#include "../common/probe_utils.cuh"

__global__ void mul_f32_kernel(const float* __restrict__ a,
                               const float* __restrict__ b,
                               float* __restrict__ y,
                               int n) {
    int i = blockIdx.x * blockDim.x + threadIdx.x;

    if (i < n) {
        float av = a[i];
        float bv = b[i];
        float out = av * bv;
        y[i] = out;
    }
}

int main() {
    constexpr int N = 1024;

    float* h_a = new float[N];
    float* h_b = new float[N];
    float* h_y = new float[N];

    fill_host(h_a, N, 0.25f);
    fill_host(h_b, N, 0.5f);

    float* d_a = nullptr;
    float* d_b = nullptr;
    float* d_y = nullptr;

    CUDA_CHECK(cudaMalloc(&d_a, N * sizeof(float)));
    CUDA_CHECK(cudaMalloc(&d_b, N * sizeof(float)));
    CUDA_CHECK(cudaMalloc(&d_y, N * sizeof(float)));

    CUDA_CHECK(cudaMemcpy(d_a, h_a, N * sizeof(float), cudaMemcpyHostToDevice));
    CUDA_CHECK(cudaMemcpy(d_b, h_b, N * sizeof(float), cudaMemcpyHostToDevice));

    dim3 block(256);
    dim3 grid((N + block.x - 1) / block.x);

    mul_f32_kernel<<<grid, block>>>(d_a, d_b, d_y, N);
    CUDA_CHECK(cudaGetLastError());
    CUDA_CHECK(cudaDeviceSynchronize());

    CUDA_CHECK(cudaMemcpy(h_y, d_y, N * sizeof(float), cudaMemcpyDeviceToHost));

    std::printf("y[0] = %f\n", h_y[0]);

    CUDA_CHECK(cudaFree(d_a));
    CUDA_CHECK(cudaFree(d_b));
    CUDA_CHECK(cudaFree(d_y));

    delete[] h_a;
    delete[] h_b;
    delete[] h_y;

    return 0;
}