#include "probe/probe_result.hpp"

#include <cuda_runtime.h>

namespace {

__device__ __forceinline__ float make_seed(int lane, int warp_id) {
    return 1.0f
         + 0.000001f * static_cast<float>(lane + 1)
         + 0.000017f * static_cast<float>(warp_id + 1);
}

/*
    Strict dependent ADD chain.

    Intentional shape:

        x = x + b
        x = x + b
        x = x + b
        ...

    Inline PTX uses "+f"(x), so the output value feeds the next instruction.
    Final SASS still must be inspected.
*/
__device__ __forceinline__ void controlled_add_8(float& x, float b) {
    asm volatile("add.rn.f32 %0, %0, %1;" : "+f"(x) : "f"(b));
    asm volatile("add.rn.f32 %0, %0, %1;" : "+f"(x) : "f"(b));
    asm volatile("add.rn.f32 %0, %0, %1;" : "+f"(x) : "f"(b));
    asm volatile("add.rn.f32 %0, %0, %1;" : "+f"(x) : "f"(b));

    asm volatile("add.rn.f32 %0, %0, %1;" : "+f"(x) : "f"(b));
    asm volatile("add.rn.f32 %0, %0, %1;" : "+f"(x) : "f"(b));
    asm volatile("add.rn.f32 %0, %0, %1;" : "+f"(x) : "f"(b));
    asm volatile("add.rn.f32 %0, %0, %1;" : "+f"(x) : "f"(b));
}

/*
    Strict dependent FMA chain.

    Intentional shape:

        x = fma(x, m, b)
        x = fma(x, m, b)
        x = fma(x, m, b)
        ...

    m and b are provided as source operands.
    They should be prepared outside the timed loop and reused.
*/
__device__ __forceinline__ void controlled_fma_8(float& x, float m, float b) {
    asm volatile("fma.rn.f32 %0, %0, %1, %2;" : "+f"(x) : "f"(m), "f"(b));
    asm volatile("fma.rn.f32 %0, %0, %1, %2;" : "+f"(x) : "f"(m), "f"(b));
    asm volatile("fma.rn.f32 %0, %0, %1, %2;" : "+f"(x) : "f"(m), "f"(b));
    asm volatile("fma.rn.f32 %0, %0, %1, %2;" : "+f"(x) : "f"(m), "f"(b));

    asm volatile("fma.rn.f32 %0, %0, %1, %2;" : "+f"(x) : "f"(m), "f"(b));
    asm volatile("fma.rn.f32 %0, %0, %1, %2;" : "+f"(x) : "f"(m), "f"(b));
    asm volatile("fma.rn.f32 %0, %0, %1, %2;" : "+f"(x) : "f"(m), "f"(b));
    asm volatile("fma.rn.f32 %0, %0, %1, %2;" : "+f"(x) : "f"(m), "f"(b));
}

__device__ __forceinline__ void controlled_add_16(float& x, float b) {
    controlled_add_8(x, b);
    controlled_add_8(x, b);
}

__device__ __forceinline__ void controlled_fma_16(float& x, float m, float b) {
    controlled_fma_8(x, m, b);
    controlled_fma_8(x, m, b);
}

__global__ void controlled_arithmetic_chain_kernel(
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

    /*
        Keep sources simple and fixed.

        m is close to 1.0 to avoid explosive growth.
        b is small and non-zero.
    */
    float x = make_seed(lane, warp_id);
    float m = 1.000001f;
    float b = 0.000013f;

    /*
        Prevent the compiler from treating the operands as too trivial.
        These values are still loop-invariant.
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
                controlled_add_8(x, b);
            } else if (role_id == 1) {
                controlled_fma_8(x, m, b);
            } else if (role_id == 2) {
                controlled_add_16(x, b);
            } else {
                controlled_fma_16(x, m, b);
            }

            progress++;
        }
    } else {
        for (unsigned long long i = 0; i < iterations; ++i) {
            if (role_id == 0) {
                controlled_add_8(x, b);
            } else if (role_id == 1) {
                controlled_fma_8(x, m, b);
            } else if (role_id == 2) {
                controlled_add_16(x, b);
            } else {
                controlled_fma_16(x, m, b);
            }

            progress++;
        }

        last_clock = clock64() - start;
    }

    /*
        Make the result observable.
        Lane 0 writes one record per warp.
    */
    float sink = x + 0.000001f * static_cast<float>(lane);

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

void launch_controlled_arithmetic_chain_kernel(
    DeviceArithmeticProbeRecord* out_records,
    int blocks,
    int threads_per_block,
    unsigned long long clock_budget_cycles,
    unsigned long long iterations,
    int use_clock_budget
) {
    controlled_arithmetic_chain_kernel<<<blocks, threads_per_block>>>(
        out_records,
        clock_budget_cycles,
        iterations,
        use_clock_budget
    );
}