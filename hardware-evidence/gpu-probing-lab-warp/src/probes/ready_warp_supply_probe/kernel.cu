#include <cuda_runtime.h>
#include <cstdint>

enum ReadyWarpSupplyRole {
    ROLE_LIGHT_ALU_READY = 0,
    ROLE_DEPENDENT_ALU_READY = 1,
    ROLE_SHARED_LOAD_READY = 2,
    ROLE_DEPENDENT_GLOBAL_STALLED = 3
};

__device__ __forceinline__
int resolve_role_id(
    int local_warp_id,
    int condition_id,
    int ready_warp_count,
    int warps_per_block
) {
    // condition 4: all global stalled baseline
    if (condition_id == 4) {
        return ROLE_DEPENDENT_GLOBAL_STALLED;
    }

    if (local_warp_id >= ready_warp_count) {
        return ROLE_DEPENDENT_GLOBAL_STALLED;
    }

    if (condition_id == 0) {
        return ROLE_LIGHT_ALU_READY;
    }

    if (condition_id == 1) {
        return ROLE_DEPENDENT_ALU_READY;
    }

    if (condition_id == 2) {
        return ROLE_SHARED_LOAD_READY;
    }

    // condition 3: mixed ready sources
    // ready warp 0 -> light ALU
    // ready warp 1 -> dependent ALU
    // ready warp 2 -> shared load
    // ready warp 3 -> light ALU
    const int mod = local_warp_id & 3;

    if (mod == 0) {
        return ROLE_LIGHT_ALU_READY;
    }

    if (mod == 1) {
        return ROLE_DEPENDENT_ALU_READY;
    }

    if (mod == 2) {
        return ROLE_SHARED_LOAD_READY;
    }

    return ROLE_LIGHT_ALU_READY;
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
void ready_warp_supply_kernel(
    std::uint64_t* out_progress,
    int* out_role_id,
    std::uint32_t* global_buffer,
    int global_buffer_size,
    std::uint64_t cycle_budget,
    int warps_per_block,
    int ready_warp_count,
    int condition_id,
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

    for (int i = tid; i < 1024; i += blockDim.x) {
        shared_data[i] =
            static_cast<std::uint32_t>(i * 1664525u + 1013904223u);
    }

    __syncthreads();

    const int global_warp_index =
        block_id * warps_per_block + local_warp_id;

    const int role = resolve_role_id(
        local_warp_id,
        condition_id,
        ready_warp_count,
        warps_per_block
    );

    std::uint32_t x = 0x12345678u;
    x ^= static_cast<std::uint32_t>(local_warp_id * 0x9e3779b9u);
    x ^= static_cast<std::uint32_t>(lane_id * 0x85ebca6bu);
    x ^= static_cast<std::uint32_t>(condition_id * 0x27d4eb2du);
    x ^= static_cast<std::uint32_t>(run_id * 0xc2b2ae35u);

    std::uint64_t progress = 0;
    const std::uint64_t start = clock64();

    while ((clock64() - start) < cycle_budget) {
        if (role == ROLE_LIGHT_ALU_READY) {
            x = x * 1664525u + 1013904223u;
            x ^= x >> 13;
            x += 0x9e3779b9u;
            x ^= x << 5;

            progress += 1;
        }
        else if (role == ROLE_DEPENDENT_ALU_READY) {
            x = x * 1103515245u + 12345u;
            x ^= x << 7;
            x += x >> 3;
            x = x * 2654435761u;
            x ^= x >> 11;
            x += 0x7f4a7c15u;

            progress += 1;
        }
        else if (role == ROLE_SHARED_LOAD_READY) {
            const int idx0 = static_cast<int>((x + lane_id * 17u) & 1023u);
            const std::uint32_t v0 = shared_data[idx0];

            const int idx1 = static_cast<int>((v0 ^ x) & 1023u);
            const std::uint32_t v1 = shared_data[idx1];

            const int idx2 = static_cast<int>((v1 + x + lane_id) & 1023u);
            const std::uint32_t v2 = shared_data[idx2];

            x ^= v0 + 0x9e3779b9u;
            x += v1 ^ (x >> 5);
            x ^= v2 + (x << 3);

            progress += 1;
        }
        else {
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
    }

    if (x == 0xFFFFFFFFu && lane_id == 0) {
        out_progress[global_warp_index] += x;
    }
}

__global__
void initialize_ready_warp_supply_global_buffer(
    std::uint32_t* global_buffer,
    int global_buffer_size,
    std::uint32_t seed
) {
    const int idx = blockIdx.x * blockDim.x + threadIdx.x;

    if (idx >= global_buffer_size) {
        return;
    }

    std::uint32_t x = static_cast<std::uint32_t>(idx);
    x ^= seed;
    x = x * 1664525u + 1013904223u;
    x ^= x >> 16;
    x *= 2246822519u;
    x ^= x >> 13;
    x *= 3266489917u;
    x ^= x >> 16;

    global_buffer[idx] = x;
}

extern "C"
cudaError_t launch_initialize_ready_warp_supply_global_buffer(
    std::uint32_t* global_buffer,
    int global_buffer_size,
    std::uint32_t seed
) {
    const int threads = 256;
    const int blocks = (global_buffer_size + threads - 1) / threads;

    initialize_ready_warp_supply_global_buffer<<<blocks, threads>>>(
        global_buffer,
        global_buffer_size,
        seed
    );

    return cudaGetLastError();
}

extern "C"
cudaError_t launch_ready_warp_supply_kernel(
    std::uint64_t* out_progress,
    int* out_role_id,
    std::uint32_t* global_buffer,
    int global_buffer_size,
    std::uint64_t cycle_budget,
    int warps_per_block,
    int ready_warp_count,
    int condition_id,
    int run_id,
    int blocks,
    int threads_per_block
) {
    const std::size_t shared_bytes = sizeof(std::uint32_t) * 1024;

    ready_warp_supply_kernel<<<
        blocks,
        threads_per_block,
        shared_bytes
    >>>(
        out_progress,
        out_role_id,
        global_buffer,
        global_buffer_size,
        cycle_budget,
        warps_per_block,
        ready_warp_count,
        condition_id,
        run_id
    );

    return cudaGetLastError();
}