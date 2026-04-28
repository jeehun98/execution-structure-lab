#include "host.hpp"

#include "common/cuda_check.hpp"

#include <cuda_runtime.h>

namespace probe::shared_padding_period_sweep {

__global__ void shared_padding_period_sweep_kernel(
    float* output,
    int stride,
    int shared_span_floats,
    int padding_period,
    int accesses_per_thread) {
  extern __shared__ float smem[];

  const int tid = threadIdx.x;
  const int global_tid = blockIdx.x * blockDim.x + threadIdx.x;

  const int padded_shared_span =
      shared_span_floats + (shared_span_floats / padding_period) + 1;

  for (int i = tid; i < padded_shared_span; i += blockDim.x) {
    smem[i] = static_cast<float>((i & 255) + 1) * 0.001f;
  }

  __syncthreads();

  float acc = 0.0f;

  for (int j = 0; j < accesses_per_thread; ++j) {
    int logical = tid * stride + j;
    logical = logical % shared_span_floats;

    int physical = logical + (logical / padding_period);

    float x = smem[physical];
    acc += x * 1.000001f;
  }

  output[global_tid] = acc;
}

void launch_kernel(
    float* output,
    int num_blocks,
    int threads_per_block,
    int stride,
    int shared_span_floats,
    int padding_period,
    int accesses_per_thread,
    cudaStream_t stream) {
  const int padded_shared_span =
      shared_span_floats + (shared_span_floats / padding_period) + 1;

  const size_t shared_bytes =
      static_cast<size_t>(padded_shared_span) * sizeof(float);

  shared_padding_period_sweep_kernel<<<
      num_blocks,
      threads_per_block,
      shared_bytes,
      stream>>>(
      output,
      stride,
      shared_span_floats,
      padding_period,
      accesses_per_thread);

  CUDA_CHECK(cudaGetLastError());
}

}  // namespace probe::shared_padding_period_sweep