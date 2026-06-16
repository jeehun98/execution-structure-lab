#include "../common/probe_utils.cuh"

__global__ void clamp_f32_kernel(const float* __restrict__ x,
                                 float* __restrict__ y,
                                 float lo,
                                 float hi,
                                 int n) {
    int i = blockIdx.x * blockDim.x + threadIdx.x;

    if (i < n) {
        float v = x[i];

        if (v < lo) {
            v = lo;
        }

        if (v > hi) {
            v = hi;
        }

        y[i] = v;
    }
}

int main() {
    constexpr int N = 1024;

    float* h_x = new float[N];
    float* h_y = new float[N];

    fill_host(h_x, N, 0.25f);

    float* d_x = nullptr;
    float* d_y = nullptr;

    CUDA_CHECK(cudaMalloc(&d_x, N * sizeof(float)));
    CUDA_CHECK(cudaMalloc(&d_y, N * sizeof(float)));

    CUDA_CHECK(cudaMemcpy(d_x, h_x, N * sizeof(float), cudaMemcpyHostToDevice));

    dim3 block(256);
    dim3 grid((N + block.x - 1) / block.x);

    float lo = -1.0f;
    float hi = 1.0f;

    clamp_f32_kernel<<<grid, block>>>(d_x, d_y, lo, hi, N);
    CUDA_CHECK(cudaGetLastError());
    CUDA_CHECK(cudaDeviceSynchronize());

    CUDA_CHECK(cudaMemcpy(h_y, d_y, N * sizeof(float), cudaMemcpyDeviceToHost));

    std::printf("clamp_f32 y[0] = %f\n", h_y[0]);

    CUDA_CHECK(cudaFree(d_x));
    CUDA_CHECK(cudaFree(d_y));

    delete[] h_x;
    delete[] h_y;

    return 0;
}