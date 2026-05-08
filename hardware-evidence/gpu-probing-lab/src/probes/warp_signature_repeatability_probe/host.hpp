#pragma once

#include <cstdint>
#include <string>
#include <vector>

namespace warp_signature_repeatability_probe {

struct Config {
    int num_runs = 64;
    int warmup_runs = 4;

    int blocks = 1;
    int warps_per_block = 8;
    int threads_per_block = 256;

    std::uint64_t cycle_budget = 100000;

    std::string output_path = "results/raw/warp_signature_repeatability_probe.json";
};

struct WarpRunSample {
    int run_id = 0;
    int block_id = 0;
    int warp_id = 0;
    std::uint64_t progress = 0;
};

struct WarpStats {
    int block_id = 0;
    int warp_id = 0;

    double mean = 0.0;
    double variance = 0.0;
    double stddev = 0.0;
    double coefficient_of_variation = 0.0;

    std::uint64_t min_progress = 0;
    std::uint64_t max_progress = 0;
};

void run_probe(const Config& config);

} // namespace warp_signature_repeatability_probe