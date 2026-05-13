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

extern "C" cudaError_t launch_initialize_launch_perturbation_global_buffer(
    std::uint32_t* global_buffer,
    int global_buffer_size,
    std::uint32_t seed
);

extern "C" cudaError_t launch_launch_perturbation_dummy_kernel(
    std::uint32_t* global_buffer,
    std::uint32_t* sink,
    int global_buffer_size,
    std::uint64_t cycle_budget,
    int dummy_mode,
    int dummy_blocks,
    int dummy_threads,
    int condition_id,
    int batch_id,
    int run_id
);

extern "C" cudaError_t launch_launch_perturbation_measure_kernel(
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

namespace launch_perturbation_probe {

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
        case 0: return "no_dummy";
        case 1: return "empty_dummy_launch";
        case 2: return "light_alu_dummy";
        case 3: return "short_global_read_dummy";
        case 4: return "short_global_write_dummy";
        case 5: return "long_global_read_dummy";
        case 6: return "many_block_global_read_dummy";
        case 7: return "same_block_count_global_read_dummy";
        default: return "unknown";
    }
}

static int dummy_mode_for_condition(int condition_id) {
    switch (condition_id) {
        case 0: return 0;
        case 1: return 1;
        case 2: return 2;
        case 3: return 3;
        case 4: return 4;
        case 5: return 3;
        case 6: return 3;
        case 7: return 3;
        default: return 0;
    }
}

static const char* dummy_mode_name(int mode) {
    switch (mode) {
        case 0: return "none";
        case 1: return "empty";
        case 2: return "light_alu";
        case 3: return "global_read";
        case 4: return "global_write";
        default: return "unknown";
    }
}

static std::uint64_t dummy_cycle_budget_for_condition(
    int condition_id,
    std::uint64_t measure_cycle_budget
) {
    switch (condition_id) {
        case 0: return 0;
        case 1: return 0;
        case 2: return measure_cycle_budget / 4;
        case 3: return measure_cycle_budget / 4;
        case 4: return measure_cycle_budget / 4;
        case 5: return measure_cycle_budget;
        case 6: return measure_cycle_budget / 4;
        case 7: return measure_cycle_budget / 4;
        default: return 0;
    }
}

static int dummy_blocks_for_condition(int condition_id, int measure_blocks) {
    switch (condition_id) {
        case 1: return 1;
        case 2: return 64;
        case 3: return 64;
        case 4: return 64;
        case 5: return 64;
        case 6: return 256;
        case 7: return measure_blocks;
        default: return 0;
    }
}

static int scaled_threshold(const Config& config) {
    const double ratio =
        static_cast<double>(config.cycle_budget) /
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
    const int threshold = scaled_threshold(config);

    for (int c = 0; c < config.num_conditions; ++c) {
        for (int w = 0; w < total_warps; ++w) {
            const int local_warp_id = w % config.warps_per_block;
            const int role_id = resolve_role_id_host(
                local_warp_id,
                config.ready_warp_count,
                config.light_warp_id
            );

            double sum = 0.0;
            std::uint64_t min_v =
                std::numeric_limits<std::uint64_t>::max();
            std::uint64_t max_v = 0;
            int sample_count = 0;
            int transient_count = 0;

            for (int b = 0; b < config.num_batches; ++b) {
                for (int r = 0; r < config.runs_per_batch; ++r) {
                    const std::uint64_t v = all_runs[c][b][r][w];

                    sum += static_cast<double>(v);
                    if (v < min_v) min_v = v;
                    if (v > max_v) max_v = v;

                    if (role_id == 2 &&
                        v < static_cast<std::uint64_t>(threshold)) {
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

            WarpConditionStats ws;
            ws.condition_id = c;
            ws.block_id = w / config.warps_per_block;
            ws.warp_id = local_warp_id;
            ws.role_id = role_id;
            ws.cycle_budget = config.cycle_budget;
            ws.scaled_threshold = threshold;
            ws.mean_progress = mean;
            ws.mean_normalized_progress =
                mean / static_cast<double>(config.cycle_budget);
            ws.variance = var_sum / static_cast<double>(sample_count);
            ws.stddev = std::sqrt(ws.variance);
            ws.coefficient_of_variation =
                mean == 0.0 ? 0.0 : ws.stddev / mean;
            ws.min_progress = min_v;
            ws.max_progress = max_v;
            ws.min_normalized_progress =
                static_cast<double>(min_v) /
                static_cast<double>(config.cycle_budget);
            ws.max_normalized_progress =
                static_cast<double>(max_v) /
                static_cast<double>(config.cycle_budget);
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

    const int threshold = scaled_threshold(config);
    const int total_runs = config.num_batches * config.runs_per_batch;

    for (int c = 0; c < config.num_conditions; ++c) {
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
            double nsum = 0.0;

            for (double v : means) sum += v;
            for (double v : normalized_means) nsum += v;

            const double mean =
                sum / static_cast<double>(means.size());

            const double nmean =
                nsum / static_cast<double>(normalized_means.size());

            double var_sum = 0.0;

            for (double v : means) {
                const double diff = v - mean;
                var_sum += diff * diff;
            }

            RoleAggregateStats rs;
            rs.condition_id = c;
            rs.role_id = role;
            rs.cycle_budget = config.cycle_budget;
            rs.scaled_threshold = threshold;
            rs.mean_progress = mean;
            rs.mean_normalized_progress = nmean;
            rs.variance = var_sum / static_cast<double>(means.size());
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

    const int threshold = scaled_threshold(config);

    for (int c = 0; c < config.num_conditions; ++c) {
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

                        const int progress =
                            static_cast<int>(
                                all_runs[c][b][r][global_warp_index]
                            );

                        if (progress < min_global) {
                            min_global = progress;
                        }
                    }

                    if (min_global < threshold) {
                        RunTransientEvent ev;
                        ev.condition_id = c;
                        ev.batch_id = b;
                        ev.run_id = r;
                        ev.block_id = block;
                        ev.min_global_progress = min_global;
                        ev.min_global_normalized_progress =
                            static_cast<double>(min_global) /
                            static_cast<double>(config.cycle_budget);

                        events.push_back(ev);
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
    const int threshold = scaled_threshold(config);

    out << "{\n";
    out << "  \"probe_name\": \"launch_perturbation_probe\",\n";

    out << "  \"interpretation\": {\n";
    out << "    \"primary_question\": "
        << "\"Which part of dummy-kernel perturbation induces the global-stall transient: launch boundary, ALU work, global read, global write, duration, or dummy occupancy?\",\n";
    out << "    \"note\": "
        << "\"This probe keeps the 3 shared-chain + 1 light + 4 global composition and decomposes dummy-before perturbation modes. Progress values are execution signatures, not absolute throughput ratios.\"\n";
    out << "  },\n";

    out << "  \"role_map\": {\n";
    out << "    \"0\": \"light_alu_ready\",\n";
    out << "    \"1\": \"shared_dependent_chain_ready\",\n";
    out << "    \"2\": \"dependent_global_stalled\"\n";
    out << "  },\n";

    out << "  \"condition_map\": {\n";
    for (int c = 0; c < config.num_conditions; ++c) {
        out << "    \"" << c << "\": \"" << condition_name(c) << "\"";
        if (c + 1 < config.num_conditions) out << ",";
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
    out << "    \"cycle_budget\": " << config.cycle_budget << ",\n";
    out << "    \"base_cycle_budget\": " << config.base_cycle_budget << ",\n";
    out << "    \"base_transient_threshold\": "
        << config.base_transient_threshold << ",\n";
    out << "    \"scaled_threshold\": " << threshold << ",\n";
    out << "    \"normalized_threshold\": "
        << static_cast<double>(threshold) /
           static_cast<double>(config.cycle_budget) << ",\n";
    out << "    \"global_buffer_size\": " << config.global_buffer_size << ",\n";
    out << "    \"ready_warp_count\": " << config.ready_warp_count << ",\n";
    out << "    \"stalled_warp_count\": " << config.stalled_warp_count << ",\n";
    out << "    \"light_warp_id\": " << config.light_warp_id << "\n";
    out << "  },\n";

    out << "  \"condition_parameters\": [\n";
    for (int c = 0; c < config.num_conditions; ++c) {
        const int mode = dummy_mode_for_condition(c);
        const int dummy_blocks =
            dummy_blocks_for_condition(c, config.blocks);
        const std::uint64_t dummy_cycles =
            dummy_cycle_budget_for_condition(c, config.cycle_budget);

        out << "    {\n";
        out << "      \"condition_id\": " << c << ",\n";
        out << "      \"condition_name\": \"" << condition_name(c) << "\",\n";
        out << "      \"dummy_mode\": " << mode << ",\n";
        out << "      \"dummy_mode_name\": \""
            << dummy_mode_name(mode) << "\",\n";
        out << "      \"dummy_blocks\": " << dummy_blocks << ",\n";
        out << "      \"dummy_threads\": 256,\n";
        out << "      \"dummy_cycle_budget\": " << dummy_cycles << "\n";
        out << "    }";
        if (c + 1 < config.num_conditions) out << ",";
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
        if (i + 1 < role_stats.size()) out << ",";
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
        out << "      \"min_global_progress\": "
            << ev.min_global_progress << ",\n";
        out << "      \"min_global_normalized_progress\": "
            << ev.min_global_normalized_progress << "\n";
        out << "    }";
        if (i + 1 < transient_events.size()) out << ",";
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
        out << "      \"mean_progress\": " << ws.mean_progress << ",\n";
        out << "      \"mean_normalized_progress\": "
            << ws.mean_normalized_progress << ",\n";
        out << "      \"variance\": " << ws.variance << ",\n";
        out << "      \"stddev\": " << ws.stddev << ",\n";
        out << "      \"coefficient_of_variation\": "
            << ws.coefficient_of_variation << ",\n";
        out << "      \"min_progress\": " << ws.min_progress << ",\n";
        out << "      \"max_progress\": " << ws.max_progress << ",\n";
        out << "      \"min_normalized_progress\": "
            << ws.min_normalized_progress << ",\n";
        out << "      \"max_normalized_progress\": "
            << ws.max_normalized_progress << ",\n";
        out << "      \"transient_count\": "
            << ws.transient_count << ",\n";
        out << "      \"transient_rate\": "
            << ws.transient_rate << "\n";
        out << "    }";
        if (i + 1 < warp_stats.size()) out << ",";
        out << "\n";
    }
    out << "  ],\n";

    out << "  \"raw_runs\": [\n";
    for (int c = 0; c < config.num_conditions; ++c) {
        out << "    {\n";
        out << "      \"condition_id\": " << c << ",\n";
        out << "      \"condition_name\": \"" << condition_name(c) << "\",\n";

        out << "      \"role_assignment\": [";
        for (int w = 0; w < total_warps; ++w) {
            out << all_roles[c][0][0][w];
            if (w + 1 < total_warps) out << ", ";
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
                    if (w + 1 < total_warps) out << ", ";
                }

                out << "]\n";
                out << "            }";
                if (r + 1 < config.runs_per_batch) out << ",";
                out << "\n";
            }

            out << "          ]\n";
            out << "        }";
            if (b + 1 < config.num_batches) out << ",";
            out << "\n";
        }

        out << "      ]\n";
        out << "    }";
        if (c + 1 < config.num_conditions) out << ",";
        out << "\n";
    }

    out << "  ]\n";
    out << "}\n";
}

static void run_dummy_if_needed(
    const Config& config,
    std::uint32_t* d_global_buffer,
    std::uint32_t* d_sink,
    int condition_id,
    int batch_id,
    int run_id
) {
    const int mode = dummy_mode_for_condition(condition_id);

    if (mode == 0) {
        return;
    }

    const int dummy_blocks =
        dummy_blocks_for_condition(condition_id, config.blocks);

    const int dummy_threads = 256;

    const std::uint64_t dummy_cycles =
        dummy_cycle_budget_for_condition(
            condition_id,
            config.cycle_budget
        );

    cuda_check(
        launch_launch_perturbation_dummy_kernel(
            d_global_buffer,
            d_sink,
            config.global_buffer_size,
            dummy_cycles,
            mode,
            dummy_blocks,
            dummy_threads,
            condition_id,
            batch_id,
            run_id
        ),
        "launch dummy kernel"
    );

    cuda_check(cudaDeviceSynchronize(), "dummy synchronize");
}

static void run_measurement(
    const Config& config,
    std::uint64_t* d_progress,
    int* d_role_id,
    std::uint32_t* d_global_buffer,
    int condition_id,
    int batch_id,
    int run_id
) {
    cuda_check(
        launch_launch_perturbation_measure_kernel(
            d_progress,
            d_role_id,
            d_global_buffer,
            config.global_buffer_size,
            config.cycle_budget,
            config.warps_per_block,
            config.ready_warp_count,
            config.light_warp_id,
            condition_id,
            batch_id,
            run_id,
            config.blocks,
            config.threads_per_block
        ),
        "launch measurement kernel"
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

    if (config.num_conditions <= 0 || config.num_conditions > 8) {
        throw std::runtime_error("num_conditions must be in range [1, 8]");
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
    std::uint32_t* d_sink = nullptr;

    cuda_check(cudaMalloc(&d_progress, progress_bytes), "cudaMalloc d_progress");
    cuda_check(cudaMalloc(&d_role_id, role_bytes), "cudaMalloc d_role_id");
    cuda_check(cudaMalloc(&d_global_buffer, global_bytes), "cudaMalloc d_global_buffer");
    cuda_check(cudaMalloc(&d_sink, sizeof(std::uint32_t)), "cudaMalloc d_sink");

    cuda_check(cudaMemset(d_sink, 0, sizeof(std::uint32_t)), "cudaMemset d_sink");

    cuda_check(
        launch_initialize_launch_perturbation_global_buffer(
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
        cuda_check(cudaMemset(d_progress, 0, progress_bytes), "warmup memset progress");
        cuda_check(cudaMemset(d_role_id, 0, role_bytes), "warmup memset role");

        run_measurement(
            config,
            d_progress,
            d_role_id,
            d_global_buffer,
            0,
            0,
            -1 - r
        );
    }

    for (int c = 0; c < config.num_conditions; ++c) {
        for (int b = 0; b < config.num_batches; ++b) {
            for (int r = 0; r < config.runs_per_batch; ++r) {
                run_dummy_if_needed(
                    config,
                    d_global_buffer,
                    d_sink,
                    c,
                    b,
                    r
                );

                cuda_check(cudaMemset(d_progress, 0, progress_bytes), "measured memset progress");
                cuda_check(cudaMemset(d_role_id, 0, role_bytes), "measured memset role");

                run_measurement(
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
    cuda_check(cudaFree(d_sink), "cudaFree d_sink");

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

    std::cout << "[launch_perturbation_probe] done\n";
    std::cout << "  conditions: " << config.num_conditions << "\n";
    std::cout << "  batches: " << config.num_batches << "\n";
    std::cout << "  runs_per_batch: " << config.runs_per_batch << "\n";
    std::cout << "  total_warps: " << total_warps << "\n";
    std::cout << "  scaled_threshold: " << scaled_threshold(config) << "\n";
    std::cout << "  output: " << config.output_path << "\n";
}

} // namespace launch_perturbation_probe