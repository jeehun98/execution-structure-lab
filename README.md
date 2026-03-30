# execution-structure-lab

execution-structure-lab은 연산의 computation structure를 분석하고, 의미 보존이 허용되는 transformation boundary를 정의하며, GPU 실행이 어떤 방식으로 실현되고 조합되고 최적화되고 생성될 수 있는지를 구조적으로 정리하는 프로젝트입니다.

이 저장소는 최적화를 고정된 rewrite 규칙의 집합으로 보지 않고, 의미를 보존한 채 어디까지 바꿀 수 있는지를 탐색하는 구조적 문제로 다룹니다.

프로젝트는 computation structure, preservation semantics, primitive realization, structural composition, hardware evidence, runtime optimization, kernel synthesis를 하나의 시스템 관점으로 연결하는 것을 목표로 합니다.