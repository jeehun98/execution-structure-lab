#include <cuda_runtime.h>

#include <cstdio>
#include <cstdlib>
#include <vector>

#define CUDA_CHECK(expr)                                                        \
    do {                                                                        \
        cudaError_t err__ = (expr);                                             \
        if (err__ != cudaSuccess) {                                             \
            std::fprintf(stderr,                                                \
                         "CUDA error at %s:%d: %s\n",                           \
                         __FILE__,                                              \
                         __LINE__,                                              \
                         cudaGetErrorString(err__));                            \
            std::exit(1);                                                       \
        }                                                                       \
    } while (0)

extern "C" __global__
void fma_direct_kernel(const float* __restrict__ a,
                       const float* __restrict__ b,
                       const float* __restrict__ c,
                       float* __restrict__ y,
                       int n) {
    int i = blockIdx.x * blockDim.x + threadIdx.x;

    if (i < n) {
        float av = a[i];
        float bv = b[i];
        float cv = c[i];

        // Expected default SASS:
        //   FFMA
        float out = av * bv + cv;

        y[i] = out;
    }
}

extern "C" __global__
void fma_tmp_kernel(const float* __restrict__ a,
                    const float* __restrict__ b,
                    const float* __restrict__ c,
                    float* __restrict__ y,
                    int n) {
    int i = blockIdx.x * blockDim.x + threadIdx.x;

    if (i < n) {
        float av = a[i];
        float bv = b[i];
        float cv = c[i];

        // Source-level temporary exists.
        // Compiler may still contract this into FFMA.
        float tmp = av * bv;
        float out = tmp + cv;

        y[i] = out;
    }
}

extern "C" __global__
void fma_gap_kernel(const float* __restrict__ a,
                    const float* __restrict__ b,
                    const float* __restrict__ c,
                    float* __restrict__ y,
                    float* __restrict__ aux,
                    int n) {
    int i = blockIdx.x * blockDim.x + threadIdx.x;

    if (i < n) {
        float av = a[i];
        float bv = b[i];
        float cv = c[i];

        // Producer of tmp.
        float tmp = av * bv;

        // Unrelated operations inserted between multiply and add.
        // aux store prevents these operations from being fully dead-code eliminated.
        float k = av + cv;
        float m = k * 3.0f + bv;
        aux[i] = m;

        // Consumer of tmp.
        // Even though source lines are separated, compiler can still see:
        //   out = (av * bv) + cv
        float out = tmp + cv;

        y[i] = out;
    }
}

extern "C" __global__
void fma_store_tmp_kernel(const float* __restrict__ a,
                          const float* __restrict__ b,
                          const float* __restrict__ c,
                          float* __restrict__ y,
                          float* __restrict__ scratch,
                          int n) {
    int i = blockIdx.x * blockDim.x + threadIdx.x;

    if (i < n) {
        float av = a[i];
        float bv = b[i];
        float cv = c[i];

        // tmp is materialized to global memory.
        float tmp = av * bv;
        scratch[i] = tmp;

        // Important:
        // Compiler may choose either:
        //   1) FADD tmp, cv
        //   2) recompute/contract as FFMA av, bv, cv
        //
        // If you see FMUL + STG plus FFMA, that means:
        //   tmp was materialized for scratch,
        //   but final y computation was still contracted.
        float out = tmp + cv;

        y[i] = out;
    }
}

extern "C" __global__
void fma_rn_intrinsic_kernel(const float* __restrict__ a,
                             const float* __restrict__ b,
                             const float* __restrict__ c,
                             float* __restrict__ y,
                             int n) {
    int i = blockIdx.x * blockDim.x + threadIdx.x;

    if (i < n) {
        float av = a[i];
        float bv = b[i];
        float cv = c[i];

        // Force separate IEEE-style roundings:
        //   tmp = round(av * bv)
        //   out = round(tmp + cv)
        //
        // Expected SASS:
        //   FMUL
        //   FADD
        //
        // This is the cleanest per-expression way to suppress FFMA.
        float tmp = __fmul_rn(av, bv);
        float out = __fadd_rn(tmp, cv);

        y[i] = out;
    }
}

extern "C" __global__
void fma_volatile_global_kernel(const float* __restrict__ a,
                                const float* __restrict__ b,
                                const float* __restrict__ c,
                                float* __restrict__ y,
                                volatile float* scratch,
                                int n) {
    int i = blockIdx.x * blockDim.x + threadIdx.x;

    if (i < n) {
        float av = a[i];
        float bv = b[i];
        float cv = c[i];

        // Volatile global store/load makes the intermediate value observable.
        // This should strongly discourage contraction across the memory boundary.
        scratch[i] = av * bv;
        float tmp = scratch[i];

        float out = tmp + cv;

        y[i] = out;
    }
}

__device__ __noinline__
float identity_noinline(float x) {
    return x;
}

extern "C" __global__
void fma_noinline_boundary_kernel(const float* __restrict__ a,
                                  const float* __restrict__ b,
                                  const float* __restrict__ c,
                                  float* __restrict__ y,
                                  int n) {
    int i = blockIdx.x * blockDim.x + threadIdx.x;

    if (i < n) {
        float av = a[i];
        float bv = b[i];
        float cv = c[i];

        float tmp = av * bv;

        // Function boundary.
        // If the call remains, compiler cannot freely see:
        //   tmp = av * bv
        //   out = tmp + cv
        // as one local expression anymore.
        tmp = identity_noinline(tmp);

        float out = tmp + cv;

        y[i] = out;
    }
}

int main() {
    constexpr int n = 1 << 20;
    constexpr int block = 256;
    constexpr int grid = (n + block - 1) / block;

    std::vector<float> h_a(n);
    std::vector<float> h_b(n);
    std::vector<float> h_c(n);
    std::vector<float> h_y(n);

    for (int i = 0; i < n; ++i) {
        h_a[i] = 1.0f + static_cast<float>(i % 17) * 0.01f;
        h_b[i] = 2.0f + static_cast<float>(i % 13) * 0.02f;
        h_c[i] = 3.0f + static_cast<float>(i % 11) * 0.03f;
    }

    float* d_a = nullptr;
    float* d_b = nullptr;
    float* d_c = nullptr;
    float* d_y = nullptr;
    float* d_aux = nullptr;
    float* d_scratch = nullptr;

    CUDA_CHECK(cudaMalloc(&d_a, n * sizeof(float)));
    CUDA_CHECK(cudaMalloc(&d_b, n * sizeof(float)));
    CUDA_CHECK(cudaMalloc(&d_c, n * sizeof(float)));
    CUDA_CHECK(cudaMalloc(&d_y, n * sizeof(float)));
    CUDA_CHECK(cudaMalloc(&d_aux, n * sizeof(float)));
    CUDA_CHECK(cudaMalloc(&d_scratch, n * sizeof(float)));

    CUDA_CHECK(cudaMemcpy(d_a, h_a.data(), n * sizeof(float), cudaMemcpyHostToDevice));
    CUDA_CHECK(cudaMemcpy(d_b, h_b.data(), n * sizeof(float), cudaMemcpyHostToDevice));
    CUDA_CHECK(cudaMemcpy(d_c, h_c.data(), n * sizeof(float), cudaMemcpyHostToDevice));

    fma_direct_kernel<<<grid, block>>>(d_a, d_b, d_c, d_y, n);
    fma_tmp_kernel<<<grid, block>>>(d_a, d_b, d_c, d_y, n);
    fma_gap_kernel<<<grid, block>>>(d_a, d_b, d_c, d_y, d_aux, n);
    fma_store_tmp_kernel<<<grid, block>>>(d_a, d_b, d_c, d_y, d_scratch, n);
    fma_rn_intrinsic_kernel<<<grid, block>>>(d_a, d_b, d_c, d_y, n);
    fma_volatile_global_kernel<<<grid, block>>>(d_a, d_b, d_c, d_y, d_scratch, n);
    fma_noinline_boundary_kernel<<<grid, block>>>(d_a, d_b, d_c, d_y, n);

    CUDA_CHECK(cudaGetLastError());
    CUDA_CHECK(cudaDeviceSynchronize());

    CUDA_CHECK(cudaMemcpy(h_y.data(), d_y, n * sizeof(float), cudaMemcpyDeviceToHost));

    std::printf("fma_contract_f32 done. y[0] = %.6f\n", h_y[0]);

    CUDA_CHECK(cudaFree(d_a));
    CUDA_CHECK(cudaFree(d_b));
    CUDA_CHECK(cudaFree(d_c));
    CUDA_CHECK(cudaFree(d_y));
    CUDA_CHECK(cudaFree(d_aux));
    CUDA_CHECK(cudaFree(d_scratch));

    return 0;
}