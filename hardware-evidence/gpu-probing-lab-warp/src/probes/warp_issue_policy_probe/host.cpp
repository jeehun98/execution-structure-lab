#include "host.hpp"

#include <cuda_runtime.h>

#include <cstddef>
#include <cstdint>
#include <stdexcept>
#include <string>
#include <vector>

#include "common/cuda_check.hpp"

namespace probe::warp_issue_policy {

extern "C"
void launch_warp_issue_policy_kernel(
    int blocks,
    int mode,
    uint64_t cycle_budget,
    int sample_period,
    const uint32_t* gmem,
    size_t global_elements,
    uint64_t* progress,
    uint64_t* last_clock,
    uint32_t* sinks
);

static std::string role_name_for(int mode, int warp_id) {
    if (mode == 0) {
        return "independent_alu";
    }

    if (mode == 1) {
        return warp_id == 0 ? "dependent_alu" : "independent_alu";
    }

    if (mode == 2) {
        return warp_id == 0 ? "shared_load" : "independent_alu";
    }

    if (mode == 3) {
        return warp_id == 0 ? "global_load" : "independent_alu";
    }

    if (mode == 4) {
        if (warp_id == 0) return "dependent_alu";
        if (warp_id == 1) return "independent_alu";
        if (warp_id == 2) return "shared_load";
        return "global_load";
    }

    return "independent_alu";
}

std::vector<WarpIssueRecord> run(const WarpIssueConfig& config) {
    if (config.mode < 0 || config.mode > 4) {
        throw std::runtime_error("mode must be in range [0, 4]");
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

    constexpr int warps_per_block = 4;
    const int output_count = config.blocks * warps_per_block;

    std::vector<uint32_t> h_global(config.global_elements);

    for (size_t i = 0; i < h_global.size(); ++i) {
        h_global[i] =
            static_cast<uint32_t>((i * 2654435761u) ^ (i >> 7));
    }

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

    launch_warp_issue_policy_kernel(
        config.blocks,
        config.mode,
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

    std::vector<WarpIssueRecord> records;
    records.reserve(static_cast<size_t>(output_count));

    for (int block = 0; block < config.blocks; ++block) {
        for (int warp = 0; warp < warps_per_block; ++warp) {
            const int idx = block * warps_per_block + warp;

            records.push_back(WarpIssueRecord{
                config.mode,
                block,
                warp,
                role_name_for(config.mode, warp),
                h_progress[idx],
                h_last_clock[idx],
                h_sinks[idx]
            });
        }
    }

    return records;
}

} // namespace probe::warp_issue_policy