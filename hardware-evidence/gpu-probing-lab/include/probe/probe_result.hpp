#pragma once

#include "common/device_info.hpp"

#include <cstddef>
#include <string>
#include <vector>

struct GlobalStrideSweepBoundedConfig {
  int device_id = 0;
  int n = 0;
  int block_size = 256;
  int grid_size = 0;
  int warmup = 10;
  int repeat = 50;
  int inner_iters = 1;
  int requested_total_accesses = 0;
  int base_offset = 0;
  std::vector<int> strides;
  std::string output_path;
};

struct GlobalStrideSweepBoundedPoint {
  int stride = 0;
  double avg_ms = 0.0;
  int launched_threads = 0;
  int active_threads = 0;
  int requested_total_accesses = 0;
  int actual_total_accesses = 0;
  int accesses_per_thread = 0;
  std::size_t total_bytes_requested = 0;
  std::size_t total_bytes_actual = 0;
  std::size_t warp_address_span_bytes = 0;
};

struct GlobalStrideSweepBoundedResult {
  GlobalStrideSweepBoundedConfig config;
  DeviceInfo device;
  std::vector<GlobalStrideSweepBoundedPoint> points;
};