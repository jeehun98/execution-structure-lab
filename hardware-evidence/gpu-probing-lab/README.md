# gpu-probing-lab

GPU execution behavior를 관찰하기 위한 별도 실험 프로젝트.

현재 포함된 probe:
- global_stride_sweep

## Build

cmake -S . -B build -G Ninja -DCMAKE_BUILD_TYPE=Release -DCMAKE_CUDA_ARCHITECTURES=86
cmake --build build -j

## Run
python scripts/run_probe.py --build-dir build --probe global_stride_sweep --config configs/global_stride_sweep.json


## 0408 로그 결과
C:\Users\owner\Desktop\execution-structure-lab\hardware-evidence\gpu-probing-lab>build\bin\probe_runner.exe --probe global_stride_sweep --config configs\global_stride_sweep.json
[error] config.n must be > 0
