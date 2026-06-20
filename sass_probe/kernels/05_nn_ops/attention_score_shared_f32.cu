#include <cuda_runtime.h>

#include <cmath>
#include <cstdio>
#include <cstdlib>
#include <vector>

#define CUDA_CHECK(expr)                                                        \
    do {                                                                        \
        const cudaError_t err__ = (expr);                                       \
        if (err__ != cudaSuccess) {                                             \
            std::fprintf(stderr,                                                \
                         "CUDA error at %s:%d: %s\n",                            \
                         __FILE__,                                              \
                         __LINE__,                                              \
                         cudaGetErrorString(err__));                            \
            std::exit(EXIT_FAILURE);                                            \
        }                                                                       \
    } while (0)

static constexpr int TOY_D = 4;
static constexpr int TOY_N_KEYS = 4;
static constexpr int TOY_DV = 4;

static constexpr float TOY_SCALE = 0.5f;
static constexpr float TOY_NEG_INF =
    -3.4028234663852886e+38F;

// -----------------------------------------------------------------------------
// 작은 D=4 dot product.
//
// Expected SASS:
//   FMUL
//   FFMA
//   FFMA
//   FFMA
//   FMUL 0.5
// -----------------------------------------------------------------------------

__device__ __forceinline__
float score4_f32(
    const float q0,
    const float q1,
    const float q2,
    const float q3,
    const float* __restrict__ k_base) {

    const float k0 = k_base[0];
    const float k1 = k_base[1];
    const float k2 = k_base[2];
    const float k3 = k_base[3];

    float score = q0 * k0;

    score = fmaf(q1, k1, score);
    score = fmaf(q2, k2, score);
    score = fmaf(q3, k3, score);

    return score * TOY_SCALE;
}

// -----------------------------------------------------------------------------
// Register-resident reference.
//
// 한 thread가 한 query row를 전부 처리한다.
//
// score 4개는 register에 유지된다.
// score intermediate에 대한 shared/global memory materialization은 없다.
//
// Expected:
//   LDG q/k/v
//   FMUL / FFMA
//   FMNMX
//   MUFU.EX2
//   MUFU.RCP
//   STG y
//
// Not expected:
//   STS
//   LDS
//   BAR
// -----------------------------------------------------------------------------

extern "C" __global__
void attention_register_reference_kernel(
    const float* __restrict__ q,
    const float* __restrict__ k,
    const float* __restrict__ v,
    float* __restrict__ y,
    const int n_rows) {

    const int row =
        static_cast<int>(blockIdx.x * blockDim.x + threadIdx.x);

    if (row >= n_rows) {
        return;
    }

    const float* q_base = q + row * TOY_D;
    float* y_base = y + row * TOY_DV;

    const float q0 = q_base[0];
    const float q1 = q_base[1];
    const float q2 = q_base[2];
    const float q3 = q_base[3];

    const float s0 =
        score4_f32(q0, q1, q2, q3, k + 0 * TOY_D);

    const float s1 =
        score4_f32(q0, q1, q2, q3, k + 1 * TOY_D);

    const float s2 =
        score4_f32(q0, q1, q2, q3, k + 2 * TOY_D);

    const float s3 =
        score4_f32(q0, q1, q2, q3, k + 3 * TOY_D);

    float max_score = TOY_NEG_INF;

    max_score = fmaxf(max_score, s0);
    max_score = fmaxf(max_score, s1);
    max_score = fmaxf(max_score, s2);
    max_score = fmaxf(max_score, s3);

    const float p0 = __expf(s0 - max_score);
    const float p1 = __expf(s1 - max_score);
    const float p2 = __expf(s2 - max_score);
    const float p3 = __expf(s3 - max_score);

    const float sum = p0 + p1 + p2 + p3;
    const float inv_sum = 1.0f / sum;

    const float n0 = p0 * inv_sum;
    const float n1 = p1 * inv_sum;
    const float n2 = p2 * inv_sum;
    const float n3 = p3 * inv_sum;

    const float* v0 = v + 0 * TOY_DV;
    const float* v1 = v + 1 * TOY_DV;
    const float* v2 = v + 2 * TOY_DV;
    const float* v3 = v + 3 * TOY_DV;

    float acc0 = n0 * v0[0];
    float acc1 = n0 * v0[1];
    float acc2 = n0 * v0[2];
    float acc3 = n0 * v0[3];

    acc0 = fmaf(n1, v1[0], acc0);
    acc1 = fmaf(n1, v1[1], acc1);
    acc2 = fmaf(n1, v1[2], acc2);
    acc3 = fmaf(n1, v1[3], acc3);

    acc0 = fmaf(n2, v2[0], acc0);
    acc1 = fmaf(n2, v2[1], acc1);
    acc2 = fmaf(n2, v2[2], acc2);
    acc3 = fmaf(n2, v2[3], acc3);

    acc0 = fmaf(n3, v3[0], acc0);
    acc1 = fmaf(n3, v3[1], acc1);
    acc2 = fmaf(n3, v3[2], acc2);
    acc3 = fmaf(n3, v3[3], acc3);

    y_base[0] = acc0;
    y_base[1] = acc1;
    y_base[2] = acc2;
    y_base[3] = acc3;
}

// -----------------------------------------------------------------------------
// Shared-memory score materialization.
//
// 하나의 block이 하나의 query row를 처리한다.
//
// producer:
//   thread 0  → score 0
//   thread 32 → score 1
//   thread 64 → score 2
//   thread 96 → score 3
//
// 네 warp의 lane 0이 각각 하나의 score를 계산하고 shared memory에 저장한다.
//
// thread 0은 __syncthreads() 이후 shared memory에서 score 4개를 읽고
// softmax와 value accumulation을 수행한다.
//
// 서로 다른 warp가 score를 생산하므로 block-wide barrier가 필요하다.
//
// Expected SASS:
//   STS
//   BAR
//   LDS
//   FMNMX
//   MUFU.EX2
//   MUFU.RCP
//   FFMA
//   STG y
// -----------------------------------------------------------------------------

extern "C" __global__ __launch_bounds__(128)
void attention_shared_scores_kernel(
    const float* __restrict__ q,
    const float* __restrict__ k,
    const float* __restrict__ v,
    float* __restrict__ y,
    const int n_rows) {

    const int row = static_cast<int>(blockIdx.x);

    // block 전체에서 같은 조건이므로 barrier 이전 return이 안전하다.
    if (row >= n_rows) {
        return;
    }

    __shared__ float shared_scores[TOY_N_KEYS];

    const int lane_id =
        static_cast<int>(threadIdx.x) & 31;

    const int warp_id =
        static_cast<int>(threadIdx.x) >> 5;

    // 각 warp의 lane 0만 score 하나를 생산한다.
    if (lane_id == 0 && warp_id < TOY_N_KEYS) {
        const float* q_base = q + row * TOY_D;
        const float* k_base = k + warp_id * TOY_D;

        const float q0 = q_base[0];
        const float q1 = q_base[1];
        const float q2 = q_base[2];
        const float q3 = q_base[3];

        const float score =
            score4_f32(
                q0,
                q1,
                q2,
                q3,
                k_base);

        shared_scores[warp_id] = score;
    }

    // 네 warp의 shared store가 끝날 때까지 기다린다.
    __syncthreads();

    // 후속 계산은 thread 0만 수행한다.
    if (threadIdx.x != 0) {
        return;
    }

    // Shared-memory consumer.
    const float s0 = shared_scores[0];
    const float s1 = shared_scores[1];
    const float s2 = shared_scores[2];
    const float s3 = shared_scores[3];

    float max_score = TOY_NEG_INF;

    max_score = fmaxf(max_score, s0);
    max_score = fmaxf(max_score, s1);
    max_score = fmaxf(max_score, s2);
    max_score = fmaxf(max_score, s3);

    const float p0 = __expf(s0 - max_score);
    const float p1 = __expf(s1 - max_score);
    const float p2 = __expf(s2 - max_score);
    const float p3 = __expf(s3 - max_score);

    const float sum = p0 + p1 + p2 + p3;
    const float inv_sum = 1.0f / sum;

    const float n0 = p0 * inv_sum;
    const float n1 = p1 * inv_sum;
    const float n2 = p2 * inv_sum;
    const float n3 = p3 * inv_sum;

    const float* v0 = v + 0 * TOY_DV;
    const float* v1 = v + 1 * TOY_DV;
    const float* v2 = v + 2 * TOY_DV;
    const float* v3 = v + 3 * TOY_DV;

    float acc0 = n0 * v0[0];
    float acc1 = n0 * v0[1];
    float acc2 = n0 * v0[2];
    float acc3 = n0 * v0[3];

    acc0 = fmaf(n1, v1[0], acc0);
    acc1 = fmaf(n1, v1[1], acc1);
    acc2 = fmaf(n1, v1[2], acc2);
    acc3 = fmaf(n1, v1[3], acc3);

    acc0 = fmaf(n2, v2[0], acc0);
    acc1 = fmaf(n2, v2[1], acc1);
    acc2 = fmaf(n2, v2[2], acc2);
    acc3 = fmaf(n2, v2[3], acc3);

    acc0 = fmaf(n3, v3[0], acc0);
    acc1 = fmaf(n3, v3[1], acc1);
    acc2 = fmaf(n3, v3[2], acc2);
    acc3 = fmaf(n3, v3[3], acc3);

    float* y_base = y + row * TOY_DV;

    y_base[0] = acc0;
    y_base[1] = acc1;
    y_base[2] = acc2;
    y_base[3] = acc3;
}

int main() {
    constexpr int n_rows = 1 << 12;

    constexpr int reference_block = 128;
    constexpr int reference_grid =
        (n_rows + reference_block - 1) / reference_block;

    // Shared kernel은 block 하나가 row 하나를 담당한다.
    constexpr int shared_block = 128;
    constexpr int shared_grid = n_rows;

    const int q_elems = n_rows * TOY_D;
    const int k_elems = TOY_N_KEYS * TOY_D;
    const int v_elems = TOY_N_KEYS * TOY_DV;
    const int y_elems = n_rows * TOY_DV;

    std::vector<float> h_q(q_elems);
    std::vector<float> h_k(k_elems);
    std::vector<float> h_v(v_elems);

    std::vector<float> h_y_reference(y_elems);
    std::vector<float> h_y_shared(y_elems);

    for (int i = 0; i < q_elems; ++i) {
        h_q[i] =
            0.01f * static_cast<float>((i % 17) - 8);
    }

    for (int i = 0; i < k_elems; ++i) {
        h_k[i] =
            0.02f * static_cast<float>((i % 13) - 6);
    }

    for (int i = 0; i < v_elems; ++i) {
        h_v[i] =
            0.03f * static_cast<float>((i % 11) - 5);
    }

    float* d_q = nullptr;
    float* d_k = nullptr;
    float* d_v = nullptr;

    float* d_y_reference = nullptr;
    float* d_y_shared = nullptr;

    CUDA_CHECK(cudaMalloc(
        reinterpret_cast<void**>(&d_q),
        q_elems * sizeof(float)));

    CUDA_CHECK(cudaMalloc(
        reinterpret_cast<void**>(&d_k),
        k_elems * sizeof(float)));

    CUDA_CHECK(cudaMalloc(
        reinterpret_cast<void**>(&d_v),
        v_elems * sizeof(float)));

    CUDA_CHECK(cudaMalloc(
        reinterpret_cast<void**>(&d_y_reference),
        y_elems * sizeof(float)));

    CUDA_CHECK(cudaMalloc(
        reinterpret_cast<void**>(&d_y_shared),
        y_elems * sizeof(float)));

    CUDA_CHECK(cudaMemcpy(
        d_q,
        h_q.data(),
        q_elems * sizeof(float),
        cudaMemcpyHostToDevice));

    CUDA_CHECK(cudaMemcpy(
        d_k,
        h_k.data(),
        k_elems * sizeof(float),
        cudaMemcpyHostToDevice));

    CUDA_CHECK(cudaMemcpy(
        d_v,
        h_v.data(),
        v_elems * sizeof(float),
        cudaMemcpyHostToDevice));

    attention_register_reference_kernel
        <<<reference_grid, reference_block>>>(
            d_q,
            d_k,
            d_v,
            d_y_reference,
            n_rows);

    CUDA_CHECK(cudaGetLastError());

    attention_shared_scores_kernel
        <<<shared_grid, shared_block>>>(
            d_q,
            d_k,
            d_v,
            d_y_shared,
            n_rows);

    CUDA_CHECK(cudaGetLastError());
    CUDA_CHECK(cudaDeviceSynchronize());

    CUDA_CHECK(cudaMemcpy(
        h_y_reference.data(),
        d_y_reference,
        y_elems * sizeof(float),
        cudaMemcpyDeviceToHost));

    CUDA_CHECK(cudaMemcpy(
        h_y_shared.data(),
        d_y_shared,
        y_elems * sizeof(float),
        cudaMemcpyDeviceToHost));

    float max_abs_diff = 0.0f;

    for (int i = 0; i < y_elems; ++i) {
        const float diff =
            std::fabs(
                h_y_reference[i] -
                h_y_shared[i]);

        if (diff > max_abs_diff) {
            max_abs_diff = diff;
        }
    }

    std::printf(
        "attention_score_shared_f32 done\n");

    std::printf(
        "reference y[0:4] = "
        "%.8f %.8f %.8f %.8f\n",
        h_y_reference[0],
        h_y_reference[1],
        h_y_reference[2],
        h_y_reference[3]);

    std::printf(
        "shared    y[0:4] = "
        "%.8f %.8f %.8f %.8f\n",
        h_y_shared[0],
        h_y_shared[1],
        h_y_shared[2],
        h_y_shared[3]);

    std::printf(
        "max_abs_diff     = %.8e\n",
        max_abs_diff);

    CUDA_CHECK(cudaFree(d_q));
    CUDA_CHECK(cudaFree(d_k));
    CUDA_CHECK(cudaFree(d_v));

    CUDA_CHECK(cudaFree(d_y_reference));
    CUDA_CHECK(cudaFree(d_y_shared));

    return 0;
}