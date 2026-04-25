#pragma once

#include <string>
#include <vector>

namespace probe::global_stride_sweep {

enum class StrideMode {
  WrappedFixedWork,
  BoundedNoWrap,
  WrappedOffsetSweep,
};

struct Config {
  // Atlas-page / result contract metadata.
  std::string probe_id = "global-stride-sweep-fixed-work";
  std::string probe_family = "global_stride_sweep";
  std::string result_schema = "stride-sweep-v1";

  int device_id = 0;
  int n = 1 << 24;
  int block_size = 256;
  int grid_size = 256;
  int warmup = 5;
  int repeat = 30;
  int inner_iters = 1;
  int total_accesses = 1 << 24;
  int base_offset = 0;

  std::vector<int> strides;

  bool run_wrapped = true;
  bool run_bounded = false;
  bool run_offset_sweep = false;

  std::vector<int> offset_values;
  std::vector<int> offset_representative_strides;

  std::string output_path;
};

struct Result {
  std::string mode;
  int stride = 1;
  int base_offset = 0;
  double avg_ms = 0.0;

  int launched_threads = 0;
  int active_threads = 0;
  int accesses_per_thread = 0;

  long long requested_total_accesses = 0;
  long long actual_total_accesses = 0;
  long long total_bytes_requested = 0;
  long long total_bytes_actual = 0;

  double actual_work_ratio = 0.0;

  // Logical throughput metrics. These are not hardware-counter DRAM bandwidth.
  double requested_bandwidth_gb_s = 0.0;
  double effective_bandwidth_gb_s = 0.0;

  long long warp_address_span_bytes = 0;
  long long unique_index_upper_bound = 0;
  long long estimated_footprint_bytes = 0;

  double unique_coverage_ratio = 0.0;

  bool wraps_address_space = false;

  double checksum = 0.0;
  double output_mean = 0.0;
  double output_max_abs = 0.0;
};

struct SuiteResult {
  std::string probe = "global_stride_sweep_suite";

  std::string probe_id = "global-stride-sweep-fixed-work";
  std::string probe_family = "global_stride_sweep";
  std::string result_schema = "stride-sweep-v1";

  struct DeviceInfo {
    int device_id = 0;
    std::string name;
    std::string compute_capability;
    int sm_count = 0;
    long long global_mem_bytes = 0;
  } device;

  Config config;
  std::vector<Result> results;
};

SuiteResult run(const Config& config);
void write_json(const SuiteResult& suite, const std::string& output_path);

void launch_global_stride_sweep_wrapped_kernel(
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

void launch_global_stride_sweep_bounded_kernel(
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

}  // namespace probe::global_stride_sweep