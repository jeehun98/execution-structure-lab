#include "../common/probe_utils.cuh"

__global__ void stg_basic_kernel(float* __restrict__ y, int n) {
    int i = blockIdx.x * blockDim.x + threadIdx.x;

    if (i < n) {
        y[i] = 1.0f;
    }
}

int main() {
    constexpr int N = 1024;

    float* h_y = new float[N];

    float* d_y = nullptr;
    CUDA_CHECK(cudaMalloc(&d_y, N * sizeof(float)));

    dim3 block(256);
    dim3 grid((N + block.x - 1) / block.x);

    stg_basic_kernel<<<grid, block>>>(d_y, N);
    CUDA_CHECK(cudaGetLastError());
    CUDA_CHECK(cudaDeviceSynchronize());

    CUDA_CHECK(cudaMemcpy(h_y, d_y, N * sizeof(float), cudaMemcpyDeviceToHost));

    std::printf("y[0] = %f\n", h_y[0]);

    CUDA_CHECK(cudaFree(d_y));
    delete[] h_y;

    return 0;
}