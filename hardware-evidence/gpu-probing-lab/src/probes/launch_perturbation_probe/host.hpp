#pragma once

#include <cstdint>
#include <string>
#include <vector>

namespace launch_perturbation_probe {

struct Config {
    int num_batches = 8;
    int runs_per_batch = 64;
    int num_conditions = 8;
    int warmup_runs = 4;

    int blocks = 1;
    int warps_per_block = 8;
    int threads_per_block = 256;

    std::uint64_t cycle_budget = 200000;
    std::uint64_t base_cycle_budget = 100000;
    int base_transient_threshold = 60;

    int global_buffer_size = 1048576;

    int ready_warp_count = 4;
    int stalled_warp_count = 4;
    int light_warp_id = 2;

    std::string output_path =
        "results/raw/launch_perturbation_probe.json";
};

struct WarpConditionStats {
    int condition_id = 0;
    int block_id = 0;
    int warp_id = 0;
    int role_id = 0;

    std::uint64_t cycle_budget = 0;
    int scaled_threshold = 0;

    double mean_progress = 0.0;
    double mean_normalized_progress = 0.0;
    double variance = 0.0;
    double stddev = 0.0;
    double coefficient_of_variation = 0.0;

    std::uint64_t min_progress = 0;
    std::uint64_t max_progress = 0;

    double min_normalized_progress = 0.0;
    double max_normalized_progress = 0.0;

    int transient_count = 0;
    double transient_rate = 0.0;
};

struct RoleAggregateStats {
    int condition_id = 0;
    int role_id = 0;

    std::uint64_t cycle_budget = 0;
    int scaled_threshold = 0;

    double mean_progress = 0.0;
    double mean_normalized_progress = 0.0;
    double variance = 0.0;
    double stddev = 0.0;
    double coefficient_of_variation = 0.0;

    std::uint64_t min_progress = 0;
    std::uint64_t max_progress = 0;

    double min_normalized_progress = 0.0;
    double max_normalized_progress = 0.0;

    int transient_count = 0;
    double transient_rate = 0.0;
};

struct RunTransientEvent {
    int condition_id = 0;
    int batch_id = 0;
    int run_id = 0;
    int block_id = 0;

    int min_global_progress = 0;
    double min_global_normalized_progress = 0.0;
};

void run_probe(const Config& config);

} // namespace launch_perturbation_probe