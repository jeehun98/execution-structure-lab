#include <cuda_runtime.h>
#include <cstdint>

enum MixedWorkloadRole {
    ROLE_LIGHT_ALU = 0,
    ROLE_DEPENDENT_ALU = 1,
    ROLE_SHARED_LOAD = 2,
    ROLE_GLOBAL_CHAIN = 3
};

__device__ __forceinline__
int resolve_role_id(int local_warp_id, int scenario_id, int warps_per_block) {
    const int half = warps_per_block / 2;

    // scenario 0:
    // all light ALU baseline
    if (scenario_id == 0) {
        return ROLE_LIGHT_ALU;
    }

    // scenario 1:
    // light ALU + dependent ALU
    if (scenario_id == 1) {
        return local_warp_id < half ? ROLE_LIGHT_ALU : ROLE_DEPENDENT_ALU;
    }

    // scenario 2:
    // light ALU + shared memory load
    if (scenario_id == 2) {
        return local_warp_id < half ? ROLE_LIGHT_ALU : ROLE_SHARED_LOAD;
    }

    // scenario 3:
    // light ALU + dependent global load
    if (scenario_id == 3) {
        return local_warp_id < half ? ROLE_LIGHT_ALU : ROLE_GLOBAL_CHAIN;
    }

    // scenario 4:
    // all mixed roles
    return local_warp_id & 3;
}

__global__
void mixed_workload_kernel(
    std::uint64_t* out_progress,
    int* out_role_id,
    std::uint32_t* global_buffer,
    int global_buffer_size,
    std::uint64_t cycle_budget,
    int warps_per_block,
    int scenario_id,
    int run_id
) {
    extern __shared__ std::uint32_t shared_data[];

    const int tid = threadIdx.x;
    const int lane_id = tid & 31;
    const int local_warp_id = tid >> 5;
    const int block_id = blockIdx.x;

    if (local_warp_id >= warps_per_block) {
        return;
    }

    const int global_warp_index = block_id * warps_per_block + local_warp_id;
    const int role = resolve_role_id(local_warp_id, scenario_id, warps_per_block);

    // shared memory 초기화
    for (int i = tid; i < 1024; i += blockDim.x) {
        shared_data[i] =
            static_cast<std::uint32_t>(i * 1664525u + 1013904223u);
    }

    __syncthreads();

    std::uint32_t x = 0x12345678u;
    x ^= static_cast<std::uint32_t>(local_warp_id * 0x9e3779b9u);
    x ^= static_cast<std::uint32_t>(lane_id * 0x85ebca6bu);
    x ^= static_cast<std::uint32_t>(scenario_id * 0x27d4eb2du);
    x ^= static_cast<std::uint32_t>(run_id * 0xc2b2ae35u);

    std::uint64_t progress = 0;
    const std::uint64_t start = clock64();

    while ((clock64() - start) < cycle_budget) {
        if (role == ROLE_LIGHT_ALU) {
            // 가벼운 independent ALU workload
            x = x * 1664525u + 1013904223u;
            x ^= x >> 13;
            progress += 1;
        }
        else if (role == ROLE_DEPENDENT_ALU) {
            // dependency chain이 강한 ALU workload
            x = x * 1103515245u + 12345u;
            x ^= x << 7;
            x += x >> 3;
            x = x * 2654435761u;
            x ^= x >> 11;
            progress += 1;
        }
        else if (role == ROLE_SHARED_LOAD) {
            // shared memory dependent load workload
            const int idx0 = static_cast<int>((x + lane_id * 17u) & 1023u);
            const std::uint32_t v0 = shared_data[idx0];

            const int idx1 = static_cast<int>((v0 ^ x) & 1023u);
            const std::uint32_t v1 = shared_data[idx1];

            x ^= v0 + 0x9e3779b9u;
            x += v1 ^ (x >> 5);
            progress += 1;
        }
        else {
            // dependent global memory chain workload
            const int mask = global_buffer_size - 1;

            int idx = static_cast<int>((x + global_warp_index * 4096u + lane_id * 131u) & mask);
            std::uint32_t v = global_buffer[idx];

            idx = static_cast<int>((v ^ x ^ (lane_id * 2654435761u)) & mask);
            v = global_buffer[idx];

            x ^= v + 0x7f4a7c15u;
            x = (x << 5) ^ (x >> 3) ^ v;
            progress += 1;
        }
    }

    if (lane_id == 0) {
        out_progress[global_warp_index] = progress;
        out_role_id[global_warp_index] = role;
    }

    // dead-code elimination 방지
    if (x == 0xFFFFFFFFu && lane_id == 0) {
        out_progress[global_warp_index] += x;
    }
}

__global__
void initialize_mixed_workload_global_buffer(
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

    global_buffer[idx] = x;
}

extern "C"
cudaError_t launch_initialize_mixed_workload_global_buffer(
    std::uint32_t* global_buffer,
    int global_buffer_size
) {
    const int threads = 256;
    const int blocks = (global_buffer_size + threads - 1) / threads;

    initialize_mixed_workload_global_buffer<<<blocks, threads>>>(
        global_buffer,
        global_buffer_size
    );

    return cudaGetLastError();
}

extern "C"
cudaError_t launch_mixed_workload_kernel(
    std::uint64_t* out_progress,
    int* out_role_id,
    std::uint32_t* global_buffer,
    int global_buffer_size,
    std::uint64_t cycle_budget,
    int warps_per_block,
    int scenario_id,
    int run_id,
    int blocks,
    int threads_per_block
) {
    const std::size_t shared_bytes = sizeof(std::uint32_t) * 1024;

    mixed_workload_kernel<<<blocks, threads_per_block, shared_bytes>>>(
        out_progress,
        out_role_id,
        global_buffer,
        global_buffer_size,
        cycle_budget,
        warps_per_block,
        scenario_id,
        run_id
    );

    return cudaGetLastError();
}