#include "host.hpp"

#include "common/cuda_check.hpp"

#include <cuda_runtime.h>

__global__ void global_stride_sweep_fixed_work_kernel(
    const float* input,
    float* output,
    int n,
    int stride,
    int inner_iters,
    int total_accesses,
    int base_offset,
    int accesses_per_thread,
    int launched_threads) {
  int tid = blockIdx.x * blockDim.x + threadIdx.x;
  if (tid >= launched_threads) {
    return;
  }

  float acc = 0.0f;

  for (int j = 0; j < accesses_per_thread; ++j) {
    int logical_access_id = tid + j * launched_threads;
    if (logical_access_id >= total_accesses) {
      break;
    }

    int idx = base_offset + logical_access_id * stride;
    idx %= n;

    float x = input[idx];
    for (int k = 0; k < inner_iters; ++k) {
      acc += x * 1.000001f;
    }
  }

  output[tid] = acc;
}

void launch_global_stride_sweep_fixed_work_kernel(
    const float* d_input,
    float* d_output,
    int n,
    int stride,
    int inner_iters,
    int total_accesses,
    int base_offset,
    int accesses_per_thread,
    int launched_threads,
    int block_size) {
  int grid_size = (launched_threads + block_size - 1) / block_size;

  global_stride_sweep_fixed_work_kernel<<<grid_size, block_size>>>(
      d_input,
      d_output,
      n,
      stride,
      inner_iters,
      total_accesses,
      base_offset,
      accesses_per_thread,
      launched_threads);

  CUDA_CHECK(cudaGetLastError());
}