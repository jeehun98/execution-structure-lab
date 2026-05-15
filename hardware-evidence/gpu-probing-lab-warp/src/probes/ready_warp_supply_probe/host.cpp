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

extern "C" cudaError_t launch_initialize_ready_warp_supply_global_buffer(
    std::uint32_t* global_buffer,
    int global_buffer_size,
    std::uint32_t seed
);

extern "C" cudaError_t launch_ready_warp_supply_kernel(
    std::uint64_t* out_progress,
    int* out_role_id,
    std::uint32_t* global_buffer,
    int global_buffer_size,
    std::uint64_t cycle_budget,
    int warps_per_block,
    int ready_warp_count,
    int condition_id,
    int run_id,
    int blocks,
    int threads_per_block
);

namespace ready_warp_supply_probe {

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
        case 1: return "dependent_alu_ready";
        case 2: return "shared_load_ready";
        case 3: return "dependent_global_stalled";
        default: return "unknown";
    }
}

static const char* condition_name(int condition_id) {
    switch (condition_id) {
        case 0: return "light_ready_vs_global_stalled";
        case 1: return "dependent_alu_ready_vs_global_stalled";
        case 2: return "shared_load_ready_vs_global_stalled";
        case 3: return "mixed_ready_sources_vs_global_stalled";
        case 4: return "all_global_stalled";
        default: return "unknown";
    }
}

static int resolve_role_id_host(
    int local_warp_id,
    int condition_id,
    int ready_warp_count
) {
    if (condition_id == 4) {
        return 3;
    }

    if (local_warp_id >= ready_warp_count) {
        return 3;
    }

    if (condition_id == 0) {
        return 0;
    }

    if (condition_id == 1) {
        return 1;
    }

    if (condition_id == 2) {
        return 2;
    }

    const int mod = local_warp_id & 3;

    if (mod == 0) return 0;
    if (mod == 1) return 1;
    if (mod == 2) return 2;

    return 0;
}

static std::vector<WarpConditionStats> compute_warp_stats(
    const std::vector<std::vector<std::vector<std::uint64_t>>>& all_runs,
    const Config& config
) {
    const int total_warps = config.blocks * config.warps_per_block;

    std::vector<WarpConditionStats> stats;
    stats.reserve(config.num_conditions * total_warps);

    for (int c = 0; c < config.num_conditions; ++c) {
        for (int w = 0; w < total_warps; ++w) {
            double sum = 0.0;

            std::uint64_t min_v =
                std::numeric_limits<std::uint64_t>::max();

            std::uint64_t max_v = 0;

            for (int r = 0; r < config.num_runs_per_condition; ++r) {
                const std::uint64_t v = all_runs[c][r][w];

                sum += static_cast<double>(v);

                if (v < min_v) min_v = v;
                if (v > max_v) max_v = v;
            }

            const double mean =
                sum / static_cast<double>(config.num_runs_per_condition);

            double var_sum = 0.0;

            for (int r = 0; r < config.num_runs_per_condition; ++r) {
                const double diff =
                    static_cast<double>(all_runs[c][r][w]) - mean;

                var_sum += diff * diff;
            }

            const double variance =
                var_sum / static_cast<double>(config.num_runs_per_condition);

            const double stddev = std::sqrt(variance);
            const double cv = mean == 0.0 ? 0.0 : stddev / mean;

            WarpConditionStats ws;
            ws.condition_id = c;
            ws.block_id = w / config.warps_per_block;
            ws.warp_id = w % config.warps_per_block;
            ws.role_id = resolve_role_id_host(
                ws.warp_id,
                c,
                config.ready_warp_count
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
    const std::vector<WarpConditionStats>& warp_stats,
    int num_conditions
) {
    std::vector<RoleAggregateStats> result;

    for (int c = 0; c < num_conditions; ++c) {
        for (int role = 0; role <= 3; ++role) {
            std::vector<double> values;
            double cv_sum = 0.0;
            int cv_count = 0;

            std::uint64_t min_progress =
                std::numeric_limits<std::uint64_t>::max();

            std::uint64_t max_progress = 0;

            for (const auto& ws : warp_stats) {
                if (ws.condition_id == c && ws.role_id == role) {
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

            for (double v : values) {
                sum += v;
            }

            const double mean =
                sum / static_cast<double>(values.size());

            double var_sum = 0.0;

            for (double v : values) {
                const double diff = v - mean;
                var_sum += diff * diff;
            }

            const double variance =
                var_sum / static_cast<double>(values.size());

            RoleAggregateStats rs;
            rs.condition_id = c;
            rs.role_id = role;
            rs.mean = mean;
            rs.variance = variance;
            rs.stddev = std::sqrt(variance);
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
    const std::vector<WarpConditionStats>& warp_stats,
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

    out << "  \"probe_name\": \"ready_warp_supply_probe\",\n";

    out << "  \"interpretation\": {\n";
    out << "    \"primary_question\": "
        << "\"Which ready warp source hides global memory stall most effectively?\",\n";
    out << "    \"note\": "
        << "\"This probe fixes the stalled global warp count and changes the ready warp source. Progress values are execution signatures, not absolute throughput ratios.\"\n";
    out << "  },\n";

    out << "  \"role_map\": {\n";
    out << "    \"0\": \"light_alu_ready\",\n";
    out << "    \"1\": \"dependent_alu_ready\",\n";
    out << "    \"2\": \"shared_load_ready\",\n";
    out << "    \"3\": \"dependent_global_stalled\"\n";
    out << "  },\n";

    out << "  \"condition_map\": {\n";
    for (int c = 0; c < config.num_conditions; ++c) {
        out << "    \"" << c << "\": \"" << condition_name(c) << "\"";

        if (c + 1 < config.num_conditions) {
            out << ",";
        }

        out << "\n";
    }
    out << "  },\n";

    out << "  \"config\": {\n";
    out << "    \"num_runs_per_condition\": "
        << config.num_runs_per_condition << ",\n";
    out << "    \"num_conditions\": "
        << config.num_conditions << ",\n";
    out << "    \"warmup_runs\": "
        << config.warmup_runs << ",\n";
    out << "    \"blocks\": "
        << config.blocks << ",\n";
    out << "    \"warps_per_block\": "
        << config.warps_per_block << ",\n";
    out << "    \"threads_per_block\": "
        << config.threads_per_block << ",\n";
    out << "    \"cycle_budget\": "
        << config.cycle_budget << ",\n";
    out << "    \"global_buffer_size\": "
        << config.global_buffer_size << ",\n";
    out << "    \"ready_warp_count\": "
        << config.ready_warp_count << ",\n";
    out << "    \"stalled_warp_count\": "
        << config.stalled_warp_count << ",\n";
    out << "    \"pre_measurement_global_warmup\": "
        << config.pre_measurement_global_warmup << "\n";
    out << "  },\n";

    out << "  \"role_aggregate_stats\": [\n";
    for (std::size_t i = 0; i < role_stats.size(); ++i) {
        const auto& rs = role_stats[i];

        out << "    {\n";
        out << "      \"condition_id\": " << rs.condition_id << ",\n";
        out << "      \"condition_name\": \""
            << condition_name(rs.condition_id) << "\",\n";
        out << "      \"role_id\": " << rs.role_id << ",\n";
        out << "      \"role_name\": \"" << role_name(rs.role_id) << "\",\n";
        out << "      \"mean_progress\": " << rs.mean << ",\n";
        out << "      \"variance\": " << rs.variance << ",\n";
        out << "      \"stddev\": " << rs.stddev << ",\n";
        out << "      \"coefficient_of_variation\": "
            << rs.coefficient_of_variation << ",\n";
        out << "      \"min_progress\": " << rs.min_progress << ",\n";
        out << "      \"max_progress\": " << rs.max_progress << "\n";
        out << "    }";

        if (i + 1 < role_stats.size()) {
            out << ",";
        }

        out << "\n";
    }
    out << "  ],\n";

    out << "  \"warp_condition_stats\": [\n";
    for (std::size_t i = 0; i < warp_stats.size(); ++i) {
        const auto& ws = warp_stats[i];

        out << "    {\n";
        out << "      \"condition_id\": " << ws.condition_id << ",\n";
        out << "      \"condition_name\": \""
            << condition_name(ws.condition_id) << "\",\n";
        out << "      \"block_id\": " << ws.block_id << ",\n";
        out << "      \"warp_id\": " << ws.warp_id << ",\n";
        out << "      \"role_id\": " << ws.role_id << ",\n";
        out << "      \"role_name\": \"" << role_name(ws.role_id) << "\",\n";
        out << "      \"mean_progress\": " << ws.mean << ",\n";
        out << "      \"variance\": " << ws.variance << ",\n";
        out << "      \"stddev\": " << ws.stddev << ",\n";
        out << "      \"coefficient_of_variation\": "
            << ws.coefficient_of_variation << ",\n";
        out << "      \"min_progress\": " << ws.min_progress << ",\n";
        out << "      \"max_progress\": " << ws.max_progress << "\n";
        out << "    }";

        if (i + 1 < warp_stats.size()) {
            out << ",";
        }

        out << "\n";
    }
    out << "  ],\n";

    out << "  \"raw_runs\": [\n";
    for (int c = 0; c < config.num_conditions; ++c) {
        out << "    {\n";
        out << "      \"condition_id\": " << c << ",\n";
        out << "      \"condition_name\": \""
            << condition_name(c) << "\",\n";

        out << "      \"role_assignment\": [";
        for (int w = 0; w < total_warps; ++w) {
            out << all_roles[c][0][w];

            if (w + 1 < total_warps) {
                out << ", ";
            }
        }
        out << "],\n";

        out << "      \"runs\": [\n";
        for (int r = 0; r < config.num_runs_per_condition; ++r) {
            out << "        {\n";
            out << "          \"run_id\": " << r << ",\n";
            out << "          \"warp_progress\": [";

            for (int w = 0; w < total_warps; ++w) {
                out << all_runs[c][r][w];

                if (w + 1 < total_warps) {
                    out << ", ";
                }
            }

            out << "]\n";
            out << "        }";

            if (r + 1 < config.num_runs_per_condition) {
                out << ",";
            }

            out << "\n";
        }

        out << "      ]\n";
        out << "    }";

        if (c + 1 < config.num_conditions) {
            out << ",";
        }

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

    if (config.ready_warp_count + config.stalled_warp_count !=
        config.warps_per_block) {
        throw std::runtime_error(
            "ready_warp_count + stalled_warp_count must equal warps_per_block"
        );
    }

    if (config.num_conditions <= 0 || config.num_conditions > 5) {
        throw std::runtime_error("num_conditions must be in range [1, 5]");
    }

    if ((config.global_buffer_size & (config.global_buffer_size - 1)) != 0) {
        throw std::runtime_error("global_buffer_size must be power of two");
    }

    const int total_warps = config.blocks * config.warps_per_block;

    const std::size_t progress_bytes =
        sizeof(std::uint64_t) * total_warps;

    const std::size_t role_bytes =
        sizeof(int) * total_warps;

    const std::size_t global_bytes =
        sizeof(std::uint32_t) *
        static_cast<std::size_t>(config.global_buffer_size);

    std::uint64_t* d_progress = nullptr;
    int* d_role_id = nullptr;
    std::uint32_t* d_global_buffer = nullptr;

    cuda_check(cudaMalloc(&d_progress, progress_bytes), "cudaMalloc d_progress");
    cuda_check(cudaMalloc(&d_role_id, role_bytes), "cudaMalloc d_role_id");
    cuda_check(cudaMalloc(&d_global_buffer, global_bytes), "cudaMalloc d_global_buffer");

    cuda_check(
        launch_initialize_ready_warp_supply_global_buffer(
            d_global_buffer,
            config.global_buffer_size,
            0x12345678u
        ),
        "initialize global buffer"
    );

    cuda_check(cudaDeviceSynchronize(), "initialize synchronize");

    std::vector<std::uint64_t> h_progress(total_warps, 0);
    std::vector<int> h_role_id(total_warps, 0);

    std::vector<std::vector<std::vector<std::uint64_t>>> all_runs(
        config.num_conditions,
        std::vector<std::vector<std::uint64_t>>(
            config.num_runs_per_condition,
            std::vector<std::uint64_t>(total_warps, 0)
        )
    );

    std::vector<std::vector<std::vector<int>>> all_roles(
        config.num_conditions,
        std::vector<std::vector<int>>(
            config.num_runs_per_condition,
            std::vector<int>(total_warps, 0)
        )
    );

    for (int r = 0; r < config.warmup_runs; ++r) {
        cuda_check(cudaMemset(d_progress, 0, progress_bytes), "cudaMemset warmup progress");
        cuda_check(cudaMemset(d_role_id, 0, role_bytes), "cudaMemset warmup role");

        cuda_check(
            launch_ready_warp_supply_kernel(
                d_progress,
                d_role_id,
                d_global_buffer,
                config.global_buffer_size,
                config.cycle_budget,
                config.warps_per_block,
                config.ready_warp_count,
                0,
                -1 - r,
                config.blocks,
                config.threads_per_block
            ),
            "warmup kernel"
        );

        cuda_check(cudaDeviceSynchronize(), "warmup synchronize");
    }

    for (int c = 0; c < config.num_conditions; ++c) {
        for (int r = 0; r < config.num_runs_per_condition; ++r) {
            if (config.pre_measurement_global_warmup != 0) {
                cuda_check(cudaMemset(d_progress, 0, progress_bytes), "cudaMemset prewarm progress");
                cuda_check(cudaMemset(d_role_id, 0, role_bytes), "cudaMemset prewarm role");

                cuda_check(
                    launch_ready_warp_supply_kernel(
                        d_progress,
                        d_role_id,
                        d_global_buffer,
                        config.global_buffer_size,
                        config.cycle_budget,
                        config.warps_per_block,
                        config.ready_warp_count,
                        c,
                        -1000 - r,
                        config.blocks,
                        config.threads_per_block
                    ),
                    "pre-measurement global warmup kernel"
                );

                cuda_check(cudaDeviceSynchronize(), "pre-measurement warmup synchronize");
            }

            cuda_check(cudaMemset(d_progress, 0, progress_bytes), "cudaMemset measured progress");
            cuda_check(cudaMemset(d_role_id, 0, role_bytes), "cudaMemset measured role");

            cuda_check(
                launch_ready_warp_supply_kernel(
                    d_progress,
                    d_role_id,
                    d_global_buffer,
                    config.global_buffer_size,
                    config.cycle_budget,
                    config.warps_per_block,
                    config.ready_warp_count,
                    c,
                    r,
                    config.blocks,
                    config.threads_per_block
                ),
                "measured kernel"
            );

            cuda_check(cudaDeviceSynchronize(), "measured synchronize");

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
                    role_bytes,
                    cudaMemcpyDeviceToHost
                ),
                "cudaMemcpy role"
            );

            all_runs[c][r] = h_progress;
            all_roles[c][r] = h_role_id;
        }
    }

    cuda_check(cudaFree(d_progress), "cudaFree d_progress");
    cuda_check(cudaFree(d_role_id), "cudaFree d_role_id");
    cuda_check(cudaFree(d_global_buffer), "cudaFree d_global_buffer");

    const auto warp_stats = compute_warp_stats(all_runs, config);
    const auto role_stats = compute_role_stats(
        warp_stats,
        config.num_conditions
    );

    write_json(
        config,
        all_runs,
        all_roles,
        warp_stats,
        role_stats
    );

    std::cout << "[ready_warp_supply_probe] done\n";
    std::cout << "  conditions: " << config.num_conditions << "\n";
    std::cout << "  runs_per_condition: "
              << config.num_runs_per_condition << "\n";
    std::cout << "  total_warps: " << total_warps << "\n";
    std::cout << "  output: " << config.output_path << "\n";
}

} // namespace ready_warp_supply_probe