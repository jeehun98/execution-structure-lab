#include <cuda_runtime.h>
#include <cstdint>

enum CompositionPhaseRole {
    ROLE_LIGHT_ALU_READY = 0,
    ROLE_SHARED_DEPENDENT_CHAIN_READY = 1,
    ROLE_DEPENDENT_GLOBAL_STALLED = 2
};

__device__ __forceinline__
std::uint32_t hash_u32(std::uint32_t x) {
    x ^= x >> 16;
    x *= 2246822519u;
    x ^= x >> 13;
    x *= 3266489917u;
    x ^= x >> 16;
    return x;
}

__device__ __forceinline__
int prewarm_count_for_condition(int condition_id) {
    if (condition_id == 1) {
        return 0;
    }

    if (condition_id == 2) {
        return 3;
    }

    return 1;
}

__device__ __forceinline__
int light_warp_for_condition(int condition_id) {
    // ready region은 warp 0~3.
    // condition 0,1,2,6: 이전 문제 조건과 동일하게 light warp = 3.
    if (condition_id == 3) return 0;
    if (condition_id == 4) return 1;
    if (condition_id == 5) return 2;
    return 3;
}

__device__ __forceinline__
int resolve_role_id(
    int local_warp_id,
    int condition_id,
    int ready_warp_count
) {
    if (local_warp_id >= ready_warp_count) {
        return ROLE_DEPENDENT_GLOBAL_STALLED;
    }

    const int light_warp = light_warp_for_condition(condition_id);

    if (local_warp_id == light_warp) {
        return ROLE_LIGHT_ALU_READY;
    }

    return ROLE_SHARED_DEPENDENT_CHAIN_READY;
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

__device__ __forceinline__
std::uint32_t run_light_alu(std::uint32_t x) {
    x = x * 1664525u + 1013904223u;
    x ^= x >> 13;
    x += 0x9e3779b9u;
    x ^= x << 5;
    return x;
}

__device__ __forceinline__
std::uint32_t run_shared_dependent_chain(
    std::uint32_t x,
    const std::uint32_t* shared_data,
    int lane_id
) {
    const int idx0 = static_cast<int>((x + lane_id * 17u) & 1023u);
    const std::uint32_t v0 = shared_data[idx0];

    const int idx1 = static_cast<int>((v0 ^ x) & 1023u);
    const std::uint32_t v1 = shared_data[idx1];

    const int idx2 = static_cast<int>((v1 + v0 + x + lane_id) & 1023u);
    const std::uint32_t v2 = shared_data[idx2];

    const int idx3 = static_cast<int>((v2 ^ v1 ^ x) & 1023u);
    const std::uint32_t v3 = shared_data[idx3];

    x ^= v0 + 0x9e3779b9u;
    x += v1 ^ (x >> 5);
    x ^= v2 + (x << 3);
    x += v3 ^ 0x85ebca6bu;

    return x;
}

__device__ __forceinline__
std::uint32_t run_dependent_global_chain(
    std::uint32_t x,
    const std::uint32_t* global_buffer,
    int global_buffer_size,
    int global_warp_index,
    int local_warp_id,
    int lane_id
) {
    int idx0 = compute_global_index(
        x,
        global_buffer_size,
        global_warp_index,
        local_warp_id,
        lane_id
    );

    const std::uint32_t v0 = global_buffer[idx0];

    int idx1 = compute_global_index(
        v0 ^ x,
        global_buffer_size,
        global_warp_index,
        local_warp_id,
        lane_id
    );

    const std::uint32_t v1 = global_buffer[idx1];

    int idx2 = compute_global_index(
        v1 + v0 + x,
        global_buffer_size,
        global_warp_index,
        local_warp_id,
        lane_id
    );

    const std::uint32_t v2 = global_buffer[idx2];

    int idx3 = compute_global_index(
        v2 ^ v1 ^ x,
        global_buffer_size,
        global_warp_index,
        local_warp_id,
        lane_id
    );

    const std::uint32_t v3 = global_buffer[idx3];

    x ^= v0 + 0x7f4a7c15u;
    x = (x << 5) ^ (x >> 3) ^ v1;
    x += v2 ^ 0x9e3779b9u;
    x ^= v3 + 0x85ebca6bu;

    return x;
}

__global__
void composition_phase_repeatability_kernel(
    std::uint64_t* out_progress,
    int* out_role_id,
    std::uint32_t* global_buffer,
    int global_buffer_size,
    std::uint64_t cycle_budget,
    int warps_per_block,
    int ready_warp_count,
    int condition_id,
    int batch_id,
    int run_id,
    int seed_mode
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
        std::uint32_t x = static_cast<std::uint32_t>(i);
        x = x * 1664525u + 1013904223u;
        x ^= x >> 16;
        x *= 2246822519u;
        x ^= x >> 13;
        shared_data[i] = x;
    }

    __syncthreads();

    const int global_warp_index =
        block_id * warps_per_block + local_warp_id;

    const int role = resolve_role_id(
        local_warp_id,
        condition_id,
        ready_warp_count
    );

    std::uint32_t effective_run =
        static_cast<std::uint32_t>(run_id + batch_id * 1009);

    if (seed_mode != 0) {
        effective_run = hash_u32(
            static_cast<std::uint32_t>(
                run_id * 747796405u +
                batch_id * 2891336453u +
                condition_id * 277803737u
            )
        );
    }

    std::uint32_t x = 0x12345678u;
    x ^= static_cast<std::uint32_t>(local_warp_id * 0x9e3779b9u);
    x ^= static_cast<std::uint32_t>(lane_id * 0x85ebca6bu);
    x ^= static_cast<std::uint32_t>(condition_id * 0x27d4eb2du);
    x ^= static_cast<std::uint32_t>(batch_id * 0x165667b1u);
    x ^= effective_run * 0xc2b2ae35u;

    std::uint64_t progress = 0;
    const std::uint64_t start = clock64();

    while ((clock64() - start) < cycle_budget) {
        if (role == ROLE_LIGHT_ALU_READY) {
            x = run_light_alu(x);
        }
        else if (role == ROLE_SHARED_DEPENDENT_CHAIN_READY) {
            x = run_shared_dependent_chain(
                x,
                shared_data,
                lane_id
            );
        }
        else {
            x = run_dependent_global_chain(
                x,
                global_buffer,
                global_buffer_size,
                global_warp_index,
                local_warp_id,
                lane_id
            );
        }

        progress += 1;
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
void initialize_composition_phase_global_buffer(
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
    x = hash_u32(x);
    global_buffer[idx] = x;
}

extern "C"
cudaError_t launch_initialize_composition_phase_global_buffer(
    std::uint32_t* global_buffer,
    int global_buffer_size,
    std::uint32_t seed
) {
    const int threads = 256;
    const int blocks = (global_buffer_size + threads - 1) / threads;

    initialize_composition_phase_global_buffer<<<blocks, threads>>>(
        global_buffer,
        global_buffer_size,
        seed
    );

    return cudaGetLastError();
}

extern "C"
cudaError_t launch_composition_phase_repeatability_kernel(
    std::uint64_t* out_progress,
    int* out_role_id,
    std::uint32_t* global_buffer,
    int global_buffer_size,
    std::uint64_t cycle_budget,
    int warps_per_block,
    int ready_warp_count,
    int condition_id,
    int batch_id,
    int run_id,
    int seed_mode,
    int blocks,
    int threads_per_block
) {
    const std::size_t shared_bytes = sizeof(std::uint32_t) * 1024;

    composition_phase_repeatability_kernel<<<
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
        batch_id,
        run_id,
        seed_mode
    );

    return cudaGetLastError();
}