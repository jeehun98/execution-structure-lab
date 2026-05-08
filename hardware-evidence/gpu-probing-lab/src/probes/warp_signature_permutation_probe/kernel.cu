#include <cuda_runtime.h>
#include <cstdint>

__device__ __forceinline__
int resolve_pattern_id(int local_warp_id, int permutation_id) {
    // 기존 repeatability에서는 pattern = local_warp_id & 3 이었음.
    // 여기서는 permutation_id에 따라 pattern assignment를 회전시킴.
    //
    // permutation 0:
    // warp 0,1,2,3 -> A,B,C,D
    //
    // permutation 1:
    // warp 0,1,2,3 -> B,C,D,A
    //
    // permutation 2:
    // warp 0,1,2,3 -> C,D,A,B
    //
    // permutation 3:
    // warp 0,1,2,3 -> D,A,B,C

    return (local_warp_id + permutation_id) & 3;
}

__global__
void warp_signature_permutation_kernel(
    std::uint64_t* out_progress,
    int* out_pattern_id,
    std::uint64_t cycle_budget,
    int warps_per_block,
    int permutation_id,
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
    const int pattern = resolve_pattern_id(local_warp_id, permutation_id);

    std::uint64_t start = clock64();
    std::uint64_t progress = 0;

    std::uint32_t x = 0x12345678u;
    x ^= static_cast<std::uint32_t>(local_warp_id * 0x9e3779b9u);
    x ^= static_cast<std::uint32_t>(lane_id * 0x85ebca6bu);
    x ^= static_cast<std::uint32_t>(run_id * 0xc2b2ae35u);
    x ^= static_cast<std::uint32_t>(permutation_id * 0x27d4eb2du);

    while ((clock64() - start) < cycle_budget) {
        if (pattern == 0) {
            // Pattern A: fast independent ALU-like
            x = x * 1664525u + 1013904223u;
            x ^= x >> 13;
            progress += 1;
        }
        else if (pattern == 1) {
            // Pattern B: dependent ALU chain-like
            x = x * 1103515245u + 12345u;
            x = x ^ (x << 7);
            x = x + (x >> 3);
            x = x * 2654435761u;
            progress += 1;
        }
        else if (pattern == 2) {
            // Pattern C: heavier integer mix
            x ^= x << 13;
            x ^= x >> 17;
            x ^= x << 5;
            x = x * 747796405u + 2891336453u;
            x ^= x >> 16;
            progress += 1;
        }
        else {
            // Pattern D: branch-like divergent path pressure
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
        out_pattern_id[global_warp_index] = pattern;
    }

    if (x == 0xFFFFFFFFu && lane_id == 0) {
        out_progress[global_warp_index] += x;
    }
}

extern "C"
cudaError_t launch_warp_signature_permutation_kernel(
    std::uint64_t* out_progress,
    int* out_pattern_id,
    std::uint64_t cycle_budget,
    int warps_per_block,
    int permutation_id,
    int run_id,
    int blocks,
    int threads_per_block
) {
    warp_signature_permutation_kernel<<<blocks, threads_per_block>>>(
        out_progress,
        out_pattern_id,
        cycle_budget,
        warps_per_block,
        permutation_id,
        run_id
    );

    return cudaGetLastError();
}