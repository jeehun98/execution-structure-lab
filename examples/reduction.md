# Reduction Example

이 문서는 execution-structure-lab이 하나의 연산을 어떤 방식으로 해석하는지 보여주는 가장 작은 예시이다.

여기서는 가장 기본적인 연산 중 하나인 **reduction**을 다룬다.  
reduction은 단순해 보이지만, computation structure, preservation semantics, primitive realization을 연결하는 첫 사례로 매우 적합하다.

---

## 1. 연산 정의

가장 단순한 reduction의 예는 다음과 같다.

\[
y = \sum_{i=0}^{N-1} x_i
\]

입력 벡터 `x`의 모든 원소를 더해 하나의 결과 `y`를 만든다.

표면적으로 보면 단순한 합 연산이지만, 구조적으로 보면 다음과 같은 질문들이 생긴다.

- 부분합을 따로 계산해도 되는가
- merge 순서를 바꾸어도 되는가
- 전체 입력을 계속 유지해야 하는가
- 어떤 방식으로 병렬화할 수 있는가
- floating-point에서는 순서 변화가 어떤 영향을 주는가

즉, reduction은 작지만 구조적인 질문을 많이 끌어낼 수 있는 연산이다.

---

## 2. Computation Structure 관점에서의 해석

Reduction은 가장 전형적인 **reduction structure**를 가진다.

핵심 구조는 다음과 같다.

- 입력 여러 개를 하나의 partial state로 누적한다
- partial state끼리는 다시 merge할 수 있다
- 최종적으로 하나의 summary result를 만든다

이 연산에서 중요한 것은 모든 원소를 끝까지 따로 유지하는 것이 아니라,  
현재까지의 partial accumulation을 유지하는 것이다.

즉, reduction은 다음과 같이 볼 수 있다.

- **partial accumulation structure**
- **mergeable summary structure**
- **tree-structured parallel composition 가능 구조**

이 구조 덕분에 reduction은 순차 실행뿐 아니라 병렬 reduction tree, blockwise accumulation, warp-level aggregation 같은 여러 realization으로 확장될 수 있다.

---

## 3. Preservation Semantics 관점에서의 해석

Reduction은 여러 preservation class와 직접 연결된다.

### Order Preservation
Reduction(sum)은 부분합의 결합 순서를 바꿀 수 있다.  
예를 들어 왼쪽부터 순차적으로 더하는 방식과 tree reduction 방식은 수학적으로 같은 합을 계산한다.

다만 floating-point에서는 덧셈의 결합법칙이 완전히 성립하지 않으므로,  
실제 결과는 순서에 따라 미세하게 달라질 수 있다.

즉, reduction은:

- 수학적 수준에서는 order relaxation이 가능한 구조
- 수치적 수준에서는 order-sensitive effect를 가질 수 있는 구조

로 해석할 수 있다.

### Representation Preservation
입력을 contiguous하게 읽든, tiled 형태로 staging하든, shared memory를 거쳐 읽든, 계산 의미 자체는 변하지 않는다.

따라서 reduction은 입력 표현이나 staging 방식의 변화에 대해 representation preservation을 가진다.

### Summary-State Preservation
Reduction은 전체 입력을 끝까지 저장할 필요가 없다.  
현재까지의 partial sum만 유지하면 된다.

즉, reduction은 아주 전형적인 summary-state preservation 사례다.

### Rematerialization Preservation
상황에 따라 reduction의 일부 intermediate를 저장하지 않고 재구성하거나 다시 계산할 수도 있다.  
규모가 작은 경우에는 intermediate 저장 없이 바로 merge하는 방식이 더 자연스럽다.

---

## 4. 가능한 Primitive Realization

Reduction은 매우 다양한 GPU primitive realization으로 구현될 수 있다.

예를 들면:

- sequential accumulation
- warp-level reduction
- block-level shared-memory reduction
- hierarchical multi-block reduction
- tree-based staged reduction

이 realization들은 모두 같은 수학적 목표를 가지지만,  
어떤 partial state를 어디에 두고, 어떤 단위에서 merge하느냐에 따라 비용 구조가 달라진다.

주요 realization 요소:

- register accumulation
- shared memory staging
- warp shuffle 기반 merge
- block synchronization
- global partial reduction

즉, reduction은 computation structure와 primitive realization이 어떻게 연결되는지를 보여주는 가장 기본적인 사례다.

---

## 5. 왜 이 예제가 중요한가

Reduction은 단순한 시작 예제이지만, 이 프로젝트의 핵심 관점을 거의 모두 담고 있다.

첫째, 연산자 이름이 아니라 **구조**로 해석할 수 있다.  
둘째, 어떤 최적화가 가능한지가 preservation semantics를 통해 설명된다.  
셋째, 동일한 구조가 여러 primitive realization으로 연결될 수 있다.  
넷째, 이후 softmax, layernorm, attention 같은 더 복잡한 연산도 이 기초 위에서 확장해서 볼 수 있다.

즉, reduction은 단순한 toy example이 아니라,  
execution-structure-lab의 해석 방식을 가장 작고 분명하게 보여주는 출발점이다.

---

## 6. 다음으로 연결되는 방향

이 예제 다음에는 다음과 같은 확장이 가능하다.

- `softmax`  
  reduction + rescaling + weighted normalization 구조로 확장

- `layernorm`  
  summary-state + mergeable statistics 구조로 확장

- `attention`  
  weighted aggregation + rescaled streaming 구조로 확장

즉, reduction은 이후 더 복잡한 operator를 해석하기 위한 가장 기본적인 구조적 토대가 된다.