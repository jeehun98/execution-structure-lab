#include "../common/probe_utils.cuh"
#include <cmath>

__global__ void online_softmax_f32_kernel(const float* __restrict__ x,
                                          float* __restrict__ y,
                                          int n) {
    // 단일 thread가 작은 row 하나를 순차 처리하는 축소판.
    // 병렬 성능 목적이 아니라 SASS 패턴 관찰 목적이다.

    if (threadIdx.x == 0 && blockIdx.x == 0) {
        float m = -3.402823466e+38F;
        float s = 0.0f;

        for (int i = 0; i < n; ++i) {
            float v = x[i];

            float new_m = m > v ? m : v;

            float old_scale = expf(m - new_m);
            float new_term = expf(v - new_m);

            s = s * old_scale + new_term;
            m = new_m;
        }

        for (int i = 0; i < n; ++i) {
            y[i] = expf(x[i] - m) / s;
        }
    }
}

int main() {
    constexpr int N = 128;

    float* h_x = new float[N];
    float* h_y = new float[N];

    fill_host(h_x, N, 0.05f);

    float* d_x = nullptr;
    float* d_y = nullptr;

    CUDA_CHECK(cudaMalloc(&d_x, N * sizeof(float)));
    CUDA_CHECK(cudaMalloc(&d_y, N * sizeof(float)));

    CUDA_CHECK(cudaMemcpy(d_x, h_x, N * sizeof(float), cudaMemcpyHostToDevice));

    online_softmax_f32_kernel<<<1, 1>>>(d_x, d_y, N);
    CUDA_CHECK(cudaGetLastError());
    CUDA_CHECK(cudaDeviceSynchronize());

    CUDA_CHECK(cudaMemcpy(h_y, d_y, N * sizeof(float), cudaMemcpyDeviceToHost));

    std::printf("online_softmax_f32 y[0] = %f\n", h_y[0]);

    CUDA_CHECK(cudaFree(d_x));
    CUDA_CHECK(cudaFree(d_y));

    delete[] h_x;
    delete[] h_y;

    return 0;
}