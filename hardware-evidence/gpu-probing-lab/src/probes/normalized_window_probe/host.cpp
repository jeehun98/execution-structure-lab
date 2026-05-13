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

extern "C" cudaError_t launch_initialize_normalized_window_global_buffer(
    std::uint32_t* global_buffer,
    int global_buffer_size,
    std::uint32_t seed
);

extern "C" cudaError_t launch_normalized_window_dummy_kernel(
    std::uint32_t* global_buffer,
    std::uint32_t* sink,
    int global_buffer_size,
    std::uint64_t cycle_budget,
    int condition_id,
    int batch_id,
    int run_id
);

extern "C" cudaError_t launch_normalized_window_kernel(
    std::uint64_t* out_progress,
    int* out_role_id,
    std::uint32_t* global_buffer,
    int global_buffer_size,
    std::uint64_t cycle_budget,
    int warps_per_block,
    int ready_warp_count,
    int light_warp_id,
    int condition_id,
    int batch_id,
    int run_id,
    int blocks,
    int threads_per_block
);

namespace normalized_window_probe {

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
        case 1: return "shared_dependent_chain_ready";
        case 2: return "dependent_global_stalled";
        default: return "unknown";
    }
}

static const char* condition_name(int condition_id) {
    switch (condition_id) {
        case 0: return "cycle50k_scaled_threshold_no_dummy";
        case 1: return "cycle100k_scaled_threshold_no_dummy";
        case 2: return "cycle200k_scaled_threshold_no_dummy";
        case 3: return "cycle400k_scaled_threshold_no_dummy";
        case 4: return "cycle100k_scaled_threshold_dummy_before";
        case 5: return "cycle200k_scaled_threshold_dummy_before";
        default: return "unknown";
    }
}

static std::uint64_t cycle_budget_for_condition(
    int condition_id,
    std::uint64_t base_cycle_budget
) {
    switch (condition_id) {
        case 0: return base_cycle_budget / 2;
        case 1: return base_cycle_budget;
        case 2: return base_cycle_budget * 2;
        case 3: return base_cycle_budget * 4;
        case 4: return base_cycle_budget;
        case 5: return base_cycle_budget * 2;
        default: return base_cycle_budget;
    }
}

static int dummy_before_for_condition(int condition_id) {
    return condition_id == 4 || condition_id == 5;
}

static int scaled_threshold_for_condition(
    int condition_id,
    const Config& config
) {
    const std::uint64_t cycle_budget =
        cycle_budget_for_condition(
            condition_id,
            config.base_cycle_budget
        );

    const double ratio =
        static_cast<double>(cycle_budget) /
        static_cast<double>(config.base_cycle_budget);

    return static_cast<int>(
        std::llround(
            static_cast<double>(config.base_transient_threshold) * ratio
        )
    );
}

static int resolve_role_id_host(
    int local_warp_id,
    int ready_warp_count,
    int light_warp_id
) {
    if (local_warp_id >= ready_warp_count) {
        return 2;
    }

    if (local_warp_id == light_warp_id) {
        return 0;
    }

    return 1;
}

static std::vector<WarpConditionStats> compute_warp_stats(
    const std::vector<std::vector<std::vector<std::vector<std::uint64_t>>>>& all_runs,
    const Config& config
) {
    std::vector<WarpConditionStats> stats;

    const int total_warps = config.blocks * config.warps_per_block;

    for (int c = 0; c < config.num_conditions; ++c) {
        const std::uint64_t cycle_budget =
            cycle_budget_for_condition(c, config.base_cycle_budget);

        const int scaled_threshold =
            scaled_threshold_for_condition(c, config);

        for (int w = 0; w < total_warps; ++w) {
            double sum = 0.0;

            std::uint64_t min_v =
                std::numeric_limits<std::uint64_t>::max();

            std::uint64_t max_v = 0;

            int sample_count = 0;
            int transient_count = 0;

            const int local_warp_id = w % config.warps_per_block;

            const int role_id = resolve_role_id_host(
                local_warp_id,
                config.ready_warp_count,
                config.light_warp_id
            );

            for (int b = 0; b < config.num_batches; ++b) {
                for (int r = 0; r < config.runs_per_batch; ++r) {
                    const std::uint64_t v = all_runs[c][b][r][w];

                    sum += static_cast<double>(v);

                    if (v < min_v) min_v = v;
                    if (v > max_v) max_v = v;

                    if (role_id == 2 &&
                        v < static_cast<std::uint64_t>(scaled_threshold)) {
                        transient_count += 1;
                    }

                    sample_count += 1;
                }
            }

            const double mean =
                sum / static_cast<double>(sample_count);

            double var_sum = 0.0;

            for (int b = 0; b < config.num_batches; ++b) {
                for (int r = 0; r < config.runs_per_batch; ++r) {
                    const double diff =
                        static_cast<double>(all_runs[c][b][r][w]) - mean;

                    var_sum += diff * diff;
                }
            }

            const double variance =
                var_sum / static_cast<double>(sample_count);

            WarpConditionStats ws;
            ws.condition_id = c;
            ws.block_id = w / config.warps_per_block;
            ws.warp_id = local_warp_id;
            ws.role_id = role_id;
            ws.cycle_budget = cycle_budget;
            ws.scaled_threshold = scaled_threshold;
            ws.mean_progress = mean;
            ws.mean_normalized_progress =
                mean / static_cast<double>(cycle_budget);
            ws.variance = variance;
            ws.stddev = std::sqrt(variance);
            ws.coefficient_of_variation =
                mean == 0.0 ? 0.0 : ws.stddev / mean;
            ws.min_progress = min_v;
            ws.max_progress = max_v;
            ws.min_normalized_progress =
                static_cast<double>(min_v) /
                static_cast<double>(cycle_budget);
            ws.max_normalized_progress =
                static_cast<double>(max_v) /
                static_cast<double>(cycle_budget);
            ws.transient_count = transient_count;
            ws.transient_rate =
                static_cast<double>(transient_count) /
                static_cast<double>(sample_count);

            stats.push_back(ws);
        }
    }

    return stats;
}

static std::vector<RoleAggregateStats> compute_role_stats(
    const std::vector<WarpConditionStats>& warp_stats,
    const Config& config
) {
    std::vector<RoleAggregateStats> result;

    const int total_runs =
        config.num_batches * config.runs_per_batch;

    for (int c = 0; c < config.num_conditions; ++c) {
        const std::uint64_t cycle_budget =
            cycle_budget_for_condition(c, config.base_cycle_budget);

        const int scaled_threshold =
            scaled_threshold_for_condition(c, config);

        for (int role = 0; role <= 2; ++role) {
            std::vector<double> means;
            std::vector<double> normalized_means;

            double cv_sum = 0.0;
            int cv_count = 0;

            std::uint64_t min_progress =
                std::numeric_limits<std::uint64_t>::max();

            std::uint64_t max_progress = 0;

            double min_normalized_progress =
                std::numeric_limits<double>::max();

            double max_normalized_progress = 0.0;

            int transient_count = 0;
            int role_warp_count = 0;

            for (const auto& ws : warp_stats) {
                if (ws.condition_id == c && ws.role_id == role) {
                    means.push_back(ws.mean_progress);
                    normalized_means.push_back(ws.mean_normalized_progress);

                    cv_sum += ws.coefficient_of_variation;
                    cv_count += 1;
                    role_warp_count += 1;

                    if (ws.min_progress < min_progress) {
                        min_progress = ws.min_progress;
                    }

                    if (ws.max_progress > max_progress) {
                        max_progress = ws.max_progress;
                    }

                    if (ws.min_normalized_progress < min_normalized_progress) {
                        min_normalized_progress = ws.min_normalized_progress;
                    }

                    if (ws.max_normalized_progress > max_normalized_progress) {
                        max_normalized_progress = ws.max_normalized_progress;
                    }

                    transient_count += ws.transient_count;
                }
            }

            if (means.empty()) {
                continue;
            }

            double sum = 0.0;
            double normalized_sum = 0.0;

            for (double v : means) sum += v;
            for (double v : normalized_means) normalized_sum += v;

            const double mean =
                sum / static_cast<double>(means.size());

            const double normalized_mean =
                normalized_sum /
                static_cast<double>(normalized_means.size());

            double var_sum = 0.0;

            for (double v : means) {
                const double diff = v - mean;
                var_sum += diff * diff;
            }

            RoleAggregateStats rs;
            rs.condition_id = c;
            rs.role_id = role;
            rs.cycle_budget = cycle_budget;
            rs.scaled_threshold = scaled_threshold;
            rs.mean_progress = mean;
            rs.mean_normalized_progress = normalized_mean;
            rs.variance =
                var_sum / static_cast<double>(means.size());
            rs.stddev = std::sqrt(rs.variance);
            rs.coefficient_of_variation =
                cv_count == 0
                    ? 0.0
                    : cv_sum / static_cast<double>(cv_count);
            rs.min_progress = min_progress;
            rs.max_progress = max_progress;
            rs.min_normalized_progress = min_normalized_progress;
            rs.max_normalized_progress = max_normalized_progress;
            rs.transient_count = transient_count;

            const int denom = role_warp_count * total_runs;
            rs.transient_rate =
                denom == 0
                    ? 0.0
                    : static_cast<double>(transient_count) /
                        static_cast<double>(denom);

            result.push_back(rs);
        }
    }

    return result;
}

static std::vector<RunTransientEvent> compute_transient_events(
    const std::vector<std::vector<std::vector<std::vector<std::uint64_t>>>>& all_runs,
    const Config& config
) {
    std::vector<RunTransientEvent> events;

    const int total_warps = config.blocks * config.warps_per_block;

    for (int c = 0; c < config.num_conditions; ++c) {
        const std::uint64_t cycle_budget =
            cycle_budget_for_condition(c, config.base_cycle_budget);

        const int scaled_threshold =
            scaled_threshold_for_condition(c, config);

        for (int b = 0; b < config.num_batches; ++b) {
            for (int r = 0; r < config.runs_per_batch; ++r) {
                for (int block = 0; block < config.blocks; ++block) {
                    int min_global =
                        std::numeric_limits<int>::max();

                    for (int local_warp = 0;
                         local_warp < config.warps_per_block;
                         ++local_warp) {
                        const int role_id = resolve_role_id_host(
                            local_warp,
                            config.ready_warp_count,
                            config.light_warp_id
                        );

                        if (role_id != 2) {
                            continue;
                        }

                        const int global_warp_index =
                            block * config.warps_per_block + local_warp;

                        if (global_warp_index >= total_warps) {
                            continue;
                        }

                        const int progress =
                            static_cast<int>(
                                all_runs[c][b][r][global_warp_index]
                            );

                        if (progress < min_global) {
                            min_global = progress;
                        }
                    }

                    if (min_global < scaled_threshold) {
                        RunTransientEvent event;
                        event.condition_id = c;
                        event.batch_id = b;
                        event.run_id = r;
                        event.block_id = block;
                        event.cycle_budget = cycle_budget;
                        event.scaled_threshold = scaled_threshold;
                        event.min_global_progress = min_global;
                        event.min_global_normalized_progress =
                            static_cast<double>(min_global) /
                            static_cast<double>(cycle_budget);

                        events.push_back(event);
                    }
                }
            }
        }
    }

    return events;
}

static void write_json(
    const Config& config,
    const std::vector<std::vector<std::vector<std::vector<std::uint64_t>>>>& all_runs,
    const std::vector<std::vector<std::vector<std::vector<int>>>>& all_roles,
    const std::vector<WarpConditionStats>& warp_stats,
    const std::vector<RoleAggregateStats>& role_stats,
    const std::vector<RunTransientEvent>& transient_events
) {
    std::ofstream out(config.output_path);

    if (!out.is_open()) {
        throw std::runtime_error(
            "failed to open output file: " + config.output_path
        );
    }

    const int total_warps = config.blocks * config.warps_per_block;

    out << "{\n";
    out << "  \"probe_name\": \"normalized_window_probe\",\n";

    out << "  \"interpretation\": {\n";
    out << "    \"primary_question\": "
        << "\"Does the global-stall transient persist when cycle budget and transient threshold are normalized together?\",\n";
    out << "    \"note\": "
        << "\"This probe keeps the 3 shared-chain + 1 light + 4 global composition and scales the transient threshold with cycle budget. Progress values are execution signatures, not absolute throughput ratios.\"\n";
    out << "  },\n";

    out << "  \"role_map\": {\n";
    out << "    \"0\": \"light_alu_ready\",\n";
    out << "    \"1\": \"shared_dependent_chain_ready\",\n";
    out << "    \"2\": \"dependent_global_stalled\"\n";
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
    out << "    \"num_batches\": " << config.num_batches << ",\n";
    out << "    \"runs_per_batch\": " << config.runs_per_batch << ",\n";
    out << "    \"num_conditions\": " << config.num_conditions << ",\n";
    out << "    \"warmup_runs\": " << config.warmup_runs << ",\n";
    out << "    \"blocks\": " << config.blocks << ",\n";
    out << "    \"warps_per_block\": " << config.warps_per_block << ",\n";
    out << "    \"threads_per_block\": " << config.threads_per_block << ",\n";
    out << "    \"base_cycle_budget\": " << config.base_cycle_budget << ",\n";
    out << "    \"global_buffer_size\": " << config.global_buffer_size << ",\n";
    out << "    \"ready_warp_count\": " << config.ready_warp_count << ",\n";
    out << "    \"stalled_warp_count\": " << config.stalled_warp_count << ",\n";
    out << "    \"light_warp_id\": " << config.light_warp_id << ",\n";
    out << "    \"base_transient_threshold\": "
        << config.base_transient_threshold << "\n";
    out << "  },\n";

    out << "  \"condition_parameters\": [\n";
    for (int c = 0; c < config.num_conditions; ++c) {
        out << "    {\n";
        out << "      \"condition_id\": " << c << ",\n";
        out << "      \"condition_name\": \"" << condition_name(c) << "\",\n";
        out << "      \"cycle_budget\": "
            << cycle_budget_for_condition(
                c,
                config.base_cycle_budget
            ) << ",\n";
        out << "      \"scaled_threshold\": "
            << scaled_threshold_for_condition(c, config) << ",\n";
        out << "      \"normalized_threshold\": "
            << static_cast<double>(scaled_threshold_for_condition(c, config)) /
                static_cast<double>(
                    cycle_budget_for_condition(c, config.base_cycle_budget)
                )
            << ",\n";
        out << "      \"dummy_before\": "
            << dummy_before_for_condition(c) << "\n";
        out << "    }";

        if (c + 1 < config.num_conditions) {
            out << ",";
        }

        out << "\n";
    }
    out << "  ],\n";

    out << "  \"role_aggregate_stats\": [\n";
    for (std::size_t i = 0; i < role_stats.size(); ++i) {
        const auto& rs = role_stats[i];

        out << "    {\n";
        out << "      \"condition_id\": " << rs.condition_id << ",\n";
        out << "      \"condition_name\": \""
            << condition_name(rs.condition_id) << "\",\n";
        out << "      \"role_id\": " << rs.role_id << ",\n";
        out << "      \"role_name\": \"" << role_name(rs.role_id) << "\",\n";
        out << "      \"cycle_budget\": " << rs.cycle_budget << ",\n";
        out << "      \"scaled_threshold\": " << rs.scaled_threshold << ",\n";
        out << "      \"mean_progress\": " << rs.mean_progress << ",\n";
        out << "      \"mean_normalized_progress\": "
            << rs.mean_normalized_progress << ",\n";
        out << "      \"variance\": " << rs.variance << ",\n";
        out << "      \"stddev\": " << rs.stddev << ",\n";
        out << "      \"coefficient_of_variation\": "
            << rs.coefficient_of_variation << ",\n";
        out << "      \"min_progress\": " << rs.min_progress << ",\n";
        out << "      \"max_progress\": " << rs.max_progress << ",\n";
        out << "      \"min_normalized_progress\": "
            << rs.min_normalized_progress << ",\n";
        out << "      \"max_normalized_progress\": "
            << rs.max_normalized_progress << ",\n";
        out << "      \"transient_count\": "
            << rs.transient_count << ",\n";
        out << "      \"transient_rate\": "
            << rs.transient_rate << "\n";
        out << "    }";

        if (i + 1 < role_stats.size()) {
            out << ",";
        }

        out << "\n";
    }
    out << "  ],\n";

    out << "  \"transient_events\": [\n";
    for (std::size_t i = 0; i < transient_events.size(); ++i) {
        const auto& ev = transient_events[i];

        out << "    {\n";
        out << "      \"condition_id\": " << ev.condition_id << ",\n";
        out << "      \"condition_name\": \""
            << condition_name(ev.condition_id) << "\",\n";
        out << "      \"batch_id\": " << ev.batch_id << ",\n";
        out << "      \"run_id\": " << ev.run_id << ",\n";
        out << "      \"block_id\": " << ev.block_id << ",\n";
        out << "      \"cycle_budget\": "
            << ev.cycle_budget << ",\n";
        out << "      \"scaled_threshold\": "
            << ev.scaled_threshold << ",\n";
        out << "      \"min_global_progress\": "
            << ev.min_global_progress << ",\n";
        out << "      \"min_global_normalized_progress\": "
            << ev.min_global_normalized_progress << "\n";
        out << "    }";

        if (i + 1 < transient_events.size()) {
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
        out << "      \"cycle_budget\": " << ws.cycle_budget << ",\n";
        out << "      \"scaled_threshold\": "
            << ws.scaled_threshold << ",\n";
        out << "      \"mean_progress\": "
            << ws.mean_progress << ",\n";
        out << "      \"mean_normalized_progress\": "
            << ws.mean_normalized_progress << ",\n";
        out << "      \"variance\": " << ws.variance << ",\n";
        out << "      \"stddev\": " << ws.stddev << ",\n";
        out << "      \"coefficient_of_variation\": "
            << ws.coefficient_of_variation << ",\n";
        out << "      \"min_progress\": "
            << ws.min_progress << ",\n";
        out << "      \"max_progress\": "
            << ws.max_progress << ",\n";
        out << "      \"min_normalized_progress\": "
            << ws.min_normalized_progress << ",\n";
        out << "      \"max_normalized_progress\": "
            << ws.max_normalized_progress << ",\n";
        out << "      \"transient_count\": "
            << ws.transient_count << ",\n";
        out << "      \"transient_rate\": "
            << ws.transient_rate << "\n";
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
        out << "      \"cycle_budget\": "
            << cycle_budget_for_condition(
                c,
                config.base_cycle_budget
            ) << ",\n";
        out << "      \"scaled_threshold\": "
            << scaled_threshold_for_condition(c, config) << ",\n";
        out << "      \"dummy_before\": "
            << dummy_before_for_condition(c) << ",\n";

        out << "      \"role_assignment\": [";
        for (int w = 0; w < total_warps; ++w) {
            out << all_roles[c][0][0][w];

            if (w + 1 < total_warps) {
                out << ", ";
            }
        }
        out << "],\n";

        out << "      \"batches\": [\n";

        for (int b = 0; b < config.num_batches; ++b) {
            out << "        {\n";
            out << "          \"batch_id\": " << b << ",\n";
            out << "          \"runs\": [\n";

            for (int r = 0; r < config.runs_per_batch; ++r) {
                out << "            {\n";
                out << "              \"run_id\": " << r << ",\n";
                out << "              \"warp_progress\": [";

                for (int w = 0; w < total_warps; ++w) {
                    out << all_runs[c][b][r][w];

                    if (w + 1 < total_warps) {
                        out << ", ";
                    }
                }

                out << "]\n";
                out << "            }";

                if (r + 1 < config.runs_per_batch) {
                    out << ",";
                }

                out << "\n";
            }

            out << "          ]\n";
            out << "        }";

            if (b + 1 < config.num_batches) {
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

static void launch_measured_kernel(
    const Config& config,
    std::uint64_t* d_progress,
    int* d_role_id,
    std::uint32_t* d_global_buffer,
    int condition_id,
    int batch_id,
    int run_id
) {
    const std::uint64_t cycle_budget =
        cycle_budget_for_condition(
            condition_id,
            config.base_cycle_budget
        );

    cuda_check(
        launch_normalized_window_kernel(
            d_progress,
            d_role_id,
            d_global_buffer,
            config.global_buffer_size,
            cycle_budget,
            config.warps_per_block,
            config.ready_warp_count,
            config.light_warp_id,
            condition_id,
            batch_id,
            run_id,
            config.blocks,
            config.threads_per_block
        ),
        "launch_normalized_window_kernel"
    );

    cuda_check(cudaDeviceSynchronize(), "measurement synchronize");
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

    if (config.light_warp_id < 0 ||
        config.light_warp_id >= config.ready_warp_count) {
        throw std::runtime_error(
            "light_warp_id must be in ready warp region"
        );
    }

    if (config.num_conditions <= 0 || config.num_conditions > 6) {
        throw std::runtime_error("num_conditions must be in range [1, 6]");
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
    std::uint32_t* d_dummy_sink = nullptr;

    cuda_check(cudaMalloc(&d_progress, progress_bytes), "cudaMalloc d_progress");
    cuda_check(cudaMalloc(&d_role_id, role_bytes), "cudaMalloc d_role_id");
    cuda_check(cudaMalloc(&d_global_buffer, global_bytes), "cudaMalloc d_global_buffer");
    cuda_check(cudaMalloc(&d_dummy_sink, sizeof(std::uint32_t)), "cudaMalloc d_dummy_sink");

    cuda_check(cudaMemset(d_dummy_sink, 0, sizeof(std::uint32_t)), "cudaMemset d_dummy_sink");

    cuda_check(
        launch_initialize_normalized_window_global_buffer(
            d_global_buffer,
            config.global_buffer_size,
            0x12345678u
        ),
        "initialize global buffer"
    );

    cuda_check(cudaDeviceSynchronize(), "initialize synchronize");

    std::vector<std::uint64_t> h_progress(total_warps, 0);
    std::vector<int> h_role_id(total_warps, 0);

    std::vector<std::vector<std::vector<std::vector<std::uint64_t>>>> all_runs(
        config.num_conditions,
        std::vector<std::vector<std::vector<std::uint64_t>>>(
            config.num_batches,
            std::vector<std::vector<std::uint64_t>>(
                config.runs_per_batch,
                std::vector<std::uint64_t>(total_warps, 0)
            )
        )
    );

    std::vector<std::vector<std::vector<std::vector<int>>>> all_roles(
        config.num_conditions,
        std::vector<std::vector<std::vector<int>>>(
            config.num_batches,
            std::vector<std::vector<int>>(
                config.runs_per_batch,
                std::vector<int>(total_warps, 0)
            )
        )
    );

    for (int r = 0; r < config.warmup_runs; ++r) {
        cuda_check(
            cudaMemset(d_progress, 0, progress_bytes),
            "cudaMemset warmup progress"
        );

        cuda_check(
            cudaMemset(d_role_id, 0, role_bytes),
            "cudaMemset warmup role"
        );

        launch_measured_kernel(
            config,
            d_progress,
            d_role_id,
            d_global_buffer,
            1,
            0,
            -1 - r
        );
    }

    for (int c = 0; c < config.num_conditions; ++c) {
        for (int b = 0; b < config.num_batches; ++b) {
            for (int r = 0; r < config.runs_per_batch; ++r) {
                if (dummy_before_for_condition(c) != 0) {
                    const std::uint64_t cycle_budget =
                        cycle_budget_for_condition(
                            c,
                            config.base_cycle_budget
                        );

                    cuda_check(
                        launch_normalized_window_dummy_kernel(
                            d_global_buffer,
                            d_dummy_sink,
                            config.global_buffer_size,
                            cycle_budget / 4,
                            c,
                            b,
                            r
                        ),
                        "launch_normalized_window_dummy_kernel"
                    );

                    cuda_check(
                        cudaDeviceSynchronize(),
                        "dummy synchronize"
                    );
                }

                cuda_check(
                    cudaMemset(d_progress, 0, progress_bytes),
                    "cudaMemset measured progress"
                );

                cuda_check(
                    cudaMemset(d_role_id, 0, role_bytes),
                    "cudaMemset measured role"
                );

                launch_measured_kernel(
                    config,
                    d_progress,
                    d_role_id,
                    d_global_buffer,
                    c,
                    b,
                    r
                );

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

                all_runs[c][b][r] = h_progress;
                all_roles[c][b][r] = h_role_id;
            }
        }
    }

    cuda_check(cudaFree(d_progress), "cudaFree d_progress");
    cuda_check(cudaFree(d_role_id), "cudaFree d_role_id");
    cuda_check(cudaFree(d_global_buffer), "cudaFree d_global_buffer");
    cuda_check(cudaFree(d_dummy_sink), "cudaFree d_dummy_sink");

    const auto warp_stats =
        compute_warp_stats(all_runs, config);

    const auto role_stats =
        compute_role_stats(warp_stats, config);

    const auto transient_events =
        compute_transient_events(all_runs, config);

    write_json(
        config,
        all_runs,
        all_roles,
        warp_stats,
        role_stats,
        transient_events
    );

    std::cout << "[normalized_window_probe] done\n";
    std::cout << "  conditions: " << config.num_conditions << "\n";
    std::cout << "  batches: " << config.num_batches << "\n";
    std::cout << "  runs_per_batch: " << config.runs_per_batch << "\n";
    std::cout << "  total_warps: " << total_warps << "\n";
    std::cout << "  output: " << config.output_path << "\n";
}

} // namespace normalized_window_probe