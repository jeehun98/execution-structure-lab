#pragma once

#include <cstddef>
#include <cstdint>
#include <string>
#include <vector>

namespace probe::warp_progress_divergence {

struct WarpProgressDivergenceConfig {
    int blocks = 1;
    uint64_t cycle_budget = 200000000;
    int sample_period = 256;
    size_t global_elements = 16777216;
};

struct WarpProgressDivergenceRecord {
    int block;
    int warp_id;
    std::string role;
    uint64_t progress;
    uint64_t last_clock;
    uint32_t sink;
};

std::vector<WarpProgressDivergenceRecord>
run(const WarpProgressDivergenceConfig& config);

} // namespace probe::warp_progress_divergence