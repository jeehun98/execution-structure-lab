#pragma once

#include <string>
#include <vector>

namespace probe::shared_pad_effect {

struct SharedPadEffectConfig {
  std::string probe_id = "shared-pad-effect";
  std::string output_raw = "results/raw/shared_pad_effect.json";

  int num_blocks = 256;
  int threads_per_block = 256;
  int accesses_per_thread = 1024;

  int shared_span_floats = 8192;
  int padding_period = 32;

  int inner_iters = 1;
  int warmup_iters = 5;
  int repeat_iters = 30;

  std::vector<int> strides = {1, 2, 4, 8, 16, 32, 48, 64};
};

struct SharedPadEffectResult {
  int stride = 0;
  int num_blocks = 0;
  int threads_per_block = 0;
  int launched_threads = 0;
  int accesses_per_thread = 0;
  int shared_span_floats = 0;
  int padded_shared_span_floats = 0;
  int padding_period = 0;
  long long total_accesses = 0;
  double avg_ms = 0.0;
  double min_ms = 0.0;
  double max_ms = 0.0;
};

SharedPadEffectConfig load_config(const std::string& path);

std::vector<SharedPadEffectResult> run_probe(const SharedPadEffectConfig& cfg);

void write_results_json(
    const std::string& path,
    const SharedPadEffectConfig& cfg,
    const std::vector<SharedPadEffectResult>& results);

}  // namespace probe::shared_pad_effect