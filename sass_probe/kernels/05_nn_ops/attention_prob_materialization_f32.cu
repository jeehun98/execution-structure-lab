#include <cuda_runtime.h>

#include <cmath>
#include <cstdio>
#include <cstdlib>
#include <vector>

#define CUDA_CHECK(expr)                                                        \
    do {                                                                        \
        cudaError_t err__ = (expr);                                             \
        if (err__ != cudaSuccess) {                                             \
            std::fprintf(stderr,                                                \
                         "CUDA error at %s:%d: %s\n",                            \
                         __FILE__,                                              \
                         __LINE__,                                              \
                         cudaGetErrorString(err__));                            \
            std::exit(1);                                                       \
        }                                                                       \
    } while (0)

static constexpr int TOY_D = 4;
static constexpr int TOY_N_KEYS = 4;
static constexpr int TOY_DV = 4;
static constexpr float TOY_SCALE = 0.5f;
static constexpr float TOY_NEG_INF = -3.4028234663852886e+38F;

__device__ __forceinline__
float score4_f32(float q0,
                 float q1,
                 float q2,
                 float q3,
                 const float* __restrict__ k_base) {
    float k0 = k_base[0];
    float k1 = k_base[1];
    float k2 = k_base[2];
    float k3 = k_base[3];

    float score = q0 * k0;
    score = fmaf(q1, k1, score);
    score = fmaf(q2, k2, score);
    score = fmaf(q3, k3, score);

    return score * TOY_SCALE;
}

// -----------------------------------------------------------------------------
// Kernel 1:
//   scores[row, j] = dot(q[row], k[j]) * scale
//
// Expected SASS:
//   LDG q/k
//   FMUL + FFMA chain
//   FMUL scale
//   STG scores
// -----------------------------------------------------------------------------

extern "C" __global__
void attention_score_store_kernel(const float* __restrict__ q,
                                  const float* __restrict__ k,
                                  float* __restrict__ scores,
                                  int n_rows) {
    int row = blockIdx.x * blockDim.x + threadIdx.x;

    if (row >= n_rows) {
        return;
    }

    const float* q_base = q + row * TOY_D;
    float* s_base = scores + row * TOY_N_KEYS;

    float q0 = q_base[0];
    float q1 = q_base[1];
    float q2 = q_base[2];
    float q3 = q_base[3];

#pragma unroll
    for (int j = 0; j < TOY_N_KEYS; ++j) {
        const float* k_base = k + j * TOY_D;
        float score = score4_f32(q0, q1, q2, q3, k_base);

        s_base[j] = score;
    }
}

// -----------------------------------------------------------------------------
// Kernel 2:
//   unnorm_probs[row, j] = exp(scores[row, j] - max(scores[row, :]))
//   sums[row] = sum_j unnorm_probs[row, j]
//
// This kernel forces unnormalized probability materialization.
//
// Expected SASS:
//   LDG scores
//   FMNMX max reduction
//   FADD score - max
//   FMUL log2(e)
//   MUFU.EX2
//   FADD sum
//   STG unnorm_probs
//   STG sums
// -----------------------------------------------------------------------------

extern "C" __global__
void attention_exp_sum_store_kernel(const float* __restrict__ scores,
                                    float* __restrict__ unnorm_probs,
                                    float* __restrict__ sums,
                                    int n_rows) {
    int row = blockIdx.x * blockDim.x + threadIdx.x;

    if (row >= n_rows) {
        return;
    }

    const float* s_base = scores + row * TOY_N_KEYS;
    float* u_base = unnorm_probs + row * TOY_N_KEYS;

    float s0 = s_base[0];
    float s1 = s_base[1];
    float s2 = s_base[2];
    float s3 = s_base[3];

    float m = TOY_NEG_INF;
    m = fmaxf(m, s0);
    m = fmaxf(m, s1);
    m = fmaxf(m, s2);
    m = fmaxf(m, s3);

    float p0 = __expf(s0 - m);
    float p1 = __expf(s1 - m);
    float p2 = __expf(s2 - m);
    float p3 = __expf(s3 - m);

    float sum = p0 + p1 + p2 + p3;

    u_base[0] = p0;
    u_base[1] = p1;
    u_base[2] = p2;
    u_base[3] = p3;

    sums[row] = sum;
}

// -----------------------------------------------------------------------------
// Kernel 3:
//   probs[row, j] = unnorm_probs[row, j] / sums[row]
//
// This kernel forces LDG of unnormalized probabilities.
//
// Expected SASS:
//   LDG unnorm_probs
//   LDG sums
//   MUFU.RCP or RCP-like reciprocal
//   FMUL normalize
//   STG probs
// -----------------------------------------------------------------------------

extern "C" __global__
void attention_normalize_probs_kernel(const float* __restrict__ unnorm_probs,
                                      const float* __restrict__ sums,
                                      float* __restrict__ probs,
                                      int n_rows) {
    int row = blockIdx.x * blockDim.x + threadIdx.x;

    if (row >= n_rows) {
        return;
    }

    const float* u_base = unnorm_probs + row * TOY_N_KEYS;
    float* p_base = probs + row * TOY_N_KEYS;

    float sum = sums[row];
    float inv_sum = 1.0f / sum;

    float p0 = u_base[0] * inv_sum;
    float p1 = u_base[1] * inv_sum;
    float p2 = u_base[2] * inv_sum;
    float p3 = u_base[3] * inv_sum;

    p_base[0] = p0;
    p_base[1] = p1;
    p_base[2] = p2;
    p_base[3] = p3;
}

// -----------------------------------------------------------------------------
// Kernel 4:
//   y[row, :] = probs[row, :] @ v
//
// Expected SASS:
//   LDG probs
//   LDG v
//   FFMA p * v + acc
//   STG y
// -----------------------------------------------------------------------------

extern "C" __global__
void attention_value_from_probs_kernel(const float* __restrict__ probs,
                                       const float* __restrict__ v,
                                       float* __restrict__ y,
                                       int n_rows) {
    int row = blockIdx.x * blockDim.x + threadIdx.x;

    if (row >= n_rows) {
        return;
    }

    const float* p_base = probs + row * TOY_N_KEYS;
    float* y_base = y + row * TOY_DV;

    float acc0 = 0.0f;
    float acc1 = 0.0f;
    float acc2 = 0.0f;
    float acc3 = 0.0f;

#pragma unroll
    for (int j = 0; j < TOY_N_KEYS; ++j) {
        float p = p_base[j];

        const float* v_base = v + j * TOY_DV;

        float v0 = v_base[0];
        float v1 = v_base[1];
        float v2 = v_base[2];
        float v3 = v_base[3];

        acc0 = fmaf(p, v0, acc0);
        acc1 = fmaf(p, v1, acc1);
        acc2 = fmaf(p, v2, acc2);
        acc3 = fmaf(p, v3, acc3);
    }

    y_base[0] = acc0;
    y_base[1] = acc1;
    y_base[2] = acc2;
    y_base[3] = acc3;
}

int main() {
    constexpr int n_rows = 1 << 12;
    constexpr int block = 128;
    constexpr int grid = (n_rows + block - 1) / block;

    const int q_elems = n_rows * TOY_D;
    const int k_elems = TOY_N_KEYS * TOY_D;
    const int v_elems = TOY_N_KEYS * TOY_DV;
    const int score_elems = n_rows * TOY_N_KEYS;
    const int prob_elems = n_rows * TOY_N_KEYS;
    const int sum_elems = n_rows;
    const int y_elems = n_rows * TOY_DV;

    std::vector<float> h_q(q_elems);
    std::vector<float> h_k(k_elems);
    std::vector<float> h_v(v_elems);
    std::vector<float> h_y(y_elems);

    for (int i = 0; i < q_elems; ++i) {
        h_q[i] = 0.01f * static_cast<float>((i % 17) - 8);
    }

    for (int i = 0; i < k_elems; ++i) {
        h_k[i] = 0.02f * static_cast<float>((i % 13) - 6);
    }

    for (int i = 0; i < v_elems; ++i) {
        h_v[i] = 0.03f * static_cast<float>((i % 11) - 5);
    }

    float* d_q = nullptr;
    float* d_k = nullptr;
    float* d_v = nullptr;
    float* d_scores = nullptr;
    float* d_unnorm_probs = nullptr;
    float* d_sums = nullptr;
    float* d_probs = nullptr;
    float* d_y = nullptr;

    CUDA_CHECK(cudaMalloc(&d_q, q_elems * sizeof(float)));
    CUDA_CHECK(cudaMalloc(&d_k, k_elems * sizeof(float)));
    CUDA_CHECK(cudaMalloc(&d_v, v_elems * sizeof(float)));
    CUDA_CHECK(cudaMalloc(&d_scores, score_elems * sizeof(float)));
    CUDA_CHECK(cudaMalloc(&d_unnorm_probs, prob_elems * sizeof(float)));
    CUDA_CHECK(cudaMalloc(&d_sums, sum_elems * sizeof(float)));
    CUDA_CHECK(cudaMalloc(&d_probs, prob_elems * sizeof(float)));
    CUDA_CHECK(cudaMalloc(&d_y, y_elems * sizeof(float)));

    CUDA_CHECK(cudaMemcpy(d_q, h_q.data(), q_elems * sizeof(float), cudaMemcpyHostToDevice));
    CUDA_CHECK(cudaMemcpy(d_k, h_k.data(), k_elems * sizeof(float), cudaMemcpyHostToDevice));
    CUDA_CHECK(cudaMemcpy(d_v, h_v.data(), v_elems * sizeof(float), cudaMemcpyHostToDevice));

    attention_score_store_kernel<<<grid, block>>>(d_q, d_k, d_scores, n_rows);

    attention_exp_sum_store_kernel<<<grid, block>>>(
        d_scores,
        d_unnorm_probs,
        d_sums,
        n_rows
    );

    attention_normalize_probs_kernel<<<grid, block>>>(
        d_unnorm_probs,
        d_sums,
        d_probs,
        n_rows
    );

    attention_value_from_probs_kernel<<<grid, block>>>(
        d_probs,
        d_v,
        d_y,
        n_rows
    );

    CUDA_CHECK(cudaGetLastError());
    CUDA_CHECK(cudaDeviceSynchronize());

    CUDA_CHECK(cudaMemcpy(h_y.data(), d_y, y_elems * sizeof(float), cudaMemcpyDeviceToHost));

    std::printf("attention_prob_materialization_f32 done\n");
    std::printf("y[0] = %.8f\n", h_y[0]);
    std::printf("y[1] = %.8f\n", h_y[1]);
    std::printf("y[2] = %.8f\n", h_y[2]);
    std::printf("y[3] = %.8f\n", h_y[3]);

    CUDA_CHECK(cudaFree(d_q));
    CUDA_CHECK(cudaFree(d_k));
    CUDA_CHECK(cudaFree(d_v));
    CUDA_CHECK(cudaFree(d_scores));
    CUDA_CHECK(cudaFree(d_unnorm_probs));
    CUDA_CHECK(cudaFree(d_sums));
    CUDA_CHECK(cudaFree(d_probs));
    CUDA_CHECK(cudaFree(d_y));

    return 0;
}