#include "../common/probe_utils.cuh"
#include <cmath>

__global__ void softmax_small_f32_kernel(const float* __restrict__ x,
                                         float* __restrict__ y,
                                         int n) {
    extern __shared__ float sdata[];

    int tid = threadIdx.x;

    float v = -3.402823466e+38F;

    if (tid < n) {
        v = x[tid];
    }

    sdata[tid] = v;
    __syncthreads();

    // max reduction
    for (int stride = blockDim.x / 2; stride > 0; stride >>= 1) {
        if (tid < stride) {
            float other = sdata[tid + stride];
            float self = sdata[tid];
            sdata[tid] = self > other ? self : other;
        }

        __syncthreads();
    }

    float max_v = sdata[0];
    __syncthreads();

    // exp and sum
    float e = 0.0f;

    if (tid < n) {
        e = expf(x[tid] - max_v);
        sdata[tid] = e;
    } else {
        sdata[tid] = 0.0f;
    }

    __syncthreads();

    for (int stride = blockDim.x / 2; stride > 0; stride >>= 1) {
        if (tid < stride) {
            sdata[tid] += sdata[tid + stride];
        }

        __syncthreads();
    }

    float sum_v = sdata[0];
    __syncthreads();

    if (tid < n) {
        y[tid] = e / sum_v;
    }
}

int main() {
    constexpr int N = 128;
    constexpr int BLOCK = 128;

    float* h_x = new float[N];
    float* h_y = new float[N];

    fill_host(h_x, N, 0.05f);

    float* d_x = nullptr;
    float* d_y = nullptr;

    CUDA_CHECK(cudaMalloc(&d_x, N * sizeof(float)));
    CUDA_CHECK(cudaMalloc(&d_y, N * sizeof(float)));

    CUDA_CHECK(cudaMemcpy(d_x, h_x, N * sizeof(float), cudaMemcpyHostToDevice));

    softmax_small_f32_kernel<<<1, BLOCK, BLOCK * sizeof(float)>>>(d_x, d_y, N);
    CUDA_CHECK(cudaGetLastError());
    CUDA_CHECK(cudaDeviceSynchronize());

    CUDA_CHECK(cudaMemcpy(h_y, d_y, N * sizeof(float), cudaMemcpyDeviceToHost));

    std::printf("softmax_small_f32 y[0] = %f\n", h_y[0]);

    CUDA_CHECK(cudaFree(d_x));
    CUDA_CHECK(cudaFree(d_y));

    delete[] h_x;
    delete[] h_y;

    return 0;
}