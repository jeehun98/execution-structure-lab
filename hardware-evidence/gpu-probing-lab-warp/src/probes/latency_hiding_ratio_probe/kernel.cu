#include <cuda_runtime.h>
#include <cstdint>

enum LatencyHidingRole {
    ROLE_LIGHT_ALU = 0,
    ROLE_GLOBAL_STALL = 1
};

__device__ __forceinline__
int stalled_warp_count_for_scenario(int scenario_id, int warps_per_block) {
    // scenario 0: 0 stalled, 8 ready
    // scenario 1: 1 stalled, 7 ready
    // ...
    // scenario 8: 8 stalled, 0 ready
    if (scenario_id < 0) return 0;
    if (scenario_id > warps_per_block) return warps_per_block;
    return scenario_id;
}

__device__ __forceinline__
int ready_warp_count_for_scenario(int scenario_id, int warps_per_block) {
    return warps_per_block - stalled_warp_count_for_scenario(
        scenario_id,
        warps_per_block
    );
}

__device__ __forceinline__
int resolve_role_id(int local_warp_id, int scenario_id, int warps_per_block) {
    const int stalled_count = stalled_warp_count_for_scenario(
        scenario_id,
        warps_per_block
    );

    const int first_stalled_warp = warps_per_block - stalled_count;

    if (local_warp_id >= first_stalled_warp) {
        return ROLE_GLOBAL_STALL;
    }

    return ROLE_LIGHT_ALU;
}

__device__ __forceinline__
int compute_global_index(
    std::uint32_t x,
    int global_buffer_size,
    int global_warp_index,
    int local_warp_id,
    int lane_id
) {
    const int mask = global_buffer_size - 1;

    // dispersed-like address pattern.
    // latency hiding probe에서는 address mode를 고정해
    // ready/stalled warp ratio 효과만 더 직접적으로 보려는 목적.
    const std::uint32_t base =
        static_cast<std::uint32_t>(
            global_warp_index * 16384u +
            local_warp_id * 4096u +
            lane_id * 257u +
            (x & 4095u)
        );

    return static_cast<int>(base & mask);
}

__global__
void latency_hiding_ratio_kernel(
    std::uint64_t* out_progress,
    int* out_role_id,
    int* out_ready_warp_count,
    int* out_stalled_warp_count,
    std::uint32_t* global_buffer,
    int global_buffer_size,
    std::uint64_t cycle_budget,
    int warps_per_block,
    int scenario_id,
    int run_id
) {
    const int tid = threadIdx.x;
    const int lane_id = tid & 31;
    const int local_warp_id = tid >> 5;
    const int block_id = blockIdx.x;

    if (local_warp_id >= warps_per_block) {
        return;
    }

    const int global_warp_index =
        block_id * warps_per_block + local_warp_id;

    const int role = resolve_role_id(
        local_warp_id,
        scenario_id,
        warps_per_block
    );

    const int stalled_count = stalled_warp_count_for_scenario(
        scenario_id,
        warps_per_block
    );

    const int ready_count = ready_warp_count_for_scenario(
        scenario_id,
        warps_per_block
    );

    std::uint32_t x = 0x12345678u;
    x ^= static_cast<std::uint32_t>(local_warp_id * 0x9e3779b9u);
    x ^= static_cast<std::uint32_t>(lane_id * 0x85ebca6bu);
    x ^= static_cast<std::uint32_t>(scenario_id * 0x27d4eb2du);
    x ^= static_cast<std::uint32_t>(run_id * 0xc2b2ae35u);

    std::uint64_t progress = 0;
    const std::uint64_t start = clock64();

    while ((clock64() - start) < cycle_budget) {
        if (role == ROLE_LIGHT_ALU) {
            // ready warp 역할.
            // dependency가 약한 independent ALU 성격.
            x = x * 1664525u + 1013904223u;
            x ^= x >> 13;
            x += 0x9e3779b9u;
            x ^= x << 5;
            progress += 1;
        }
        else {
            // stalled warp 역할.
            // dependent global load chain.
            int idx0 = compute_global_index(
                x,
                global_buffer_size,
                global_warp_index,
                local_warp_id,
                lane_id
            );

            std::uint32_t v0 = global_buffer[idx0];

            int idx1 = compute_global_index(
                v0 ^ x,
                global_buffer_size,
                global_warp_index,
                local_warp_id,
                lane_id
            );

            std::uint32_t v1 = global_buffer[idx1];

            int idx2 = compute_global_index(
                v1 + v0 + x,
                global_buffer_size,
                global_warp_index,
                local_warp_id,
                lane_id
            );

            std::uint32_t v2 = global_buffer[idx2];

            int idx3 = compute_global_index(
                v2 ^ v1 ^ x,
                global_buffer_size,
                global_warp_index,
                local_warp_id,
                lane_id
            );

            std::uint32_t v3 = global_buffer[idx3];

            x ^= v0 + 0x7f4a7c15u;
            x = (x << 5) ^ (x >> 3) ^ v1;
            x += v2 ^ 0x9e3779b9u;
            x ^= v3 + 0x85ebca6bu;

            progress += 1;
        }
    }

    if (lane_id == 0) {
        out_progress[global_warp_index] = progress;
        out_role_id[global_warp_index] = role;
        out_ready_warp_count[global_warp_index] = ready_count;
        out_stalled_warp_count[global_warp_index] = stalled_count;
    }

    if (x == 0xFFFFFFFFu && lane_id == 0) {
        out_progress[global_warp_index] += x;
    }
}

__global__
void initialize_latency_hiding_global_buffer(
    std::uint32_t* global_buffer,
    int global_buffer_size
) {
    const int idx = blockIdx.x * blockDim.x + threadIdx.x;

    if (idx >= global_buffer_size) {
        return;
    }

    std::uint32_t x = static_cast<std::uint32_t>(idx);
    x = x * 1664525u + 1013904223u;
    x ^= x >> 16;
    x *= 2246822519u;
    x ^= x >> 13;
    x *= 3266489917u;
    x ^= x >> 16;

    global_buffer[idx] = x;
}

extern "C"
cudaError_t launch_initialize_latency_hiding_global_buffer(
    std::uint32_t* global_buffer,
    int global_buffer_size
) {
    const int threads = 256;
    const int blocks = (global_buffer_size + threads - 1) / threads;

    initialize_latency_hiding_global_buffer<<<blocks, threads>>>(
        global_buffer,
        global_buffer_size
    );

    return cudaGetLastError();
}

extern "C"
cudaError_t launch_latency_hiding_ratio_kernel(
    std::uint64_t* out_progress,
    int* out_role_id,
    int* out_ready_warp_count,
    int* out_stalled_warp_count,
    std::uint32_t* global_buffer,
    int global_buffer_size,
    std::uint64_t cycle_budget,
    int warps_per_block,
    int scenario_id,
    int run_id,
    int blocks,
    int threads_per_block
) {
    latency_hiding_ratio_kernel<<<blocks, threads_per_block>>>(
        out_progress,
        out_role_id,
        out_ready_warp_count,
        out_stalled_warp_count,
        global_buffer,
        global_buffer_size,
        cycle_budget,
        warps_per_block,
        scenario_id,
        run_id
    );

    return cudaGetLastError();
}