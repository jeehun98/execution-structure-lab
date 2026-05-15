#include "host.hpp"

#include <cuda_runtime.h>

#include <algorithm>
#include <cstddef>
#include <cstdint>
#include <stdexcept>
#include <string>
#include <vector>

#include "common/cuda_check.hpp"

namespace probe::global_latency_hiding {

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
);

static void validate_active_warps(int active_warps) {
    if (active_warps <= 0) {
        throw std::runtime_error("active_warps must be positive");
    }

    if (active_warps > 32) {
        throw std::runtime_error("active_warps must be <= 32");
    }
}

static void validate_config(const GlobalLatencyHidingConfig& config) {
    if (config.active_warps_values.empty()) {
        throw std::runtime_error("active_warps_values must not be empty");
    }

    if (config.blocks <= 0) {
        throw std::runtime_error("blocks must be positive");
    }

    if (config.sample_period <= 0) {
        throw std::runtime_error("sample_period must be positive");
    }

    if (config.global_elements == 0) {
        throw std::runtime_error("global_elements must be positive");
    }

    for (int active_warps : config.active_warps_values) {
        validate_active_warps(active_warps);
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

std::vector<GlobalLatencyHidingRecord>
run(const GlobalLatencyHidingConfig& config) {
    validate_config(config);

    std::vector<uint32_t> h_global = make_global_input(config.global_elements);

    uint32_t* d_global = nullptr;

    CUDA_CHECK(cudaMalloc(
        reinterpret_cast<void**>(&d_global),
        sizeof(uint32_t) * config.global_elements
    ));

    CUDA_CHECK(cudaMemcpy(
        d_global,
        h_global.data(),
        sizeof(uint32_t) * config.global_elements,
        cudaMemcpyHostToDevice
    ));

    std::vector<GlobalLatencyHidingRecord> all_records;

    for (int active_warps : config.active_warps_values) {
        validate_active_warps(active_warps);

        const int output_count = config.blocks * active_warps;

        uint64_t* d_progress = nullptr;
        uint64_t* d_last_clock = nullptr;
        uint32_t* d_sinks = nullptr;

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

        launch_global_latency_hiding_kernel(
            config.blocks,
            active_warps,
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

        CUDA_CHECK(cudaFree(d_progress));
        CUDA_CHECK(cudaFree(d_last_clock));
        CUDA_CHECK(cudaFree(d_sinks));

        all_records.reserve(
            all_records.size() + static_cast<size_t>(output_count)
        );

        for (int block = 0; block < config.blocks; ++block) {
            for (int warp = 0; warp < active_warps; ++warp) {
                const int idx = block * active_warps + warp;

                all_records.push_back(GlobalLatencyHidingRecord{
                    active_warps,
                    block,
                    warp,
                    "global_load",
                    h_progress[idx],
                    h_last_clock[idx],
                    h_sinks[idx]
                });
            }
        }
    }

    CUDA_CHECK(cudaFree(d_global));

    return all_records;
}

} // namespace probe::global_latency_hiding