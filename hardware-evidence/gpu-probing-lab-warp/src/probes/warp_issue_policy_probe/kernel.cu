#include <cuda_runtime.h>

#include <cstddef>
#include <cstdint>

namespace probe::warp_issue_policy {

enum Role : int {
    ROLE_INDEPENDENT_ALU = 0,
    ROLE_DEPENDENT_ALU   = 1,
    ROLE_SHARED_LOAD     = 2,
    ROLE_GLOBAL_LOAD     = 3
};

__device__ __forceinline__
int role_for_warp(int mode, int warp_id) {
    if (mode == 0) {
        return ROLE_INDEPENDENT_ALU;
    }

    if (mode == 1) {
        return warp_id == 0 ? ROLE_DEPENDENT_ALU : ROLE_INDEPENDENT_ALU;
    }

    if (mode == 2) {
        return warp_id == 0 ? ROLE_SHARED_LOAD : ROLE_INDEPENDENT_ALU;
    }

    if (mode == 3) {
        return warp_id == 0 ? ROLE_GLOBAL_LOAD : ROLE_INDEPENDENT_ALU;
    }

    if (mode == 4) {
        if (warp_id == 0) return ROLE_DEPENDENT_ALU;
        if (warp_id == 1) return ROLE_INDEPENDENT_ALU;
        if (warp_id == 2) return ROLE_SHARED_LOAD;
        return ROLE_GLOBAL_LOAD;
    }

    return ROLE_INDEPENDENT_ALU;
}

__device__ __forceinline__
uint32_t do_independent_alu(uint32_t x, int lane) {
    uint32_t a0 = x + static_cast<uint32_t>(lane + 1);
    uint32_t a1 = x + static_cast<uint32_t>(lane + 3);
    uint32_t a2 = x + static_cast<uint32_t>(lane + 5);
    uint32_t a3 = x + static_cast<uint32_t>(lane + 7);

#pragma unroll 64
    for (int i = 0; i < 64; ++i) {
        a0 += 1;
        a1 += 3;
        a2 += 5;
        a3 += 7;
    }

    return a0 ^ a1 ^ a2 ^ a3;
}

__device__ __forceinline__
uint32_t do_dependent_alu(uint32_t x) {
#pragma unroll 64
    for (int i = 0; i < 64; ++i) {
        x = x * 1664525u + 1013904223u;
    }

    return x;
}

__device__ __forceinline__
uint32_t do_shared_load(uint32_t x, volatile uint32_t* smem, int lane) {
#pragma unroll 64
    for (int i = 0; i < 64; ++i) {
        int idx = (lane + i) & 31;
        x += smem[idx];
    }

    return x;
}

__device__ __forceinline__
uint32_t do_global_load(
    uint32_t x,
    const uint32_t* __restrict__ gmem,
    size_t global_elements,
    uint64_t iter,
    int lane,
    int block_id
) {
#pragma unroll 8
    for (int i = 0; i < 8; ++i) {
        size_t idx =
            ((iter * 4096ULL) +
             (static_cast<uint64_t>(i) * 131071ULL) +
             static_cast<uint64_t>(lane) +
             static_cast<uint64_t>(block_id) * 8192ULL) %
            global_elements;

        x += gmem[idx];
    }

    return x;
}

__global__
void warp_issue_policy_kernel(
    int mode,
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

    smem[tid] = static_cast<uint32_t>(tid + 1);
    __syncthreads();

    const int role = role_for_warp(mode, warp_id);

    uint32_t x =
        static_cast<uint32_t>((block_id + 1) * 1009 + warp_id * 97 + lane + 1);

    uint64_t iter = 0;
    const uint64_t start = clock64();
    uint64_t now = start;

    while ((now - start) < cycle_budget) {
        if (role == ROLE_INDEPENDENT_ALU) {
            x = do_independent_alu(x, lane);
        } else if (role == ROLE_DEPENDENT_ALU) {
            x = do_dependent_alu(x);
        } else if (role == ROLE_SHARED_LOAD) {
            x = do_shared_load(x, smem, lane);
        } else {
            x = do_global_load(
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

} // namespace probe::warp_issue_policy

extern "C"
void launch_warp_issue_policy_kernel(
    int blocks,
    int mode,
    uint64_t cycle_budget,
    int sample_period,
    const uint32_t* gmem,
    size_t global_elements,
    uint64_t* progress,
    uint64_t* last_clock,
    uint32_t* sinks
) {
    constexpr int threads_per_block = 128;

    probe::warp_issue_policy::warp_issue_policy_kernel<<<blocks, threads_per_block>>>(
        mode,
        cycle_budget,
        sample_period,
        gmem,
        global_elements,
        progress,
        last_clock,
        sinks
    );
}