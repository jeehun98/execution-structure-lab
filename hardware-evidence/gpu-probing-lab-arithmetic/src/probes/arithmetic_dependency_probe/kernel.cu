#include "probe/probe_result.hpp"

#include <cuda_runtime.h>

namespace {

__device__ __forceinline__ float prevent_zero(float x, int lane, int warp_id) {
    return x + 0.000001f * static_cast<float>((lane + 1) * (warp_id + 1));
}

__device__ __forceinline__ void independent_fma_step(
    float& a0,
    float& a1,
    float& a2,
    float& a3,
    float& a4,
    float& a5,
    float& a6,
    float& a7
) {
    a0 = __fmaf_rn(a0, 1.000001f, 0.000013f);
    a1 = __fmaf_rn(a1, 1.000002f, 0.000017f);
    a2 = __fmaf_rn(a2, 0.999999f, 0.000019f);
    a3 = __fmaf_rn(a3, 1.000003f, 0.000023f);

    a4 = __fmaf_rn(a4, 0.999998f, 0.000029f);
    a5 = __fmaf_rn(a5, 1.000004f, 0.000031f);
    a6 = __fmaf_rn(a6, 0.999997f, 0.000037f);
    a7 = __fmaf_rn(a7, 1.000005f, 0.000041f);
}

__device__ __forceinline__ void dependent_fma_chain_step(float& x) {
    x = __fmaf_rn(x, 1.000001f, 0.000013f);
    x = __fmaf_rn(x, 1.000002f, 0.000017f);
    x = __fmaf_rn(x, 0.999999f, 0.000019f);
    x = __fmaf_rn(x, 1.000003f, 0.000023f);

    x = __fmaf_rn(x, 0.999998f, 0.000029f);
    x = __fmaf_rn(x, 1.000004f, 0.000031f);
    x = __fmaf_rn(x, 0.999997f, 0.000037f);
    x = __fmaf_rn(x, 1.000005f, 0.000041f);
}

__device__ __forceinline__ void independent_add_step(
    float& a0,
    float& a1,
    float& a2,
    float& a3,
    float& a4,
    float& a5,
    float& a6,
    float& a7
) {
    a0 = a0 + 0.000013f;
    a1 = a1 + 0.000017f;
    a2 = a2 + 0.000019f;
    a3 = a3 + 0.000023f;

    a4 = a4 + 0.000029f;
    a5 = a5 + 0.000031f;
    a6 = a6 + 0.000037f;
    a7 = a7 + 0.000041f;
}

__device__ __forceinline__ void dependent_add_chain_step(float& x) {
    x = x + 0.000013f;
    x = x + 0.000017f;
    x = x + 0.000019f;
    x = x + 0.000023f;

    x = x + 0.000029f;
    x = x + 0.000031f;
    x = x + 0.000037f;
    x = x + 0.000041f;
}

__global__ void arithmetic_dependency_kernel(
    DeviceArithmeticProbeRecord* out_records,
    unsigned long long clock_budget_cycles,
    unsigned long long iterations,
    int use_clock_budget
) {
    const int tid = threadIdx.x;
    const int lane = tid & 31;
    const int warp_id = tid >> 5;
    const int warps_per_block = blockDim.x >> 5;

    const int global_warp_index = blockIdx.x * warps_per_block + warp_id;
    const int role_id = warp_id & 3;

    float a0 = prevent_zero(1.0f, lane, warp_id);
    float a1 = prevent_zero(2.0f, lane, warp_id);
    float a2 = prevent_zero(3.0f, lane, warp_id);
    float a3 = prevent_zero(4.0f, lane, warp_id);
    float a4 = prevent_zero(5.0f, lane, warp_id);
    float a5 = prevent_zero(6.0f, lane, warp_id);
    float a6 = prevent_zero(7.0f, lane, warp_id);
    float a7 = prevent_zero(8.0f, lane, warp_id);

    float x = prevent_zero(1.0f, lane, warp_id);

    unsigned long long progress = 0;
    unsigned long long last_clock = 0;

    const unsigned long long start = clock64();

    if (use_clock_budget) {
        while (true) {
            const unsigned long long now = clock64();

            if (now - start >= clock_budget_cycles) {
                last_clock = now - start;
                break;
            }

            if (role_id == 0) {
                independent_fma_step(a0, a1, a2, a3, a4, a5, a6, a7);
            } else if (role_id == 1) {
                dependent_fma_chain_step(x);
            } else if (role_id == 2) {
                independent_add_step(a0, a1, a2, a3, a4, a5, a6, a7);
            } else {
                dependent_add_chain_step(x);
            }

            progress++;
        }
    } else {
        for (unsigned long long i = 0; i < iterations; ++i) {
            if (role_id == 0) {
                independent_fma_step(a0, a1, a2, a3, a4, a5, a6, a7);
            } else if (role_id == 1) {
                dependent_fma_chain_step(x);
            } else if (role_id == 2) {
                independent_add_step(a0, a1, a2, a3, a4, a5, a6, a7);
            } else {
                dependent_add_chain_step(x);
            }

            progress++;
        }

        last_clock = clock64() - start;
    }

    float sink = 0.0f;

    if (role_id == 0 || role_id == 2) {
        sink = a0 + a1 + a2 + a3 + a4 + a5 + a6 + a7;
    } else {
        sink = x;
    }

    // Mix lane value so all lanes participate.
    sink += static_cast<float>(lane) * 0.000001f;

    if (lane == 0) {
        out_records[global_warp_index].block_id = blockIdx.x;
        out_records[global_warp_index].warp_id = warp_id;
        out_records[global_warp_index].role_id = role_id;
        out_records[global_warp_index].progress = progress;
        out_records[global_warp_index].last_clock = last_clock;
        out_records[global_warp_index].sink = sink;
    }
}

} // namespace

void launch_arithmetic_dependency_kernel(
    DeviceArithmeticProbeRecord* out_records,
    int blocks,
    int threads_per_block,
    unsigned long long clock_budget_cycles,
    unsigned long long iterations,
    int use_clock_budget
) {
    arithmetic_dependency_kernel<<<blocks, threads_per_block>>>(
        out_records,
        clock_budget_cycles,
        iterations,
        use_clock_budget
    );
}