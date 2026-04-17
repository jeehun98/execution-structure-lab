#include "common/cuda_check.hpp"

#include <cuda_runtime.h>

namespace probe::shared_bank_conflict_stride {

__global__ void shared_bank_conflict_stride_read_kernel(
    float* out,
    int shared_span_floats,
    int accesses_per_thread,
    int stride,
    int use_modulo_wrap,
    int pad_every_32) {
  extern __shared__ float smem[];

  const int tid = threadIdx.x;
  const int gtid = blockIdx.x * blockDim.x + tid;

  for (int i = tid; i < shared_span_floats; i += blockDim.x) {
    smem[i] = static_cast<float>((i % 251) * 0.25f);
  }
  __syncthreads();

  float acc = 0.0f;

#pragma unroll 1
  for (int j = 0; j < accesses_per_thread; ++j) {
    int logical = tid * stride + j;

    if (use_modulo_wrap) {
      logical %= shared_span_floats;
    } else {
      if (logical >= shared_span_floats) {
        logical = logical % shared_span_floats;
      }
    }

    int physical = logical;
    if (pad_every_32) {
      physical = logical + (logical / 32);
    }

    float x = smem[physical];
    acc += x * 1.000001f;
  }

  out[gtid] = acc;
}

__global__ void shared_bank_conflict_stride_write_kernel(
    float* out,
    int shared_span_floats,
    int accesses_per_thread,
    int stride,
    int use_modulo_wrap,
    int pad_every_32) {
  extern __shared__ float smem[];

  const int tid = threadIdx.x;
  const int gtid = blockIdx.x * blockDim.x + tid;

  for (int i = tid; i < shared_span_floats; i += blockDim.x) {
    smem[i] = 1.0f;
  }
  __syncthreads();

  float acc = 0.0f;

#pragma unroll 1
  for (int j = 0; j < accesses_per_thread; ++j) {
    int logical = tid * stride + j;

    if (use_modulo_wrap) {
      logical %= shared_span_floats;
    } else {
      if (logical >= shared_span_floats) {
        logical = logical % shared_span_floats;
      }
    }

    int physical = logical;
    if (pad_every_32) {
      physical = logical + (logical / 32);
    }

    float v = smem[physical];
    v = v + 0.0001f;
    smem[physical] = v;
    acc += v;
  }

  out[gtid] = acc;
}

void launch_shared_bank_conflict_stride_kernel(
    float* out,
    int block_size,
    int grid_size,
    int shared_span_floats,
    int accesses_per_thread,
    int stride,
    bool use_modulo_wrap,
    bool write_mode,
    bool pad_every_32) {
  int effective_shared_floats = shared_span_floats;
  if (pad_every_32) {
    effective_shared_floats += (shared_span_floats / 32) + 1;
  }

  const size_t smem_bytes =
      static_cast<size_t>(effective_shared_floats) * sizeof(float);

  if (write_mode) {
    shared_bank_conflict_stride_write_kernel<<<grid_size, block_size, smem_bytes>>>(
        out,
        shared_span_floats,
        accesses_per_thread,
        stride,
        use_modulo_wrap ? 1 : 0,
        pad_every_32 ? 1 : 0);
  } else {
    shared_bank_conflict_stride_read_kernel<<<grid_size, block_size, smem_bytes>>>(
        out,
        shared_span_floats,
        accesses_per_thread,
        stride,
        use_modulo_wrap ? 1 : 0,
        pad_every_32 ? 1 : 0);
  }

  CUDA_CHECK(cudaGetLastError());
}

} // namespace probe::shared_bank_conflict_stride