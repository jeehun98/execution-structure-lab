# computation-structure

이 디렉토리는 여러 operator 아래에서 반복적으로 나타나는 공통 계산 구조를 정리합니다.

초점은 개별 연산자 자체가 아니라, reduction, streaming accumulation, mergeable summary, weighted aggregation과 같은 구조적 형태에 있습니다.

이 계층의 목적은 구현 세부사항보다 앞서, 각 연산이 본질적으로 어떤 계산으로 이해되어야 하는지를 설명하는 데 있습니다.