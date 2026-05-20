#include "probe/probe_result.hpp"

#include <cuda_runtime.h>

namespace {

__device__ __forceinline__ float make_seed(int lane, int warp_id) {
    return 1.0f
         + 0.000001f * static_cast<float>(lane + 1)
         + 0.000017f * static_cast<float>(warp_id + 1);
}

__device__ __forceinline__ void dep_fma(float& x, float m, float b) {
    asm volatile(
        "fma.rn.f32 %0, %0, %1, %2;"
        : "+f"(x)
        : "f"(m), "f"(b)
    );
}

__device__ __forceinline__ void ind_fma(float& x, float m, float b) {
    asm volatile(
        "fma.rn.f32 %0, %0, %1, %2;"
        : "+f"(x)
        : "f"(m), "f"(b)
    );
}

/*
    Dependent chains.

    These intentionally use a single accumulator x.
    Target SASS shape should look like:

        FFMA Rxx, Rm, Rxx, Rb
        FFMA Rxx, Rm, Rxx, Rb
        ...
*/

__device__ __forceinline__ void dependent_fma_3(float& x, float m, float b) {
    dep_fma(x, m, b);
    dep_fma(x, m, b);
    dep_fma(x, m, b);
}

__device__ __forceinline__ void dependent_fma_7(float& x, float m, float b) {
    dep_fma(x, m, b);
    dep_fma(x, m, b);
    dep_fma(x, m, b);
    dep_fma(x, m, b);
    dep_fma(x, m, b);
    dep_fma(x, m, b);
    dep_fma(x, m, b);
}

__device__ __forceinline__ void dependent_fma_13(float& x, float m, float b) {
    dep_fma(x, m, b);
    dep_fma(x, m, b);
    dep_fma(x, m, b);
    dep_fma(x, m, b);

    dep_fma(x, m, b);
    dep_fma(x, m, b);
    dep_fma(x, m, b);
    dep_fma(x, m, b);

    dep_fma(x, m, b);
    dep_fma(x, m, b);
    dep_fma(x, m, b);
    dep_fma(x, m, b);

    dep_fma(x, m, b);
}

__device__ __forceinline__ void dependent_fma_29(float& x, float m, float b) {
    dep_fma(x, m, b);
    dep_fma(x, m, b);
    dep_fma(x, m, b);
    dep_fma(x, m, b);

    dep_fma(x, m, b);
    dep_fma(x, m, b);
    dep_fma(x, m, b);
    dep_fma(x, m, b);

    dep_fma(x, m, b);
    dep_fma(x, m, b);
    dep_fma(x, m, b);
    dep_fma(x, m, b);

    dep_fma(x, m, b);
    dep_fma(x, m, b);
    dep_fma(x, m, b);
    dep_fma(x, m, b);

    dep_fma(x, m, b);
    dep_fma(x, m, b);
    dep_fma(x, m, b);
    dep_fma(x, m, b);

    dep_fma(x, m, b);
    dep_fma(x, m, b);
    dep_fma(x, m, b);
    dep_fma(x, m, b);

    dep_fma(x, m, b);
    dep_fma(x, m, b);
    dep_fma(x, m, b);
    dep_fma(x, m, b);

    dep_fma(x, m, b);
}

/*
    Independent versions.

    Same total FFMA count as dependent version,
    but distributed across independent accumulators.

    This is not "zero dependency" globally, because each accumulator has its own chain.
    The point is to expose multiple ready accumulator lanes within the warp instruction stream.

    Target idea:

        FFMA a0
        FFMA a1
        FFMA a2
        FFMA a3
        FFMA a0
        FFMA a1
        ...
*/

__device__ __forceinline__ void independent_fma_3(
    float& a0,
    float& a1,
    float& a2,
    float& a3,
    float m,
    float b
) {
    ind_fma(a0, m, b);
    ind_fma(a1, m, b);
    ind_fma(a2, m, b);
}

__device__ __forceinline__ void independent_fma_7(
    float& a0,
    float& a1,
    float& a2,
    float& a3,
    float m,
    float b
) {
    ind_fma(a0, m, b);
    ind_fma(a1, m, b);
    ind_fma(a2, m, b);
    ind_fma(a3, m, b);

    ind_fma(a0, m, b);
    ind_fma(a1, m, b);
    ind_fma(a2, m, b);
}

__device__ __forceinline__ void independent_fma_13(
    float& a0,
    float& a1,
    float& a2,
    float& a3,
    float m,
    float b
) {
    ind_fma(a0, m, b);
    ind_fma(a1, m, b);
    ind_fma(a2, m, b);
    ind_fma(a3, m, b);

    ind_fma(a0, m, b);
    ind_fma(a1, m, b);
    ind_fma(a2, m, b);
    ind_fma(a3, m, b);

    ind_fma(a0, m, b);
    ind_fma(a1, m, b);
    ind_fma(a2, m, b);
    ind_fma(a3, m, b);

    ind_fma(a0, m, b);
}

__device__ __forceinline__ void independent_fma_29(
    float& a0,
    float& a1,
    float& a2,
    float& a3,
    float m,
    float b
) {
    ind_fma(a0, m, b);
    ind_fma(a1, m, b);
    ind_fma(a2, m, b);
    ind_fma(a3, m, b);

    ind_fma(a0, m, b);
    ind_fma(a1, m, b);
    ind_fma(a2, m, b);
    ind_fma(a3, m, b);

    ind_fma(a0, m, b);
    ind_fma(a1, m, b);
    ind_fma(a2, m, b);
    ind_fma(a3, m, b);

    ind_fma(a0, m, b);
    ind_fma(a1, m, b);
    ind_fma(a2, m, b);
    ind_fma(a3, m, b);

    ind_fma(a0, m, b);
    ind_fma(a1, m, b);
    ind_fma(a2, m, b);
    ind_fma(a3, m, b);

    ind_fma(a0, m, b);
    ind_fma(a1, m, b);
    ind_fma(a2, m, b);
    ind_fma(a3, m, b);

    ind_fma(a0, m, b);
    ind_fma(a1, m, b);
    ind_fma(a2, m, b);
    ind_fma(a3, m, b);

    ind_fma(a0, m, b);
}

__global__ void irregular_fma_dependency_shape_kernel(
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

    float x = make_seed(lane, warp_id);

    float a0 = make_seed(lane, warp_id) + 0.125f;
    float a1 = make_seed(lane, warp_id) + 0.250f;
    float a2 = make_seed(lane, warp_id) + 0.375f;
    float a3 = make_seed(lane, warp_id) + 0.500f;

    float m = 1.000001f;
    float b = 0.000013f;

    /*
        Keep source operands loop-invariant but not trivially identical across all lanes.
        This reduces the chance of overly aggressive simplification while keeping SASS readable.
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
                dependent_fma_3(x, m, b);
            } else if (role_id == 1) {
                independent_fma_3(a0, a1, a2, a3, m, b);
            } else if (role_id == 2) {
                dependent_fma_7(x, m, b);
            } else if (role_id == 3) {
                independent_fma_7(a0, a1, a2, a3, m, b);
            } else if (role_id == 4) {
                dependent_fma_13(x, m, b);
            } else if (role_id == 5) {
                independent_fma_13(a0, a1, a2, a3, m, b);
            } else if (role_id == 6) {
                dependent_fma_29(x, m, b);
            } else {
                independent_fma_29(a0, a1, a2, a3, m, b);
            }

            progress++;
        }
    } else {
        for (unsigned long long i = 0; i < iterations; ++i) {
            if (role_id == 0) {
                dependent_fma_3(x, m, b);
            } else if (role_id == 1) {
                independent_fma_3(a0, a1, a2, a3, m, b);
            } else if (role_id == 2) {
                dependent_fma_7(x, m, b);
            } else if (role_id == 3) {
                independent_fma_7(a0, a1, a2, a3, m, b);
            } else if (role_id == 4) {
                dependent_fma_13(x, m, b);
            } else if (role_id == 5) {
                independent_fma_13(a0, a1, a2, a3, m, b);
            } else if (role_id == 6) {
                dependent_fma_29(x, m, b);
            } else {
                independent_fma_29(a0, a1, a2, a3, m, b);
            }

            progress++;
        }

        last_clock = clock64() - start;
    }

    float sink = 0.0f;

    if ((role_id & 1) == 0) {
        sink = x;
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

void launch_irregular_fma_dependency_shape_kernel(
    DeviceArithmeticProbeRecord* out_records,
    int blocks,
    int threads_per_block,
    unsigned long long clock_budget_cycles,
    unsigned long long iterations,
    int use_clock_budget
) {
    irregular_fma_dependency_shape_kernel<<<blocks, threads_per_block>>>(
        out_records,
        clock_budget_cycles,
        iterations,
        use_clock_budget
    );
}