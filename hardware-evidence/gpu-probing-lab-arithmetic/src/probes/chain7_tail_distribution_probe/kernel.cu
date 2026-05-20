#include "probe/probe_result.hpp"

#include <cuda_runtime.h>

namespace {

__device__ __forceinline__ float make_seed(int lane, int warp_id, float offset) {
    return 1.0f
         + offset
         + 0.000001f * static_cast<float>(lane + 1)
         + 0.000017f * static_cast<float>(warp_id + 1);
}

__device__ __forceinline__ void fma_step(float& x, float m, float b) {
    asm volatile(
        "fma.rn.f32 %0, %0, %1, %2;"
        : "+f"(x)
        : "f"(m), "f"(b)
    );
}

/*
    Baseline strict dependent chain.
    7 FFMA on one accumulator.
*/
__device__ __forceinline__ void dependent_fma_7(float& x, float m, float b) {
    fma_step(x, m, b);
    fma_step(x, m, b);
    fma_step(x, m, b);
    fma_step(x, m, b);
    fma_step(x, m, b);
    fma_step(x, m, b);
    fma_step(x, m, b);
}

/*
    2 accumulators: 4 / 3 distribution.

    Pattern:
        a0 a1 a0 a1 a0 a1 a0

    Purpose:
        Less ILP than 4 accumulators,
        but lower live value pressure.
*/
__device__ __forceinline__ void independent_fma_7_2acc_4_3(
    float& a0,
    float& a1,
    float m,
    float b
) {
    fma_step(a0, m, b);
    fma_step(a1, m, b);

    fma_step(a0, m, b);
    fma_step(a1, m, b);

    fma_step(a0, m, b);
    fma_step(a1, m, b);

    fma_step(a0, m, b);
}

/*
    3 accumulators: 3 / 2 / 2 distribution.

    Pattern:
        a0 a1 a2 a0 a1 a2 a0
*/
__device__ __forceinline__ void independent_fma_7_3acc_3_2_2(
    float& a0,
    float& a1,
    float& a2,
    float m,
    float b
) {
    fma_step(a0, m, b);
    fma_step(a1, m, b);
    fma_step(a2, m, b);

    fma_step(a0, m, b);
    fma_step(a1, m, b);
    fma_step(a2, m, b);

    fma_step(a0, m, b);
}

/*
    4 accumulators, current-like chain_7 shape.

    Pattern:
        a0 a1 a2 a3 a0 a1 a2

    a3 has shorter chain.
*/
__device__ __forceinline__ void independent_fma_7_4acc_tail_a3_missing(
    float& a0,
    float& a1,
    float& a2,
    float& a3,
    float m,
    float b
) {
    fma_step(a0, m, b);
    fma_step(a1, m, b);
    fma_step(a2, m, b);
    fma_step(a3, m, b);

    fma_step(a0, m, b);
    fma_step(a1, m, b);
    fma_step(a2, m, b);
}

/*
    4 accumulators, shifted tail.

    Pattern:
        a1 a2 a3 a0 a1 a2 a3

    a0 has shorter chain.

    Purpose:
        Same instruction count and same number of accumulators as role_3,
        but the missing tail is shifted.
        If role_3 and role_4 differ, tail position / register allocation matters.
*/
__device__ __forceinline__ void independent_fma_7_4acc_tail_a0_missing(
    float& a0,
    float& a1,
    float& a2,
    float& a3,
    float m,
    float b
) {
    fma_step(a1, m, b);
    fma_step(a2, m, b);
    fma_step(a3, m, b);
    fma_step(a0, m, b);

    fma_step(a1, m, b);
    fma_step(a2, m, b);
    fma_step(a3, m, b);
}

/*
    7 accumulators, each updated once.

    Pattern:
        a0 a1 a2 a3 a4 a5 a6

    Purpose:
        Maximize instruction independence for 7 FFMA,
        but also maximizes live accumulator count.
        If this is not faster, live range / sink / register pressure is likely involved.
*/
__device__ __forceinline__ void independent_fma_7_7acc_once(
    float& a0,
    float& a1,
    float& a2,
    float& a3,
    float& a4,
    float& a5,
    float& a6,
    float m,
    float b
) {
    fma_step(a0, m, b);
    fma_step(a1, m, b);
    fma_step(a2, m, b);
    fma_step(a3, m, b);
    fma_step(a4, m, b);
    fma_step(a5, m, b);
    fma_step(a6, m, b);
}

/*
    Balanced chain-8 control.

    Dependent:
        one accumulator, 8 FFMA.

    Independent:
        4 accumulators, 2 updates each:
        a0 a1 a2 a3 a0 a1 a2 a3
*/
__device__ __forceinline__ void dependent_fma_8(float& x, float m, float b) {
    fma_step(x, m, b);
    fma_step(x, m, b);
    fma_step(x, m, b);
    fma_step(x, m, b);

    fma_step(x, m, b);
    fma_step(x, m, b);
    fma_step(x, m, b);
    fma_step(x, m, b);
}

__device__ __forceinline__ void independent_fma_8_4acc_balanced(
    float& a0,
    float& a1,
    float& a2,
    float& a3,
    float m,
    float b
) {
    fma_step(a0, m, b);
    fma_step(a1, m, b);
    fma_step(a2, m, b);
    fma_step(a3, m, b);

    fma_step(a0, m, b);
    fma_step(a1, m, b);
    fma_step(a2, m, b);
    fma_step(a3, m, b);
}

__global__ void chain7_tail_distribution_kernel(
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
    const int role_id = warp_id & 7;

    float x = make_seed(lane, warp_id, 0.000f);

    float a0 = make_seed(lane, warp_id, 0.125f);
    float a1 = make_seed(lane, warp_id, 0.250f);
    float a2 = make_seed(lane, warp_id, 0.375f);
    float a3 = make_seed(lane, warp_id, 0.500f);
    float a4 = make_seed(lane, warp_id, 0.625f);
    float a5 = make_seed(lane, warp_id, 0.750f);
    float a6 = make_seed(lane, warp_id, 0.875f);

    float m = 1.000001f;
    float b = 0.000013f;

    /*
        Keep operands loop-invariant but not compile-time trivial.
    */
    m += 0.0000001f * static_cast<float>((lane & 1) + 1);
    b += 0.0000001f * static_cast<float>((warp_id & 1) + 1);

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
                dependent_fma_7(x, m, b);
            } else if (role_id == 1) {
                independent_fma_7_2acc_4_3(a0, a1, m, b);
            } else if (role_id == 2) {
                independent_fma_7_3acc_3_2_2(a0, a1, a2, m, b);
            } else if (role_id == 3) {
                independent_fma_7_4acc_tail_a3_missing(a0, a1, a2, a3, m, b);
            } else if (role_id == 4) {
                independent_fma_7_4acc_tail_a0_missing(a0, a1, a2, a3, m, b);
            } else if (role_id == 5) {
                independent_fma_7_7acc_once(a0, a1, a2, a3, a4, a5, a6, m, b);
            } else if (role_id == 6) {
                dependent_fma_8(x, m, b);
            } else {
                independent_fma_8_4acc_balanced(a0, a1, a2, a3, m, b);
            }

            progress++;
        }
    } else {
        for (unsigned long long i = 0; i < iterations; ++i) {
            if (role_id == 0) {
                dependent_fma_7(x, m, b);
            } else if (role_id == 1) {
                independent_fma_7_2acc_4_3(a0, a1, m, b);
            } else if (role_id == 2) {
                independent_fma_7_3acc_3_2_2(a0, a1, a2, m, b);
            } else if (role_id == 3) {
                independent_fma_7_4acc_tail_a3_missing(a0, a1, a2, a3, m, b);
            } else if (role_id == 4) {
                independent_fma_7_4acc_tail_a0_missing(a0, a1, a2, a3, m, b);
            } else if (role_id == 5) {
                independent_fma_7_7acc_once(a0, a1, a2, a3, a4, a5, a6, m, b);
            } else if (role_id == 6) {
                dependent_fma_8(x, m, b);
            } else {
                independent_fma_8_4acc_balanced(a0, a1, a2, a3, m, b);
            }

            progress++;
        }

        last_clock = clock64() - start;
    }

    float sink = 0.0f;

    if (role_id == 0 || role_id == 6) {
        sink = x;
    } else if (role_id == 1) {
        sink = a0 + a1;
    } else if (role_id == 2) {
        sink = a0 + a1 + a2;
    } else if (role_id == 5) {
        sink = a0 + a1 + a2 + a3 + a4 + a5 + a6;
    } else {
        sink = a0 + a1 + a2 + a3;
    }

    sink += 0.000001f * static_cast<float>(lane);

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

void launch_chain7_tail_distribution_kernel(
    DeviceArithmeticProbeRecord* out_records,
    int blocks,
    int threads_per_block,
    unsigned long long clock_budget_cycles,
    unsigned long long iterations,
    int use_clock_budget
) {
    chain7_tail_distribution_kernel<<<blocks, threads_per_block>>>(
        out_records,
        clock_budget_cycles,
        iterations,
        use_clock_budget
    );
}