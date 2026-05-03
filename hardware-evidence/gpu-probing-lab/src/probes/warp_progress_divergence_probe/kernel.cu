#include <cuda_runtime.h>

#include <cstddef>
#include <cstdint>

namespace probe::warp_progress_divergence {

enum Role : int {
    ROLE_FAST_INDEPENDENT_ALU = 0,
    ROLE_DEPENDENT_ALU_CHAIN  = 1,
    ROLE_SHARED_LOAD          = 2,
    ROLE_DEPENDENT_GLOBAL_LOAD = 3
};

__device__ __forceinline__
int role_for_warp(int warp_id) {
    if (warp_id == 0) {
        return ROLE_FAST_INDEPENDENT_ALU;
    }

    if (warp_id == 1) {
        return ROLE_DEPENDENT_ALU_CHAIN;
    }

    if (warp_id == 2) {
        return ROLE_SHARED_LOAD;
    }

    return ROLE_DEPENDENT_GLOBAL_LOAD;
}

__device__ __forceinline__
uint32_t mix_u32(uint32_t x) {
    x ^= x >> 16;
    x *= 0x7feb352du;
    x ^= x >> 15;
    x *= 0x846ca68bu;
    x ^= x >> 16;
    return x;
}

__device__ __forceinline__
uint32_t do_fast_independent_alu(uint32_t x, int lane) {
    uint32_t a0 = x + static_cast<uint32_t>(lane + 1);
    uint32_t a1 = x + static_cast<uint32_t>(lane + 3);
    uint32_t a2 = x + static_cast<uint32_t>(lane + 5);
    uint32_t a3 = x + static_cast<uint32_t>(lane + 7);

#pragma unroll 32
    for (int i = 0; i < 32; ++i) {
        a0 += 1;
        a1 += 3;
        a2 += 5;
        a3 += 7;
    }

    return a0 ^ a1 ^ a2 ^ a3;
}

__device__ __forceinline__
uint32_t do_dependent_alu_chain(uint32_t x) {
#pragma unroll 128
    for (int i = 0; i < 128; ++i) {
        x = x * 1664525u + 1013904223u;
        x ^= x >> 13;
    }

    return x;
}

__device__ __forceinline__
uint32_t do_shared_load(
    uint32_t x,
    volatile uint32_t* smem,
    int lane,
    uint64_t iter
) {
#pragma unroll 128
    for (int i = 0; i < 128; ++i) {
        int idx =
            static_cast<int>(
                (static_cast<uint64_t>(lane) * 17ULL +
                 static_cast<uint64_t>(i) * 31ULL +
                 iter) &
                127ULL
            );

        x += smem[idx];
        x = (x << 5) | (x >> 27);
    }

    return x;
}

__device__ __forceinline__
uint32_t do_dependent_global_load(
    uint32_t x,
    const uint32_t* __restrict__ gmem,
    size_t global_elements,
    uint64_t iter,
    int lane,
    int block_id
) {
    size_t idx =
        static_cast<size_t>(
            mix_u32(
                static_cast<uint32_t>(
                    iter ^
                    (static_cast<uint64_t>(lane) * 0x9e3779b9ULL) ^
                    (static_cast<uint64_t>(block_id) * 0x85ebca6bULL)
                )
            )
        ) % global_elements;

#pragma unroll 16
    for (int i = 0; i < 16; ++i) {
        uint32_t v = gmem[idx];

        x ^= v;
        x = mix_u32(x);

        idx =
            static_cast<size_t>(
                static_cast<uint64_t>(v) +
                static_cast<uint64_t>(x) +
                static_cast<uint64_t>(lane + 1) * 131071ULL +
                static_cast<uint64_t>(i + 1) * 8191ULL
            ) % global_elements;
    }

    return x;
}

__global__
void warp_progress_divergence_kernel(
    uint64_t cycle_budget,
    int sample_period,
    const uint32_t* __restrict__ gmem,
    size_t global_elements,
    uint64_t* progress,
    uint64_t* last_clock,
    uint32_t* sinks
) {
    __shared__ uint32_t smem[128];

    const int tid = threadIdx.x;
    const int lane = tid & 31;
    const int warp_id = tid >> 5;
    const int block_id = blockIdx.x;

    smem[tid] =
        mix_u32(
            static_cast<uint32_t>(
                (block_id + 1) * 1009 +
                (tid + 1) * 9176
            )
        );

    __syncthreads();

    const int role = role_for_warp(warp_id);

    uint32_t x =
        static_cast<uint32_t>(
            (block_id + 1) * 1009 +
            (warp_id + 1) * 97 +
            lane +
            1
        );

    uint64_t iter = 0;

    const uint64_t start = clock64();
    uint64_t now = start;

    while ((now - start) < cycle_budget) {
        if (role == ROLE_FAST_INDEPENDENT_ALU) {
            x = do_fast_independent_alu(x, lane);
        } else if (role == ROLE_DEPENDENT_ALU_CHAIN) {
            x = do_dependent_alu_chain(x);
        } else if (role == ROLE_SHARED_LOAD) {
            x = do_shared_load(x, smem, lane, iter);
        } else {
            x = do_dependent_global_load(
                x,
                gmem,
                global_elements,
                iter,
                lane,
                block_id
            );
        }

        ++iter;

        if ((iter % static_cast<uint64_t>(sample_period)) == 0 && lane == 0) {
            const int out_idx = block_id * 4 + warp_id;

            progress[out_idx] = iter;
            last_clock[out_idx] = clock64();
        }

        now = clock64();
    }

    if (lane == 0) {
        const int out_idx = block_id * 4 + warp_id;

        progress[out_idx] = iter;
        last_clock[out_idx] = now;
        sinks[out_idx] = x;
    }
}

} // namespace probe::warp_progress_divergence

extern "C"
void launch_warp_progress_divergence_kernel(
    int blocks,
    uint64_t cycle_budget,
    int sample_period,
    const uint32_t* gmem,
    size_t global_elements,
    uint64_t* progress,
    uint64_t* last_clock,
    uint32_t* sinks
) {
    constexpr int threads_per_block = 128;

    probe::warp_progress_divergence::warp_progress_divergence_kernel
        <<<blocks, threads_per_block>>>(
            cycle_budget,
            sample_period,
            gmem,
            global_elements,
            progress,
            last_clock,
            sinks
        );
}