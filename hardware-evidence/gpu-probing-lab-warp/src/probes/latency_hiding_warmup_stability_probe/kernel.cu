#include <cuda_runtime.h>
#include <cstdint>

enum WarmupStabilityRole {
    ROLE_LIGHT_ALU_READY = 0,
    ROLE_DEPENDENT_GLOBAL_STALLED = 1
};

__device__ __forceinline__
int resolve_role_id(
    int local_warp_id,
    int ready_warp_count,
    int warps_per_block
) {
    if (local_warp_id < ready_warp_count) {
        return ROLE_LIGHT_ALU_READY;
    }

    return ROLE_DEPENDENT_GLOBAL_STALLED;
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
void latency_hiding_warmup_stability_kernel(
    std::uint64_t* out_progress,
    int* out_role_id,
    std::uint32_t* global_buffer,
    int global_buffer_size,
    std::uint64_t cycle_budget,
    int warps_per_block,
    int ready_warp_count,
    int run_id,
    int condition_id
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
        ready_warp_count,
        warps_per_block
    );

    std::uint32_t x = 0x12345678u;
    x ^= static_cast<std::uint32_t>(local_warp_id * 0x9e3779b9u);
    x ^= static_cast<std::uint32_t>(lane_id * 0x85ebca6bu);
    x ^= static_cast<std::uint32_t>(run_id * 0xc2b2ae35u);
    x ^= static_cast<std::uint32_t>(condition_id * 0x27d4eb2du);

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
void initialize_latency_hiding_warmup_buffer(
    std::uint32_t* buffer,
    int buffer_size,
    std::uint32_t seed
) {
    const int idx = blockIdx.x * blockDim.x + threadIdx.x;

    if (idx >= buffer_size) {
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

    buffer[idx] = x;
}

__global__
void pretouch_latency_hiding_buffer(
    const std::uint32_t* buffer,
    std::uint32_t* sink,
    int buffer_size
) {
    const int idx = blockIdx.x * blockDim.x + threadIdx.x;

    if (idx >= buffer_size) {
        return;
    }

    std::uint32_t x = buffer[idx];
    x ^= x >> 13;
    x *= 747796405u;
    x ^= x >> 16;

    atomicAdd(sink, x & 1u);
}

__global__
void evict_latency_hiding_cache_kernel(
    const std::uint32_t* eviction_buffer,
    std::uint32_t* sink,
    int eviction_buffer_size
) {
    const int idx = blockIdx.x * blockDim.x + threadIdx.x;

    if (idx >= eviction_buffer_size) {
        return;
    }

    std::uint32_t x = eviction_buffer[idx];
    x ^= x >> 11;
    x *= 2654435761u;
    x ^= x >> 15;

    atomicAdd(sink, x & 1u);
}

extern "C"
cudaError_t launch_initialize_latency_hiding_warmup_buffer(
    std::uint32_t* buffer,
    int buffer_size,
    std::uint32_t seed
) {
    const int threads = 256;
    const int blocks = (buffer_size + threads - 1) / threads;

    initialize_latency_hiding_warmup_buffer<<<blocks, threads>>>(
        buffer,
        buffer_size,
        seed
    );

    return cudaGetLastError();
}

extern "C"
cudaError_t launch_pretouch_latency_hiding_buffer(
    const std::uint32_t* buffer,
    std::uint32_t* sink,
    int buffer_size
) {
    const int threads = 256;
    const int blocks = (buffer_size + threads - 1) / threads;

    pretouch_latency_hiding_buffer<<<blocks, threads>>>(
        buffer,
        sink,
        buffer_size
    );

    return cudaGetLastError();
}

extern "C"
cudaError_t launch_evict_latency_hiding_cache(
    const std::uint32_t* eviction_buffer,
    std::uint32_t* sink,
    int eviction_buffer_size
) {
    const int threads = 256;
    const int blocks = (eviction_buffer_size + threads - 1) / threads;

    evict_latency_hiding_cache_kernel<<<blocks, threads>>>(
        eviction_buffer,
        sink,
        eviction_buffer_size
    );

    return cudaGetLastError();
}

extern "C"
cudaError_t launch_latency_hiding_warmup_stability_kernel(
    std::uint64_t* out_progress,
    int* out_role_id,
    std::uint32_t* global_buffer,
    int global_buffer_size,
    std::uint64_t cycle_budget,
    int warps_per_block,
    int ready_warp_count,
    int run_id,
    int condition_id,
    int blocks,
    int threads_per_block
) {
    latency_hiding_warmup_stability_kernel<<<
        blocks,
        threads_per_block
    >>>(
        out_progress,
        out_role_id,
        global_buffer,
        global_buffer_size,
        cycle_budget,
        warps_per_block,
        ready_warp_count,
        run_id,
        condition_id
    );

    return cudaGetLastError();
}