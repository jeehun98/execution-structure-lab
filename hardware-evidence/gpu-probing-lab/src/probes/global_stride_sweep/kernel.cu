#include "host.hpp"

#include "common/cuda_check.hpp"

#include <cuda_runtime.h>

__global__ void global_stride_sweep_kernel(
    const float* input,
    float* output,
    int n,
    int stride,
    int inner_iters) {
  int tid = blockIdx.x * blockDim.x + threadIdx.x;
  int idx = tid * stride;

  if (idx >= n) {
    return;
  }

  float x = input[idx];
  float acc = 0.0f;

  for (int i = 0; i < inner_iters; ++i) {
    acc += x * 1.000001f;
  }

  output[idx] = acc;
}

void launch_global_stride_sweep_kernel(
    const float* d_input,
    float* d_output,
    int n,
    int stride,
    int inner_iters,
    int grid_size,
    int block_size) {
  global_stride_sweep_kernel<<<grid_size, block_size>>>(
      d_input, d_output, n, stride, inner_iters);
  CUDA_CHECK(cudaGetLastError());
}