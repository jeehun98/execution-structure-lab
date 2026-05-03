#include "host.hpp"

#include <cuda_runtime.h>

#include <cstddef>
#include <cstdint>
#include <stdexcept>
#include <string>
#include <vector>

#include "common/cuda_check.hpp"

namespace probe::warp_progress_divergence {

extern "C"
void launch_warp_progress_divergence_kernel(
    int blocks,
    uint64_t cycle_budget,
    int sample_period,
    const uint32_t* gmem,
    size_t global_elements,
    uint64_t* progress,
    uint64_t* last_clock,
    uint32_t* sinks
);

static constexpr int warps_per_block = 4;

static std::string role_name_for(int warp_id) {
    if (warp_id == 0) {
        return "fast_independent_alu";
    }

    if (warp_id == 1) {
        return "dependent_alu_chain";
    }

    if (warp_id == 2) {
        return "shared_load";
    }

    return "dependent_global_load";
}

static void validate_config(const WarpProgressDivergenceConfig& config) {
    if (config.blocks <= 0) {
        throw std::runtime_error("blocks must be positive");
    }

    if (config.sample_period <= 0) {
        throw std::runtime_error("sample_period must be positive");
    }

    if (config.global_elements == 0) {
        throw std::runtime_error("global_elements must be positive");
    }
}

static std::vector<uint32_t>
make_global_input(size_t global_elements) {
    std::vector<uint32_t> h_global(global_elements);

    for (size_t i = 0; i < h_global.size(); ++i) {
        uint32_t x = static_cast<uint32_t>(i);

        x ^= x >> 16;
        x *= 0x7feb352du;
        x ^= x >> 15;
        x *= 0x846ca68bu;
        x ^= x >> 16;

        h_global[i] = x;
    }

    return h_global;
}

std::vector<WarpProgressDivergenceRecord>
run(const WarpProgressDivergenceConfig& config) {
    validate_config(config);

    const int output_count = config.blocks * warps_per_block;

    std::vector<uint32_t> h_global =
        make_global_input(config.global_elements);

    uint32_t* d_global = nullptr;
    uint64_t* d_progress = nullptr;
    uint64_t* d_last_clock = nullptr;
    uint32_t* d_sinks = nullptr;

    CUDA_CHECK(cudaMalloc(
        reinterpret_cast<void**>(&d_global),
        sizeof(uint32_t) * config.global_elements
    ));

    CUDA_CHECK(cudaMalloc(
        reinterpret_cast<void**>(&d_progress),
        sizeof(uint64_t) * output_count
    ));

    CUDA_CHECK(cudaMalloc(
        reinterpret_cast<void**>(&d_last_clock),
        sizeof(uint64_t) * output_count
    ));

    CUDA_CHECK(cudaMalloc(
        reinterpret_cast<void**>(&d_sinks),
        sizeof(uint32_t) * output_count
    ));

    CUDA_CHECK(cudaMemcpy(
        d_global,
        h_global.data(),
        sizeof(uint32_t) * config.global_elements,
        cudaMemcpyHostToDevice
    ));

    CUDA_CHECK(cudaMemset(
        d_progress,
        0,
        sizeof(uint64_t) * output_count
    ));

    CUDA_CHECK(cudaMemset(
        d_last_clock,
        0,
        sizeof(uint64_t) * output_count
    ));

    CUDA_CHECK(cudaMemset(
        d_sinks,
        0,
        sizeof(uint32_t) * output_count
    ));

    launch_warp_progress_divergence_kernel(
        config.blocks,
        config.cycle_budget,
        config.sample_period,
        d_global,
        config.global_elements,
        d_progress,
        d_last_clock,
        d_sinks
    );

    CUDA_CHECK(cudaGetLastError());
    CUDA_CHECK(cudaDeviceSynchronize());

    std::vector<uint64_t> h_progress(output_count);
    std::vector<uint64_t> h_last_clock(output_count);
    std::vector<uint32_t> h_sinks(output_count);

    CUDA_CHECK(cudaMemcpy(
        h_progress.data(),
        d_progress,
        sizeof(uint64_t) * output_count,
        cudaMemcpyDeviceToHost
    ));

    CUDA_CHECK(cudaMemcpy(
        h_last_clock.data(),
        d_last_clock,
        sizeof(uint64_t) * output_count,
        cudaMemcpyDeviceToHost
    ));

    CUDA_CHECK(cudaMemcpy(
        h_sinks.data(),
        d_sinks,
        sizeof(uint32_t) * output_count,
        cudaMemcpyDeviceToHost
    ));

    CUDA_CHECK(cudaFree(d_global));
    CUDA_CHECK(cudaFree(d_progress));
    CUDA_CHECK(cudaFree(d_last_clock));
    CUDA_CHECK(cudaFree(d_sinks));

    std::vector<WarpProgressDivergenceRecord> records;
    records.reserve(static_cast<size_t>(output_count));

    for (int block = 0; block < config.blocks; ++block) {
        for (int warp = 0; warp < warps_per_block; ++warp) {
            const int idx = block * warps_per_block + warp;

            records.push_back(WarpProgressDivergenceRecord{
                block,
                warp,
                role_name_for(warp),
                h_progress[idx],
                h_last_clock[idx],
                h_sinks[idx]
            });
        }
    }

    return records;
}

} // namespace probe::warp_progress_divergence