#pragma once

#include "common/cuda_check.hpp"

#include <cuda_runtime.h>

class CudaEventTimer {
 public:
  CudaEventTimer() {
    CUDA_CHECK(cudaEventCreate(&start_));
    CUDA_CHECK(cudaEventCreate(&stop_));
  }

  ~CudaEventTimer() {
    cudaEventDestroy(start_);
    cudaEventDestroy(stop_);
  }

  void start() {
    CUDA_CHECK(cudaEventRecord(start_));
  }

  double stop() {
    CUDA_CHECK(cudaEventRecord(stop_));
    CUDA_CHECK(cudaEventSynchronize(stop_));
    float ms = 0.0f;
    CUDA_CHECK(cudaEventElapsedTime(&ms, start_, stop_));
    return static_cast<double>(ms);
  }

 private:
  cudaEvent_t start_{};
  cudaEvent_t stop_{};
};