#include "host.hpp"

#include <cuda_runtime.h>

#include <cmath>
#include <cstdint>
#include <fstream>
#include <iostream>
#include <limits>
#include <stdexcept>
#include <string>
#include <vector>

extern "C" cudaError_t launch_warp_signature_repeatability_kernel(
    std::uint64_t* out_progress,
    std::uint64_t cycle_budget,
    int warps_per_block,
    int run_id,
    int blocks,
    int threads_per_block
);

namespace warp_signature_repeatability_probe {

static void cuda_check(cudaError_t err, const char* msg) {
    if (err != cudaSuccess) {
        throw std::runtime_error(
            std::string(msg) + ": " + cudaGetErrorString(err)
        );
    }
}

static std::vector<WarpStats> compute_stats(
    const std::vector<std::vector<std::uint64_t>>& runs,
    int blocks,
    int warps_per_block
) {
    const int total_warps = blocks * warps_per_block;
    const int num_runs = static_cast<int>(runs.size());

    std::vector<WarpStats> stats;
    stats.reserve(total_warps);

    for (int warp = 0; warp < total_warps; ++warp) {
        double sum = 0.0;
        std::uint64_t min_v = std::numeric_limits<std::uint64_t>::max();
        std::uint64_t max_v = 0;

        for (int r = 0; r < num_runs; ++r) {
            const std::uint64_t v = runs[r][warp];
            sum += static_cast<double>(v);
            if (v < min_v) min_v = v;
            if (v > max_v) max_v = v;
        }

        const double mean = sum / static_cast<double>(num_runs);

        double var_sum = 0.0;
        for (int r = 0; r < num_runs; ++r) {
            const double diff = static_cast<double>(runs[r][warp]) - mean;
            var_sum += diff * diff;
        }

        const double variance = var_sum / static_cast<double>(num_runs);
        const double stddev = std::sqrt(variance);
        const double cv = mean == 0.0 ? 0.0 : stddev / mean;

        WarpStats s;
        s.block_id = warp / warps_per_block;
        s.warp_id = warp % warps_per_block;
        s.mean = mean;
        s.variance = variance;
        s.stddev = stddev;
        s.coefficient_of_variation = cv;
        s.min_progress = min_v;
        s.max_progress = max_v;

        stats.push_back(s);
    }

    return stats;
}

static void write_json(
    const Config& config,
    const std::vector<std::vector<std::uint64_t>>& runs,
    const std::vector<WarpStats>& stats
) {
    std::ofstream out(config.output_path);
    if (!out.is_open()) {
        throw std::runtime_error("failed to open output file: " + config.output_path);
    }

    const int total_warps = config.blocks * config.warps_per_block;

    out << "{\n";
    out << "  \"probe_name\": \"warp_signature_repeatability_probe\",\n";
    out << "  \"interpretation\": {\n";
    out << "    \"primary_question\": \"Does a workload-specific warp progress signature repeat across runs?\",\n";
    out << "    \"note\": \"This probe should be interpreted as repeatability of progress signatures, not as absolute throughput ratio.\"\n";
    out << "  },\n";

    out << "  \"config\": {\n";
    out << "    \"num_runs\": " << config.num_runs << ",\n";
    out << "    \"warmup_runs\": " << config.warmup_runs << ",\n";
    out << "    \"blocks\": " << config.blocks << ",\n";
    out << "    \"warps_per_block\": " << config.warps_per_block << ",\n";
    out << "    \"threads_per_block\": " << config.threads_per_block << ",\n";
    out << "    \"cycle_budget\": " << config.cycle_budget << "\n";
    out << "  },\n";

    out << "  \"stats\": [\n";
    for (std::size_t i = 0; i < stats.size(); ++i) {
        const auto& s = stats[i];

        out << "    {\n";
        out << "      \"block_id\": " << s.block_id << ",\n";
        out << "      \"warp_id\": " << s.warp_id << ",\n";
        out << "      \"mean_progress\": " << s.mean << ",\n";
        out << "      \"variance\": " << s.variance << ",\n";
        out << "      \"stddev\": " << s.stddev << ",\n";
        out << "      \"coefficient_of_variation\": " << s.coefficient_of_variation << ",\n";
        out << "      \"min_progress\": " << s.min_progress << ",\n";
        out << "      \"max_progress\": " << s.max_progress << "\n";
        out << "    }";

        if (i + 1 < stats.size()) out << ",";
        out << "\n";
    }
    out << "  ],\n";

    out << "  \"raw_runs\": [\n";
    for (std::size_t r = 0; r < runs.size(); ++r) {
        out << "    {\n";
        out << "      \"run_id\": " << r << ",\n";
        out << "      \"warp_progress\": [";

        for (int w = 0; w < total_warps; ++w) {
            out << runs[r][w];
            if (w + 1 < total_warps) out << ", ";
        }

        out << "]\n";
        out << "    }";

        if (r + 1 < runs.size()) out << ",";
        out << "\n";
    }
    out << "  ]\n";

    out << "}\n";
}

void run_probe(const Config& config) {
    if (config.threads_per_block % 32 != 0) {
        throw std::runtime_error("threads_per_block must be multiple of 32");
    }

    if (config.warps_per_block * 32 > config.threads_per_block) {
        throw std::runtime_error("warps_per_block exceeds threads_per_block capacity");
    }

    const int total_warps = config.blocks * config.warps_per_block;
    const std::size_t bytes = sizeof(std::uint64_t) * total_warps;

    std::uint64_t* d_progress = nullptr;
    cuda_check(cudaMalloc(&d_progress, bytes), "cudaMalloc d_progress");

    std::vector<std::uint64_t> h_progress(total_warps, 0);

    // Warmup
    for (int r = 0; r < config.warmup_runs; ++r) {
        cuda_check(cudaMemset(d_progress, 0, bytes), "cudaMemset warmup");

        cuda_check(
            launch_warp_signature_repeatability_kernel(
                d_progress,
                config.cycle_budget,
                config.warps_per_block,
                -1 - r,
                config.blocks,
                config.threads_per_block
            ),
            "kernel launch warmup"
        );

        cuda_check(cudaDeviceSynchronize(), "cudaDeviceSynchronize warmup");
    }

    std::vector<std::vector<std::uint64_t>> runs;
    runs.reserve(config.num_runs);

    for (int r = 0; r < config.num_runs; ++r) {
        cuda_check(cudaMemset(d_progress, 0, bytes), "cudaMemset run");

        cuda_check(
            launch_warp_signature_repeatability_kernel(
                d_progress,
                config.cycle_budget,
                config.warps_per_block,
                r,
                config.blocks,
                config.threads_per_block
            ),
            "kernel launch run"
        );

        cuda_check(cudaDeviceSynchronize(), "cudaDeviceSynchronize run");

        cuda_check(
            cudaMemcpy(h_progress.data(), d_progress, bytes, cudaMemcpyDeviceToHost),
            "cudaMemcpy progress"
        );

        runs.push_back(h_progress);
    }

    cuda_check(cudaFree(d_progress), "cudaFree d_progress");

    const auto stats = compute_stats(
        runs,
        config.blocks,
        config.warps_per_block
    );

    write_json(config, runs, stats);

    std::cout << "[warp_signature_repeatability_probe] done\n";
    std::cout << "  runs: " << config.num_runs << "\n";
    std::cout << "  total_warps: " << total_warps << "\n";
    std::cout << "  output: " << config.output_path << "\n";
}

} // namespace warp_signature_repeatability_probe