#include "host.hpp"

#include "common/cuda_check.hpp"

#include <cuda_runtime.h>

#include <algorithm>
#include <stdexcept>
#include <string>
#include <vector>

void launch_optimal_accumulator_count_kernel(
    DeviceArithmeticProbeRecord* out_records,
    int blocks,
    int threads_per_block,
    int chain_length,
    unsigned long long clock_budget_cycles,
    unsigned long long iterations,
    int use_clock_budget
);

namespace {

int target_acc_count_from_role(int role_id) {
    switch (role_id) {
        case 0: return 1;
        case 1: return 2;
        case 2: return 3;
        case 3: return 4;
        case 4: return 5;
        case 5: return 7;
        case 6: return 8;
        case 7: return 16;
        default: return 1;
    }
}

std::string role_name_from_id(int role_id, int chain_length) {
    const int target_acc = target_acc_count_from_role(role_id);
    const int effective_acc = std::min(target_acc, chain_length);

    return "chain" + std::to_string(chain_length)
         + "_acc" + std::to_string(target_acc)
         + "_effective" + std::to_string(effective_acc);
}

void validate_chain_length(int chain_length) {
    if (chain_length != 7 && chain_length != 13 && chain_length != 29) {
        throw std::runtime_error(
            "optimal_accumulator_count_probe supports chain_length = 7, 13, or 29."
        );
    }
}

} // namespace

std::vector<ArithmeticProbeRecord> run_optimal_accumulator_count_probe(
    const ProbeConfig& config
) {
    const int blocks = config.get_int("blocks", 1);
    const int threads_per_block = config.get_int("threads_per_block", 256);
    const int repeat = config.get_int("repeat", 1);
    const int chain_length = config.get_int("chain_length", 7);

    validate_chain_length(chain_length);

    const unsigned long long clock_budget_cycles =
        config.get_u64("clock_budget_cycles", 10000000ULL);

    const unsigned long long iterations =
        config.get_u64("iterations", 100000ULL);

    const int use_clock_budget =
        config.get_bool("use_clock_budget", true) ? 1 : 0;

    if (threads_per_block % 32 != 0) {
        throw std::runtime_error("threads_per_block must be a multiple of 32.");
    }

    const int warps_per_block = threads_per_block / 32;

    if (warps_per_block < 8) {
        throw std::runtime_error(
            "optimal_accumulator_count_probe requires at least 8 warps per block. "
            "Use threads_per_block >= 256."
        );
    }

    const int records_per_run = blocks * warps_per_block;
    const int total_records = records_per_run * repeat;

    std::vector<ArithmeticProbeRecord> host_records;
    host_records.reserve(total_records);

    DeviceArithmeticProbeRecord* d_records = nullptr;

    CUDA_CHECK(cudaMalloc(
        &d_records,
        sizeof(DeviceArithmeticProbeRecord) * records_per_run
    ));

    for (int run = 0; run < repeat; ++run) {
        CUDA_CHECK(cudaMemset(
            d_records,
            0,
            sizeof(DeviceArithmeticProbeRecord) * records_per_run
        ));

        launch_optimal_accumulator_count_kernel(
            d_records,
            blocks,
            threads_per_block,
            chain_length,
            clock_budget_cycles,
            iterations,
            use_clock_budget
        );

        CUDA_CHECK(cudaGetLastError());
        CUDA_CHECK(cudaDeviceSynchronize());

        std::vector<DeviceArithmeticProbeRecord> tmp(records_per_run);

        CUDA_CHECK(cudaMemcpy(
            tmp.data(),
            d_records,
            sizeof(DeviceArithmeticProbeRecord) * records_per_run,
            cudaMemcpyDeviceToHost
        ));

        for (const auto& raw : tmp) {
            ArithmeticProbeRecord rec;

            rec.run = run;
            rec.block_id = raw.block_id;
            rec.warp_id = raw.warp_id;
            rec.role_id = raw.role_id;
            rec.role = role_name_from_id(raw.role_id, chain_length);
            rec.progress = raw.progress;
            rec.last_clock = raw.last_clock;
            rec.sink = raw.sink;

            host_records.push_back(rec);
        }
    }

    CUDA_CHECK(cudaFree(d_records));

    return host_records;
}