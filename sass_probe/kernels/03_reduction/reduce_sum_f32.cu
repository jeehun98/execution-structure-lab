#include "../common/probe_utils.cuh"

__global__ void reduce_sum_f32_kernel(const float* __restrict__ x,
                                      float* __restrict__ y,
                                      int n) {
    extern __shared__ float sdata[];

    int tid = threadIdx.x;
    int i = blockIdx.x * blockDim.x + threadIdx.x;

    float v = 0.0f;

    if (i < n) {
        v = x[i];
    }

    sdata[tid] = v;
    __syncthreads();

    for (int stride = blockDim.x / 2; stride > 0; stride >>= 1) {
        if (tid < stride) {
            sdata[tid] += sdata[tid + stride];
        }

        __syncthreads();
    }

    if (tid == 0) {
        y[blockIdx.x] = sdata[0];
    }
}

int main() {
    constexpr int N = 1024;
    constexpr int BLOCK = 256;
    constexpr int GRID = (N + BLOCK - 1) / BLOCK;

    float* h_x = new float[N];
    float* h_y = new float[GRID];

    fill_host(h_x, N, 0.25f);

    float* d_x = nullptr;
    float* d_y = nullptr;

    CUDA_CHECK(cudaMalloc(&d_x, N * sizeof(float)));
    CUDA_CHECK(cudaMalloc(&d_y, GRID * sizeof(float)));

    CUDA_CHECK(cudaMemcpy(d_x, h_x, N * sizeof(float), cudaMemcpyHostToDevice));

    reduce_sum_f32_kernel<<<GRID, BLOCK, BLOCK * sizeof(float)>>>(d_x, d_y, N);
    CUDA_CHECK(cudaGetLastError());
    CUDA_CHECK(cudaDeviceSynchronize());

    CUDA_CHECK(cudaMemcpy(h_y, d_y, GRID * sizeof(float), cudaMemcpyDeviceToHost));

    std::printf("reduce_sum_f32 y[0] = %f\n", h_y[0]);

    CUDA_CHECK(cudaFree(d_x));
    CUDA_CHECK(cudaFree(d_y));

    delete[] h_x;
    delete[] h_y;

    return 0;
}