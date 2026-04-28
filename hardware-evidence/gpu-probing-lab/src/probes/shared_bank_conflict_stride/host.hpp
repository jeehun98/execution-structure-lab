#pragma once

#include <string>
#include <vector>

namespace probe::shared_bank_conflict_stride {

struct Config {
  int block_size = 256;
  int grid_size = 256;

  int shared_span_floats = 4096;
  int accesses_per_thread = 1024;

  int warmup = 10;
  int repeat = 50;

  // Fallback only.
  // If explicit strides are provided, max_stride is not used for sweep generation.
  int max_stride = 64;

  // Explicit irregular stride list.
  // If empty, default_stride_values(max_stride) is used.
  std::vector<int> strides;

  bool use_modulo_wrap = true;
  bool write_mode = false;
  bool pad_every_32 = false;
};

struct ResultPoint {
  int stride = 1;
  float avg_ms = 0.0f;

  int block_size = 0;
  int grid_size = 0;
  int launched_threads = 0;

  int accesses_per_thread = 0;
  long long actual_total_accesses = 0;

  int shared_span_floats = 0;
  int shared_span_bytes = 0;

  bool use_modulo_wrap = true;
  bool write_mode = false;
  bool pad_every_32 = false;

  double checksum = 0.0;
  double output_mean = 0.0;
  double output_max_abs = 0.0;
};

struct RunResult {
  std::string probe;
  std::vector<ResultPoint> results;
};

// Used only when Config::strides is empty.
// Default behavior should remain compatible with the old max_stride-based sweep.
std::vector<int> default_stride_values(int max_stride);

// Preferred helper for sweep selection.
// If cfg.strides is non-empty, returns cfg.strides.
// Otherwise returns default_stride_values(cfg.max_stride).
std::vector<int> stride_values_from_config(const Config& cfg);

RunResult run(const Config& cfg);

std::string to_json(
    const RunResult& result,
    const Config& cfg,
    int device_id,
    const std::string& device_name,
    int cc_major,
    int cc_minor);

void write_json(
    const RunResult& result,
    const Config& cfg,
    const std::string& output_path,
    int device_id,
    const std::string& device_name,
    int cc_major,
    int cc_minor);

}  // namespace probe::shared_bank_conflict_stride