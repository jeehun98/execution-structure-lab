# Computation Structures

이 디렉토리는 여러 operator들에 공통적으로 나타나는 상위 수준의 계산 구조를 정리합니다.

초점은 개별 연산자의 이름이나 구현 방식이 아니라, reduction, streaming accumulation, mergeable summary, weighted aggregation과 같이 서로 다른 연산자들 아래에서 반복적으로 나타나는 계산의 구조적 형태에 있습니다.

이 계층의 목적은 특정 hardware나 backend를 전제하지 않은 상태에서, 주어진 operator들을 더 일반적인 계산 범주로 분류할 수 있게 만드는 데 있습니다. 따라서 이 디렉토리는 개별 operator의 고유 의미나 realization을 직접 다루기보다, operator들을 해석하고 연결하기 위한 상위 개념의 구조 언어를 제공합니다.