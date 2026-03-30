# primitive-realization

이 디렉토리는 계산 구조를 GPU 하드웨어 위에서 실제 실행 형태로 실현하는 primitive들을 다룹니다.

예를 들어 reduction tree, tile staging, streaming update, shared memory residency, cooperative accumulation 같은 실행 단위를 정리합니다.

목표는 추상적인 computation structure를 구체적인 execution mechanism으로 연결하는 것입니다.