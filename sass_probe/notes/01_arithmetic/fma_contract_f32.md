# fma_contract_f32: FFMA Contraction Pattern Experiment

## 1. 실험 목적

이 실험의 목적은 CUDA C/C++ 코드에서 작성한 FP32 multiply-add 표현이 SASS 단계에서 어떤 조건으로 `FFMA`로 contraction되는지 확인하는 것이다.

핵심 질문은 다음과 같다.

```text
1. `av * bv + cv`는 SASS에서 `FFMA`로 변환되는가?
2. 중간 변수 `tmp`를 두어도 `FFMA`로 합쳐지는가?
3. multiply와 add 사이에 관계없는 코드가 끼어도 `FFMA`로 합쳐지는가?
4. 중간값을 global memory에 저장하면 contraction이 깨지는가?
5. `__fmul_rn`, `__fadd_rn`으로 반올림 지점을 강제하면 `FFMA`가 억제되는가?
6. `volatile` memory boundary는 contraction을 막는가?
7. `__noinline__` 함수 경계는 contraction을 막는가?
```

이번 실험은 단순히 `a * b + c`가 `FFMA`로 변환되는지만 확인하는 것이 아니다. 더 중요한 목표는 컴파일러가 소스 코드의 줄 순서가 아니라 **값의 생산자-소비자 관계**, 즉 def-use graph를 기준으로 연산을 재작성하는지 확인하는 것이다.

---

## 2. 실험 대상

파일:

```text
kernels/01_arithmetic/fma_contract_f32.cu
```

덤프 결과:

```text
sass/sm86/01_arithmetic/fma_contract_f32.sass
ptx/sm86/01_arithmetic/fma_contract_f32.ptx
```

대상 아키텍처:

```text
sm_86
```

확인된 주요 커널:

```text
fma_direct_kernel
fma_tmp_kernel
fma_gap_kernel
fma_store_tmp_kernel
fma_rn_intrinsic_kernel
fma_volatile_global_kernel
fma_noinline_boundary_kernel
```

---

## 3. 전체 결과 요약

| Kernel                         | 소스 패턴                               | 관찰된 SASS                  | 해석                                     |
| ------------------------------ | ----------------------------------- | ------------------------- | -------------------------------------- |
| `fma_direct_kernel`            | `av * bv + cv`                      | `FFMA`                    | 기본 multiply-add contraction            |
| `fma_tmp_kernel`               | `tmp = av * bv; out = tmp + cv;`    | `FFMA`                    | source temporary는 SASS에서 물질화되지 않음      |
| `fma_gap_kernel`               | multiply와 add 사이에 unrelated code 삽입 | `FFMA`                    | 소스상 떨어져 있어도 def-use 관계로 contraction    |
| `fma_store_tmp_kernel`         | `scratch[i] = tmp`                  | `FMUL + FADD + STG`       | 중간값 저장으로 `tmp`가 실제 레지스터 값으로 물질화        |
| `fma_rn_intrinsic_kernel`      | `__fmul_rn`, `__fadd_rn`            | `FMUL + FADD`             | 반올림 지점 강제로 contraction 억제              |
| `fma_volatile_global_kernel`   | volatile store/load                 | `FMUL + STG + LDG + FADD` | 관찰 가능한 memory boundary로 contraction 차단 |
| `fma_noinline_boundary_kernel` | noinline function boundary          | `FMUL + CALL + FADD`      | 함수 경계가 graph rewrite를 차단               |

핵심 결론:

```text
FFMA contraction은 소스 코드 문자열 패턴 매칭이 아니다.
컴파일러는 값의 흐름을 추적하고, 허용 가능한 경우 multiply-add graph를 FFMA primitive로 재작성한다.
```

---

## 4. 커널별 분석

## 4.1 `fma_direct_kernel`

소스 의도:

```cpp
float out = av * bv + cv;
y[i] = out;
```

관찰된 핵심 SASS:

```sass
FFMA R11, R4, R3, R7 ;
STG.E [R8.64], R11 ;
```

해석:

`av * bv + cv` 형태가 SASS에서 `FFMA` 하나로 변환되었다.

이는 가장 기본적인 FMA contraction이다.

```text
source:
    out = av * bv + cv

compiler graph:
    out = add(mul(av, bv), cv)

SASS:
    FFMA
```

여기서 `FFMA`는 다음 의미를 가진다.

```text
out = round(av * bv + cv)
```

즉, multiply와 add를 따로 수행하지 않고 fused operation으로 처리한다.

---

## 4.2 `fma_tmp_kernel`

소스 의도:

```cpp
float tmp = av * bv;
float out = tmp + cv;
y[i] = out;
```

관찰된 핵심 SASS:

```sass
FFMA R11, R4, R3, R7 ;
STG.E [R8.64], R11 ;
```

해석:

소스 코드에는 `tmp`라는 중간 변수가 존재하지만, SASS에서는 `FMUL` 결과로 따로 물질화되지 않았다.

컴파일러는 다음 구조를:

```text
tmp = mul(av, bv)
out = add(tmp, cv)
```

다음과 같이 재작성했다.

```text
out = fma(av, bv, cv)
```

따라서 C/CUDA의 temporary variable은 반드시 SASS 레지스터 lifetime으로 대응되지 않는다.

중요한 관찰:

```text
소스 변수 tmp가 존재한다
≠
SASS에서 tmp가 독립적인 FMUL 결과로 존재한다
```

즉, source-level variable과 SASS-level register/value는 1:1로 대응되지 않는다.

---

## 4.3 `fma_gap_kernel`

소스 의도:

```cpp
float tmp = av * bv;

// unrelated operations
float k = av + cv;
float m = k * 3.0f + bv;
aux[i] = m;

float out = tmp + cv;
y[i] = out;
```

관찰된 핵심 SASS:

```sass
FADD R11, R3, R7 ;
FFMA R13, R11, 3, R4 ;
FFMA R15, R4, R3, R7 ;
STG.E [R8.64], R13 ;
STG.E [R10.64], R15 ;
```

해석:

`FFMA`가 두 개 관찰되었다.

첫 번째:

```sass
FFMA R13, R11, 3, R4 ;
```

이는 unrelated 계산인:

```cpp
float m = k * 3.0f + bv;
```

가 `FFMA`로 변환된 것이다.

두 번째:

```sass
FFMA R15, R4, R3, R7 ;
```

이것이 원래 실험에서 보고자 한 핵심이다.

소스 코드에서는 multiply와 add 사이에 unrelated operation이 끼어 있었지만, 최종적으로 `tmp + cv` 계산은 `FFMA`로 합쳐졌다.

이 결과는 매우 중요하다.

```text
컴파일러는 source line adjacency를 기준으로 FMA를 만드는 것이 아니다.
컴파일러는 값의 def-use 관계를 추적한다.
```

즉, 다음 관계가 유지되면:

```text
tmp = av * bv
out = tmp + cv
```

중간에 관계없는 코드가 존재하더라도 컴파일러는 이를 다음과 같이 볼 수 있다.

```text
out = av * bv + cv
```

그리고 SASS에서:

```sass
FFMA
```

로 재작성한다.

이 실험은 `FFMA` contraction이 단순 peephole optimization보다 더 넓은 범위에서 일어날 수 있음을 보여준다.

---

## 4.4 `fma_store_tmp_kernel`

소스 의도:

```cpp
float tmp = av * bv;
scratch[i] = tmp;

float out = tmp + cv;
y[i] = out;
```

관찰된 핵심 SASS:

```sass
FMUL R13, R4, R3 ;
FADD R15, R6, R13 ;
STG.E [R8.64], R13 ;
STG.E [R10.64], R15 ;
```

해석:

이 경우에는 `FFMA`가 나오지 않았다.

대신 다음 구조가 관찰되었다.

```text
FMUL → FADD → STG scratch → STG y
```

`tmp = av * bv`의 결과가 `R13`에 실제로 만들어졌고, 이 값이 두 곳에서 사용된다.

```text
R13 → scratch[i] 저장
R13 → FADD 입력
```

이것은 source-level temporary가 실제 SASS value로 물질화된 경우다.

중요한 차이는 `scratch[i] = tmp`이다.

이 store 때문에 `tmp`는 단순한 내부 중간 표현이 아니라, 외부에서 관찰 가능한 값이 된다. 따라서 컴파일러가 `tmp`를 제거하고 `FFMA`로 완전히 합치기 어렵다.

결론:

```text
중간값이 memory에 저장되면, 그 값은 실제 계산 결과로 물질화될 가능성이 커진다.
```

이 결과는 앞으로 attention/softmax류 분석에서 중요하다.

어떤 중간 tensor가 실제로 global/shared memory에 저장되는지, 아니면 register accumulator 안에서만 갱신되는지를 구분하는 기준이 되기 때문이다.

---

## 4.5 `fma_rn_intrinsic_kernel`

소스 의도:

```cpp
float tmp = __fmul_rn(av, bv);
float out = __fadd_rn(tmp, cv);
y[i] = out;
```

관찰된 핵심 SASS:

```sass
FMUL R0, R4, R3 ;
FADD R11, R0, R7 ;
STG.E [R8.64], R11 ;
```

해석:

`__fmul_rn`과 `__fadd_rn`을 사용하면 `FFMA`가 억제된다.

이는 각 연산의 반올림 지점을 명시했기 때문이다.

분리된 multiply-add는 다음 의미에 가깝다.

```text
tmp = round(av * bv)
out = round(tmp + cv)
```

반면 `FFMA`는 다음 의미다.

```text
out = round(av * bv + cv)
```

두 계산은 실수 수학에서는 같아 보이지만, 부동소수점에서는 반올림 지점이 다르므로 결과가 달라질 수 있다.

따라서 이 커널은 다음 사실을 보여준다.

```text
FFMA contraction은 단순 성능 최적화가 아니라,
부동소수점 의미를 바꿔도 허용되는 조건에서만 수행된다.
```

---

## 4.6 `fma_volatile_global_kernel`

소스 의도:

```cpp
scratch[i] = av * bv;
float tmp = scratch[i];

float out = tmp + cv;
y[i] = out;
```

관찰된 핵심 SASS:

```sass
FMUL R13, R4, R3 ;
STG.E.STRONG.SYS [R8.64], R13 ;
LDG.E.STRONG.SYS R15, [R8.64] ;
FADD R15, R6, R15 ;
STG.E [R10.64], R15 ;
```

해석:

`volatile` global memory 접근 때문에 store와 load가 SASS에 명확히 남았다.

특히 다음 두 명령어가 중요하다.

```sass
STG.E.STRONG.SYS
LDG.E.STRONG.SYS
```

이는 컴파일러가 해당 memory access를 제거하거나 재배치하기 어렵다는 뜻이다.

따라서 다음 식으로 contraction할 수 없다.

```text
scratch[i] = av * bv;
tmp = scratch[i];
out = tmp + cv;
```

를 임의로:

```text
out = av * bv + cv;
```

로 바꾸면 volatile memory access의 관찰 가능성이 사라진다.

결론:

```text
volatile global memory boundary는 FFMA contraction을 강하게 차단한다.
```

이 실험은 `store/load boundary`가 SASS 분석에서 매우 중요한 구분선임을 보여준다.

---

## 4.7 `fma_noinline_boundary_kernel`

소스 의도:

```cpp
float tmp = av * bv;
tmp = identity_noinline(tmp);

float out = tmp + cv;
y[i] = out;
```

관찰된 핵심 SASS:

```sass
FMUL R8, R4, R3 ;
CALL.REL.NOINC 0x160 ;
FADD R5, R7, R8 ;
STG.E [R2.64], R5 ;
RET.REL.NODEC R2 0x0 ;
```

해석:

`__noinline__` 함수 경계가 유지되면서, multiply와 add가 하나의 local expression으로 합쳐지지 않았다.

구조는 다음과 같다.

```text
FMUL → CALL → FADD
```

즉, 함수 호출 경계가 def-use graph rewrite를 막는 장벽처럼 작동했다.

물론 모든 함수 호출이 항상 contraction을 막는 것은 아니다. 함수가 inline되거나 컴파일러가 내부 의미를 완전히 알 수 있으면 다시 최적화될 수 있다.

하지만 이번 실험처럼 `__noinline__`으로 경계를 강제하면, 컴파일러가 multiply-add를 `FFMA`로 합치지 못한다.

결론:

```text
noinline function boundary는 FFMA contraction을 차단할 수 있다.
```

---

## 5. 관찰된 경계 조건

이번 실험을 통해 `FFMA` contraction이 가능한 경우와 어려운 경우를 다음처럼 정리할 수 있다.

## 5.1 Contraction이 잘 일어나는 경우

```text
1. `av * bv + cv`를 직접 작성한 경우
2. `tmp = av * bv; out = tmp + cv;`처럼 temporary만 존재하는 경우
3. multiply와 add 사이에 unrelated code가 있어도 def-use 관계가 유지되는 경우
```

이 경우 source code의 모양이 조금 달라도 compiler graph는 다음 패턴을 유지한다.

```text
FADD(FMUL(a, b), c)
```

따라서 SASS에서 다음으로 바뀔 수 있다.

```text
FFMA(a, b, c)
```

## 5.2 Contraction이 깨지는 경우

```text
1. 중간값을 global memory에 저장하는 경우
2. volatile store/load가 있는 경우
3. `__fmul_rn`, `__fadd_rn`으로 반올림 지점을 강제하는 경우
4. `__noinline__` function call boundary가 있는 경우
```

이 경우에는 중간값이 단순한 내부 표현이 아니라, 보존되어야 하는 값이 된다.

따라서 SASS에서 다음과 같은 패턴이 나타난다.

```text
FMUL
FADD
STG
LDG
CALL
```

---

## 6. SASS 분석 관점에서의 의미

이번 실험은 SASS 분석의 기본 관점을 명확하게 만든다.

```text
CUDA source line
≠
SASS instruction
```

```text
C/CUDA temporary variable
≠
반드시 SASS register lifetime
```

```text
source expression order
≠
SASS instruction order
```

컴파일러는 소스 코드를 먼저 내부 표현으로 바꾸고, 그 안에서 값의 흐름을 재작성한다.

따라서 분석 단위는 소스 코드의 줄이 아니라 다음이어야 한다.

```text
1. 값이 어디서 생성되는가?
2. 값이 어디에서 소비되는가?
3. 중간값이 memory에 저장되는가?
4. 중간값이 외부에서 관찰 가능한가?
5. 반올림 지점이 보존되어야 하는가?
6. 함수 호출 경계가 있는가?
7. 최종 SASS primitive가 무엇으로 선택되었는가?
```

이 관점에서 `FFMA`는 단순한 산술 명령어가 아니라, compiler graph rewrite의 결과물이다.

---

## 7. FlashAttention / Online Update 관점과의 연결

이번 실험은 작은 규모의 `mul + add` 예제지만, 더 큰 연산 구조를 이해하는 데 중요한 기준을 제공한다.

예를 들어 일반 attention은 다음과 같은 중간 결과를 만들 수 있다.

```text
QK^T
softmax(QK^T)
softmax(QK^T) V
```

반면 FlashAttention류 구현은 중간 matrix를 global memory에 완전히 물질화하지 않고, tile 단위로 읽으면서 다음 값을 online으로 갱신한다.

```text
running max
running sum
accumulator
```

이번 `fma_contract_f32` 실험에서 본 핵심도 이와 비슷하다.

```text
source-level intermediate:
    tmp = av * bv

SASS-level result:
    tmp가 사라지고 FFMA로 fused 될 수 있음
```

반대로 중간값이 저장되면:

```text
scratch[i] = tmp
```

SASS에서는 다음처럼 물질화된다.

```text
FMUL
STG
FADD
```

따라서 앞으로 operator/layer 분석에서는 다음 질문을 던져야 한다.

```text
이 중간값은 실제로 memory에 저장되는가?
아니면 register accumulator 안에서만 유지되는가?
중간 tensor가 물질화되는가?
아니면 online update 형태로 재작성되는가?
```

이것이 SASS를 통해 attention류 최적화를 관찰하는 핵심 기준이 된다.

---

## 8. 결론

이번 실험의 핵심 결론은 다음과 같다.

```text
FFMA contraction은 소스 코드 문자열 패턴 매칭이 아니다.
```

컴파일러는 다음 소스 코드를:

```cpp
float tmp = av * bv;
float out = tmp + cv;
```

단순히 줄 단위로 번역하지 않는다.

대신 내부적으로 다음과 같은 계산 그래프를 본다.

```text
out = add(mul(av, bv), cv)
```

그리고 조건이 허용되면 다음과 같이 재작성한다.

```text
out = fma(av, bv, cv)
```

SASS에서는 이것이 다음으로 나타난다.

```sass
FFMA
```

하지만 다음과 같은 경계가 생기면 contraction이 깨진다.

```text
memory materialization
volatile access
rounding boundary
noinline call boundary
```

따라서 SASS 분석에서 중요한 것은 소스 코드의 변수명이나 줄 순서가 아니라, 실제로 다음 요소들이 어떻게 나타나는지다.

```text
FFMA / FMUL / FADD
LDG / STG
CALL / RET
register reuse
memory boundary
rounding boundary
```

이번 `fma_contract_f32` 실험은 SASS 분석의 첫 번째 기준선을 제공한다.

```text
소스 표현이 아니라,
컴파일러가 재구성한 계산 그래프와 물질화 경계를 분석해야 한다.
```

---

## 9. 다음 실험 방향

다음 단계에서는 같은 방법을 더 복잡한 operator에 적용한다.

추천 순서:

```text
1. relu_f32
   - max(x, 0)
   - threshold operation이 SASS에서 어떻게 표현되는지 확인

2. clamp_f32
   - min(max(x, lo), hi)
   - 비교/선택 명령어 패턴 확인

3. reduce_sum_f32
   - accumulator update
   - register accumulation과 memory store boundary 확인

4. softmax_small_f32
   - max reduction
   - exp
   - sum reduction
   - normalization
   - 중간값 저장 여부 확인

5. online_softmax_f32
   - running max
   - running sum
   - accumulator update
   - FlashAttention식 online update의 축소판 확인
```

분석 프레임은 동일하게 유지한다.

```text
CUDA source expression
→ compiler graph rewrite
→ SASS primitive
→ intermediate materialization 여부
```

이 프레임을 유지하면 단순 명령어 사전이 아니라, operator/layer 단위의 최적화 구조를 SASS에서 읽는 방향으로 확장할 수 있다.
