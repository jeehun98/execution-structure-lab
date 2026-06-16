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

// Small fixed-size toy attention.
//
// One CUDA thread computes one query row.
// This is intentionally not a performance kernel.
// The goal is SASS readability.
//
// D      = query/key dimension
// N_KEYS = number of keys per query row
// DV     = value dimension
//
// Attention:
//
//   score_j = dot(q, k_j) * scale
//   p_j     = softmax(score_j)
//   y       = sum_j p_j * v_j
//
// Online version:
//
//   m_j   = running max
//   l_j   = running softmax denominator
//   acc_j = running value accumulator
//
//   new_m = max(m, score)
//   alpha = exp(m - new_m)
//   beta  = exp(score - new_m)
//
//   l   = l * alpha + beta
//   acc = acc * alpha + beta * v
//   m   = new_m

static constexpr int TOY_D = 4;
static constexpr int TOY_N_KEYS = 4;
static constexpr int TOY_DV = 4;
static constexpr float TOY_SCALE = 0.5f;  // 1 / sqrt(4)
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

    // Expected SASS:
    //   FMUL for first multiply
    //   FFMA for accumulation
    //
    // score = (((q0*k0 + q1*k1) + q2*k2) + q3*k3) * scale
    float score = q0 * k0;
    score = fmaf(q1, k1, score);
    score = fmaf(q2, k2, score);
    score = fmaf(q3, k3, score);

    return score * TOY_SCALE;
}

// -----------------------------------------------------------------------------
// Materialized path 1:
//   score[row, key] = dot(q[row], k[key])
// -----------------------------------------------------------------------------
//
// Observation target:
//
//   QK score accumulation:
//      FFMA?
//
//   materialization:
//      STG to scores?
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

    float q0 = q_base[0];
    float q1 = q_base[1];
    float q2 = q_base[2];
    float q3 = q_base[3];

#pragma unroll
    for (int j = 0; j < TOY_N_KEYS; ++j) {
        const float* k_base = k + j * TOY_D;
        float score = score4_f32(q0, q1, q2, q3, k_base);

        // Materialized score matrix.
        // Expected SASS:
        //   STG to scores
        scores[row * TOY_N_KEYS + j] = score;
    }
}

// -----------------------------------------------------------------------------
// Materialized path 2:
//   probs[row, key] = softmax(scores[row, key])
// -----------------------------------------------------------------------------
//
// Observation target:
//
//   score matrix load:
//      LDG from scores?
//
//   probability materialization:
//      STG to probs?
//
//   exp approximation:
//      MUFU.EX2 / related instructions?
// -----------------------------------------------------------------------------

extern "C" __global__
void attention_softmax_store_kernel(const float* __restrict__ scores,
                                    float* __restrict__ probs,
                                    int n_rows) {
    int row = blockIdx.x * blockDim.x + threadIdx.x;

    if (row >= n_rows) {
        return;
    }

    const float* s_base = scores + row * TOY_N_KEYS;
    float* p_base = probs + row * TOY_N_KEYS;

    float m = TOY_NEG_INF;

#pragma unroll
    for (int j = 0; j < TOY_N_KEYS; ++j) {
        float s = s_base[j];
        m = fmaxf(m, s);
    }

    float l = 0.0f;

#pragma unroll
    for (int j = 0; j < TOY_N_KEYS; ++j) {
        float p = __expf(s_base[j] - m);
        l += p;

        // Temporary unnormalized probability.
        // This is intentionally materialized.
        p_base[j] = p;
    }

    float inv_l = 1.0f / l;

#pragma unroll
    for (int j = 0; j < TOY_N_KEYS; ++j) {
        float p = p_base[j] * inv_l;

        // Final normalized probability matrix.
        // Expected SASS:
        //   LDG from probs
        //   STG to probs
        p_base[j] = p;
    }
}

// -----------------------------------------------------------------------------
// Materialized path 3:
//   y[row] = probs[row, :] @ v
// -----------------------------------------------------------------------------
//
// Observation target:
//
//   probability matrix load:
//      LDG from probs?
//
//   value accumulation:
//      FFMA p * v + acc?
//
//   final output:
//      STG to y
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

        // Expected SASS:
        //   FFMA for p * v + acc
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

// -----------------------------------------------------------------------------
// Online / FlashAttention-style toy path:
//   no score matrix store
//   no probability matrix store
//   running max / running sum / accumulator kept in registers
// -----------------------------------------------------------------------------
//
// Observation target:
//
//   QK score:
//      FFMA accumulation?
//
//   running max:
//      FMNMX / FSEL / compare-select pattern?
//
//   running sum:
//      l = l * alpha + beta
//      FFMA?
//
//   value accumulation:
//      scaled_acc = acc * alpha
//      acc = beta * v + scaled_acc
//      FMUL + FFMA?
//
//   materialization:
//      no STG to scores/probs
//      only final STG to y
// -----------------------------------------------------------------------------

extern "C" __global__
void flashattention_toy_online_kernel(const float* __restrict__ q,
                                      const float* __restrict__ k,
                                      const float* __restrict__ v,
                                      float* __restrict__ y,
                                      int n_rows) {
    int row = blockIdx.x * blockDim.x + threadIdx.x;

    if (row >= n_rows) {
        return;
    }

    const float* q_base = q + row * TOY_D;
    float* y_base = y + row * TOY_DV;

    float q0 = q_base[0];
    float q1 = q_base[1];
    float q2 = q_base[2];
    float q3 = q_base[3];

    float m = TOY_NEG_INF;
    float l = 0.0f;

    float acc0 = 0.0f;
    float acc1 = 0.0f;
    float acc2 = 0.0f;
    float acc3 = 0.0f;

#pragma unroll
    for (int j = 0; j < TOY_N_KEYS; ++j) {
        const float* k_base = k + j * TOY_D;
        const float* v_base = v + j * TOY_DV;

        float score = score4_f32(q0, q1, q2, q3, k_base);

        float new_m = fmaxf(m, score);

        // __expf is used intentionally to avoid an opaque libdevice call.
        // Expected SASS often includes MUFU.EX2 / related range reduction.
        float alpha = __expf(m - new_m);
        float beta = __expf(score - new_m);

        // running denominator update:
        //
        //   l_new = l * alpha + beta
        //
        // Expected SASS:
        //   FFMA or FMUL + FADD depending on codegen.
        l = fmaf(l, alpha, beta);

        float v0 = v_base[0];
        float v1 = v_base[1];
        float v2 = v_base[2];
        float v3 = v_base[3];

        // running accumulator update:
        //
        //   acc_new = acc * alpha + beta * v
        //
        // Written in two steps to make the rescale and value update visible.
        //
        // Expected SASS:
        //   FMUL for acc * alpha
        //   FFMA for beta * v + scaled_acc
        float scaled_acc0 = acc0 * alpha;
        float scaled_acc1 = acc1 * alpha;
        float scaled_acc2 = acc2 * alpha;
        float scaled_acc3 = acc3 * alpha;

        acc0 = fmaf(beta, v0, scaled_acc0);
        acc1 = fmaf(beta, v1, scaled_acc1);
        acc2 = fmaf(beta, v2, scaled_acc2);
        acc3 = fmaf(beta, v3, scaled_acc3);

        m = new_m;
    }

    float inv_l = 1.0f / l;

    y_base[0] = acc0 * inv_l;
    y_base[1] = acc1 * inv_l;
    y_base[2] = acc2 * inv_l;
    y_base[3] = acc3 * inv_l;
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
    const int y_elems = n_rows * TOY_DV;

    std::vector<float> h_q(q_elems);
    std::vector<float> h_k(k_elems);
    std::vector<float> h_v(v_elems);
    std::vector<float> h_y_materialized(y_elems);
    std::vector<float> h_y_online(y_elems);

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
    float* d_probs = nullptr;
    float* d_y_materialized = nullptr;
    float* d_y_online = nullptr;

    CUDA_CHECK(cudaMalloc(&d_q, q_elems * sizeof(float)));
    CUDA_CHECK(cudaMalloc(&d_k, k_elems * sizeof(float)));
    CUDA_CHECK(cudaMalloc(&d_v, v_elems * sizeof(float)));
    CUDA_CHECK(cudaMalloc(&d_scores, score_elems * sizeof(float)));
    CUDA_CHECK(cudaMalloc(&d_probs, prob_elems * sizeof(float)));
    CUDA_CHECK(cudaMalloc(&d_y_materialized, y_elems * sizeof(float)));
    CUDA_CHECK(cudaMalloc(&d_y_online, y_elems * sizeof(float)));

    CUDA_CHECK(cudaMemcpy(d_q, h_q.data(), q_elems * sizeof(float), cudaMemcpyHostToDevice));
    CUDA_CHECK(cudaMemcpy(d_k, h_k.data(), k_elems * sizeof(float), cudaMemcpyHostToDevice));
    CUDA_CHECK(cudaMemcpy(d_v, h_v.data(), v_elems * sizeof(float), cudaMemcpyHostToDevice));

    attention_score_store_kernel<<<grid, block>>>(d_q, d_k, d_scores, n_rows);
    attention_softmax_store_kernel<<<grid, block>>>(d_scores, d_probs, n_rows);
    attention_value_from_probs_kernel<<<grid, block>>>(d_probs, d_v, d_y_materialized, n_rows);

    flashattention_toy_online_kernel<<<grid, block>>>(d_q, d_k, d_v, d_y_online, n_rows);

    CUDA_CHECK(cudaGetLastError());
    CUDA_CHECK(cudaDeviceSynchronize());

    CUDA_CHECK(cudaMemcpy(h_y_materialized.data(),
                          d_y_materialized,
                          y_elems * sizeof(float),
                          cudaMemcpyDeviceToHost));

    CUDA_CHECK(cudaMemcpy(h_y_online.data(),
                          d_y_online,
                          y_elems * sizeof(float),
                          cudaMemcpyDeviceToHost));

    float max_abs_diff = 0.0f;
    for (int i = 0; i < y_elems; ++i) {
        float diff = std::fabs(h_y_materialized[i] - h_y_online[i]);
        if (diff > max_abs_diff) {
            max_abs_diff = diff;
        }
    }

    std::printf("flashattention_toy_f32 done\n");
    std::printf("y_materialized[0] = %.8f\n", h_y_materialized[0]);
    std::printf("y_online[0]       = %.8f\n", h_y_online[0]);
    std::printf("max_abs_diff      = %.8e\n", max_abs_diff);

    CUDA_CHECK(cudaFree(d_q));
    CUDA_CHECK(cudaFree(d_k));
    CUDA_CHECK(cudaFree(d_v));
    CUDA_CHECK(cudaFree(d_scores));
    CUDA_CHECK(cudaFree(d_probs));
    CUDA_CHECK(cudaFree(d_y_materialized));
    CUDA_CHECK(cudaFree(d_y_online));

    return 0;
}