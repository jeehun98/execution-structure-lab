# Preservation Classes

이 문서는 execution-structure-lab에서 사용하는 초기 preservation semantics 분류를 정리한다.

여기서 preservation semantics란, 어떤 transformation이 계산의 의미를 유지하는지, 그리고 그 허용 범위가 어디까지인지를 설명하는 규칙이다.

이 저장소에서 preservation은 단순한 부가 속성이 아니다.  
preservation은 realization, composition, runtime path selection, kernel synthesis 전반을 제한하는 **legality boundary**로 작동한다.

---

## 왜 preservation semantics가 필요한가

최적화는 종종 “더 빠르게 만들 수 있는가”라는 질문만으로 접근된다.  
하지만 구조적으로 더 중요한 질문은 다음과 같다.

- 이 변환은 정말 같은 계산인가
- 어떤 조건 아래에서만 같은 계산인가
- 수학적으로는 같아도 수치적으로는 어떤 차이가 생기는가
- 저장 방식을 바꿔도 의미가 유지되는가
- intermediate를 생략하거나 재계산해도 되는가

이 질문들에 답하지 않으면, 최적화는 경험적인 테크닉 모음으로 남는다.  
반대로 preservation semantics를 명시하면, 각 transformation은 **정당화 가능한 변화**가 된다.

---

## 초기 preservation class

초기 버전에서는 아래 다섯 가지를 핵심 축으로 둔다.

---

### 1. Order Preservation

연산 순서를 바꾸었을 때 의미가 유지되는지에 대한 보존 성질이다.

질문:
- 연산 순서를 바꾸어도 수학적으로 같은가
- 병렬 reduction tree로 재배열해도 되는가
- 수치적으로는 어떤 오차 차이가 생길 수 있는가

예시:
- 정수 합에서는 순서 변경이 거의 문제되지 않을 수 있다
- 부동소수점 sum은 수학적으로 같은 형태라도 순서에 따라 결과가 조금 달라질 수 있다
- max reduction은 보통 순서 변화에 강하다

의미:
- reduction tree 재구성
- warp/block 단위 병렬화
- non-sequential accumulation

같은 최적화가 order preservation의 범위 안에서 가능해진다.

---

### 2. Representation Preservation

데이터의 표현 방식, 배치 방식, layout이 바뀌더라도 의미가 유지되는지에 대한 보존 성질이다.

질문:
- memory layout이 바뀌어도 계산 의미는 같은가
- tiled representation으로 바꿔도 되는가
- transpose나 reindexing이 semantic change 없이 가능한가

예시:
- row-major와 tiled layout 사이의 변환
- shared memory staging을 위한 재배열
- vectorized load/store를 위한 packed representation

의미:
- layout transformation
- tiling
- staging
- data movement reorganization

이 class는 계산 그 자체보다 **표현의 바뀜**을 정당화한다.

---

### 3. Summary-State Preservation

전체 상태를 그대로 유지하지 않고, 요약 상태만 유지해도 의미가 보존되는지에 대한 보존 성질이다.

질문:
- 전체 input을 저장하지 않고 summary state만으로 충분한가
- partial summary를 merge할 수 있는가
- summary state가 원래 계산에 필요한 정보를 충분히 담고 있는가

예시:
- mean / variance 누적
- running statistics
- mergeable online state
- blockwise summary accumulation

의미:
- online algorithm
- streaming accumulation
- reduced state storage
- mergeable state design

이 class가 있어야 full materialization 없이도 계산을 지속할 수 있다.

---

### 4. Rescaling Preservation

수치 안정성 또는 표현 범위 관리를 위해 값을 재스케일링해도 의미가 유지되는지에 대한 보존 성질이다.

질문:
- 중간 상태를 scale 조정해도 최종 결과가 같게 복원되는가
- normalization factor를 분리해서 관리해도 되는가
- rescaling 과정이 numerical stability를 개선하는가

예시:
- online softmax의 running max 기반 rescaling
- log-sum-exp 형태의 안정화
- blockwise normalized accumulation

의미:
- stable streaming algorithm
- scale-aware partial state
- normalized accumulation path

이 class는 특히 softmax, attention, 확률적 weighted aggregation에서 중요하다.

---

### 5. Rematerialization Preservation

중간값을 저장하지 않고 필요할 때 다시 계산해도 의미가 유지되는지에 대한 보존 성질이다.

질문:
- intermediate를 메모리에 저장하지 않아도 되는가
- 필요한 시점에 recompute해도 semantic mismatch가 없는가
- 메모리 절약이 compute 증가보다 유리한가

예시:
- activation recomputation
- fused epilogue intermediate 재생성
- checkpointing 가능한 계산 경로

의미:
- memory-compute trade-off
- checkpointing
- reduced buffer requirement
- workspace-sensitive path choice

이 class는 runtime optimization과도 강하게 연결된다.

---

## preservation class는 어떻게 쓰이는가

preservation class는 단지 문서화용 분류가 아니다.  
이 분류는 이후 계층과 직접 연결된다.

예를 들어:

- Order Preservation  
  → reduction tree 변경 가능성 판단

- Representation Preservation  
  → tiling, layout transform, staging 정당화

- Summary-State Preservation  
  → streaming / online path 허용 여부 판단

- Rescaling Preservation  
  → numerically stable accumulation path 허용 여부 판단

- Rematerialization Preservation  
  → recompute-based path 선택 가능 여부 판단

즉, preservation class는 “이 연산에 어떤 최적화가 붙을 수 있는가”를 규정하는 출발점이다.

---

## reduction 예시로 보는 preservation

Reduction(sum)을 예로 들면:

- **Order Preservation**  
  부분합의 merge 순서를 바꿀 수 있다.  
  다만 floating-point에서는 결과 값의 미세한 차이가 발생할 수 있다.

- **Representation Preservation**  
  입력을 tiled/shared-memory staged 형태로 재배열해도 계산 의미는 유지된다.

- **Summary-State Preservation**  
  전체 입력을 유지하지 않고 partial sum만 유지해도 최종 결과를 계산할 수 있다.

- **Rescaling Preservation**  
  일반 sum에서는 보통 핵심 class가 아니지만, 특정 normalized accumulation으로 확장되면 중요해질 수 있다.

- **Rematerialization Preservation**  
  intermediate를 별도 저장하지 않고 재계산 가능한 경우가 있다.

이렇게 보면 reduction은 단순 연산이 아니라, 여러 preservation class와 연결된 구조적 사례가 된다.

---

## 이 문서의 역할

이 문서는 초기 preservation taxonomy를 제공하기 위한 출발점이다.  
향후에는 approximation, decomposition, bounded-error transform, representation hierarchy 같은 더 세분화된 class가 추가될 수 있다.

현재 단계의 목적은 복잡한 이론을 완성하는 것이 아니라,  
각 operator와 structure를 해석할 때 사용할 수 있는 **실용적인 legality vocabulary**를 만드는 것이다.