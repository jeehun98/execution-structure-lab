#pragma once

#include <string>
#include <vector>

namespace probe::shared_padding_period_sweep {

struct Config {
  std::string probe_id = "shared-padding-period-sweep";
  std::string output_raw = "results/raw/shared_padding_period_sweep.json";

  int num_blocks = 256;
  int threads_per_block = 256;
  int accesses_per_thread = 1024;

  int shared_span_floats = 8192;

  std::vector<int> padding_periods = {16, 31, 32, 33, 64};
  std::vector<int> strides = {
      1, 2, 3, 5, 7, 9, 11, 13,
      15, 16, 17, 19, 23, 29, 30, 31, 32, 33, 34,
      37, 41, 47, 48, 49, 53, 59, 61, 63, 64, 65,
      71, 79, 83, 97};

  int inner_iters = 1;
  int warmup_iters = 5;
  int repeat_iters = 30;
};

struct ResultPoint {
  int padding_period = 0;
  int stride = 0;

  double avg_ms = 0.0;
  double min_ms = 0.0;
  double max_ms = 0.0;

  int num_blocks = 0;
  int threads_per_block = 0;
  int launched_threads = 0;

  int accesses_per_thread = 0;
  long long total_accesses = 0;

  int shared_span_floats = 0;
  int padded_shared_span_floats = 0;
  int shared_bytes = 0;
};

struct RunResult {
  std::string probe_id;
  std::vector<ResultPoint> results;
};

Config load_config(const std::string& path);

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

}  // namespace probe::shared_padding_period_sweep