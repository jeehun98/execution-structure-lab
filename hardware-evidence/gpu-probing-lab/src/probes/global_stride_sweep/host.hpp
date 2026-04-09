#pragma once

#include "probe/probe_result.hpp"
#include "common/device_info.hpp"

#include <string>
#include <vector>

// -------------------------------
// naive version
// -------------------------------
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

// -------------------------------
// fixed-work version
// -------------------------------
struct GlobalStrideSweepFixedWorkConfig {
  int device_id = 0;
  int n = 0;
  int block_size = 256;
  int grid_size = 0;
  int warmup = 10;
  int repeat = 50;
  int inner_iters = 1;
  int total_accesses = 0;
  int base_offset = 0;
  std::vector<int> strides;
  std::string output_path;
};

struct GlobalStrideSweepFixedWorkPoint {
  int stride = 0;
  double avg_ms = 0.0;
  int launched_threads = 0;
  int total_accesses = 0;
  int accesses_per_thread = 0;
  int active_threads = 0;
  std::size_t total_bytes_requested = 0;
};

struct GlobalStrideSweepFixedWorkResult {
  GlobalStrideSweepFixedWorkConfig config;
  DeviceInfo device;
  std::vector<GlobalStrideSweepFixedWorkPoint> points;
};

GlobalStrideSweepFixedWorkConfig load_global_stride_sweep_fixed_work_config(const std::string& path);
GlobalStrideSweepFixedWorkResult run_global_stride_sweep_fixed_work(const GlobalStrideSweepFixedWorkConfig& config);
void write_global_stride_sweep_fixed_work_result_json(const GlobalStrideSweepFixedWorkResult& result);

void launch_global_stride_sweep_fixed_work_kernel(
    const float* d_input,
    float* d_output,
    int n,
    int stride,
    int inner_iters,
    int total_accesses,
    int base_offset,
    int accesses_per_thread,
    int launched_threads,
    int block_size);