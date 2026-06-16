# flashattention_toy_f32: Materialized Attention vs Online Attention SASS Analysis

## 1. 실험 목적

이번 실험의 목적은 `online_softmax_f32`에서 관찰한 running max / running sum 구조를 더 확장하여, attention toy kernel에서 **materialized attention**과 **online / FlashAttention-style attention**이 SASS 수준에서 어떻게 다르게 나타나는지 확인하는 것이다.

핵심 질문은 다음과 같다.

```text
Attention source expression이 SASS에서
materialized attention으로 보이는가,
아니면 online fused update로 보이는가?
```

이를 위해 하나의 CUDA 파일 안에 두 종류의 attention path를 구성했다.

```text
1. Materialized attention path
   - QK score 계산
   - score matrix 저장
   - score matrix를 다시 읽어 softmax 계산
   - probability matrix 저장
   - probability matrix를 다시 읽어 value accumulation

2. Online / FlashAttention-style path
   - QK score 계산
   - running max update
   - running sum update
   - value accumulator update
   - score/probability matrix 저장 없이 final output만 저장
```

이 실험은 실제 고성능 FlashAttention 구현이 아니다. 목적은 성능이 아니라 **SASS 관찰 가능성**이다.

따라서 한 thread가 하나의 query row를 처리하는 작은 toy kernel로 구성했다. 이렇게 하면 warp-level scheduling, shared memory tiling, inter-thread reduction 같은 복잡한 요소를 배제하고, 다음 핵심 요소만 관찰할 수 있다.

```text
QK score accumulation
softmax max reduction
exp approximation
running sum update
value accumulator update
score/probability materialization
final output store
```

---

## 2. 실험 파일

CUDA source:

```text
kernels/05_nn_ops/flashattention_toy_f32.cu
```

SASS dump:

```text
sass/sm86/05_nn_ops/flashattention_toy_f32.sass
```

PTX dump:

```text
ptx/sm86/05_nn_ops/flashattention_toy_f32.ptx
```

대상 아키텍처:

```text
sm_86
```

컴파일 옵션 요약:

```text
-O3
-Xptxas=-O3
--generate-line-info
--use_fast_math
```

실행 결과:

```text
flashattention_toy_f32 done
y_materialized[0] = -0.05316688
y_online[0]       = -0.05316688
max_abs_diff      = 1.11758709e-08
```

`materialized` 결과와 `online` 결과는 매우 가깝다. 완전한 bitwise equality를 기대할 필요는 없다. 두 구현은 같은 수학적 attention을 계산하지만, softmax 및 accumulation 순서가 다르기 때문에 부동소수점 반올림 차이가 생길 수 있다.

이번 결과에서 `max_abs_diff ≈ 1e-8` 수준이면 toy 실험으로는 정상이다.

---

## 3. Toy Attention 구조

고정 크기 toy attention을 사용했다.

```text
TOY_D      = 4
TOY_N_KEYS = 4
TOY_DV     = 4
TOY_SCALE  = 0.5
```

수식은 다음과 같다.

```text
score_j = dot(q, k_j) * scale

p_j = softmax(score_j)

y = Σ_j p_j * v_j
```

온라인 버전은 softmax를 다음 running state로 갱신한다.

```text
m   = running max
l   = running sum / denominator
acc = running value accumulator
```

각 key `j`에 대해:

```text
score = dot(q, k_j) * scale

new_m = max(m, score)

alpha = exp(m - new_m)
beta  = exp(score - new_m)

l   = l * alpha + beta
acc = acc * alpha + beta * v

m = new_m
```

마지막에:

```text
y = acc / l
```

을 저장한다.

이 구조는 FlashAttention의 핵심 아이디어를 축소한 것이다.

```text
score matrix와 probability matrix를 만들지 않고,
softmax 통계와 value accumulator를 online으로 갱신한다.
```

---

## 4. 커널 구성

이번 파일에는 네 개의 주요 커널이 있다.

| Kernel                              | 역할                                        | Attention 형태 |
| ----------------------------------- | ----------------------------------------- | ------------ |
| `attention_score_store_kernel`      | QK score 계산 후 score matrix 저장             | materialized |
| `attention_softmax_store_kernel`    | score matrix를 읽고 softmax probability 저장   | materialized |
| `attention_value_from_probs_kernel` | probability matrix를 읽고 value accumulation | materialized |
| `flashattention_toy_online_kernel`  | score/probability matrix 없이 online update | online       |

이 네 커널을 비교하면, SASS에서 다음 두 경로를 구분할 수 있다.

```text
Materialized path:
    QK score → STG scores
    LDG scores → softmax → STG probs
    LDG probs → value accumulation → STG y

Online path:
    QK score
    running max/sum update
    value accumulator update
    STG y only
```

---

## 5. 분석 기준

이번 분석에서 보는 핵심 SASS marker는 다음과 같다.

| SASS marker                 | 의미                                       |
| --------------------------- | ---------------------------------------- |
| `LDG`                       | global/read-only memory load             |
| `STG`                       | global memory store                      |
| `FMUL`                      | floating-point multiply                  |
| `FADD`                      | floating-point add/sub                   |
| `FFMA`                      | fused multiply-add                       |
| `FMNMX`                     | floating-point min/max                   |
| `MUFU.EX2`                  | special function unit exponential base-2 |
| `MUFU.RCP`                  | reciprocal                               |
| `IMAD.WIDE`                 | address calculation                      |
| `ISETP` / predicated `EXIT` | bounds check                             |

특히 attention materialization 여부는 다음으로 판단한다.

```text
score matrix에 대한 STG가 있는가?
score matrix에 대한 LDG가 있는가?

probability matrix에 대한 STG가 있는가?
probability matrix에 대한 LDG가 있는가?

online kernel에서 score/probability matrix STG가 없는가?
```

---

# 6. `attention_score_store_kernel` 분석

## 6.1 커널 역할

이 커널은 materialized attention path의 첫 번째 단계다.

```text
q row와 모든 key를 dot product
score_j = dot(q, k_j) * 0.5
scores[row, j] = score_j
```

즉, `QK^T` score matrix를 global memory에 저장한다.

## 6.2 관찰된 SASS 패턴

핵심 명령어 흐름은 다음과 같다.

```sass
LDG.E.CONSTANT ...
LDG.E.CONSTANT ...

FMUL.FTZ ...
FFMA.FTZ ...
FFMA.FTZ ...
FFMA.FTZ ...

FMUL.FTZ ..., 0.5

STG.E [R2.64], ...
STG.E [R2.64+0x4], ...
STG.E [R2.64+0x8], ...
STG.E [R2.64+0xc], ...
```

## 6.3 QK score accumulation

dot product의 첫 multiply는 `FMUL`로 시작한다.

```text
score = q0 * k0
```

이후 누적은 `FFMA`로 이어진다.

```text
score = q1 * k1 + score
score = q2 * k2 + score
score = q3 * k3 + score
```

SASS에서는 다음 구조로 볼 수 있다.

```text
FMUL
FFMA
FFMA
FFMA
```

이것은 `fma_contract_f32` 실험에서 확인한 `mul + add` contraction과 같은 원리다.

소스 수준의 dot product는:

```cpp
float score = q0 * k0;
score = fmaf(q1, k1, score);
score = fmaf(q2, k2, score);
score = fmaf(q3, k3, score);
```

SASS에서는:

```text
FMUL + FFMA chain
```

으로 나타난다.

## 6.4 Scale 적용

`TOY_SCALE = 0.5`는 다음처럼 별도의 multiply로 나타난다.

```sass
FMUL.FTZ ..., 0.5
```

즉, score 계산은 다음 단계로 분리되어 보인다.

```text
dot product accumulation
→ scale multiply
```

## 6.5 Score matrix materialization

이 커널의 가장 중요한 관찰은 마지막 `STG` 4개다.

```sass
STG.E [scores], ...
STG.E [scores+0x4], ...
STG.E [scores+0x8], ...
STG.E [scores+0xc], ...
```

이는 `score_j`들이 실제 global memory에 저장되었음을 의미한다.

따라서 이 커널은 명확한 materialization boundary를 가진다.

```text
QK score가 register에서 계산된 뒤,
scores matrix로 materialized 된다.
```

이것이 materialized attention의 첫 번째 SASS 증거다.

---

# 7. `attention_softmax_store_kernel` 분석

## 7.1 커널 역할

이 커널은 materialized attention path의 두 번째 단계다.

```text
scores[row, :]를 global memory에서 읽음
max(score)를 계산
exp(score - max)를 계산
sum을 계산
probability를 normalize
probs[row, :]를 global memory에 저장
```

## 7.2 관찰된 SASS 패턴

핵심 흐름은 다음과 같다.

```sass
LDG.E.CONSTANT R4,  [scores]
LDG.E.CONSTANT R6,  [scores+0x4]
LDG.E.CONSTANT R8,  [scores+0x8]
LDG.E.CONSTANT R10, [scores+0xc]

FMNMX.FTZ ...
FMNMX.FTZ ...
FMNMX.FTZ ...
FMNMX.FTZ ...

FADD.FTZ score - max
FMUL.FTZ ..., 1.4426950216293334961
MUFU.EX2 ...

FADD.FTZ ...
FADD.FTZ ...
FADD.FTZ ...

MUFU.RCP ...

FMUL.FTZ ...
FMUL.FTZ ...
FMUL.FTZ ...
FMUL.FTZ ...

STG.E [probs], ...
STG.E [probs+0x4], ...
STG.E [probs+0x8], ...
STG.E [probs+0xc], ...
```

## 7.3 Score matrix load

초반부의 `LDG` 4개는 score matrix를 읽는 부분이다.

```text
s0 = scores[row, 0]
s1 = scores[row, 1]
s2 = scores[row, 2]
s3 = scores[row, 3]
```

이것은 materialized path의 핵심이다.

이전 커널에서 `STG scores`가 있었고, 이 커널에서 `LDG scores`가 있다.

```text
attention_score_store_kernel:
    STG scores

attention_softmax_store_kernel:
    LDG scores
```

따라서 score matrix는 kernel boundary를 넘어 실제 memory tensor로 존재한다.

## 7.4 Max reduction

softmax 안정화를 위한 max 계산은 `FMNMX`로 나타났다.

```sass
FMNMX.FTZ R5, R4, -INF, !PT
FMNMX.FTZ R5, R5, R6, !PT
FMNMX.FTZ R5, R5, R8, !PT
FMNMX.FTZ R5, R5, R10, !PT
```

이는 다음 소스 구조에 대응한다.

```cpp
m = fmaxf(m, s);
```

SASS 수준에서는 branch 없이 max operation으로 정리된다.

```text
running max / row max:
    FMNMX chain
```

## 7.5 Exp 계산

`__expf`는 다음 패턴으로 내려갔다.

```sass
FADD.FTZ score, -max
FMUL.FTZ ..., 1.4426950216293334961
MUFU.EX2 ...
```

여기서 `1.4426950216293334961`은 `log2(e)`다.

즉, compiler/codegen은 대략 다음 변환을 사용한다.

```text
exp(x) = 2^(x * log2(e))
```

그래서 SASS에서는 natural exponential이 직접 보이는 것이 아니라:

```text
x * log2(e)
MUFU.EX2
```

형태로 보인다.

## 7.6 Sum reduction

exp 결과들의 합은 `FADD` chain으로 나타난다.

```text
l = p0 + p1 + p2 + p3
```

SASS에서는:

```sass
FADD.FTZ ...
FADD.FTZ ...
FADD.FTZ ...
```

형태로 보인다.

## 7.7 Reciprocal and normalization

분모의 reciprocal은:

```sass
MUFU.RCP
```

로 나타난다.

이후 각 probability는:

```text
p_j = exp_j * rcp(sum)
```

으로 계산되고, `FMUL`로 나타난다.

```sass
FMUL.FTZ ...
FMUL.FTZ ...
FMUL.FTZ ...
FMUL.FTZ ...
```

## 7.8 Probability matrix materialization

마지막 `STG` 4개는 normalized probability matrix 저장이다.

```sass
STG.E [probs], ...
STG.E [probs+0x4], ...
STG.E [probs+0x8], ...
STG.E [probs+0xc], ...
```

따라서 materialized attention path에서 probability matrix도 실제 memory tensor로 존재한다.

```text
scores matrix:
    materialized

probability matrix:
    materialized
```

## 7.9 중요한 관찰: 중간 unnormalized probability store 제거

소스 코드에서는 다음처럼 작성했다.

```cpp
float p = __expf(s_base[j] - m);
l += p;
p_base[j] = p;

float inv_l = 1.0f / l;

float p = p_base[j] * inv_l;
p_base[j] = p;
```

의도는 다음을 관찰하는 것이었다.

```text
STG unnormalized probs
LDG unnormalized probs
STG normalized probs
```

하지만 실제 SASS에서는 중간 unnormalized probability store/load가 보이지 않았다.

왜냐하면 이 store/load는 같은 커널 안에서 외부 관찰 경계 없이 다시 사용되기 때문이다. 컴파일러는 이를 register value로 유지하고, 최종 normalized probability만 memory에 저장했다.

즉:

```text
source-level store
≠
반드시 SASS-level STG
```

이 관찰은 `fma_contract_f32`에서 본 사실과 연결된다.

```text
source temporary variable
≠
반드시 SASS register/materialized value

source store-like expression
≠
반드시 memory round-trip
```

컴파일러가 store/load를 제거할 수 있다고 판단하면, 중간 memory materialization은 사라질 수 있다.

다만 최종 `probs` matrix는 다음 커널에서 사용되므로 반드시 저장된다.

```text
attention_softmax_store_kernel:
    STG probs

attention_value_from_probs_kernel:
    LDG probs
```

이 kernel boundary가 진짜 materialization boundary다.

---

# 8. `attention_value_from_probs_kernel` 분석

## 8.1 커널 역할

이 커널은 materialized attention path의 마지막 단계다.

```text
probs[row, :]를 global memory에서 읽음
v를 global memory에서 읽음
acc += p_j * v_j
y[row, :] 저장
```

## 8.2 관찰된 SASS 패턴

핵심 흐름은 다음과 같다.

```sass
LDG.E.CONSTANT ...   // probs
LDG.E.CONSTANT ...   // values

FFMA.FTZ ...
FFMA.FTZ ...
FFMA.FTZ ...
...

STG.E [y], ...
STG.E [y+0x4], ...
STG.E [y+0x8], ...
STG.E [y+0xc], ...
```

## 8.3 Probability matrix load

초반부 `LDG` 중 일부는 `probs`를 읽는 load다.

이는 이전 커널의 `STG probs`와 연결된다.

```text
attention_softmax_store_kernel:
    STG probs

attention_value_from_probs_kernel:
    LDG probs
```

따라서 probability matrix가 global memory에 materialized되었다는 점이 명확하다.

## 8.4 Value accumulation

value accumulation은 `FFMA` chain으로 나타난다.

소스 구조:

```cpp
acc0 = fmaf(p, v0, acc0);
acc1 = fmaf(p, v1, acc1);
acc2 = fmaf(p, v2, acc2);
acc3 = fmaf(p, v3, acc3);
```

SASS 구조:

```text
FFMA
FFMA
FFMA
FFMA
...
```

이는 `p * v + acc` 형태가 fused multiply-add로 내려갔다는 뜻이다.

즉 materialized path에서도 arithmetic 자체는 fused 된다.

중요한 차이는 arithmetic fusion이 아니라 memory boundary다.

```text
materialized attention:
    p가 memory에서 로드됨

online attention:
    p가 memory tensor로 존재하지 않고 beta/register state로 존재함
```

## 8.5 Final output store

마지막 `STG` 4개는 output vector `y[row, :]` 저장이다.

```sass
STG.E [y], ...
STG.E [y+0x4], ...
STG.E [y+0x8], ...
STG.E [y+0xc], ...
```

이는 materialized path와 online path 모두에서 필요하다.

따라서 단순히 `STG`가 보인다고 materialized attention이라고 판단하면 안 된다.

판별 기준은 다음이다.

```text
중간 score/probability tensor에 대한 STG/LDG인가?
아니면 final output y에 대한 STG인가?
```

---

# 9. `flashattention_toy_online_kernel` 분석

## 9.1 커널 역할

이 커널은 online / FlashAttention-style path다.

핵심은 다음이다.

```text
score matrix 저장 없음
probability matrix 저장 없음

running max m
running sum l
value accumulator acc

를 register에서 갱신한 뒤 final y만 저장
```

## 9.2 관찰된 SASS 흐름

온라인 커널은 긴 instruction stream으로 나온다. 이유는 loop가 unroll되고, `TOY_N_KEYS=4`, `TOY_D=4`, `TOY_DV=4`가 모두 compile-time constant이기 때문이다.

관찰된 주요 marker는 다음과 같다.

```text
LDG.E.CONSTANT  // q/k/v load
FMUL.FTZ        // first multiply, scale, rescale
FFMA.FTZ        // dot-product and accumulator update
FMNMX.FTZ       // running max
FADD.FTZ        // score - max, m - new_m
FMUL.FTZ log2(e)
MUFU.EX2        // exp
MUFU.RCP        // final reciprocal
STG.E           // final y only
```

## 9.3 QK score accumulation

온라인 커널에서도 score 계산은 `FMUL + FFMA chain`으로 나타난다.

```text
score = dot(q, k_j) * scale
```

SASS 관점:

```text
FMUL
FFMA
FFMA
FFMA
FMUL 0.5
```

이는 materialized score kernel과 동일한 산술 패턴이다.

즉 QK score 계산 자체는 두 path 모두 fused multiply-add 형태로 최적화된다.

차이는 score를 memory에 저장하느냐, register state로 바로 소비하느냐다.

```text
materialized:
    score 계산 → STG scores

online:
    score 계산 → running max/sum/acc update에 바로 사용
```

## 9.4 Running max update

온라인 softmax의 핵심인 running max는 `FMNMX`로 나타난다.

```text
new_m = max(m, score)
```

SASS:

```sass
FMNMX.FTZ ...
```

이는 branch-based control flow가 아니라 floating-point min/max instruction으로 처리된다.

중요한 점은 이 값이 memory에 저장되지 않는다는 것이다.

```text
m
new_m
score
```

이 모두 register value로 유지되며 다음 계산에 사용된다.

## 9.5 Alpha / beta 계산

온라인 업데이트는 다음 두 값을 계산한다.

```text
alpha = exp(m - new_m)
beta  = exp(score - new_m)
```

SASS 패턴은 softmax kernel과 동일하다.

```sass
FADD.FTZ ...
FMUL.FTZ ..., 1.4426950216293334961
MUFU.EX2 ...
```

해석:

```text
x = m - new_m 또는 score - new_m
x_log2 = x * log2(e)
exp_value = 2^x_log2
```

즉 `__expf`는 `MUFU.EX2`로 내려간다.

## 9.6 Running sum update

소스 의도:

```cpp
l = fmaf(l, alpha, beta);
```

수학적으로는:

```text
l_new = l_old * alpha + beta
```

SASS에서는 `FFMA` 형태로 나타날 수 있다.

```text
FFMA l, alpha, beta
```

이번 덤프에서도 online kernel 내부에는 여러 `FFMA.FTZ`가 나타난다. 이 중 일부가 running sum update와 value accumulator update에 해당한다.

다만 loop unroll과 register scheduling 때문에 source line과 SASS instruction을 1:1로 대응시키기는 어렵다. 따라서 정확한 개별 instruction mapping보다는 다음 구조적 기준으로 판단한다.

```text
online kernel 내부:
    score/prob STG 없음
    FMNMX로 running max 갱신
    MUFU.EX2로 alpha/beta 계산
    FFMA/FMUL로 l 및 acc 갱신
    final y만 STG
```

## 9.7 Value accumulator update

소스 의도:

```cpp
scaled_acc = acc * alpha;
acc = fmaf(beta, v, scaled_acc);
```

이는 다음 수식이다.

```text
acc_new = acc_old * alpha + beta * v
```

SASS에서는 일반적으로 다음 조합으로 나타난다.

```text
FMUL  scaled_acc = acc * alpha
FFMA  acc = beta * v + scaled_acc
```

이번 online kernel에서도 `FMUL.FTZ`와 `FFMA.FTZ`가 반복적으로 나타난다.

이 구조는 materialized path의:

```text
acc += p * v
```

와 비슷해 보이지만, 의미가 다르다.

materialized path:

```text
p = LDG probs
acc = p * v + acc
```

online path:

```text
beta = exp(score - new_m)
alpha = exp(m - new_m)

acc = acc * alpha + beta * v
```

즉 online path에서는 probability matrix의 `p`를 memory에서 읽지 않는다. 대신 softmax normalization을 고려한 running update를 register 상태로 수행한다.

## 9.8 Final normalization

마지막에는:

```text
inv_l = 1 / l
y = acc * inv_l
```

이 수행된다.

SASS에서는:

```sass
MUFU.RCP
FMUL.FTZ
FMUL.FTZ
FMUL.FTZ
FMUL.FTZ
STG.E [y]
STG.E [y+0x4]
STG.E [y+0x8]
STG.E [y+0xc]
```

로 나타난다.

## 9.9 Online kernel의 materialization 여부

온라인 커널에서 중요한 것은 `STG`가 아예 없다는 뜻이 아니다. 마지막 output `y`는 당연히 저장해야 한다.

진짜 질문은 이것이다.

```text
score matrix 또는 probability matrix에 해당하는 STG가 있는가?
```

이번 online kernel에서는 중간 score/probability matrix store가 보이지 않는다.

관찰된 store는 마지막 output store다.

```text
STG y[0]
STG y[1]
STG y[2]
STG y[3]
```

따라서 online kernel은 다음처럼 해석할 수 있다.

```text
score/probability matrix materialization 없음
running max/sum/accumulator register update
final output만 global memory에 저장
```

이것이 FlashAttention-style online update의 toy SASS signature다.

---

# 10. Materialized vs Online 비교

## 10.1 Materialized attention SASS signature

Materialized path는 kernel boundary마다 중간 tensor가 global memory에 드러난다.

```text
attention_score_store_kernel:
    QK score 계산
    STG scores

attention_softmax_store_kernel:
    LDG scores
    softmax
    STG probs

attention_value_from_probs_kernel:
    LDG probs
    value accumulation
    STG y
```

SASS signature:

```text
FMUL / FFMA
STG scores

LDG scores
FMNMX
MUFU.EX2
MUFU.RCP
STG probs

LDG probs
FFMA
STG y
```

## 10.2 Online attention SASS signature

Online path는 score/probability matrix를 memory tensor로 만들지 않는다.

```text
flashattention_toy_online_kernel:
    LDG q/k/v
    QK score FFMA
    running max FMNMX
    alpha/beta MUFU.EX2
    running sum/value accumulator FFMA/FMUL
    final RCP
    STG y
```

SASS signature:

```text
LDG q/k/v
FMUL / FFMA score
FMNMX running max
MUFU.EX2 exp
FFMA running sum / accumulator
MUFU.RCP
FMUL final normalize
STG y
```

## 10.3 핵심 차이

| 항목                 | Materialized attention     | Online attention              |
| ------------------ | -------------------------- | ----------------------------- |
| score matrix       | `STG scores`, `LDG scores` | 없음                            |
| probability matrix | `STG probs`, `LDG probs`   | 없음                            |
| QK score           | `FMUL + FFMA`              | `FMUL + FFMA`                 |
| max update         | `FMNMX`                    | `FMNMX`                       |
| exp                | `MUFU.EX2`                 | `MUFU.EX2`                    |
| value accumulation | `LDG probs` 후 `FFMA`       | alpha/beta 기반 register `FFMA` |
| final output       | `STG y`                    | `STG y`                       |
| 중간 state           | global memory tensor       | register values               |

결론적으로 산술 primitive는 일부 비슷하다.

```text
QK score:
    both use FFMA

softmax max:
    both use FMNMX

exp:
    both use MUFU.EX2

value accumulation:
    both use FFMA
```

하지만 memory boundary가 다르다.

```text
materialized:
    intermediate tensor appears as LDG/STG

online:
    intermediate tensor disappears into register update stream
```

---

# 11. 이번 실험의 핵심 결론

이번 SASS 결과는 다음 결론을 뒷받침한다.

```text
Attention의 중간 행렬이 SASS에서 memory boundary로 나타나면 materialized attention이다.

반대로 score/probability matrix에 대한 STG/LDG 없이,
FMNMX, MUFU.EX2, FFMA 기반 register update와 final STG만 보이면
online fused attention으로 볼 수 있다.
```

더 구체적으로:

```text
materialized attention은 score/probability를 global memory tensor로 노출한다.

online attention은 score/probability를 tensor로 저장하지 않고,
running max, running sum, value accumulator를 register 상태로 유지한다.
```

이 실험은 `fma_contract_f32`에서 확인한 관점과 연결된다.

```text
source expression
→ compiler graph rewrite
→ SASS primitive
→ materialization boundary
```

`fma_contract_f32`에서는 source-level temporary가 반드시 SASS-level materialization으로 이어지지 않음을 보았다.

이번 `flashattention_toy_f32`에서는 더 큰 단위에서 같은 사실을 확인했다.

```text
source-level conceptual matrix:
    scores
    probs

SASS-level online path:
    scores/probs matrix 없음
    register state만 존재
```

즉, SASS 분석에서 중요한 것은 소스 코드에 어떤 변수나 배열 이름이 있는지가 아니라, 실제로 다음이 나타나는지다.

```text
LDG/STG memory boundary
register update chain
FFMA/FMUL/FADD arithmetic primitive
FMNMX max update
MUFU special function
```

---

# 12. 주의점

## 12.1 `LDG.E.CONSTANT` 해석 주의

이번 SASS에는 `LDG.E.CONSTANT`가 많이 보인다.

이를 곧바로 CUDA constant memory 사용으로 해석하면 안 된다. 여기서는 `const float* __restrict__` 입력에 대한 read-only/cache path 성격으로 보는 것이 안전하다.

분석의 핵심은 `CONSTANT`라는 이름 자체가 아니라 다음이다.

```text
LDG:
    global/read-only load

STG:
    global store
```

즉 중요한 것은 memory traffic direction이다.

```text
중간 tensor를 읽는가?
중간 tensor를 쓰는가?
```

## 12.2 `STG`가 있다고 모두 materialized attention은 아니다

online kernel에도 마지막 `STG`가 있다.

하지만 이것은 final output `y` 저장이다.

따라서 판단 기준은 다음이어야 한다.

```text
STG가 있는가?
```

가 아니라:

```text
score/probability intermediate에 대한 STG가 있는가?
```

이다.

## 12.3 Source와 SASS는 1:1 대응하지 않는다

`attention_softmax_store_kernel`에서 source-level unnormalized probability store는 SASS에서 제거되었다.

이것은 다음 사실을 다시 보여준다.

```text
source에 store처럼 보이는 코드가 있어도,
compiler가 외부 관찰 가능성이 없다고 판단하면
memory round-trip을 제거할 수 있다.
```

진짜 materialization boundary는 kernel boundary 또는 외부에서 관찰 가능한 memory access다.

---

# 13. 보강 실험 방향

이번 실험만으로도 materialized vs online의 큰 차이는 확인되었다.

다만 더 강하게 probability materialization을 관찰하려면 softmax를 두 커널로 쪼갤 수 있다.

## 13.1 Unnormalized probability materialization

새 커널 후보:

```text
attention_exp_store_kernel
```

역할:

```text
scores[row, :]를 읽음
m = max(scores)
unnorm_probs[row, j] = exp(score_j - m)
sum[row] = Σ exp(score_j - m)
```

예상 SASS:

```text
LDG scores
FMNMX
MUFU.EX2
STG unnorm_probs
STG sum
```

## 13.2 Normalize probability kernel

새 커널 후보:

```text
attention_normalize_probs_kernel
```

역할:

```text
unnorm_probs[row, j]를 읽음
sum[row]를 읽음
probs[row, j] = unnorm_probs[row, j] / sum[row]
```

예상 SASS:

```text
LDG unnorm_probs
LDG sum
MUFU.RCP
FMUL
STG probs
```

이렇게 나누면 현재 compiler가 제거한 중간 unnormalized probability store/load도 강제로 SASS에서 관찰할 수 있다.

## 13.3 Shared memory toy 실험

다음 단계에서는 global memory materialization과 shared memory materialization을 구분할 수 있다.

예시:

```text
attention_score_shared_kernel
```

관찰 질문:

```text
score가 STS/ LDS로 나타나는가?
shared memory materialization은 global memory materialization과 어떻게 다른가?
```

SASS marker:

```text
STS
LDS
```

이는 실제 FlashAttention의 shared memory tiling 분석으로 넘어가기 전 중간 단계가 된다.

## 13.4 Multi-thread row 실험

현재 toy kernel은 한 thread가 한 row를 처리한다.

다음 단계에서는 하나의 row를 여러 thread가 나눠 처리하게 만들 수 있다.

관찰 질문:

```text
warp-level reduction이 어떤 SASS로 나타나는가?
SHFL이 나타나는가?
shared memory reduction이 나타나는가?
barrier가 나타나는가?
```

SASS marker:

```text
SHF / SHFL 계열
BAR
LDS / STS
```

이 단계로 가면 실제 attention kernel의 parallel reduction 구조와 가까워진다.

---

# 14. 연구 노트 요약

이번 실험의 최종 요약은 다음과 같다.

```text
flashattention_toy_f32는 materialized attention과 online attention의 SASS 차이를 보여주는 toy kernel이다.

materialized path에서는 score matrix와 probability matrix가 global memory boundary로 나타난다.

attention_score_store_kernel은 QK score를 FMUL/FFMA chain으로 계산한 뒤 STG로 scores matrix를 저장한다.

attention_softmax_store_kernel은 scores matrix를 LDG로 읽고, FMNMX로 max를 계산하고, MUFU.EX2로 exp를 계산한 뒤, normalized probability를 STG로 저장한다.

attention_value_from_probs_kernel은 probability matrix를 LDG로 읽고, p * v + acc를 FFMA chain으로 누적한 뒤 final y를 STG한다.

반면 flashattention_toy_online_kernel은 score/probability matrix에 대한 STG/LDG 없이, QK score 계산, running max update, exp, running sum update, value accumulator update를 하나의 register-level instruction stream 안에서 수행한다.

따라서 SASS 수준에서 materialized attention과 online fused attention은 memory boundary의 존재 여부로 구분할 수 있다.
```

핵심 판별식:

```text
Materialized attention:
    STG scores
    LDG scores
    STG probs
    LDG probs

Online attention:
    no STG scores
    no LDG scores from intermediate
    no STG probs
    no LDG probs from intermediate
    FMNMX / MUFU / FFMA register update
    final STG y only
```

---

# 15. 연결되는 연구 질문

이 실험은 다음 큰 질문으로 이어진다.

```text
고수준 attention source expression은 컴파일 후 SASS에서
중간 tensor를 materialize하는 구조로 남는가,
아니면 register/shared-memory 기반 online update 구조로 재작성되는가?
```

현재 toy 실험에서는 두 구조를 수동으로 작성했고, SASS에서 두 구조의 차이를 확인했다.

다음 단계에서는 더 복잡한 attention kernel에서 다음을 확인해야 한다.

```text
1. score/probability matrix가 global memory에 나타나는가?
2. shared memory tile로만 존재하는가?
3. register accumulator로만 존재하는가?
4. running max/sum update가 online softmax 형태인가?
5. value accumulation이 FFMA chain으로 유지되는가?
6. kernel boundary가 materialization boundary를 만드는가?
```

이 질문들은 실제 FlashAttention류 kernel 분석의 핵심이다.
