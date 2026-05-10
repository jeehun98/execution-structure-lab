#include <cuda_runtime.h>
#include <cstdint>

enum ContentionRole {
    ROLE_LIGHT_ALU = 0,
    ROLE_GLOBAL_CHAIN = 1
};

enum AddressMode {
    ADDRESS_MIXED_DEFAULT = 0,
    ADDRESS_OVERLAP = 1,
    ADDRESS_DISPERSED = 2
};

__device__ __forceinline__
int global_warp_count_for_scenario(int scenario_id, int warps_per_block) {
    if (scenario_id == 0) {
        return 0; // all light baseline
    }

    if (scenario_id == 1) {
        return 1; // 1 global + rest light
    }

    if (scenario_id == 2) {
        return 2; // 2 global + rest light
    }

    if (scenario_id == 3) {
        return 4; // 4 global + rest light
    }

    if (scenario_id == 4) {
        return warps_per_block; // all global
    }

    if (scenario_id == 5) {
        return 4; // 4 global overlap
    }

    if (scenario_id == 6) {
        return 4; // 4 global dispersed
    }

    return 0;
}

__device__ __forceinline__
int address_mode_for_scenario(int scenario_id) {
    if (scenario_id == 5) {
        return ADDRESS_OVERLAP;
    }

    if (scenario_id == 6) {
        return ADDRESS_DISPERSED;
    }

    return ADDRESS_MIXED_DEFAULT;
}

__device__ __forceinline__
int resolve_role_id(int local_warp_id, int scenario_id, int warps_per_block) {
    const int global_count = global_warp_count_for_scenario(
        scenario_id,
        warps_per_block
    );

    // 뒤쪽 warp부터 global_chain으로 배정.
    // 예: 1 global이면 warp 7만 global.
    // 예: 4 global이면 warp 4~7이 global.
    const int first_global_warp = warps_per_block - global_count;

    if (local_warp_id >= first_global_warp) {
        return ROLE_GLOBAL_CHAIN;
    }

    return ROLE_LIGHT_ALU;
}

__device__ __forceinline__
int compute_global_index(
    std::uint32_t x,
    int global_buffer_size,
    int global_warp_index,
    int local_warp_id,
    int lane_id,
    int address_mode
) {
    const int mask = global_buffer_size - 1;

    if (address_mode == ADDRESS_OVERLAP) {
        // 여러 global warp가 같은 작은 영역을 반복 접근.
        // 캐시 재사용도 생길 수 있지만, 동시에 같은 region에 몰리는 조건.
        const std::uint32_t base =
            static_cast<std::uint32_t>((lane_id * 64u) + (x & 2047u));

        return static_cast<int>(base & mask);
    }

    if (address_mode == ADDRESS_DISPERSED) {
        // warp마다 멀리 떨어진 주소 영역 접근.
        const std::uint32_t base =
            static_cast<std::uint32_t>(
                global_warp_index * 16384u +
                lane_id * 257u +
                (x & 4095u)
            );

        return static_cast<int>(base & mask);
    }

    // default: mixed workload probe와 유사한 기본 dependent global access.
    const std::uint32_t base =
        static_cast<std::uint32_t>(
            global_warp_index * 4096u +
            local_warp_id * 1024u +
            lane_id * 131u +
            (x & 4095u)
        );

    return static_cast<int>(base & mask);
}

__global__
void global_memory_contention_amplification_kernel(
    std::uint64_t* out_progress,
    int* out_role_id,
    int* out_address_mode,
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

    const int address_mode = address_mode_for_scenario(scenario_id);

    std::uint32_t x = 0x12345678u;
    x ^= static_cast<std::uint32_t>(local_warp_id * 0x9e3779b9u);
    x ^= static_cast<std::uint32_t>(lane_id * 0x85ebca6bu);
    x ^= static_cast<std::uint32_t>(scenario_id * 0x27d4eb2du);
    x ^= static_cast<std::uint32_t>(run_id * 0xc2b2ae35u);

    std::uint64_t progress = 0;
    const std::uint64_t start = clock64();

    while ((clock64() - start) < cycle_budget) {
        if (role == ROLE_LIGHT_ALU) {
            x = x * 1664525u + 1013904223u;
            x ^= x >> 13;
            progress += 1;
        }
        else {
            int idx0 = compute_global_index(
                x,
                global_buffer_size,
                global_warp_index,
                local_warp_id,
                lane_id,
                address_mode
            );

            std::uint32_t v0 = global_buffer[idx0];

            // dependent chain: 첫 load 결과가 다음 주소를 결정.
            int idx1 = compute_global_index(
                v0 ^ x,
                global_buffer_size,
                global_warp_index,
                local_warp_id,
                lane_id,
                address_mode
            );

            std::uint32_t v1 = global_buffer[idx1];

            int idx2 = compute_global_index(
                v1 + v0 + x,
                global_buffer_size,
                global_warp_index,
                local_warp_id,
                lane_id,
                address_mode
            );

            std::uint32_t v2 = global_buffer[idx2];

            x ^= v0 + 0x7f4a7c15u;
            x = (x << 5) ^ (x >> 3) ^ v1;
            x += v2 ^ 0x9e3779b9u;

            progress += 1;
        }
    }

    if (lane_id == 0) {
        out_progress[global_warp_index] = progress;
        out_role_id[global_warp_index] = role;
        out_address_mode[global_warp_index] = address_mode;
    }

    // dead-code elimination 방지
    if (x == 0xFFFFFFFFu && lane_id == 0) {
        out_progress[global_warp_index] += x;
    }
}

__global__
void initialize_global_memory_contention_buffer(
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
cudaError_t launch_initialize_global_memory_contention_buffer(
    std::uint32_t* global_buffer,
    int global_buffer_size
) {
    const int threads = 256;
    const int blocks = (global_buffer_size + threads - 1) / threads;

    initialize_global_memory_contention_buffer<<<blocks, threads>>>(
        global_buffer,
        global_buffer_size
    );

    return cudaGetLastError();
}

extern "C"
cudaError_t launch_global_memory_contention_amplification_kernel(
    std::uint64_t* out_progress,
    int* out_role_id,
    int* out_address_mode,
    std::uint32_t* global_buffer,
    int global_buffer_size,
    std::uint64_t cycle_budget,
    int warps_per_block,
    int scenario_id,
    int run_id,
    int blocks,
    int threads_per_block
) {
    global_memory_contention_amplification_kernel<<<
        blocks,
        threads_per_block
    >>>(
        out_progress,
        out_role_id,
        out_address_mode,
        global_buffer,
        global_buffer_size,
        cycle_budget,
        warps_per_block,
        scenario_id,
        run_id
    );

    return cudaGetLastError();
}