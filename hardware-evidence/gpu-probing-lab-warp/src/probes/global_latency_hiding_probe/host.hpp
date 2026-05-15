#pragma once

#include <cstddef>
#include <cstdint>
#include <string>
#include <vector>

namespace probe::global_latency_hiding {

struct GlobalLatencyHidingConfig {
    std::vector<int> active_warps_values;
    int blocks = 1;
    uint64_t cycle_budget = 200000000;
    int sample_period = 256;
    size_t global_elements = 16777216;
};

struct GlobalLatencyHidingRecord {
    int active_warps;
    int block;
    int warp_id;
    std::string role;
    uint64_t progress;
    uint64_t last_clock;
    uint32_t sink;
};

std::vector<GlobalLatencyHidingRecord>
run(const GlobalLatencyHidingConfig& config);

} // namespace probe::global_latency_hiding