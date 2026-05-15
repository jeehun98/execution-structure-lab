# gpu-probing-lab

GPU execution behavior를 관찰하기 위한 별도 실험 프로젝트.

현재 포함된 probe:
- global_stride_sweep

## Build

cmake -S . -B build -G Ninja -DCMAKE_BUILD_TYPE=Release -DCMAKE_CUDA_ARCHITECTURES=86
cmake --build build -j
