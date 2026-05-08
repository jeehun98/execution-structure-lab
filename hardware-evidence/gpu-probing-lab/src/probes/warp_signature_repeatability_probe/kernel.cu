#include <cuda_runtime.h>
#include <cstdint>

__global__
void warp_signature_repeatability_kernel(
    std::uint64_t* out_progress,
    std::uint64_t cycle_budget,
    int warps_per_block,
    int run_id
) {
    const int tid = threadIdx.x;
    const int lane_id = tid & 31;
    const int local_warp_id = tid >> 5;
    const int block_id = blockIdx.x;

    if (local_warp_id >= warps_per_block) {
        return;
    }

    const int global_warp_index = block_id * warps_per_block + local_warp_id;

    std::uint64_t start = clock64();
    std::uint64_t progress = 0;

    std::uint32_t x = 0x12345678u;
    x ^= static_cast<std::uint32_t>(local_warp_id * 0x9e3779b9u);
    x ^= static_cast<std::uint32_t>(lane_id * 0x85ebca6bu);
    x ^= static_cast<std::uint32_t>(run_id * 0xc2b2ae35u);

    const int pattern = local_warp_id & 3;

    while ((clock64() - start) < cycle_budget) {
        if (pattern == 0) {
            x = x * 1664525u + 1013904223u;
            x ^= x >> 13;
            progress += 1;
        }
        else if (pattern == 1) {
            x = x * 1103515245u + 12345u;
            x = x ^ (x << 7);
            x = x + (x >> 3);
            x = x * 2654435761u;
            progress += 1;
        }
        else if (pattern == 2) {
            x ^= x << 13;
            x ^= x >> 17;
            x ^= x << 5;
            x = x * 747796405u + 2891336453u;
            x ^= x >> 16;
            progress += 1;
        }
        else {
            if ((x & 1u) == 0u) {
                x = x * 1664525u + 1013904223u;
                x ^= x >> 11;
            } else {
                x ^= x << 7;
                x += 0x9e3779b9u;
                x ^= x >> 9;
            }
            progress += 1;
        }
    }

    if (lane_id == 0) {
        out_progress[global_warp_index] = progress;
    }

    if (x == 0xFFFFFFFFu && lane_id == 0) {
        out_progress[global_warp_index] += x;
    }
}

extern "C"
cudaError_t launch_warp_signature_repeatability_kernel(
    std::uint64_t* out_progress,
    std::uint64_t cycle_budget,
    int warps_per_block,
    int run_id,
    int blocks,
    int threads_per_block
) {
    warp_signature_repeatability_kernel<<<blocks, threads_per_block>>>(
        out_progress,
        cycle_budget,
        warps_per_block,
        run_id
    );

    return cudaGetLastError();
}