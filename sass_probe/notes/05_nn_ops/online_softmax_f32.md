# online_softmax_f32 SASS 분석

## 1. 목적

`online_softmax_f32` 커널은 일반적인 shared-memory softmax와 달리, softmax의 max/sum 계산을 streaming 방식으로 처리하는 축소판이다.

이 커널의 목적은 성능 좋은 병렬 softmax 구현이 아니라, FlashAttention류 online softmax update가 SASS 레벨에서 어떤 primitive로 나타나는지 확인하는 것이다.

핵심 질문은 다음과 같다.

```text
exp 전체 벡터를 shared memory에 저장하는가?
아니면 running max / running sum을 register accumulator로 유지하는가?
```

결론부터 말하면, 이 커널은 shared memory materialization 없이 register accumulator 중심으로 내려간다.

---

## 2. CUDA source 구조

대상 커널은 대략 다음 구조다.

```cpp
__global__ void online_softmax_f32_kernel(const float* __restrict__ x,
                                          float* __restrict__ y,
                                          int n) {
    if (threadIdx.x == 0 && blockIdx.x == 0) {
        float m = -FLT_MAX;
        float s = 0.0f;

        for (int i = 0; i < n; ++i) {
            float v = x[i];

            float new_m = m > v ? m : v;

            float old_scale = expf(m - new_m);
            float new_term  = expf(v - new_m);

            s = s * old_scale + new_term;
            m = new_m;
        }

        for (int i = 0; i < n; ++i) {
            y[i] = expf(x[i] - m) / s;
        }
    }
}
```

이 커널의 핵심은 첫 번째 loop다.

```cpp
new_m = max(m, v);
s = s * expf(m - new_m) + expf(v - new_m);
m = new_m;
```

즉, 전체 softmax 값을 한 번에 materialize하지 않고, streaming으로 max와 sum을 갱신한다.

---

## 3. 단일 thread guard

SASS 초반에는 다음과 같은 구조가 나타난다.

```sass
S2UR UR4, SR_CTAID.X
S2R  R0, SR_TID.X
LOP3.LUT P0, RZ, R0, UR4, RZ, ...
@P0 EXIT
```

이는 CUDA source의 다음 조건에 대응된다.

```cpp
if (threadIdx.x == 0 && blockIdx.x == 0) {
    ...
}
```

즉, `threadIdx.x != 0` 또는 `blockIdx.x != 0`인 thread/block은 바로 종료한다.

이 커널은 병렬 softmax가 아니라, online softmax update의 SASS primitive를 보기 위한 단일-thread 실험이다.

---

## 4. accumulator 초기화

SASS 초반에는 다음 값들이 관찰된다.

```sass
MOV R21, RZ
MOV R11, 0xff7fffff
```

역할상 다음과 같이 해석할 수 있다.

```cpp
float s = 0.0f;
float m = -FLT_MAX;
```

따라서 분석상 주요 accumulator는 다음과 같다.

```text
R11 = running max m
R21 = running sum s
```

이후 긴 update loop에서 `R11`과 `R21`이 계속 유지된다. 이 점이 `softmax_small_f32`와 가장 큰 차이다.

---

## 5. online max update pattern

반복 구간에는 다음과 같은 max update 패턴이 반복된다.

```sass
FSETP.GT.FTZ.AND P?, PT, R_m, R_v, PT
FSEL R_new_m, R_m, R_v, P?
```

의미는 다음과 같다.

```cpp
new_m = (m > v) ? m : v;
```

즉:

```cpp
new_m = max(m, v);
```

ReLU 실험에서는 `max(x, 0)`이 `FMNMX.FTZ`로 내려갔지만, online softmax의 max update는 여러 value와 accumulator가 섞인 unrolled loop 안에서 `FSETP + FSEL` 형태로 나타난다.

---

## 6. expf lowering pattern

`expf(...)`는 함수 호출처럼 남지 않고 다음 형태로 내려간다.

```sass
FADD.FTZ ...
FMUL.FTZ ..., 1.4426950216293334961
MUFU.EX2 ...
```

이는 다음 변환에 해당한다.

```cpp
expf(a)
= exp2(a * log2(e))
```

따라서 online update의 두 항:

```cpp
old_scale = expf(m - new_m);
new_term  = expf(v - new_m);
```

은 SASS에서 다음 흐름으로 나타난다.

```text
m - new_m
→ * log2(e)
→ MUFU.EX2

v - new_m
→ * log2(e)
→ MUFU.EX2
```

여기서 `MUFU.EX2`는 base-2 exponential을 수행하는 special function unit 계열 primitive로 볼 수 있다.

---

## 7. 핵심: running sum update가 FFMA로 표현됨

online softmax의 핵심 update는 다음 한 줄이다.

```cpp
s = s * old_scale + new_term;
```

SASS에서는 이 구조가 `FFMA.FTZ`로 나타난다.

대표적인 형태:

```sass
FFMA.FTZ R21, R6, R21, R7
```

의미는 다음과 같다.

```cpp
R21 = R6 * R21 + R7;
```

역할상:

```text
R21 = running sum s
R6  = old_scale = exp(old_m - new_m)
R7  = new_term  = exp(v - new_m)
```

따라서 high-level 의미는 다음과 같다.

```cpp
s = s * old_scale + new_term;
```

이전에 `fma_f32` 실험에서 확인한:

```cpp
a * b + c → FFMA
```

패턴이 여기서는 실제 algorithmic accumulator update로 나타난다.

즉, online softmax의 running sum update는 SASS 레벨에서 fused multiply-add accumulator update로 읽힌다.

---

## 8. shared memory materialization 없음

`softmax_small_f32`에서는 다음 명령어들이 반복적으로 나타났다.

```text
STS
LDS
BAR.SYNC
```

이는 shared memory에 중간값을 저장하고, block-level reduction을 수행한다는 의미였다.

반면 `online_softmax_f32`에서는 update loop 안에 shared memory reduction 구조가 나타나지 않는다.

주요 흐름은 다음과 같다.

```text
LDG
FSETP/FSEL
FADD
FMUL
MUFU.EX2
FFMA
```

즉:

```text
x[i] load
→ new_m 계산
→ old_scale / new_term 계산
→ s update
→ m update
```

가 register 안에서 진행된다.

materialization 관점에서 보면:

```text
m: register accumulator
s: register accumulator
old_scale: temporary register
new_term: temporary register
```

이다.

따라서 online update phase에서는 exp 전체 벡터를 shared memory에 저장하지 않는다.

---

## 9. compiler unrolling

SASS에서는 `LDG.E.CONSTANT`가 여러 개 연속으로 나오는 구간이 있다.

```sass
LDG.E.CONSTANT R18, [R2.64]
LDG.E.CONSTANT R20, [R2.64+0x4]
LDG.E.CONSTANT R15, [R2.64+0x8]
...
```

이는 source-level의 단순 loop:

```cpp
for (int i = 0; i < n; ++i)
```

가 SASS에서 그대로 보존되지 않았음을 보여준다.

컴파일러는 loop를 여러 단위로 unroll한다.

```text
16개 단위 unrolled path
8개 단위 tail path
4개 단위 tail path
1개 단위 tail path
```

따라서 SASS 분석에서는 source line을 그대로 따라가는 방식보다, dataflow와 role pattern을 기준으로 보는 것이 더 적절하다.

---

## 10. normalization phase

online update가 끝난 뒤에는 최종 `m`, `s`를 이용해 output을 계산한다.

SASS에는 다음 패턴이 나타난다.

```sass
MUFU.RCP R?, R21
FADD.FTZ R?, x, -R11
FMUL.FTZ R?, R?, 1.4426950216293334961
MUFU.EX2 R?, R?
FMUL.FTZ R?, R?, inv_s
STG.E [...]
```

의미는 다음과 같다.

```cpp
inv_s = 1.0f / s;
e = expf(x[i] - m);
y[i] = e * inv_s;
```

즉 CUDA source의:

```cpp
y[i] = expf(x[i] - m) / s;
```

는 SASS에서:

```cpp
y[i] = expf(x[i] - m) * rcp(s);
```

로 내려간다.

division은 직접적인 divide instruction이 아니라:

```text
MUFU.RCP
FMUL
```

조합으로 표현된다.

---

## 11. softmax_small_f32와 비교

### softmax_small_f32

```text
x
→ shared memory
→ max reduction
→ shared memory
→ exp(x - max)
→ shared memory
→ sum reduction
→ shared memory
→ normalize
→ y
```

SASS 핵심:

```text
STS
LDS
BAR.SYNC
FSETP/FSEL
FADD
MUFU.EX2
MUFU.RCP
STG
```

### online_softmax_f32

```text
x stream
→ register running max m
→ register running sum s
→ final normalize
→ y
```

SASS 핵심:

```text
LDG
FSETP/FSEL
FADD
FMUL
MUFU.EX2
FFMA
MUFU.RCP
STG
```

가장 큰 차이는 materialization이다.

```text
softmax_small_f32:
    exp 값과 reduction partial이 shared memory에 저장됨

online_softmax_f32:
    running max/sum이 register accumulator로 유지됨
```

---

## 12. 분석 프레임 적용

### CUDA source expression

```cpp
new_m = max(m, v);

old_scale = expf(m - new_m);
new_term  = expf(v - new_m);

s = s * old_scale + new_term;
m = new_m;
```

### Compiler graph rewrite

```text
max:
    FSETP + FSEL

exp:
    subtract
    multiply by log2(e)
    MUFU.EX2

sum update:
    fused multiply-add
```

### SASS primitive

```text
FSETP
FSEL
FADD
FMUL
MUFU.EX2
FFMA
```

### Intermediate materialization

```text
shared memory materialization 없음.

m, s는 register accumulator로 유지된다.
old_scale, new_term은 temporary register 값으로 생성되고,
s update에 바로 사용된다.
```

---

## 13. 결론

`online_softmax_f32`는 `softmax_small_f32`와 달리 shared memory reduction을 사용하지 않는다.

`softmax_small_f32`가:

```text
shared-memory materialized softmax
```

라면, `online_softmax_f32`는:

```text
register-accumulator streaming softmax
```

로 볼 수 있다.

SASS 레벨에서 핵심 차이는 다음이다.

```text
softmax_small_f32:
    STS / LDS / BAR.SYNC 중심

online_softmax_f32:
    FSETP / FSEL / MUFU.EX2 / FFMA 중심
```

특히 online update의 핵심 수식:

```cpp
s = s * expf(old_m - new_m) + expf(v - new_m);
```

이 SASS에서 `FFMA.FTZ`로 나타난 점이 중요하다.

이는 FlashAttention식 online softmax update의 축소판이 SASS 레벨에서 다음 구조로 읽힐 수 있음을 보여준다.

```text
running max:
    FSETP + FSEL

running sum:
    MUFU.EX2 + FFMA

materialization:
    shared memory가 아니라 register accumulator
```
