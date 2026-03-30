# runtime-optimization

이 디렉토리는 shape, dtype, memory pressure, workspace 한계 같은 runtime 조건 아래에서 어떤 실행 경로를 선택할지를 다룹니다.

하나의 고정된 최적 커널을 전제하지 않고, preservation이 허용하는 optimization space 안에서 경로를 선택하는 방식으로 접근합니다.

핵심은 dispatch logic, policy boundary, path selection criterion을 정리하는 것입니다.