#pragma once

#include "common/device_info.hpp"

#include <string>
#include <vector>

struct GlobalStrideSweepPoint {
  int stride = 0;
  double avg_ms = 0.0;
};

struct GlobalStrideSweepConfig {
  int device_id = 0;
  int n = 0;
  int block_size = 256;
  int warmup = 10;
  int repeat = 50;
  int inner_iters = 1;
  std::vector<int> strides;
  std::string output_path;
};

struct GlobalStrideSweepResult {
  GlobalStrideSweepConfig config;
  DeviceInfo device;
  std::vector<GlobalStrideSweepPoint> points;
};