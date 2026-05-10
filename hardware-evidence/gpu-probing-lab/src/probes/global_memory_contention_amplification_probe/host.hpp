#pragma once

#include <cstdint>
#include <string>
#include <vector>

namespace global_memory_contention_amplification_probe {

struct Config {
    int num_runs_per_scenario = 24;
    int num_scenarios = 7;
    int warmup_runs = 4;

    int blocks = 1;
    int warps_per_block = 8;
    int threads_per_block = 256;

    std::uint64_t cycle_budget = 100000;
    int global_buffer_size = 1048576;

    std::string output_path =
        "results/raw/global_memory_contention_amplification_probe.json";
};

struct WarpScenarioStats {
    int scenario_id = 0;
    int block_id = 0;
    int warp_id = 0;
    int role_id = 0;
    int address_mode = 0;

    double mean = 0.0;
    double variance = 0.0;
    double stddev = 0.0;
    double coefficient_of_variation = 0.0;

    std::uint64_t min_progress = 0;
    std::uint64_t max_progress = 0;
};

struct RoleAggregateStats {
    int scenario_id = 0;
    int role_id = 0;
    int address_mode = 0;

    double mean = 0.0;
    double variance = 0.0;
    double stddev = 0.0;
    double coefficient_of_variation = 0.0;

    std::uint64_t min_progress = 0;
    std::uint64_t max_progress = 0;
};

void run_probe(const Config& config);

} // namespace global_memory_contention_amplification_probe