# Operators and Computation Structure

이 문서는 개별 연산자를 단순한 이름이나 수식으로만 보지 않고, 그 아래에 있는 **computation structure** 관점에서 정리하기 위한 초안이다.

이 저장소에서 중요한 것은 “이 연산이 무엇인가”보다, **“이 연산이 어떤 계산 구조를 가지는가”**이다.  
같은 구조를 공유하는 연산자들은 서로 다른 표면적 형태를 가지더라도 비슷한 realization, composition, optimization 가능성을 가질 수 있다.

---

## 왜 computation structure가 중요한가

GPU 최적화는 종종 operator-specific trick의 형태로 축적된다.  
예를 들어 reduction 최적화, softmax 최적화, normalization 최적화처럼 연산자별 기법으로 정리되는 경우가 많다.

하지만 실제로는 서로 다른 연산자 아래에 공통적인 계산 구조가 존재한다.

예를 들어:

- 부분 결과를 병합할 수 있는가
- 전체 상태 대신 요약 상태만 유지할 수 있는가
- 순서를 바꾸어도 의미가 유지되는가
- streaming 방식으로 처리할 수 있는가
- 수치적 안정성을 위해 rescaling이 필요한가
- 저장 대신 재계산을 허용할 수 있는가

이 질문들은 연산자 이름보다 더 아래 수준의 구조를 다룬다.  
따라서 computation structure를 먼저 정의하면, 개별 최적화를 더 일반적인 원리로 끌어올릴 수 있다.

---

## 기본 구조 분류

아래 분류는 초기 초안이며, 이후 더 세분화될 수 있다.

### 1. Reduction Structure

여러 입력을 하나의 요약 결과로 결합하는 구조이다.

예시:
- sum
- max
- min
- dot product의 부분 누적
- norm 계산의 중간 합산

주요 특징:
- 병합 가능한 partial result가 존재한다
- tree 형태의 병렬화가 가능하다
- 연산 순서가 수치 결과에 영향을 줄 수 있다
- associative / commutative 성질이 중요하다

핵심 질문:
- partial state는 무엇인가
- merge rule은 무엇인가
- order relaxation이 허용되는가

---

### 2. Summary-State Structure

전체 입력을 모두 유지하지 않고, 작은 상태만으로 계산을 이어갈 수 있는 구조이다.

예시:
- mean / variance 추적
- running statistics
- online normalization 관련 계산
- blockwise summary accumulation

주요 특징:
- 전체 state 대신 compressed state를 유지한다
- mergeable summary가 존재할 수 있다
- state 표현 자체가 중요한 의미를 가진다

핵심 질문:
- summary state는 무엇인가
- state merge가 가능한가
- summary만으로 원래 의미를 충분히 유지할 수 있는가

---

### 3. Weighted Aggregation Structure

입력 값들을 가중치와 함께 누적하는 구조이다.

예시:
- weighted sum
- attention value accumulation
- probability-weighted expectation
- normalized weighted reduction

주요 특징:
- numerator와 denominator가 함께 움직일 수 있다
- rescaling이 필요할 수 있다
- streaming accumulation과 잘 연결된다

핵심 질문:
- weight는 고정인가 동적인가
- normalization이 필요한가
- partial weighted state를 병합할 수 있는가

---

### 4. Rescaled Streaming Structure

입력을 한 번에 전부 물질화하지 않고, streaming 방식으로 처리하면서 수치 안정성을 위해 중간 상태를 rescaling하는 구조이다.

예시:
- online softmax
- streaming log-sum-exp
- blockwise stable accumulation
- flash-attention 계열의 일부 구성

주요 특징:
- 전체 intermediate를 저장하지 않는다
- running max / scale / normalized sum 같은 상태가 필요하다
- numerical stability가 구조의 일부가 된다

핵심 질문:
- 어떤 state를 유지해야 안정성이 보장되는가
- rescaling 전후에 어떤 보존 관계가 성립하는가
- streaming decomposition이 가능한가

---

### 5. Rematerializable Structure

중간값을 저장하는 대신, 필요할 때 다시 계산해도 되는 구조이다.

예시:
- fused epilogue의 일부 intermediate
- backward에서 재계산 가능한 activation
- checkpointing 가능한 중간 단계

주요 특징:
- memory와 compute 사이의 trade-off가 존재한다
- 저장 비용보다 재계산 비용이 낮을 수 있다
- preservation semantics가 별도로 필요하다

핵심 질문:
- 어떤 intermediate가 재계산 가능한가
- 어떤 경우에 저장이 필수적인가
- rematerialization이 전체 path 선택에 어떤 영향을 주는가

---

## 초기 operator 해석 예시

### Reduction
Reduction은 가장 기본적인 reduction structure를 가진다.  
입력 여러 개를 하나의 partial state로 누적하고, 이 partial state들을 다시 merge하여 최종 결과를 만든다.

핵심 구조:
- partial accumulation
- mergeable partial result
- order-sensitive numerical effect 가능성

---

### Softmax
Softmax는 단순 elementwise operator가 아니다.  
구조적으로 보면 max reduction, exp-based rescaling, normalized weighted aggregation이 결합된 형태로 해석할 수 있다.

핵심 구조:
- reduction structure
- rescaled streaming structure
- weighted aggregation structure

---

### LayerNorm
LayerNorm은 mean과 variance를 추적하는 summary-state structure로 볼 수 있다.  
구현 방식에 따라 online/mergeable statistics 구조로도 해석 가능하다.

핵심 구조:
- summary-state structure
- reduction structure
- mergeable statistics

---

## 이 문서의 목적

이 문서는 연산자를 computation structure 관점에서 바라보는 최소 출발점이다.  
이후에는 각 구조를 더 엄밀히 정의하고, preservation semantics 및 primitive realization과 연결하는 방향으로 확장한다.

즉, operator를 곧바로 kernel로 연결하기보다,  
먼저 **operator → structure**의 관계를 정리하는 것이 이 문서의 역할이다.