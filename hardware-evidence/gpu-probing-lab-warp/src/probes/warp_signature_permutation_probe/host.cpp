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

extern "C" cudaError_t launch_warp_signature_permutation_kernel(
    std::uint64_t* out_progress,
    int* out_pattern_id,
    std::uint64_t cycle_budget,
    int warps_per_block,
    int permutation_id,
    int run_id,
    int blocks,
    int threads_per_block
);

namespace warp_signature_permutation_probe {

static void cuda_check(cudaError_t err, const char* msg) {
    if (err != cudaSuccess) {
        throw std::runtime_error(
            std::string(msg) + ": " + cudaGetErrorString(err)
        );
    }
}

static int resolve_pattern_id_host(int local_warp_id, int permutation_id) {
    return (local_warp_id + permutation_id) & 3;
}

static std::vector<WarpPermutationStats> compute_warp_stats(
    const std::vector<std::vector<std::vector<std::uint64_t>>>& all_runs,
    const Config& config
) {
    const int total_warps = config.blocks * config.warps_per_block;

    std::vector<WarpPermutationStats> stats;
    stats.reserve(config.num_permutations * total_warps);

    for (int p = 0; p < config.num_permutations; ++p) {
        for (int w = 0; w < total_warps; ++w) {
            double sum = 0.0;
            std::uint64_t min_v = std::numeric_limits<std::uint64_t>::max();
            std::uint64_t max_v = 0;

            for (int r = 0; r < config.num_runs_per_permutation; ++r) {
                const std::uint64_t v = all_runs[p][r][w];
                sum += static_cast<double>(v);

                if (v < min_v) min_v = v;
                if (v > max_v) max_v = v;
            }

            const double mean = sum / static_cast<double>(config.num_runs_per_permutation);

            double var_sum = 0.0;
            for (int r = 0; r < config.num_runs_per_permutation; ++r) {
                const double diff = static_cast<double>(all_runs[p][r][w]) - mean;
                var_sum += diff * diff;
            }

            const double variance = var_sum / static_cast<double>(config.num_runs_per_permutation);
            const double stddev = std::sqrt(variance);
            const double cv = mean == 0.0 ? 0.0 : stddev / mean;

            WarpPermutationStats s;
            s.permutation_id = p;
            s.block_id = w / config.warps_per_block;
            s.warp_id = w % config.warps_per_block;
            s.pattern_id = resolve_pattern_id_host(s.warp_id, p);
            s.mean = mean;
            s.variance = variance;
            s.stddev = stddev;
            s.coefficient_of_variation = cv;
            s.min_progress = min_v;
            s.max_progress = max_v;

            stats.push_back(s);
        }
    }

    return stats;
}

static std::vector<PatternAggregateStats> compute_pattern_aggregate_stats(
    const std::vector<WarpPermutationStats>& warp_stats
) {
    constexpr int pattern_count = 4;

    std::vector<std::vector<double>> grouped(pattern_count);

    for (const auto& s : warp_stats) {
        if (s.pattern_id >= 0 && s.pattern_id < pattern_count) {
            grouped[s.pattern_id].push_back(s.mean);
        }
    }

    std::vector<PatternAggregateStats> result;
    result.reserve(pattern_count);

    for (int pattern = 0; pattern < pattern_count; ++pattern) {
        PatternAggregateStats ps;
        ps.pattern_id = pattern;

        if (grouped[pattern].empty()) {
            result.push_back(ps);
            continue;
        }

        double sum = 0.0;
        double min_v = std::numeric_limits<double>::max();
        double max_v = 0.0;

        for (double v : grouped[pattern]) {
            sum += v;
            if (v < min_v) min_v = v;
            if (v > max_v) max_v = v;
        }

        const double mean = sum / static_cast<double>(grouped[pattern].size());

        double var_sum = 0.0;
        for (double v : grouped[pattern]) {
            const double diff = v - mean;
            var_sum += diff * diff;
        }

        ps.mean = mean;
        ps.variance = var_sum / static_cast<double>(grouped[pattern].size());
        ps.stddev = std::sqrt(ps.variance);
        ps.min_progress = static_cast<std::uint64_t>(min_v);
        ps.max_progress = static_cast<std::uint64_t>(max_v);

        result.push_back(ps);
    }

    return result;
}

static void write_json(
    const Config& config,
    const std::vector<std::vector<std::vector<std::uint64_t>>>& all_runs,
    const std::vector<std::vector<std::vector<int>>>& all_patterns,
    const std::vector<WarpPermutationStats>& warp_stats,
    const std::vector<PatternAggregateStats>& pattern_stats
) {
    std::ofstream out(config.output_path);
    if (!out.is_open()) {
        throw std::runtime_error("failed to open output file: " + config.output_path);
    }

    const int total_warps = config.blocks * config.warps_per_block;

    out << "{\n";
    out << "  \"probe_name\": \"warp_signature_permutation_probe\",\n";
    out << "  \"interpretation\": {\n";
    out << "    \"primary_question\": \"Does the progress signature follow workload pattern or warp id?\",\n";
    out << "    \"note\": \"This probe permutes workload pattern assignment across warp ids. Progress should be interpreted as execution signature, not absolute throughput ratio.\"\n";
    out << "  },\n";

    out << "  \"config\": {\n";
    out << "    \"num_runs_per_permutation\": " << config.num_runs_per_permutation << ",\n";
    out << "    \"num_permutations\": " << config.num_permutations << ",\n";
    out << "    \"warmup_runs\": " << config.warmup_runs << ",\n";
    out << "    \"blocks\": " << config.blocks << ",\n";
    out << "    \"warps_per_block\": " << config.warps_per_block << ",\n";
    out << "    \"threads_per_block\": " << config.threads_per_block << ",\n";
    out << "    \"cycle_budget\": " << config.cycle_budget << "\n";
    out << "  },\n";

    out << "  \"pattern_aggregate_stats\": [\n";
    for (std::size_t i = 0; i < pattern_stats.size(); ++i) {
        const auto& s = pattern_stats[i];

        out << "    {\n";
        out << "      \"pattern_id\": " << s.pattern_id << ",\n";
        out << "      \"mean_progress\": " << s.mean << ",\n";
        out << "      \"variance\": " << s.variance << ",\n";
        out << "      \"stddev\": " << s.stddev << ",\n";
        out << "      \"min_progress\": " << s.min_progress << ",\n";
        out << "      \"max_progress\": " << s.max_progress << "\n";
        out << "    }";

        if (i + 1 < pattern_stats.size()) out << ",";
        out << "\n";
    }
    out << "  ],\n";

    out << "  \"warp_permutation_stats\": [\n";
    for (std::size_t i = 0; i < warp_stats.size(); ++i) {
        const auto& s = warp_stats[i];

        out << "    {\n";
        out << "      \"permutation_id\": " << s.permutation_id << ",\n";
        out << "      \"block_id\": " << s.block_id << ",\n";
        out << "      \"warp_id\": " << s.warp_id << ",\n";
        out << "      \"pattern_id\": " << s.pattern_id << ",\n";
        out << "      \"mean_progress\": " << s.mean << ",\n";
        out << "      \"variance\": " << s.variance << ",\n";
        out << "      \"stddev\": " << s.stddev << ",\n";
        out << "      \"coefficient_of_variation\": " << s.coefficient_of_variation << ",\n";
        out << "      \"min_progress\": " << s.min_progress << ",\n";
        out << "      \"max_progress\": " << s.max_progress << "\n";
        out << "    }";

        if (i + 1 < warp_stats.size()) out << ",";
        out << "\n";
    }
    out << "  ],\n";

    out << "  \"raw_runs\": [\n";
    for (int p = 0; p < config.num_permutations; ++p) {
        out << "    {\n";
        out << "      \"permutation_id\": " << p << ",\n";

        out << "      \"pattern_assignment\": [";
        for (int w = 0; w < total_warps; ++w) {
            out << all_patterns[p][0][w];
            if (w + 1 < total_warps) out << ", ";
        }
        out << "],\n";

        out << "      \"runs\": [\n";
        for (int r = 0; r < config.num_runs_per_permutation; ++r) {
            out << "        {\n";
            out << "          \"run_id\": " << r << ",\n";
            out << "          \"warp_progress\": [";

            for (int w = 0; w < total_warps; ++w) {
                out << all_runs[p][r][w];
                if (w + 1 < total_warps) out << ", ";
            }

            out << "]\n";
            out << "        }";

            if (r + 1 < config.num_runs_per_permutation) out << ",";
            out << "\n";
        }
        out << "      ]\n";
        out << "    }";

        if (p + 1 < config.num_permutations) out << ",";
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

    if (config.num_permutations <= 0 || config.num_permutations > 4) {
        throw std::runtime_error("num_permutations must be in range [1, 4]");
    }

    const int total_warps = config.blocks * config.warps_per_block;
    const std::size_t progress_bytes = sizeof(std::uint64_t) * total_warps;
    const std::size_t pattern_bytes = sizeof(int) * total_warps;

    std::uint64_t* d_progress = nullptr;
    int* d_pattern_id = nullptr;

    cuda_check(cudaMalloc(&d_progress, progress_bytes), "cudaMalloc d_progress");
    cuda_check(cudaMalloc(&d_pattern_id, pattern_bytes), "cudaMalloc d_pattern_id");

    std::vector<std::uint64_t> h_progress(total_warps, 0);
    std::vector<int> h_pattern_id(total_warps, 0);

    // all_runs[permutation][run][warp]
    std::vector<std::vector<std::vector<std::uint64_t>>> all_runs(
        config.num_permutations,
        std::vector<std::vector<std::uint64_t>>(
            config.num_runs_per_permutation,
            std::vector<std::uint64_t>(total_warps, 0)
        )
    );

    // all_patterns[permutation][run][warp]
    std::vector<std::vector<std::vector<int>>> all_patterns(
        config.num_permutations,
        std::vector<std::vector<int>>(
            config.num_runs_per_permutation,
            std::vector<int>(total_warps, 0)
        )
    );

    // Warmup
    for (int r = 0; r < config.warmup_runs; ++r) {
        cuda_check(cudaMemset(d_progress, 0, progress_bytes), "cudaMemset warmup progress");
        cuda_check(cudaMemset(d_pattern_id, 0, pattern_bytes), "cudaMemset warmup pattern");

        cuda_check(
            launch_warp_signature_permutation_kernel(
                d_progress,
                d_pattern_id,
                config.cycle_budget,
                config.warps_per_block,
                0,
                -1 - r,
                config.blocks,
                config.threads_per_block
            ),
            "kernel launch warmup"
        );

        cuda_check(cudaDeviceSynchronize(), "cudaDeviceSynchronize warmup");
    }

    for (int p = 0; p < config.num_permutations; ++p) {
        for (int r = 0; r < config.num_runs_per_permutation; ++r) {
            cuda_check(cudaMemset(d_progress, 0, progress_bytes), "cudaMemset run progress");
            cuda_check(cudaMemset(d_pattern_id, 0, pattern_bytes), "cudaMemset run pattern");

            cuda_check(
                launch_warp_signature_permutation_kernel(
                    d_progress,
                    d_pattern_id,
                    config.cycle_budget,
                    config.warps_per_block,
                    p,
                    r,
                    config.blocks,
                    config.threads_per_block
                ),
                "kernel launch run"
            );

            cuda_check(cudaDeviceSynchronize(), "cudaDeviceSynchronize run");

            cuda_check(
                cudaMemcpy(h_progress.data(), d_progress, progress_bytes, cudaMemcpyDeviceToHost),
                "cudaMemcpy progress"
            );

            cuda_check(
                cudaMemcpy(h_pattern_id.data(), d_pattern_id, pattern_bytes, cudaMemcpyDeviceToHost),
                "cudaMemcpy pattern"
            );

            all_runs[p][r] = h_progress;
            all_patterns[p][r] = h_pattern_id;
        }
    }

    cuda_check(cudaFree(d_progress), "cudaFree d_progress");
    cuda_check(cudaFree(d_pattern_id), "cudaFree d_pattern_id");

    const auto warp_stats = compute_warp_stats(all_runs, config);
    const auto pattern_stats = compute_pattern_aggregate_stats(warp_stats);

    write_json(
        config,
        all_runs,
        all_patterns,
        warp_stats,
        pattern_stats
    );

    std::cout << "[warp_signature_permutation_probe] done\n";
    std::cout << "  permutations: " << config.num_permutations << "\n";
    std::cout << "  runs_per_permutation: " << config.num_runs_per_permutation << "\n";
    std::cout << "  total_warps: " << total_warps << "\n";
    std::cout << "  output: " << config.output_path << "\n";
}

} // namespace warp_signature_permutation_probe