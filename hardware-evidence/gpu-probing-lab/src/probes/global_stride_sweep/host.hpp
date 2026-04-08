#pragma once

#include "probe/probe_result.hpp"
#include "common/device_info.hpp"

#include <string>

GlobalStrideSweepConfig load_global_stride_sweep_config(const std::string& path);
GlobalStrideSweepResult run_global_stride_sweep(const GlobalStrideSweepConfig& config);
void write_global_stride_sweep_result_json(const GlobalStrideSweepResult& result);

void launch_global_stride_sweep_kernel(
    const float* d_input,
    float* d_output,
    int n,
    int stride,
    int inner_iters,
    int grid_size,
    int block_size);