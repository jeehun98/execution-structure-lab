#include <cuda_runtime.h>

#include <cstddef>
#include <cstdint>

namespace probe::global_latency_hiding {

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
uint32_t do_global_latency_work(
    uint32_t x,
    const uint32_t* __restrict__ gmem,
    size_t global_elements,
    uint64_t iter,
    int lane,
    int warp_id,
    int block_id
) {
    size_t idx =
        (static_cast<size_t>(mix_u32(
            static_cast<uint32_t>(
                iter ^
                (static_cast<uint64_t>(lane) * 0x9e3779b9ULL) ^
                (static_cast<uint64_t>(warp_id) * 0x85ebca6bULL) ^
                (static_cast<uint64_t>(block_id) * 0xc2b2ae35ULL)
            )
        ))) % global_elements;

#pragma unroll 16
    for (int i = 0; i < 16; ++i) {
        uint32_t v = gmem[idx];

        x ^= v + static_cast<uint32_t>(i * 17 + lane);
        x = mix_u32(x);

        idx =
            (idx +
             static_cast<size_t>(v) +
             static_cast<size_t>(lane + 1) * 131071ULL +
             static_cast<size_t>(warp_id + 1) * 8191ULL) %
            global_elements;
    }

    return x;
}

__global__
void global_latency_hiding_kernel(
    int active_warps,
    uint64_t cycle_budget,
    int sample_period,
    const uint32_t* __restrict__ gmem,
    size_t global_elements,
    uint64_t* progress,
    uint64_t* last_clock,
    uint32_t* sinks
) {
    const int tid = threadIdx.x;
    const int lane = tid & 31;
    const int warp_id = tid >> 5;
    const int block_id = blockIdx.x;

    if (warp_id >= active_warps) {
        return;
    }

    uint32_t x =
        static_cast<uint32_t>(
            (block_id + 1) * 1009 +
            (warp_id + 1) * 9176 +
            lane * 37 +
            1
        );

    uint64_t iter = 0;

    const uint64_t start = clock64();
    uint64_t now = start;

    while ((now - start) < cycle_budget) {
        x = do_global_latency_work(
            x,
            gmem,
            global_elements,
            iter,
            lane,
            warp_id,
            block_id
        );

        ++iter;

        if ((iter % static_cast<uint64_t>(sample_period)) == 0 && lane == 0) {
            const int out_idx = block_id * active_warps + warp_id;

            progress[out_idx] = iter;
            last_clock[out_idx] = clock64();
        }

        now = clock64();
    }

    if (lane == 0) {
        const int out_idx = block_id * active_warps + warp_id;

        progress[out_idx] = iter;
        last_clock[out_idx] = now;
        sinks[out_idx] = x;
    }
}

} // namespace probe::global_latency_hiding

extern "C"
void launch_global_latency_hiding_kernel(
    int blocks,
    int active_warps,
    uint64_t cycle_budget,
    int sample_period,
    const uint32_t* gmem,
    size_t global_elements,
    uint64_t* progress,
    uint64_t* last_clock,
    uint32_t* sinks
) {
    const int threads_per_block = active_warps * 32;

    probe::global_latency_hiding::global_latency_hiding_kernel
        <<<blocks, threads_per_block>>>(
            active_warps,
            cycle_budget,
            sample_period,
            gmem,
            global_elements,
            progress,
            last_clock,
            sinks
        );
}