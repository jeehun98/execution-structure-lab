#include "host.hpp"

#include "common/cuda_check.hpp"

#include <cuda_runtime.h>

#include <stdexcept>
#include <string>
#include <vector>

void launch_irregular_fma_dependency_shape_kernel(
    DeviceArithmeticProbeRecord* out_records,
    int blocks,
    int threads_per_block,
    unsigned long long clock_budget_cycles,
    unsigned long long iterations,
    int use_clock_budget
);

namespace {

std::string role_name_from_id(int role_id) {
    switch (role_id) {
        case 0:
            return "dependent_fma_chain_3";
        case 1:
            return "independent_fma_3";
        case 2:
            return "dependent_fma_chain_7";
        case 3:
            return "independent_fma_7";
        case 4:
            return "dependent_fma_chain_13";
        case 5:
            return "independent_fma_13";
        case 6:
            return "dependent_fma_chain_29";
        case 7:
            return "independent_fma_29";
        default:
            return "unknown";
    }
}

} // namespace

std::vector<ArithmeticProbeRecord> run_irregular_fma_dependency_shape_probe(
    const ProbeConfig& config
) {
    const int blocks = config.get_int("blocks", 1);
    const int threads_per_block = config.get_int("threads_per_block", 256);
    const int repeat = config.get_int("repeat", 1);

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
            "irregular_fma_dependency_shape_probe requires at least 8 warps per block. "
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

        launch_irregular_fma_dependency_shape_kernel(
            d_records,
            blocks,
            threads_per_block,
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
            rec.role = role_name_from_id(raw.role_id);
            rec.progress = raw.progress;
            rec.last_clock = raw.last_clock;
            rec.sink = raw.sink;

            host_records.push_back(rec);
        }
    }

    CUDA_CHECK(cudaFree(d_records));

    return host_records;
}