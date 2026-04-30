#pragma once

#include <cstddef>
#include <cstdint>
#include <string>
#include <vector>

namespace probe::warp_issue_policy {

struct WarpIssueConfig {
    int mode = 0;
    int blocks = 1;
    uint64_t cycle_budget = 200000000ULL;
    int sample_period = 256;
    size_t global_elements = 1 << 24;
};

struct WarpIssueRecord {
    int mode;
    int block_id;
    int warp_id;
    std::string role;
    uint64_t progress;
    uint64_t last_clock;
    uint32_t sink;
};

std::vector<WarpIssueRecord> run(const WarpIssueConfig& config);

} // namespace probe::warp_issue_policy