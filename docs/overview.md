# Overview

execution-structure-lab은 GPU 실행 구조를 구조 중심으로 다루는 프로젝트입니다.

이 프로젝트는 연산의 computation structure를 먼저 식별하고, 어떤 transformation이 의미를 보존하는지에 대한 preservation boundary를 정의한 뒤, 그 제약을 realization, composition, runtime selection, synthesis까지 연결합니다.

즉, 최적화를 개별 기법의 집합이 아니라, 유효한 execution space를 설계하는 문제로 바라봅니다.