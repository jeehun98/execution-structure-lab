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

extern "C" cudaError_t launch_initialize_latency_hiding_global_buffer(
    std::uint32_t* global_buffer,
    int global_buffer_size
);

extern "C" cudaError_t launch_latency_hiding_ratio_kernel(
    std::uint64_t* out_progress,
    int* out_role_id,
    int* out_ready_warp_count,
    int* out_stalled_warp_count,
    std::uint32_t* global_buffer,
    int global_buffer_size,
    std::uint64_t cycle_budget,
    int warps_per_block,
    int scenario_id,
    int run_id,
    int blocks,
    int threads_per_block
);

namespace latency_hiding_ratio_probe {

static void cuda_check(cudaError_t err, const char* msg) {
    if (err != cudaSuccess) {
        throw std::runtime_error(
            std::string(msg) + ": " + cudaGetErrorString(err)
        );
    }
}

static const char* role_name(int role_id) {
    switch (role_id) {
        case 0: return "light_alu_ready";
        case 1: return "dependent_global_stalled";
        default: return "unknown";
    }
}

static int stalled_warp_count_for_scenario_host(
    int scenario_id,
    int warps_per_block
) {
    if (scenario_id < 0) return 0;
    if (scenario_id > warps_per_block) return warps_per_block;
    return scenario_id;
}

static int ready_warp_count_for_scenario_host(
    int scenario_id,
    int warps_per_block
) {
    return warps_per_block -
        stalled_warp_count_for_scenario_host(scenario_id, warps_per_block);
}

static int resolve_role_id_host(
    int local_warp_id,
    int scenario_id,
    int warps_per_block
) {
    const int stalled_count = stalled_warp_count_for_scenario_host(
        scenario_id,
        warps_per_block
    );

    const int first_stalled_warp = warps_per_block - stalled_count;

    if (local_warp_id >= first_stalled_warp) {
        return 1;
    }

    return 0;
}

static std::string scenario_name(int scenario_id, int warps_per_block) {
    const int stalled_count =
        stalled_warp_count_for_scenario_host(scenario_id, warps_per_block);

    const int ready_count =
        ready_warp_count_for_scenario_host(scenario_id, warps_per_block);

    return std::to_string(ready_count) +
        "_ready_" +
        std::to_string(stalled_count) +
        "_stalled";
}

static std::vector<WarpScenarioStats> compute_warp_stats(
    const std::vector<std::vector<std::vector<std::uint64_t>>>& all_runs,
    const Config& config
) {
    const int total_warps = config.blocks * config.warps_per_block;

    std::vector<WarpScenarioStats> stats;
    stats.reserve(config.num_scenarios * total_warps);

    for (int s_id = 0; s_id < config.num_scenarios; ++s_id) {
        for (int w = 0; w < total_warps; ++w) {
            double sum = 0.0;

            std::uint64_t min_v =
                std::numeric_limits<std::uint64_t>::max();

            std::uint64_t max_v = 0;

            for (int r = 0; r < config.num_runs_per_scenario; ++r) {
                const std::uint64_t v = all_runs[s_id][r][w];

                sum += static_cast<double>(v);

                if (v < min_v) min_v = v;
                if (v > max_v) max_v = v;
            }

            const double mean =
                sum / static_cast<double>(config.num_runs_per_scenario);

            double var_sum = 0.0;

            for (int r = 0; r < config.num_runs_per_scenario; ++r) {
                const double diff =
                    static_cast<double>(all_runs[s_id][r][w]) - mean;

                var_sum += diff * diff;
            }

            const double variance =
                var_sum / static_cast<double>(config.num_runs_per_scenario);

            const double stddev = std::sqrt(variance);
            const double cv = mean == 0.0 ? 0.0 : stddev / mean;

            WarpScenarioStats ws;
            ws.scenario_id = s_id;
            ws.block_id = w / config.warps_per_block;
            ws.warp_id = w % config.warps_per_block;
            ws.role_id = resolve_role_id_host(
                ws.warp_id,
                s_id,
                config.warps_per_block
            );
            ws.ready_warp_count = ready_warp_count_for_scenario_host(
                s_id,
                config.warps_per_block
            );
            ws.stalled_warp_count = stalled_warp_count_for_scenario_host(
                s_id,
                config.warps_per_block
            );
            ws.mean = mean;
            ws.variance = variance;
            ws.stddev = stddev;
            ws.coefficient_of_variation = cv;
            ws.min_progress = min_v;
            ws.max_progress = max_v;

            stats.push_back(ws);
        }
    }

    return stats;
}

static std::vector<RoleAggregateStats> compute_role_stats(
    const std::vector<WarpScenarioStats>& warp_stats,
    int num_scenarios
) {
    std::vector<RoleAggregateStats> result;

    for (int s_id = 0; s_id < num_scenarios; ++s_id) {
        for (int role = 0; role <= 1; ++role) {
            std::vector<double> values;
            double cv_sum = 0.0;

            int cv_count = 0;
            std::uint64_t min_progress =
                std::numeric_limits<std::uint64_t>::max();

            std::uint64_t max_progress = 0;

            for (const auto& ws : warp_stats) {
                if (ws.scenario_id == s_id && ws.role_id == role) {
                    values.push_back(ws.mean);
                    cv_sum += ws.coefficient_of_variation;
                    cv_count += 1;

                    if (ws.min_progress < min_progress) {
                        min_progress = ws.min_progress;
                    }

                    if (ws.max_progress > max_progress) {
                        max_progress = ws.max_progress;
                    }
                }
            }

            if (values.empty()) {
                continue;
            }

            double sum = 0.0;
            double min_mean = std::numeric_limits<double>::max();
            double max_mean = 0.0;

            for (double v : values) {
                sum += v;
                if (v < min_mean) min_mean = v;
                if (v > max_mean) max_mean = v;
            }

            const double mean = sum / static_cast<double>(values.size());

            double var_sum = 0.0;

            for (double v : values) {
                const double diff = v - mean;
                var_sum += diff * diff;
            }

            const double variance =
                var_sum / static_cast<double>(values.size());

            const double stddev = std::sqrt(variance);

            RoleAggregateStats rs;
            rs.scenario_id = s_id;
            rs.role_id = role;
            rs.ready_warp_count = ready_warp_count_for_scenario_host(s_id, 8);
            rs.stalled_warp_count = stalled_warp_count_for_scenario_host(s_id, 8);
            rs.mean = mean;
            rs.variance = variance;
            rs.stddev = stddev;
            rs.coefficient_of_variation =
                cv_count == 0 ? 0.0 : cv_sum / static_cast<double>(cv_count);
            rs.min_progress = min_progress;
            rs.max_progress = max_progress;

            result.push_back(rs);
        }
    }

    return result;
}

static void write_json(
    const Config& config,
    const std::vector<std::vector<std::vector<std::uint64_t>>>& all_runs,
    const std::vector<std::vector<std::vector<int>>>& all_roles,
    const std::vector<std::vector<std::vector<int>>>& all_ready_counts,
    const std::vector<std::vector<std::vector<int>>>& all_stalled_counts,
    const std::vector<WarpScenarioStats>& warp_stats,
    const std::vector<RoleAggregateStats>& role_stats
) {
    std::ofstream out(config.output_path);

    if (!out.is_open()) {
        throw std::runtime_error(
            "failed to open output file: " + config.output_path
        );
    }

    const int total_warps = config.blocks * config.warps_per_block;

    out << "{\n";

    out << "  \"probe_name\": \"latency_hiding_ratio_probe\",\n";

    out << "  \"interpretation\": {\n";
    out << "    \"primary_question\": "
        << "\"How does ready warp supply hide global memory latency as stalled warp ratio increases?\",\n";
    out << "    \"note\": "
        << "\"This probe varies the ratio of ready light_alu warps to dependent_global_stalled warps. Progress values are execution signatures, not absolute throughput ratios.\"\n";
    out << "  },\n";

    out << "  \"role_map\": {\n";
    out << "    \"0\": \"light_alu_ready\",\n";
    out << "    \"1\": \"dependent_global_stalled\"\n";
    out << "  },\n";

    out << "  \"scenario_map\": {\n";
    for (int s_id = 0; s_id < config.num_scenarios; ++s_id) {
        out << "    \"" << s_id << "\": \""
            << scenario_name(s_id, config.warps_per_block) << "\"";

        if (s_id + 1 < config.num_scenarios) out << ",";
        out << "\n";
    }
    out << "  },\n";

    out << "  \"config\": {\n";
    out << "    \"num_runs_per_scenario\": "
        << config.num_runs_per_scenario << ",\n";
    out << "    \"num_scenarios\": " << config.num_scenarios << ",\n";
    out << "    \"warmup_runs\": " << config.warmup_runs << ",\n";
    out << "    \"blocks\": " << config.blocks << ",\n";
    out << "    \"warps_per_block\": " << config.warps_per_block << ",\n";
    out << "    \"threads_per_block\": " << config.threads_per_block << ",\n";
    out << "    \"cycle_budget\": " << config.cycle_budget << ",\n";
    out << "    \"global_buffer_size\": " << config.global_buffer_size << "\n";
    out << "  },\n";

    out << "  \"role_aggregate_stats\": [\n";
    for (std::size_t i = 0; i < role_stats.size(); ++i) {
        const auto& rs = role_stats[i];

        out << "    {\n";
        out << "      \"scenario_id\": " << rs.scenario_id << ",\n";
        out << "      \"scenario_name\": \""
            << scenario_name(rs.scenario_id, config.warps_per_block) << "\",\n";
        out << "      \"role_id\": " << rs.role_id << ",\n";
        out << "      \"role_name\": \"" << role_name(rs.role_id) << "\",\n";
        out << "      \"ready_warp_count\": " << rs.ready_warp_count << ",\n";
        out << "      \"stalled_warp_count\": " << rs.stalled_warp_count << ",\n";
        out << "      \"mean_progress\": " << rs.mean << ",\n";
        out << "      \"variance\": " << rs.variance << ",\n";
        out << "      \"stddev\": " << rs.stddev << ",\n";
        out << "      \"coefficient_of_variation\": "
            << rs.coefficient_of_variation << ",\n";
        out << "      \"min_progress\": " << rs.min_progress << ",\n";
        out << "      \"max_progress\": " << rs.max_progress << "\n";
        out << "    }";

        if (i + 1 < role_stats.size()) out << ",";
        out << "\n";
    }
    out << "  ],\n";

    out << "  \"warp_scenario_stats\": [\n";
    for (std::size_t i = 0; i < warp_stats.size(); ++i) {
        const auto& ws = warp_stats[i];

        out << "    {\n";
        out << "      \"scenario_id\": " << ws.scenario_id << ",\n";
        out << "      \"scenario_name\": \""
            << scenario_name(ws.scenario_id, config.warps_per_block) << "\",\n";
        out << "      \"block_id\": " << ws.block_id << ",\n";
        out << "      \"warp_id\": " << ws.warp_id << ",\n";
        out << "      \"role_id\": " << ws.role_id << ",\n";
        out << "      \"role_name\": \"" << role_name(ws.role_id) << "\",\n";
        out << "      \"ready_warp_count\": " << ws.ready_warp_count << ",\n";
        out << "      \"stalled_warp_count\": " << ws.stalled_warp_count << ",\n";
        out << "      \"mean_progress\": " << ws.mean << ",\n";
        out << "      \"variance\": " << ws.variance << ",\n";
        out << "      \"stddev\": " << ws.stddev << ",\n";
        out << "      \"coefficient_of_variation\": "
            << ws.coefficient_of_variation << ",\n";
        out << "      \"min_progress\": " << ws.min_progress << ",\n";
        out << "      \"max_progress\": " << ws.max_progress << "\n";
        out << "    }";

        if (i + 1 < warp_stats.size()) out << ",";
        out << "\n";
    }
    out << "  ],\n";

    out << "  \"raw_runs\": [\n";
    for (int s_id = 0; s_id < config.num_scenarios; ++s_id) {
        out << "    {\n";
        out << "      \"scenario_id\": " << s_id << ",\n";
        out << "      \"scenario_name\": \""
            << scenario_name(s_id, config.warps_per_block) << "\",\n";

        out << "      \"role_assignment\": [";
        for (int w = 0; w < total_warps; ++w) {
            out << all_roles[s_id][0][w];
            if (w + 1 < total_warps) out << ", ";
        }
        out << "],\n";

        out << "      \"ready_warp_count_assignment\": [";
        for (int w = 0; w < total_warps; ++w) {
            out << all_ready_counts[s_id][0][w];
            if (w + 1 < total_warps) out << ", ";
        }
        out << "],\n";

        out << "      \"stalled_warp_count_assignment\": [";
        for (int w = 0; w < total_warps; ++w) {
            out << all_stalled_counts[s_id][0][w];
            if (w + 1 < total_warps) out << ", ";
        }
        out << "],\n";

        out << "      \"runs\": [\n";
        for (int r = 0; r < config.num_runs_per_scenario; ++r) {
            out << "        {\n";
            out << "          \"run_id\": " << r << ",\n";
            out << "          \"warp_progress\": [";

            for (int w = 0; w < total_warps; ++w) {
                out << all_runs[s_id][r][w];
                if (w + 1 < total_warps) out << ", ";
            }

            out << "]\n";
            out << "        }";

            if (r + 1 < config.num_runs_per_scenario) out << ",";
            out << "\n";
        }

        out << "      ]\n";
        out << "    }";

        if (s_id + 1 < config.num_scenarios) out << ",";
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
        throw std::runtime_error(
            "warps_per_block exceeds threads_per_block capacity"
        );
    }

    if (config.num_scenarios <= 0 ||
        config.num_scenarios > config.warps_per_block + 1) {
        throw std::runtime_error(
            "num_scenarios must be in range [1, warps_per_block + 1]"
        );
    }

    if ((config.global_buffer_size & (config.global_buffer_size - 1)) != 0) {
        throw std::runtime_error("global_buffer_size must be power of two");
    }

    const int total_warps = config.blocks * config.warps_per_block;

    const std::size_t progress_bytes =
        sizeof(std::uint64_t) * total_warps;

    const std::size_t int_bytes =
        sizeof(int) * total_warps;

    const std::size_t global_bytes =
        sizeof(std::uint32_t) *
        static_cast<std::size_t>(config.global_buffer_size);

    std::uint64_t* d_progress = nullptr;
    int* d_role_id = nullptr;
    int* d_ready_warp_count = nullptr;
    int* d_stalled_warp_count = nullptr;
    std::uint32_t* d_global_buffer = nullptr;

    cuda_check(cudaMalloc(&d_progress, progress_bytes), "cudaMalloc d_progress");
    cuda_check(cudaMalloc(&d_role_id, int_bytes), "cudaMalloc d_role_id");
    cuda_check(cudaMalloc(&d_ready_warp_count, int_bytes), "cudaMalloc d_ready_warp_count");
    cuda_check(cudaMalloc(&d_stalled_warp_count, int_bytes), "cudaMalloc d_stalled_warp_count");
    cuda_check(cudaMalloc(&d_global_buffer, global_bytes), "cudaMalloc d_global_buffer");

    cuda_check(
        launch_initialize_latency_hiding_global_buffer(
            d_global_buffer,
            config.global_buffer_size
        ),
        "launch_initialize_latency_hiding_global_buffer"
    );

    cuda_check(
        cudaDeviceSynchronize(),
        "cudaDeviceSynchronize initialize global buffer"
    );

    std::vector<std::uint64_t> h_progress(total_warps, 0);
    std::vector<int> h_role_id(total_warps, 0);
    std::vector<int> h_ready_warp_count(total_warps, 0);
    std::vector<int> h_stalled_warp_count(total_warps, 0);

    std::vector<std::vector<std::vector<std::uint64_t>>> all_runs(
        config.num_scenarios,
        std::vector<std::vector<std::uint64_t>>(
            config.num_runs_per_scenario,
            std::vector<std::uint64_t>(total_warps, 0)
        )
    );

    std::vector<std::vector<std::vector<int>>> all_roles(
        config.num_scenarios,
        std::vector<std::vector<int>>(
            config.num_runs_per_scenario,
            std::vector<int>(total_warps, 0)
        )
    );

    std::vector<std::vector<std::vector<int>>> all_ready_counts(
        config.num_scenarios,
        std::vector<std::vector<int>>(
            config.num_runs_per_scenario,
            std::vector<int>(total_warps, 0)
        )
    );

    std::vector<std::vector<std::vector<int>>> all_stalled_counts(
        config.num_scenarios,
        std::vector<std::vector<int>>(
            config.num_runs_per_scenario,
            std::vector<int>(total_warps, 0)
        )
    );

    for (int r = 0; r < config.warmup_runs; ++r) {
        cuda_check(cudaMemset(d_progress, 0, progress_bytes), "cudaMemset warmup progress");
        cuda_check(cudaMemset(d_role_id, 0, int_bytes), "cudaMemset warmup role");
        cuda_check(cudaMemset(d_ready_warp_count, 0, int_bytes), "cudaMemset warmup ready count");
        cuda_check(cudaMemset(d_stalled_warp_count, 0, int_bytes), "cudaMemset warmup stalled count");

        cuda_check(
            launch_latency_hiding_ratio_kernel(
                d_progress,
                d_role_id,
                d_ready_warp_count,
                d_stalled_warp_count,
                d_global_buffer,
                config.global_buffer_size,
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

    for (int s_id = 0; s_id < config.num_scenarios; ++s_id) {
        for (int r = 0; r < config.num_runs_per_scenario; ++r) {
            cuda_check(cudaMemset(d_progress, 0, progress_bytes), "cudaMemset run progress");
            cuda_check(cudaMemset(d_role_id, 0, int_bytes), "cudaMemset run role");
            cuda_check(cudaMemset(d_ready_warp_count, 0, int_bytes), "cudaMemset run ready count");
            cuda_check(cudaMemset(d_stalled_warp_count, 0, int_bytes), "cudaMemset run stalled count");

            cuda_check(
                launch_latency_hiding_ratio_kernel(
                    d_progress,
                    d_role_id,
                    d_ready_warp_count,
                    d_stalled_warp_count,
                    d_global_buffer,
                    config.global_buffer_size,
                    config.cycle_budget,
                    config.warps_per_block,
                    s_id,
                    r,
                    config.blocks,
                    config.threads_per_block
                ),
                "kernel launch run"
            );

            cuda_check(cudaDeviceSynchronize(), "cudaDeviceSynchronize run");

            cuda_check(
                cudaMemcpy(
                    h_progress.data(),
                    d_progress,
                    progress_bytes,
                    cudaMemcpyDeviceToHost
                ),
                "cudaMemcpy progress"
            );

            cuda_check(
                cudaMemcpy(
                    h_role_id.data(),
                    d_role_id,
                    int_bytes,
                    cudaMemcpyDeviceToHost
                ),
                "cudaMemcpy role"
            );

            cuda_check(
                cudaMemcpy(
                    h_ready_warp_count.data(),
                    d_ready_warp_count,
                    int_bytes,
                    cudaMemcpyDeviceToHost
                ),
                "cudaMemcpy ready count"
            );

            cuda_check(
                cudaMemcpy(
                    h_stalled_warp_count.data(),
                    d_stalled_warp_count,
                    int_bytes,
                    cudaMemcpyDeviceToHost
                ),
                "cudaMemcpy stalled count"
            );

            all_runs[s_id][r] = h_progress;
            all_roles[s_id][r] = h_role_id;
            all_ready_counts[s_id][r] = h_ready_warp_count;
            all_stalled_counts[s_id][r] = h_stalled_warp_count;
        }
    }

    cuda_check(cudaFree(d_progress), "cudaFree d_progress");
    cuda_check(cudaFree(d_role_id), "cudaFree d_role_id");
    cuda_check(cudaFree(d_ready_warp_count), "cudaFree d_ready_warp_count");
    cuda_check(cudaFree(d_stalled_warp_count), "cudaFree d_stalled_warp_count");
    cuda_check(cudaFree(d_global_buffer), "cudaFree d_global_buffer");

    const auto warp_stats = compute_warp_stats(all_runs, config);
    const auto role_stats = compute_role_stats(
        warp_stats,
        config.num_scenarios
    );

    write_json(
        config,
        all_runs,
        all_roles,
        all_ready_counts,
        all_stalled_counts,
        warp_stats,
        role_stats
    );

    std::cout << "[latency_hiding_ratio_probe] done\n";
    std::cout << "  scenarios: " << config.num_scenarios << "\n";
    std::cout << "  runs_per_scenario: "
              << config.num_runs_per_scenario << "\n";
    std::cout << "  total_warps: " << total_warps << "\n";
    std::cout << "  output: " << config.output_path << "\n";
}

} // namespace latency_hiding_ratio_probe