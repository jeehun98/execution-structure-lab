# attention_prob_materialization_f32

## Kernel Boundary를 통한 Softmax Intermediate Materialization 분석

## 1. 실험 개요

이번 실험은 이전 `flashattention_toy_f32` 실험에서 관찰된 compiler optimization을 더 명확하게 검증하기 위해 설계했다.

이전 실험의 materialized softmax source에는 다음과 같은 중간 저장이 있었다.

```cpp
float p = __expf(score - max_value);
p_base[j] = p;

float inv_sum = 1.0f / sum;
p_base[j] = p_base[j] * inv_sum;
```

소스 코드만 보면 다음 memory flow를 예상할 수 있다.

```text
STG unnormalized probability
LDG unnormalized probability
STG normalized probability
```

그러나 실제 SASS에서는 중간 unnormalized probability의 store/load가 나타나지 않았다.

컴파일러는 같은 kernel 안에서 해당 값이 다시 사용된다는 사실을 추적하고, unnormalized probability를 register에 유지한 뒤 normalized probability만 최종적으로 저장했다.

즉 다음 최적화가 발생했다.

```text
source:

    p = exp(score - max)
    store p
    load p
    p = p / sum
    store p

optimized SASS:

    p = exp(score - max)
    p = p / sum
    store normalized p
```

이번 실험에서는 softmax를 여러 kernel로 분리해 중간값을 kernel boundary 밖으로 노출했다.

목표는 다음 질문을 확인하는 것이다.

```text
같은 softmax 계산이라도 kernel boundary를 만들면,
compiler가 제거했던 intermediate store/load가
SASS의 STG/LDG로 다시 나타나는가?
```

---

## 2. 실험 파일

CUDA source:

```text
kernels/05_nn_ops/attention_prob_materialization_f32.cu
```

SASS dump:

소스 코드만 보면 다음 memory flow를 예상할 수 있다

STG unnormalized probabili

LDG unnormalized probabilit

STG normalized probabilit

그러나 실제 SASS에서는 중간 unnormalized probability의 store/load가 나타나지 않았다

컴파일러는 같은 kernel 안에서 해당 값이 다시 사용된다는 사실을 추적하고, unnormalized probability를 register에 유지한 뒤 normalized probability만 최종적으로 저장했

즉 다음 최적화가 발생했

sourc

    p = exp(score - ma

    store 

    load 

    p = p / su

    store 

optimized SAS

    p = exp(score - ma

    p = p / su

    store normalized 

이번 실험에서는 softmax를 여러 kernel로 분리해 중간값을 kernel boundary 밖으로 노출했다

목표는 다음 질문을 확인하는 것이

같은 softmax 계산이라도 kernel boundary를 만들

compiler가 제거했던 intermediate store/load

SASS의 STG/LDG로 다시 나타나는가

2. 실험 파

CUDA source

kernels/05_nn_ops/attention_prob_materialization_f32.

SASS dumpㅍ:cu:일?가면,다..pmx)S:pmppx)e:다.다..yyty.r

```text
sass/sm86/05_nn_ops/attention_prob_materialization_f32.sass
```

PTX dump:

```text
ptx/sm86/05_nn_ops/attention_prob_materialization_f32.ptx
```

대상 GPU architecture:

```text
sm_86
```

컴파일 옵션:

```text
-O3
-Xptxas=-O3
--generate-line-info
--use_fast_math
```

---

## 3. 실행 결과

실행 결과:

```text
attention_prob_materialization_f32 done
y[0] = -0.05316688
y[1] = -0.02316688
y[2] = 0.00683312
y[3] = -0.04475802
```

첫 번째 결과:

```text
y[0] = -0.05316688
```

은 이전 `flashattention_toy_f32` 실험의 결과와 동일하다.

이전 결과:

```text
y_materialized[0] = -0.05316688
y_online[0]       = -0.05316688
```

따라서 kernel을 더 세분화해 intermediate tensor를 강제로 materialize했지만, 계산되는 attention output은 동일하게 유지되었다.

이번 실험의 목적은 numerical result를 바꾸는 것이 아니라 다음 차이를 만드는 것이다.

```text
동일한 수학적 계산
다른 execution structure
다른 memory materialization boundary
```

---

## 4. 전체 계산 구조

이번 구현은 attention을 네 개의 kernel로 분리했다.

```text
Kernel 1
QK score 계산
    ↓
scores global memory 저장

Kernel 2
scores load
max reduction
exp 계산
sum 계산
    ↓
unnorm_probs global memory 저장
sums global memory 저장

Kernel 3
unnorm_probs load
sums load
normalize
    ↓
probs global memory 저장

Kernel 4
probs load
values load
value accumulation
    ↓
y global memory 저장
```

보다 구체적으로는 다음 flow를 가진다.

```text
q, k
  │
  ▼
attention_score_store_kernel
  │
  ├─ STG scores
  ▼
scores
  │
  ▼
attention_exp_sum_store_kernel
  │
  ├─ LDG scores
  ├─ STG unnorm_probs
  └─ STG sums
  ▼
unnorm_probs, sums
  │
  ▼
attention_normalize_probs_kernel
  │
  ├─ LDG unnorm_probs
  ├─ LDG sums
  └─ STG probs
  ▼
probs
  │
  ▼
attention_value_from_probs_kernel
  │
  ├─ LDG probs
  ├─ LDG values
  └─ STG y
```

이 구조에서는 각 intermediate tensor가 kernel boundary를 넘어 다음 kernel의 입력으로 사용된다.

따라서 다음 intermediate들은 compiler가 제거할 수 없는 외부 관찰 가능한 global memory state가 된다.

```text
scores
unnorm_probs
sums
probs
```

---

# 5. 분석 대상 커널

| Kernel                              | 역할                             | 주요 materialization                           |
| ----------------------------------- | ------------------------------ | -------------------------------------------- |
| `attention_score_store_kernel`      | QK score 계산                    | `STG scores`                                 |
| `attention_exp_sum_store_kernel`    | max, exp, sum 계산               | `LDG scores`, `STG unnorm_probs`, `STG sums` |
| `attention_normalize_probs_kernel`  | probability normalization      | `LDG unnorm_probs`, `LDG sums`, `STG probs`  |
| `attention_value_from_probs_kernel` | probability-value accumulation | `LDG probs`, `STG y`                         |

이번 분석에서 가장 중요한 두 kernel은 다음이다.

```text
attention_exp_sum_store_kernel
attention_normalize_probs_kernel
```

두 kernel 사이에서 다음 memory boundary가 만들어졌기 때문이다.

```text
STG unnorm_probs
STG sums

kernel boundary

LDG unnorm_probs
LDG sums
```

---

# 6. `attention_score_store_kernel`

## 6.1 역할

이 kernel은 query row와 각 key 사이의 dot product를 계산한다.

수식:

```text
score_j = q · k_j × scale
```

현재 toy configuration:

```text
D = 4
N_KEYS = 4
scale = 0.5
```

따라서 한 query row에 대해 네 개의 score를 계산한다.

---

## 6.2 SASS 구조

핵심 instruction pattern:

```sass
LDG.E.CONSTANT ...
LDG.E.CONSTANT ...

FMUL.FTZ ...
FFMA.FTZ ...
FFMA.FTZ ...
FFMA.FTZ ...

FMUL.FTZ ..., 0.5

STG.E [scores]
STG.E [scores+0x4]
STG.E [scores+0x8]
STG.E [scores+0xc]
```

---

## 6.3 QK dot-product accumulation

각 score 계산은 첫 multiply와 이후 fused accumulation으로 구성된다.

수식:

```text
score =
    q0 × k0
  + q1 × k1
  + q2 × k2
  + q3 × k3
```

SASS pattern:

```text
FMUL
FFMA
FFMA
FFMA
```

첫 multiply:

```text
partial = q0 × k0
```

이후 accumulation:

```text
partial = q1 × k1 + partial
partial = q2 × k2 + partial
partial = q3 × k3 + partial
```

이 부분은 이전 `fma_contract_f32` 실험에서 확인한 multiply-add contraction과 연결된다.

```text
mul + add dependency
→ FFMA
```

---

## 6.4 Scale 적용

dot product 결과에 `0.5` scale이 적용된다.

SASS:

```sass
FMUL.FTZ ..., 0.5
```

따라서 score 계산은 다음 구조다.

```text
FMUL / FFMA dot product
→ FMUL scale
→ STG score
```

---

## 6.5 Score materialization

마지막 네 개의 `STG`는 각 score를 global memory에 저장한다.

```sass
STG.E [R2.64], ...
STG.E [R2.64+0x4], ...
STG.E [R2.64+0x8], ...
STG.E [R2.64+0xc], ...
```

이는 다음 source-level array를 나타낸다.

```text
scores[row, 0]
scores[row, 1]
scores[row, 2]
scores[row, 3]
```

따라서 첫 번째 materialization boundary가 확인된다.

```text
register QK score
→ STG
→ global scores matrix
```

---

# 7. `attention_exp_sum_store_kernel`

## 7.1 역할

이 kernel은 저장된 scores를 읽고 다음을 계산한다.

```text
1. row maximum
2. exp(score - max)
3. sum of exponentials
4. unnormalized probability 저장
5. sum 저장
```

수식:

```text
m = max_j score_j

u_j = exp(score_j - m)

l = Σ_j u_j
```

출력:

```text
unnorm_probs[row, j] = u_j
sums[row] = l
```

이번 실험에서 가장 중요한 kernel이다.

---

## 7.2 Scores load

초반부에서 score 네 개를 global memory로부터 읽는다.

```sass
LDG.E.CONSTANT R5,  [R2.64]
LDG.E.CONSTANT R7,  [R2.64+0x4]
LDG.E.CONSTANT R9,  [R2.64+0x8]
LDG.E.CONSTANT R11, [R2.64+0xc]
```

이 load들은 이전 kernel의 score stores와 연결된다.

```text
attention_score_store_kernel:
    STG scores

attention_exp_sum_store_kernel:
    LDG scores
```

따라서 scores matrix가 kernel 사이에서 global memory tensor로 존재한다.

---

## 7.3 Maximum reduction

다음 SASS가 나타난다.

```sass
FMNMX.FTZ R6, R5, -3.40282346638528859812e+38, !PT
FMNMX.FTZ R6, R6, R7, !PT
FMNMX.FTZ R6, R6, R9, !PT
FMNMX.FTZ R6, R6, R11, !PT
```

이는 다음 reduction에 대응한다.

```text
m = max(-∞, s0)
m = max(m, s1)
m = max(m, s2)
m = max(m, s3)
```

즉 max reduction은 branch가 아니라 `FMNMX` chain으로 구현된다.

```text
source:
    fmaxf

SASS:
    FMNMX
```

---

## 7.4 Stable softmax subtraction

각 score에서 maximum을 뺀다.

```sass
FADD.FTZ R8, R7, -R6
FADD.FTZ R5, R5, -R6
FADD.FTZ R9, R9, -R6
FADD.FTZ R6, R11, -R6
```

SASS에서는 subtraction도 `FADD`와 negated operand로 표현된다.

```text
score - max
→ FADD score, -max
```

이 단계는 numerical stability를 위한 stable softmax 구조다.

```text
exp(score)
```

대신:

```text
exp(score - max(score))
```

를 계산한다.

---

## 7.5 Exponential calculation

각 값은 먼저 `log2(e)`를 곱한다.

```sass
FMUL.FTZ ..., 1.4426950216293334961
```

그 다음:

```sass
MUFU.EX2 ...
```

가 실행된다.

이는 다음 관계 때문이다.

```text
exp(x) = 2^(x × log2(e))
```

따라서 `__expf`의 SASS signature는 다음과 같다.

```text
FADD score - max
FMUL log2(e)
MUFU.EX2
```

이번 kernel에서 네 개의 exponential이 각각 `MUFU.EX2`로 나타났다.

---

## 7.6 Sum reduction

exponential 결과를 더한다.

관찰된 SASS:

```sass
FADD.FTZ R10, R7, R8
FADD.FTZ R10, R9, R10
FADD.FTZ R13, R11, R10
```

수식:

```text
sum = u0 + u1 + u2 + u3
```

이번 toy size에서는 sequential `FADD` chain으로 reduction된다.

---

## 7.7 Unnormalized probability materialization

가장 중요한 부분이다.

```sass
    STG.E [R2.64], R7
    STG.E [R2.64+0x4], R8
    STG.E [R2.64+0x8], R9
    STG.E [R2.64+0xc], R11
```

이 네 store는 다음을 저장한다.

```text
unnorm_probs[row, 0]
unnorm_probs[row, 1]
unnorm_probs[row, 2]
unnorm_probs[row, 3]
```

이전 `flashattention_toy_f32`에서는 unnormalized probability가 같은 kernel 안에서 normalize되었기 때문에 compiler가 중간 store를 제거했다.

이번에는 다음 kernel에서 이 값을 소비하므로 제거할 수 없다.

```text
attention_exp_sum_store_kernel:
    STG unnorm_probs

attention_normalize_probs_kernel:
    LDG unnorm_probs
```

따라서 source-level intermediate tensor가 실제 SASS-level global memory tensor로 materialize되었다.

---

## 7.8 Sum materialization

마지막 store:

```sass
STG.E [R4.64], R13
```

는 row sum을 저장한다.

```text
sums[row] = u0 + u1 + u2 + u3
```

따라서 이 kernel에는 두 종류의 output materialization이 있다.

```text
vector output:
    unnorm_probs[row, :]

scalar output:
    sums[row]
```

SASS signature:

```text
4 × STG unnorm_probs
1 × STG sum
```

---

# 8. `attention_normalize_probs_kernel`

## 8.1 역할

이 kernel은 이전 kernel이 저장한 unnormalized probabilities와 row sum을 읽는다.

수식:

```text
inv_sum = 1 / sums[row]

probs[row, j] =
    unnorm_probs[row, j] × inv_sum
```

---

## 8.2 Sum load

다음 load가 나타난다.

```sass
LDG.E.CONSTANT R6, [R6.64]
```

이는:

```text
sum = sums[row]
```

에 대응한다.

즉 이전 kernel의:

```text
STG sums
```

가 현재 kernel의:

```text
LDG sums
```

로 이어진다.

---

## 8.3 Unnormalized probability load

네 개의 probability를 global memory에서 읽는다.

```sass
LDG.E.CONSTANT R9,  [R2.64]
LDG.E.CONSTANT R11, [R2.64+0x4]
LDG.E.CONSTANT R13, [R2.64+0x8]
LDG.E.CONSTANT R15, [R2.64+0xc]
```

이는 다음을 의미한다.

```text
u0 = unnorm_probs[row, 0]
u1 = unnorm_probs[row, 1]
u2 = unnorm_probs[row, 2]
u3 = unnorm_probs[row, 3]
```

이 결과로 이번 실험의 핵심 materialization chain이 완성된다.

```text
Kernel 2:
    STG unnorm_probs

Kernel 3:
    LDG unnorm_probs
```

---

## 8.4 Reciprocal

row sum의 reciprocal은:

```sass
MUFU.RCP R8, R6
```

로 계산된다.

수식:

```text
inv_sum = 1 / sum
```

`--use_fast_math` 환경이므로 reciprocal은 special function unit의 `MUFU.RCP`로 내려간다.

---

## 8.5 Normalize

각 unnormalized probability에 reciprocal을 곱한다.

```sass
FMUL.FTZ R9,  R8, R9
FMUL.FTZ R11, R8, R11
FMUL.FTZ R13, R8, R13
FMUL.FTZ R15, R8, R15
```

수식:

```text
p0 = u0 × inv_sum
p1 = u1 × inv_sum
p2 = u2 × inv_sum
p3 = u3 × inv_sum
```

---

## 8.6 Normalized probability materialization

계산된 probabilities를 global memory에 저장한다.

```sass
STG.E [R4.64], R9
STG.E [R4.64+0x4], R11
STG.E [R4.64+0x8], R13
STG.E [R4.64+0xc], R15
```

따라서 다음 chain이 확인된다.

```text
STG unnorm_probs
→ kernel boundary
→ LDG unnorm_probs
→ MUFU.RCP
→ FMUL normalize
→ STG probs
```

이것이 이번 실험에서 보고자 했던 핵심 구조다.

---

# 9. `attention_value_from_probs_kernel`

## 9.1 역할

이 kernel은 normalized probability와 values를 읽어 최종 output을 계산한다.

수식:

```text
y = Σ_j probs_j × v_j
```

각 output component:

```text
y_d = Σ_j probs_j × v[j, d]
```

---

## 9.2 Input loads

초반부에서 다음 데이터들을 읽는다.

```text
probs[row, 0:4]
values[0:4, 0:4]
```

SASS에서는 여러 `LDG.E.CONSTANT`로 나타난다.

이전 kernel의:

```text
STG probs
```

가 현재 kernel의:

```text
LDG probs
```

로 이어진다.

---

## 9.3 Value accumulation

핵심 arithmetic은 `FFMA` chain으로 나타난다.

예:

```sass
FFMA.FTZ R0, R0, R3, RZ
FFMA.FTZ R0, R15, R17, R0
...
```

수식:

```text
acc = p × v + acc
```

첫 accumulation에서도 compiler는 zero addend를 이용해 `FFMA`를 사용한다.

```text
acc0 = p0 × v0 + 0
```

이후:

```text
acc0 = p1 × v1 + acc0
acc0 = p2 × v2 + acc0
acc0 = p3 × v3 + acc0
```

로 누적된다.

즉 probability-value accumulation의 SASS signature는 다음이다.

```text
LDG probs
LDG values
FFMA chain
```

---

## 9.4 Final output materialization

마지막에는 output vector를 저장한다.

```sass
STG.E [R2.64], R23
STG.E [R2.64+0x4], R9
STG.E [R2.64+0x8], R11
STG.E [R2.64+0xc], R13
```

이는:

```text
y[row, 0:4]
```

의 최종 output store다.

---

# 10. 전체 Materialization Chain

이번 실험에서 확인된 전체 global memory flow는 다음과 같다.

```text
Q/K
 │
 │ LDG
 ▼
QK score registers
 │
 │ STG
 ▼
scores
 │
 │ LDG
 ▼
max / exp / sum registers
 │
 ├─ STG unnorm_probs
 └─ STG sums
        │
        │ LDG
        ▼
normalize registers
 │
 │ STG
 ▼
probs
 │
 │ LDG
 ▼
value accumulator registers
 │
 │ STG
 ▼
y
```

instruction 관점에서 축약하면:

```text
LDG q/k
FMUL/FFMA
STG scores

LDG scores
FMNMX
FADD
FMUL
MUFU.EX2
FADD
STG unnorm_probs
STG sums

LDG unnorm_probs
LDG sums
MUFU.RCP
FMUL
STG probs

LDG probs
LDG values
FFMA
STG y
```

---

# 11. 이전 실험과의 비교

## 11.1 `flashattention_toy_f32`의 same-kernel softmax

이전 materialized softmax kernel의 source에는 중간 store가 있었다.

```text
exp result
→ p_base store
→ p_base load
→ normalize
→ final store
```

그러나 실제 SASS에서는 compiler가 중간 store/load를 제거했다.

실제 구조:

```text
exp result register
→ normalize register
→ final STG probs
```

이유:

```text
같은 kernel 내부
외부 관찰 가능성 없음
store 후 바로 동일 kernel에서 소비
compiler가 data flow 전체를 볼 수 있음
```

---

## 11.2 이번 kernel-boundary 실험

이번 실험에서는:

```text
Kernel A:
    STG unnorm_probs
    STG sums

Kernel B:
    LDG unnorm_probs
    LDG sums
```

로 분리했다.

컴파일러는 별도 kernel launch 사이에서 register value를 직접 전달할 수 없다.

각 kernel은 독립된 global function이고, intermediate result는 global memory를 통해 전달되어야 한다.

따라서 store/load가 제거되지 않았다.

---

## 11.3 비교표

| 항목                                    | Same-kernel softmax | Split-kernel softmax      |
| ------------------------------------- | ------------------- | ------------------------- |
| unnormalized probability source store | 존재                  | 존재                        |
| unnormalized probability SASS `STG`   | 제거됨                 | 유지됨                       |
| unnormalized probability SASS `LDG`   | 제거됨                 | 유지됨                       |
| sum SASS `STG/LDG`                    | register 유지         | global memory 유지          |
| compiler가 전체 def-use를 볼 수 있는가         | 가능                  | kernel boundary로 제한       |
| materialization                       | 최종 probs만           | unnorm_probs, sums, probs |
| kernel launch 수                       | 적음                  | 많음                        |
| global memory traffic                 | 적음                  | 많음                        |

---

# 12. 핵심 연구 결론

이번 실험은 다음 사실을 명확하게 보여준다.

```text
Materialization은 source code에 배열 대입문이 있다는 사실만으로 결정되지 않는다.
```

같은 kernel 안에서 intermediate store/load가 외부에 관찰되지 않으면 compiler는 이를 제거할 수 있다.

```text
source STG/LDG intent
→ optimized register value
```

반면 kernel boundary를 넘는 값은 다음 kernel이 소비할 수 있도록 global memory state로 존재해야 한다.

```text
producer kernel
→ STG global intermediate
→ kernel boundary
→ LDG global intermediate
→ consumer kernel
```

따라서 진짜 materialization boundary는 다음과 같은 외부 관찰 가능성에 의해 만들어진다.

```text
kernel boundary
volatile access
function/call boundary
external consumer
synchronization boundary
aliasing or observable memory semantics
```

이번 실험에서는 그중 kernel boundary를 직접 확인했다.

---

# 13. FMA 실험과의 연결

`fma_contract_f32`에서 확인한 내용:

```text
source temporary variable는
반드시 SASS intermediate value로 남지 않는다.
```

예:

```cpp
float tmp = a * b;
float out = tmp + c;
```

SASS:

```text
FFMA
```

`tmp`는 독립적인 `FMUL` 결과로 materialize되지 않았다.

이번 실험에서는 같은 개념을 tensor 수준으로 확장했다.

```text
source intermediate array도
반드시 SASS global memory tensor로 남지 않는다.
```

same-kernel source:

```text
unnorm_probs store
unnorm_probs load
```

optimized SASS:

```text
register 유지
중간 STG/LDG 제거
```

그러나 kernel boundary가 생기면:

```text
STG unnorm_probs
LDG unnorm_probs
```

가 실제 SASS에 나타난다.

따라서 두 실험을 통합하면 다음 결론을 얻을 수 있다.

```text
Scalar temporary와 tensor intermediate 모두,
외부에서 관찰되지 않는다면 compiler optimization으로 제거될 수 있다.

반면 외부 관찰 가능성이 생기면
register value 또는 compiler IR value가
실제 memory materialization으로 바뀐다.
```

---

# 14. FlashAttention과의 연결

일반적인 materialized attention은 다음 중간 행렬을 만든다.

```text
S = QKᵀ
P = softmax(S)
O = PV
```

global memory 관점:

```text
Q/K
→ compute S
→ store S
→ load S
→ compute P
→ store P
→ load P
→ compute O
→ store O
```

이번 실험은 여기에 unnormalized probability와 sum까지 추가로 노출했다.

```text
store scores
load scores

store unnorm_probs
store sums

load unnorm_probs
load sums

store probs
load probs

store output
```

반면 online attention은 다음 중간값을 register 상태로 유지한다.

```text
score
running max
running sum
value accumulator
```

그래서 SASS에서 다음 global intermediate memory boundaries가 사라진다.

```text
no STG scores
no LDG scores

no STG unnorm_probs
no LDG unnorm_probs

no STG probs
no LDG probs
```

최종 output만 저장된다.

```text
STG y only
```

이번 실험은 FlashAttention의 장점을 단순히 “kernel fusion”이라는 말로 이해하는 것보다 더 구체적인 관점을 제공한다.

```text
핵심은 중간 계산을 같은 kernel에 넣는 것만이 아니라,
중간 tensor를 global memory state로 materialize하지 않도록
execution structure를 바꾸는 것이다.
```

---

# 15. SASS에서 Materialization을 판별하는 방법

## 15.1 단순히 `STG` 개수만 세면 안 된다

모든 kernel에는 output store가 있을 수 있다.

온라인 attention에도 최종 `y` 저장을 위한 `STG`는 존재한다.

따라서 다음 질문은 부족하다.

```text
STG가 있는가?
```

보다 정확한 질문은 다음이다.

```text
어떤 logical tensor를 저장하는 STG인가?
```

---

## 15.2 Producer-consumer pair 확인

materialization을 확정하려면 producer kernel과 consumer kernel을 함께 본다.

예:

```text
Producer:
    STG unnorm_probs

Consumer:
    LDG unnorm_probs
```

이 pair가 존재하면 intermediate tensor가 실제 global memory를 통해 전달된다고 볼 수 있다.

---

## 15.3 주소와 kernel parameter 연결

SASS만 보면 register 주소가 어떤 source pointer인지 바로 드러나지 않을 수 있다.

따라서 다음을 같이 봐야 한다.

```text
kernel parameter order
IMAD.WIDE address calculation
LDG/STG offset pattern
source array shape
consumer kernel의 대응 load
```

예를 들어 네 개의 연속 store:

```text
base
base + 0x4
base + 0x8
base + 0xc
```

는 연속된 네 개 FP32 element를 나타낸다.

---

## 15.4 최종 판별 프레임

```text
1. source-level intermediate를 식별한다.
2. producer kernel의 STG를 찾는다.
3. consumer kernel의 LDG를 찾는다.
4. 두 access가 같은 logical tensor인지 확인한다.
5. kernel boundary가 존재하는지 확인한다.
6. intermediate가 register로 제거되었는지 memory에 남았는지 판단한다.
```

---

# 16. 이번 실험에서 확인된 SASS Signature

## 16.1 Score materialization

```text
FMUL / FFMA
FMUL scale
STG scores
```

## 16.2 Unnormalized probability materialization

```text
LDG scores
FMNMX
FADD score - max
FMUL log2(e)
MUFU.EX2
FADD sum
STG unnorm_probs
STG sums
```

## 16.3 Probability normalization

```text
LDG unnorm_probs
LDG sums
MUFU.RCP
FMUL normalize
STG probs
```

## 16.4 Value accumulation

```text
LDG probs
LDG values
FFMA accumulation
STG y
```

전체 signature:

```text
FMUL/FFMA → STG scores
LDG scores → FMNMX/MUFU.EX2 → STG unnorm_probs/sums
LDG unnorm_probs/sums → MUFU.RCP/FMUL → STG probs
LDG probs/values → FFMA → STG y
```

---

# 17. 연구 흐름 정리

현재까지의 연구 흐름은 다음과 같다.

## 17.1 `fma_contract_f32`

관찰 대상:

```text
scalar expression fusion
```

핵심 결론:

```text
source temporary는 SASS에서 제거될 수 있다.
compiler는 textual adjacency가 아니라 def-use graph를 본다.
```

## 17.2 `online_softmax_f32`

관찰 대상:

```text
running max / running sum
```

핵심 결론:

```text
softmax 통계를 intermediate array 없이 online으로 갱신할 수 있다.
```

## 17.3 `flashattention_toy_f32`

관찰 대상:

```text
materialized attention vs online attention
```

핵심 결론:

```text
materialized path는 score/probability LDG/STG가 나타난다.
online path는 register update와 final output store만 나타난다.
```

## 17.4 `attention_prob_materialization_f32`

관찰 대상:

```text
kernel boundary에 의한 강제 materialization
```

핵심 결론:

```text
same-kernel intermediate store는 제거될 수 있지만,
kernel boundary를 넘는 intermediate는 STG/LDG로 남는다.
```

---

# 18. 다음 연구 방향

이번 단계 이후에는 global memory materialization과 shared memory materialization을 비교하는 것이 자연스럽다.

추천 실험:

```text
attention_score_shared_f32
```

구성:

```text
1. QK score 계산
2. score를 shared memory에 저장
3. __syncthreads()
4. shared memory에서 score load
5. max / sum / normalize
6. final output 저장
```

관찰 질문:

```text
global memory intermediate:
    STG / LDG

shared memory intermediate:
    STS / LDS

register intermediate:
    memory instruction 없음
```

이를 통해 materialization을 세 단계로 구분할 수 있다.

```text
register-resident
shared-memory-resident
global-memory-resident
```

추가로 관찰할 instruction:

```text
STS
LDS
BAR.SYNC 또는 barrier 계열
```

그 다음 단계에서는 하나의 query row를 warp가 협력해 처리하도록 확장할 수 있다.

```text
warp_attention_toy_f32
```

관찰 질문:

```text
warp reduction이 SHFL 계열로 나타나는가?
shared memory reduction과 어떤 차이가 있는가?
barrier가 필요한가?
register pressure가 어떻게 바뀌는가?
```

---

# 19. 최종 결론

이번 실험은 의도대로 성공했다.

```text
attention_exp_sum_store_kernel:
    STG unnorm_probs
    STG sums

attention_normalize_probs_kernel:
    LDG unnorm_probs
    LDG sums
    STG probs
```

따라서 다음 materialization chain이 SASS에서 확인되었다.

```text
STG unnorm_probs
→ kernel boundary
→ LDG unnorm_probs
→ normalize
→ STG probs
```

최종 결론:

```text
Materialization은 source code의 변수나 배열 대입문 자체로 결정되지 않는다.

같은 kernel 안의 intermediate는 compiler가 register에 유지하거나 제거할 수 있다.

그러나 kernel boundary를 넘어야 하는 intermediate는
다음 kernel에서 소비할 수 있도록 global memory에 저장되어야 하며,
SASS에서 명시적인 STG/LDG boundary로 나타난다.
```

이 결과는 attention optimization을 분석할 때 다음 관점이 중요하다는 것을 보여준다.

```text
어떤 계산을 수행하는가?
```

뿐 아니라:

```text
중간값이 어디에 존재하는가?
register인가?
shared memory인가?
global memory인가?
kernel boundary를 넘는가?
```

를 함께 봐야 한다.

이번 실험에서 얻은 가장 중요한 문장은 다음과 같다.

```text
Attention 최적화의 핵심은 산술 연산을 줄이는 것만이 아니라,
중간 tensor가 global memory state로 materialize되는 경계를 제거하는 것이다.
```
