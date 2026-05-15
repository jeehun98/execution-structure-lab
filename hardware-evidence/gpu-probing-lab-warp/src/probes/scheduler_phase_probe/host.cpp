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

extern "C" cudaError_t launch_initialize_scheduler_phase_global_buffer(
    std::uint32_t* global_buffer,
    int global_buffer_size,
    std::uint32_t seed
);

extern "C" cudaError_t launch_scheduler_phase_dummy_kernel(
    std::uint32_t* global_buffer,
    std::uint32_t* sink,
    int global_buffer_size,
    std::uint64_t cycle_budget,
    int condition_id,
    int batch_id,
    int run_id
);

extern "C" cudaError_t launch_scheduler_phase_kernel(
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

namespace scheduler_phase_probe {

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
        case 0: return "blocks1_cycle100k_no_dummy";
        case 1: return "blocks2_cycle100k_no_dummy";
        case 2: return "blocks4_cycle100k_no_dummy";
        case 3: return "blocks8_cycle100k_no_dummy";
        case 4: return "blocks1_cycle100k_dummy_before";
        case 5: return "blocks4_cycle100k_dummy_before";
        case 6: return "blocks1_cycle50k_no_dummy";
        case 7: return "blocks1_cycle200k_no_dummy";
        default: return "unknown";
    }
}

static int active_blocks_for_condition(int condition_id) {
    switch (condition_id) {
        case 0: return 1;
        case 1: return 2;
        case 2: return 4;
        case 3: return 8;
        case 4: return 1;
        case 5: return 4;
        case 6: return 1;
        case 7: return 1;
        default: return 1;
    }
}

static std::uint64_t cycle_budget_for_condition(
    int condition_id,
    std::uint64_t base_cycle_budget
) {
    if (condition_id == 6) {
        return base_cycle_budget / 2;
    }

    if (condition_id == 7) {
        return base_cycle_budget * 2;
    }

    return base_cycle_budget;
}

static int dummy_before_for_condition(int condition_id) {
    if (condition_id == 4 || condition_id == 5) {
        return 1;
    }

    return 0;
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

    for (int c = 0; c < config.num_conditions; ++c) {
        const int active_blocks = active_blocks_for_condition(c);
        const int active_warps = active_blocks * config.warps_per_block;

        for (int w = 0; w < active_warps; ++w) {
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

                    if (v < min_v) {
                        min_v = v;
                    }

                    if (v > max_v) {
                        max_v = v;
                    }

                    if (role_id == 2 &&
                        v < static_cast<std::uint64_t>(
                            config.transient_threshold
                        )) {
                        transient_count += 1;
                    }

                    sample_count += 1;
                }
            }

            const double mean = sum / static_cast<double>(sample_count);

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
            ws.mean = mean;
            ws.variance = variance;
            ws.stddev = std::sqrt(variance);
            ws.coefficient_of_variation =
                mean == 0.0 ? 0.0 : ws.stddev / mean;
            ws.min_progress = min_v;
            ws.max_progress = max_v;
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

    for (int c = 0; c < config.num_conditions; ++c) {
        const int total_runs =
            config.num_batches * config.runs_per_batch;

        for (int role = 0; role <= 2; ++role) {
            std::vector<double> values;
            double cv_sum = 0.0;
            int cv_count = 0;

            std::uint64_t min_progress =
                std::numeric_limits<std::uint64_t>::max();

            std::uint64_t max_progress = 0;
            int transient_count = 0;
            int role_warp_count = 0;

            for (const auto& ws : warp_stats) {
                if (ws.condition_id == c && ws.role_id == role) {
                    values.push_back(ws.mean);
                    cv_sum += ws.coefficient_of_variation;
                    cv_count += 1;
                    role_warp_count += 1;

                    if (ws.min_progress < min_progress) {
                        min_progress = ws.min_progress;
                    }

                    if (ws.max_progress > max_progress) {
                        max_progress = ws.max_progress;
                    }

                    transient_count += ws.transient_count;
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

static std::vector<BlockConditionStats> compute_block_stats(
    const std::vector<std::vector<std::vector<std::vector<std::uint64_t>>>>& all_runs,
    const Config& config
) {
    std::vector<BlockConditionStats> result;

    for (int c = 0; c < config.num_conditions; ++c) {
        const int active_blocks = active_blocks_for_condition(c);

        for (int block = 0; block < active_blocks; ++block) {
            double sum = 0.0;
            int sample_count = 0;
            int transient_count = 0;

            std::uint64_t min_progress =
                std::numeric_limits<std::uint64_t>::max();

            std::uint64_t max_progress = 0;

            for (int b = 0; b < config.num_batches; ++b) {
                for (int r = 0; r < config.runs_per_batch; ++r) {
                    bool transient_run_for_block = false;

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

                        const std::uint64_t v =
                            all_runs[c][b][r][global_warp_index];

                        sum += static_cast<double>(v);

                        if (v < min_progress) {
                            min_progress = v;
                        }

                        if (v > max_progress) {
                            max_progress = v;
                        }

                        if (v < static_cast<std::uint64_t>(
                                config.transient_threshold
                            )) {
                            transient_run_for_block = true;
                        }

                        sample_count += 1;
                    }

                    if (transient_run_for_block) {
                        transient_count += 1;
                    }
                }
            }

            BlockConditionStats bs;
            bs.condition_id = c;
            bs.block_id = block;
            bs.global_mean_progress =
                sample_count == 0
                    ? 0.0
                    : sum / static_cast<double>(sample_count);
            bs.global_min_progress = min_progress;
            bs.global_max_progress = max_progress;
            bs.transient_count = transient_count;
            bs.transient_rate =
                static_cast<double>(transient_count) /
                static_cast<double>(config.num_batches * config.runs_per_batch);

            result.push_back(bs);
        }
    }

    return result;
}

static std::vector<RunTransientEvent> compute_transient_events(
    const std::vector<std::vector<std::vector<std::vector<std::uint64_t>>>>& all_runs,
    const Config& config
) {
    std::vector<RunTransientEvent> events;

    for (int c = 0; c < config.num_conditions; ++c) {
        const int active_blocks = active_blocks_for_condition(c);

        for (int b = 0; b < config.num_batches; ++b) {
            for (int r = 0; r < config.runs_per_batch; ++r) {
                for (int block = 0; block < active_blocks; ++block) {
                    int min_global = std::numeric_limits<int>::max();

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

                    if (min_global < config.transient_threshold) {
                        RunTransientEvent event;
                        event.condition_id = c;
                        event.batch_id = b;
                        event.run_id = r;
                        event.block_id = block;
                        event.min_global_progress = min_global;

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
    const std::vector<BlockConditionStats>& block_stats,
    const std::vector<RunTransientEvent>& transient_events
) {
    std::ofstream out(config.output_path);

    if (!out.is_open()) {
        throw std::runtime_error(
            "failed to open output file: " + config.output_path
        );
    }

    const int max_total_warps = config.max_blocks * config.warps_per_block;

    out << "{\n";
    out << "  \"probe_name\": \"scheduler_phase_probe\",\n";

    out << "  \"interpretation\": {\n";
    out << "    \"primary_question\": "
        << "\"Do rare global-stall transient events localize by block count, launch phase, dummy-kernel phase perturbation, or cycle budget?\",\n";
    out << "    \"note\": "
        << "\"This probe repeats the 3 shared-chain + 1 light + 4 global composition while varying active block count, dummy launch insertion, and cycle budget. Progress values are execution signatures, not absolute throughput ratios.\"\n";
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
    out << "    \"max_blocks\": " << config.max_blocks << ",\n";
    out << "    \"warps_per_block\": " << config.warps_per_block << ",\n";
    out << "    \"threads_per_block\": " << config.threads_per_block << ",\n";
    out << "    \"base_cycle_budget\": " << config.base_cycle_budget << ",\n";
    out << "    \"global_buffer_size\": " << config.global_buffer_size << ",\n";
    out << "    \"ready_warp_count\": " << config.ready_warp_count << ",\n";
    out << "    \"stalled_warp_count\": " << config.stalled_warp_count << ",\n";
    out << "    \"light_warp_id\": " << config.light_warp_id << ",\n";
    out << "    \"transient_threshold\": " << config.transient_threshold << "\n";
    out << "  },\n";

    out << "  \"condition_parameters\": [\n";
    for (int c = 0; c < config.num_conditions; ++c) {
        out << "    {\n";
        out << "      \"condition_id\": " << c << ",\n";
        out << "      \"condition_name\": \"" << condition_name(c) << "\",\n";
        out << "      \"active_blocks\": "
            << active_blocks_for_condition(c) << ",\n";
        out << "      \"cycle_budget\": "
            << cycle_budget_for_condition(
                c,
                config.base_cycle_budget
            ) << ",\n";
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
        out << "      \"mean_progress\": " << rs.mean << ",\n";
        out << "      \"variance\": " << rs.variance << ",\n";
        out << "      \"stddev\": " << rs.stddev << ",\n";
        out << "      \"coefficient_of_variation\": "
            << rs.coefficient_of_variation << ",\n";
        out << "      \"min_progress\": " << rs.min_progress << ",\n";
        out << "      \"max_progress\": " << rs.max_progress << ",\n";
        out << "      \"transient_count\": " << rs.transient_count << ",\n";
        out << "      \"transient_rate\": " << rs.transient_rate << "\n";
        out << "    }";

        if (i + 1 < role_stats.size()) {
            out << ",";
        }

        out << "\n";
    }
    out << "  ],\n";

    out << "  \"block_condition_stats\": [\n";
    for (std::size_t i = 0; i < block_stats.size(); ++i) {
        const auto& bs = block_stats[i];

        out << "    {\n";
        out << "      \"condition_id\": " << bs.condition_id << ",\n";
        out << "      \"condition_name\": \""
            << condition_name(bs.condition_id) << "\",\n";
        out << "      \"block_id\": " << bs.block_id << ",\n";
        out << "      \"global_mean_progress\": "
            << bs.global_mean_progress << ",\n";
        out << "      \"global_min_progress\": "
            << bs.global_min_progress << ",\n";
        out << "      \"global_max_progress\": "
            << bs.global_max_progress << ",\n";
        out << "      \"transient_count\": "
            << bs.transient_count << ",\n";
        out << "      \"transient_rate\": "
            << bs.transient_rate << "\n";
        out << "    }";

        if (i + 1 < block_stats.size()) {
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
        out << "      \"min_global_progress\": "
            << ev.min_global_progress << "\n";
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
        out << "      \"mean_progress\": " << ws.mean << ",\n";
        out << "      \"variance\": " << ws.variance << ",\n";
        out << "      \"stddev\": " << ws.stddev << ",\n";
        out << "      \"coefficient_of_variation\": "
            << ws.coefficient_of_variation << ",\n";
        out << "      \"min_progress\": " << ws.min_progress << ",\n";
        out << "      \"max_progress\": " << ws.max_progress << ",\n";
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
        const int active_blocks = active_blocks_for_condition(c);
        const int active_warps = active_blocks * config.warps_per_block;

        out << "    {\n";
        out << "      \"condition_id\": " << c << ",\n";
        out << "      \"condition_name\": \""
            << condition_name(c) << "\",\n";
        out << "      \"active_blocks\": " << active_blocks << ",\n";
        out << "      \"cycle_budget\": "
            << cycle_budget_for_condition(
                c,
                config.base_cycle_budget
            ) << ",\n";
        out << "      \"dummy_before\": "
            << dummy_before_for_condition(c) << ",\n";

        out << "      \"role_assignment\": [";
        for (int w = 0; w < active_warps; ++w) {
            out << all_roles[c][0][0][w];

            if (w + 1 < active_warps) {
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

                for (int w = 0; w < active_warps; ++w) {
                    out << all_runs[c][b][r][w];

                    if (w + 1 < active_warps) {
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

    (void)max_total_warps;
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
    const int active_blocks = active_blocks_for_condition(condition_id);

    const std::uint64_t cycle_budget =
        cycle_budget_for_condition(
            condition_id,
            config.base_cycle_budget
        );

    cuda_check(
        launch_scheduler_phase_kernel(
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
            active_blocks,
            config.threads_per_block
        ),
        "launch_scheduler_phase_kernel"
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

    if (config.max_blocks < 1) {
        throw std::runtime_error("max_blocks must be positive");
    }

    const int max_total_warps =
        config.max_blocks * config.warps_per_block;

    const std::size_t progress_bytes =
        sizeof(std::uint64_t) * max_total_warps;

    const std::size_t role_bytes =
        sizeof(int) * max_total_warps;

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
        launch_initialize_scheduler_phase_global_buffer(
            d_global_buffer,
            config.global_buffer_size,
            0x12345678u
        ),
        "initialize global buffer"
    );

    cuda_check(cudaDeviceSynchronize(), "initialize synchronize");

    std::vector<std::uint64_t> h_progress(max_total_warps, 0);
    std::vector<int> h_role_id(max_total_warps, 0);

    std::vector<std::vector<std::vector<std::vector<std::uint64_t>>>> all_runs(
        config.num_conditions,
        std::vector<std::vector<std::vector<std::uint64_t>>>(
            config.num_batches,
            std::vector<std::vector<std::uint64_t>>(
                config.runs_per_batch,
                std::vector<std::uint64_t>(max_total_warps, 0)
            )
        )
    );

    std::vector<std::vector<std::vector<std::vector<int>>>> all_roles(
        config.num_conditions,
        std::vector<std::vector<std::vector<int>>>(
            config.num_batches,
            std::vector<std::vector<int>>(
                config.runs_per_batch,
                std::vector<int>(max_total_warps, 0)
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
            0,
            0,
            -1 - r
        );
    }

    for (int c = 0; c < config.num_conditions; ++c) {
        const int active_warps =
            active_blocks_for_condition(c) * config.warps_per_block;

        for (int b = 0; b < config.num_batches; ++b) {
            for (int r = 0; r < config.runs_per_batch; ++r) {
                if (dummy_before_for_condition(c) != 0) {
                    cuda_check(
                        launch_scheduler_phase_dummy_kernel(
                            d_global_buffer,
                            d_dummy_sink,
                            config.global_buffer_size,
                            config.base_cycle_budget / 4,
                            c,
                            b,
                            r
                        ),
                        "launch_scheduler_phase_dummy_kernel"
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

                for (int w = 0; w < active_warps; ++w) {
                    all_runs[c][b][r][w] = h_progress[w];
                    all_roles[c][b][r][w] = h_role_id[w];
                }
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

    const auto block_stats =
        compute_block_stats(all_runs, config);

    const auto transient_events =
        compute_transient_events(all_runs, config);

    write_json(
        config,
        all_runs,
        all_roles,
        warp_stats,
        role_stats,
        block_stats,
        transient_events
    );

    std::cout << "[scheduler_phase_probe] done\n";
    std::cout << "  conditions: " << config.num_conditions << "\n";
    std::cout << "  batches: " << config.num_batches << "\n";
    std::cout << "  runs_per_batch: " << config.runs_per_batch << "\n";
    std::cout << "  max_total_warps: " << max_total_warps << "\n";
    std::cout << "  output: " << config.output_path << "\n";
}

} // namespace scheduler_phase_probe