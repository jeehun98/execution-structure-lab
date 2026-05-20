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

template <int IDX>
__device__ __forceinline__ void fma_at_index(
    float& a0,
    float& a1,
    float& a2,
    float& a3,
    float& a4,
    float& a5,
    float& a6,
    float& a7,
    float& a8,
    float& a9,
    float& a10,
    float& a11,
    float& a12,
    float& a13,
    float& a14,
    float& a15,
    float m,
    float b
) {
    if constexpr (IDX == 0) {
        fma_step(a0, m, b);
    } else if constexpr (IDX == 1) {
        fma_step(a1, m, b);
    } else if constexpr (IDX == 2) {
        fma_step(a2, m, b);
    } else if constexpr (IDX == 3) {
        fma_step(a3, m, b);
    } else if constexpr (IDX == 4) {
        fma_step(a4, m, b);
    } else if constexpr (IDX == 5) {
        fma_step(a5, m, b);
    } else if constexpr (IDX == 6) {
        fma_step(a6, m, b);
    } else if constexpr (IDX == 7) {
        fma_step(a7, m, b);
    } else if constexpr (IDX == 8) {
        fma_step(a8, m, b);
    } else if constexpr (IDX == 9) {
        fma_step(a9, m, b);
    } else if constexpr (IDX == 10) {
        fma_step(a10, m, b);
    } else if constexpr (IDX == 11) {
        fma_step(a11, m, b);
    } else if constexpr (IDX == 12) {
        fma_step(a12, m, b);
    } else if constexpr (IDX == 13) {
        fma_step(a13, m, b);
    } else if constexpr (IDX == 14) {
        fma_step(a14, m, b);
    } else if constexpr (IDX == 15) {
        fma_step(a15, m, b);
    }
}

template <int I, int N, int ACC>
struct FmaRoundRobin {
    __device__ __forceinline__ static void run(
        float& a0,
        float& a1,
        float& a2,
        float& a3,
        float& a4,
        float& a5,
        float& a6,
        float& a7,
        float& a8,
        float& a9,
        float& a10,
        float& a11,
        float& a12,
        float& a13,
        float& a14,
        float& a15,
        float m,
        float b
    ) {
        constexpr int idx = I % ACC;

        fma_at_index<idx>(
            a0, a1, a2, a3,
            a4, a5, a6, a7,
            a8, a9, a10, a11,
            a12, a13, a14, a15,
            m, b
        );

        FmaRoundRobin<I + 1, N, ACC>::run(
            a0, a1, a2, a3,
            a4, a5, a6, a7,
            a8, a9, a10, a11,
            a12, a13, a14, a15,
            m, b
        );
    }
};

template <int N, int ACC>
struct FmaRoundRobin<N, N, ACC> {
    __device__ __forceinline__ static void run(
        float&,
        float&,
        float&,
        float&,
        float&,
        float&,
        float&,
        float&,
        float&,
        float&,
        float&,
        float&,
        float&,
        float&,
        float&,
        float&,
        float,
        float
    ) {}
};

template <int N, int ACC>
__device__ __forceinline__ void run_fma_rr(
    float& a0,
    float& a1,
    float& a2,
    float& a3,
    float& a4,
    float& a5,
    float& a6,
    float& a7,
    float& a8,
    float& a9,
    float& a10,
    float& a11,
    float& a12,
    float& a13,
    float& a14,
    float& a15,
    float m,
    float b
) {
    FmaRoundRobin<0, N, ACC>::run(
        a0, a1, a2, a3,
        a4, a5, a6, a7,
        a8, a9, a10, a11,
        a12, a13, a14, a15,
        m, b
    );
}

template <int N>
__device__ __forceinline__ void dispatch_acc_role(
    int role_id,
    float& a0,
    float& a1,
    float& a2,
    float& a3,
    float& a4,
    float& a5,
    float& a6,
    float& a7,
    float& a8,
    float& a9,
    float& a10,
    float& a11,
    float& a12,
    float& a13,
    float& a14,
    float& a15,
    float m,
    float b
) {
    if (role_id == 0) {
        run_fma_rr<N, 1>(
            a0, a1, a2, a3,
            a4, a5, a6, a7,
            a8, a9, a10, a11,
            a12, a13, a14, a15,
            m, b
        );
    } else if (role_id == 1) {
        run_fma_rr<N, 2>(
            a0, a1, a2, a3,
            a4, a5, a6, a7,
            a8, a9, a10, a11,
            a12, a13, a14, a15,
            m, b
        );
    } else if (role_id == 2) {
        run_fma_rr<N, 3>(
            a0, a1, a2, a3,
            a4, a5, a6, a7,
            a8, a9, a10, a11,
            a12, a13, a14, a15,
            m, b
        );
    } else if (role_id == 3) {
        run_fma_rr<N, 4>(
            a0, a1, a2, a3,
            a4, a5, a6, a7,
            a8, a9, a10, a11,
            a12, a13, a14, a15,
            m, b
        );
    } else if (role_id == 4) {
        run_fma_rr<N, 5>(
            a0, a1, a2, a3,
            a4, a5, a6, a7,
            a8, a9, a10, a11,
            a12, a13, a14, a15,
            m, b
        );
    } else if (role_id == 5) {
        run_fma_rr<N, 7>(
            a0, a1, a2, a3,
            a4, a5, a6, a7,
            a8, a9, a10, a11,
            a12, a13, a14, a15,
            m, b
        );
    } else if (role_id == 6) {
        if constexpr (N < 8) {
            run_fma_rr<N, N>(
                a0, a1, a2, a3,
                a4, a5, a6, a7,
                a8, a9, a10, a11,
                a12, a13, a14, a15,
                m, b
            );
        } else {
            run_fma_rr<N, 8>(
                a0, a1, a2, a3,
                a4, a5, a6, a7,
                a8, a9, a10, a11,
                a12, a13, a14, a15,
                m, b
            );
        }
    } else {
        if constexpr (N < 16) {
            run_fma_rr<N, N>(
                a0, a1, a2, a3,
                a4, a5, a6, a7,
                a8, a9, a10, a11,
                a12, a13, a14, a15,
                m, b
            );
        } else {
            run_fma_rr<N, 16>(
                a0, a1, a2, a3,
                a4, a5, a6, a7,
                a8, a9, a10, a11,
                a12, a13, a14, a15,
                m, b
            );
        }
    }
}

__device__ __forceinline__ void dispatch_chain_length(
    int chain_length,
    int role_id,
    float& a0,
    float& a1,
    float& a2,
    float& a3,
    float& a4,
    float& a5,
    float& a6,
    float& a7,
    float& a8,
    float& a9,
    float& a10,
    float& a11,
    float& a12,
    float& a13,
    float& a14,
    float& a15,
    float m,
    float b
) {
    if (chain_length == 7) {
        dispatch_acc_role<7>(
            role_id,
            a0, a1, a2, a3,
            a4, a5, a6, a7,
            a8, a9, a10, a11,
            a12, a13, a14, a15,
            m, b
        );
    } else if (chain_length == 13) {
        dispatch_acc_role<13>(
            role_id,
            a0, a1, a2, a3,
            a4, a5, a6, a7,
            a8, a9, a10, a11,
            a12, a13, a14, a15,
            m, b
        );
    } else {
        dispatch_acc_role<29>(
            role_id,
            a0, a1, a2, a3,
            a4, a5, a6, a7,
            a8, a9, a10, a11,
            a12, a13, a14, a15,
            m, b
        );
    }
}

__device__ __forceinline__ int target_acc_from_role(int role_id) {
    if (role_id == 0) {
        return 1;
    } else if (role_id == 1) {
        return 2;
    } else if (role_id == 2) {
        return 3;
    } else if (role_id == 3) {
        return 4;
    } else if (role_id == 4) {
        return 5;
    } else if (role_id == 5) {
        return 7;
    } else if (role_id == 6) {
        return 8;
    } else {
        return 16;
    }
}

__device__ __forceinline__ float sink_for_active_accumulators(
    int active,
    float a0,
    float a1,
    float a2,
    float a3,
    float a4,
    float a5,
    float a6,
    float a7,
    float a8,
    float a9,
    float a10,
    float a11,
    float a12,
    float a13,
    float a14,
    float a15
) {
    float s = a0;

    if (active >= 2) {
        s += a1;
    }
    if (active >= 3) {
        s += a2;
    }
    if (active >= 4) {
        s += a3;
    }
    if (active >= 5) {
        s += a4;
    }
    if (active >= 6) {
        s += a5;
    }
    if (active >= 7) {
        s += a6;
    }
    if (active >= 8) {
        s += a7;
    }
    if (active >= 9) {
        s += a8;
    }
    if (active >= 10) {
        s += a9;
    }
    if (active >= 11) {
        s += a10;
    }
    if (active >= 12) {
        s += a11;
    }
    if (active >= 13) {
        s += a12;
    }
    if (active >= 14) {
        s += a13;
    }
    if (active >= 15) {
        s += a14;
    }
    if (active >= 16) {
        s += a15;
    }

    return s;
}

__global__ void optimal_accumulator_count_kernel(
    DeviceArithmeticProbeRecord* out_records,
    int chain_length,
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

    float a0  = make_seed(lane, warp_id, 0.000f);
    float a1  = make_seed(lane, warp_id, 0.125f);
    float a2  = make_seed(lane, warp_id, 0.250f);
    float a3  = make_seed(lane, warp_id, 0.375f);

    float a4  = make_seed(lane, warp_id, 0.500f);
    float a5  = make_seed(lane, warp_id, 0.625f);
    float a6  = make_seed(lane, warp_id, 0.750f);
    float a7  = make_seed(lane, warp_id, 0.875f);

    float a8  = make_seed(lane, warp_id, 1.000f);
    float a9  = make_seed(lane, warp_id, 1.125f);
    float a10 = make_seed(lane, warp_id, 1.250f);
    float a11 = make_seed(lane, warp_id, 1.375f);

    float a12 = make_seed(lane, warp_id, 1.500f);
    float a13 = make_seed(lane, warp_id, 1.625f);
    float a14 = make_seed(lane, warp_id, 1.750f);
    float a15 = make_seed(lane, warp_id, 1.875f);

    float m = 1.000001f;
    float b = 0.000013f;

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

            dispatch_chain_length(
                chain_length,
                role_id,
                a0, a1, a2, a3,
                a4, a5, a6, a7,
                a8, a9, a10, a11,
                a12, a13, a14, a15,
                m, b
            );

            progress++;
        }
    } else {
        for (unsigned long long i = 0; i < iterations; ++i) {
            dispatch_chain_length(
                chain_length,
                role_id,
                a0, a1, a2, a3,
                a4, a5, a6, a7,
                a8, a9, a10, a11,
                a12, a13, a14, a15,
                m, b
            );

            progress++;
        }

        last_clock = clock64() - start;
    }

    const int target_acc = target_acc_from_role(role_id);
    const int active_acc = target_acc < chain_length ? target_acc : chain_length;

    float sink = sink_for_active_accumulators(
        active_acc,
        a0, a1, a2, a3,
        a4, a5, a6, a7,
        a8, a9, a10, a11,
        a12, a13, a14, a15
    );

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

void launch_optimal_accumulator_count_kernel(
    DeviceArithmeticProbeRecord* out_records,
    int blocks,
    int threads_per_block,
    int chain_length,
    unsigned long long clock_budget_cycles,
    unsigned long long iterations,
    int use_clock_budget
) {
    optimal_accumulator_count_kernel<<<blocks, threads_per_block>>>(
        out_records,
        chain_length,
        clock_budget_cycles,
        iterations,
        use_clock_budget
    );
}