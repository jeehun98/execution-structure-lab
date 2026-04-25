#include "host.hpp"

#include "common/cuda_check.hpp"

#include <cuda_runtime.h>

#include <algorithm>
#include <cmath>
#include <filesystem>
#include <fstream>
#include <iomanip>
#include <numeric>
#include <sstream>
#include <stdexcept>
#include <string>
#include <vector>

namespace probe::global_stride_sweep {
namespace {

struct EventTimer {
  cudaEvent_t start{};
  cudaEvent_t stop{};

  EventTimer() {
    CUDA_CHECK(cudaEventCreate(&start));
    CUDA_CHECK(cudaEventCreate(&stop));
  }

  ~EventTimer() {
    cudaEventDestroy(start);
    cudaEventDestroy(stop);
  }

  void tic() { CUDA_CHECK(cudaEventRecord(start)); }

  float toc_ms() {
    CUDA_CHECK(cudaEventRecord(stop));
    CUDA_CHECK(cudaEventSynchronize(stop));

    float ms = 0.0f;
    CUDA_CHECK(cudaEventElapsedTime(&ms, start, stop));
    return ms;
  }
};

long long gcd_ll(long long a, long long b) {
  while (b != 0) {
    long long t = a % b;
    a = b;
    b = t;
  }
  return a < 0 ? -a : a;
}

long long ceil_div_ll(long long a, long long b) {
  if (b <= 0) {
    throw std::runtime_error("ceil_div_ll: denominator must be positive");
  }
  return (a + b - 1) / b;
}

std::string escape_json(const std::string& s) {
  std::ostringstream oss;
  for (char c : s) {
    switch (c) {
      case '\"':
        oss << "\\\"";
        break;
      case '\\':
        oss << "\\\\";
        break;
      case '\n':
        oss << "\\n";
        break;
      case '\r':
        oss << "\\r";
        break;
      case '\t':
        oss << "\\t";
        break;
      default:
        oss << c;
        break;
    }
  }
  return oss.str();
}

SuiteResult::DeviceInfo query_device_info(int device_id) {
  cudaDeviceProp prop{};
  CUDA_CHECK(cudaGetDeviceProperties(&prop, device_id));

  SuiteResult::DeviceInfo info;
  info.device_id = device_id;
  info.name = prop.name;
  info.compute_capability =
      std::to_string(prop.major) + "." + std::to_string(prop.minor);
  info.sm_count = prop.multiProcessorCount;
  info.global_mem_bytes = static_cast<long long>(prop.totalGlobalMem);
  return info;
}

void validate_case_config(const Config& config, int stride) {
  if (config.n <= 0) {
    throw std::runtime_error("global_stride_sweep: n must be positive");
  }
  if (config.block_size <= 0) {
    throw std::runtime_error("global_stride_sweep: block_size must be positive");
  }
  if (config.grid_size <= 0) {
    throw std::runtime_error("global_stride_sweep: grid_size must be positive");
  }
  if (config.repeat <= 0) {
    throw std::runtime_error("global_stride_sweep: repeat must be positive");
  }
  if (config.warmup < 0) {
    throw std::runtime_error("global_stride_sweep: warmup must be non-negative");
  }
  if (config.inner_iters <= 0) {
    throw std::runtime_error("global_stride_sweep: inner_iters must be positive");
  }
  if (config.total_accesses <= 0) {
    throw std::runtime_error("global_stride_sweep: total_accesses must be positive");
  }
  if (stride <= 0) {
    throw std::runtime_error("global_stride_sweep: stride must be positive");
  }
}

Result run_single_case(
    const Config& config,
    const std::string& mode_name,
    bool wrapped,
    int stride,
    int base_offset,
    const float* d_input,
    float* d_output,
    std::vector<float>& h_output) {
  validate_case_config(config, stride);

  Result r;
  r.mode = mode_name;
  r.stride = stride;
  r.base_offset = base_offset;
  r.wraps_address_space = wrapped;

  const int launched_threads = config.block_size * config.grid_size;
  const int accesses_per_thread =
      static_cast<int>(ceil_div_ll(config.total_accesses, launched_threads));

  r.launched_threads = launched_threads;
  r.accesses_per_thread = accesses_per_thread;
  r.requested_total_accesses = config.total_accesses;
  r.total_bytes_requested =
      static_cast<long long>(config.total_accesses) * sizeof(float);
  r.warp_address_span_bytes =
      static_cast<long long>(31) * stride * sizeof(float) + sizeof(float);

  if (wrapped) {
    r.actual_total_accesses = config.total_accesses;
    r.active_threads = std::min(launched_threads, config.total_accesses);
    r.total_bytes_actual =
        static_cast<long long>(r.actual_total_accesses) * sizeof(float);

    long long unique_cycle =
        static_cast<long long>(config.n) / gcd_ll(config.n, stride);
    r.unique_index_upper_bound =
        std::min<long long>(config.total_accesses, unique_cycle);
    r.estimated_footprint_bytes =
        r.unique_index_upper_bound * static_cast<long long>(sizeof(float));
  } else {
    if (base_offset >= config.n) {
      r.actual_total_accesses = 0;
    } else {
      long long max_valid_logical =
          (static_cast<long long>(config.n - 1) - base_offset) / stride + 1;
      r.actual_total_accesses =
          std::max<long long>(
              0,
              std::min<long long>(config.total_accesses, max_valid_logical));
    }

    r.active_threads =
        static_cast<int>(
            std::min<long long>(launched_threads, r.actual_total_accesses));
    r.total_bytes_actual =
        static_cast<long long>(r.actual_total_accesses) * sizeof(float);
    r.unique_index_upper_bound = r.actual_total_accesses;
    r.estimated_footprint_bytes =
        r.unique_index_upper_bound * static_cast<long long>(sizeof(float));
  }

  EventTimer timer;

  // Avoid stale output from previous mode/stride contaminating checksum stats.
  CUDA_CHECK(cudaMemset(d_output, 0, sizeof(float) * launched_threads));

  for (int i = 0; i < config.warmup; ++i) {
    if (wrapped) {
      launch_global_stride_sweep_wrapped_kernel(
          d_input,
          d_output,
          config.n,
          stride,
          config.inner_iters,
          config.total_accesses,
          base_offset,
          accesses_per_thread,
          launched_threads,
          config.block_size);
    } else {
      launch_global_stride_sweep_bounded_kernel(
          d_input,
          d_output,
          config.n,
          stride,
          config.inner_iters,
          config.total_accesses,
          base_offset,
          accesses_per_thread,
          launched_threads,
          config.block_size);
    }
  }
  CUDA_CHECK(cudaDeviceSynchronize());

  CUDA_CHECK(cudaMemset(d_output, 0, sizeof(float) * launched_threads));

  double ms_sum = 0.0;
  for (int i = 0; i < config.repeat; ++i) {
    timer.tic();

    if (wrapped) {
      launch_global_stride_sweep_wrapped_kernel(
          d_input,
          d_output,
          config.n,
          stride,
          config.inner_iters,
          config.total_accesses,
          base_offset,
          accesses_per_thread,
          launched_threads,
          config.block_size);
    } else {
      launch_global_stride_sweep_bounded_kernel(
          d_input,
          d_output,
          config.n,
          stride,
          config.inner_iters,
          config.total_accesses,
          base_offset,
          accesses_per_thread,
          launched_threads,
          config.block_size);
    }

    ms_sum += static_cast<double>(timer.toc_ms());
  }

  r.avg_ms = ms_sum / static_cast<double>(config.repeat);

  if (r.requested_total_accesses > 0) {
    r.actual_work_ratio =
        static_cast<double>(r.actual_total_accesses) /
        static_cast<double>(r.requested_total_accesses);
  }

  if (config.n > 0) {
    r.unique_coverage_ratio =
        static_cast<double>(r.unique_index_upper_bound) /
        static_cast<double>(config.n);
  }

  if (r.avg_ms > 0.0) {
    const double seconds = r.avg_ms / 1000.0;

    r.requested_bandwidth_gb_s =
        static_cast<double>(r.total_bytes_requested) / seconds / 1.0e9;

    r.effective_bandwidth_gb_s =
        static_cast<double>(r.total_bytes_actual) / seconds / 1.0e9;
  }

  CUDA_CHECK(cudaMemcpy(
      h_output.data(),
      d_output,
      sizeof(float) * launched_threads,
      cudaMemcpyDeviceToHost));

  double checksum = 0.0;
  double sum = 0.0;
  double max_abs = 0.0;

  for (float v : h_output) {
    checksum += static_cast<double>(v);
    sum += static_cast<double>(v);
    max_abs = std::max(max_abs, std::abs(static_cast<double>(v)));
  }

  r.checksum = checksum;
  r.output_mean = h_output.empty() ? 0.0 : sum / static_cast<double>(h_output.size());
  r.output_max_abs = max_abs;

  return r;
}

void write_int_array_json(std::ostringstream& oss, const std::vector<int>& values) {
  oss << "[";
  for (size_t i = 0; i < values.size(); ++i) {
    if (i) {
      oss << ", ";
    }
    oss << values[i];
  }
  oss << "]";
}

std::string suite_to_json(const SuiteResult& suite) {
  std::ostringstream oss;
  oss << std::fixed << std::setprecision(6);

  oss << "{\n";
  oss << "  \"probe\": \"" << escape_json(suite.probe) << "\",\n";
  oss << "  \"probe_id\": \"" << escape_json(suite.probe_id) << "\",\n";
  oss << "  \"probe_family\": \"" << escape_json(suite.probe_family) << "\",\n";
  oss << "  \"result_schema\": \"" << escape_json(suite.result_schema) << "\",\n";

  oss << "  \"metric_note\": "
      << "\"bandwidth fields are logical probe throughput, not hardware-counter DRAM bandwidth\",\n";

  oss << "  \"device\": {\n";
  oss << "    \"device_id\": " << suite.device.device_id << ",\n";
  oss << "    \"name\": \"" << escape_json(suite.device.name) << "\",\n";
  oss << "    \"compute_capability\": \""
      << escape_json(suite.device.compute_capability) << "\",\n";
  oss << "    \"sm_count\": " << suite.device.sm_count << ",\n";
  oss << "    \"global_mem_bytes\": " << suite.device.global_mem_bytes << "\n";
  oss << "  },\n";

  oss << "  \"config\": {\n";
  oss << "    \"probe_id\": \"" << escape_json(suite.config.probe_id) << "\",\n";
  oss << "    \"probe_family\": \"" << escape_json(suite.config.probe_family) << "\",\n";
  oss << "    \"result_schema\": \"" << escape_json(suite.config.result_schema) << "\",\n";
  oss << "    \"device_id\": " << suite.config.device_id << ",\n";
  oss << "    \"n\": " << suite.config.n << ",\n";
  oss << "    \"block_size\": " << suite.config.block_size << ",\n";
  oss << "    \"grid_size\": " << suite.config.grid_size << ",\n";
  oss << "    \"warmup\": " << suite.config.warmup << ",\n";
  oss << "    \"repeat\": " << suite.config.repeat << ",\n";
  oss << "    \"inner_iters\": " << suite.config.inner_iters << ",\n";
  oss << "    \"total_accesses\": " << suite.config.total_accesses << ",\n";
  oss << "    \"base_offset\": " << suite.config.base_offset << ",\n";

  oss << "    \"strides\": ";
  write_int_array_json(oss, suite.config.strides);
  oss << ",\n";

  oss << "    \"run_wrapped\": " << (suite.config.run_wrapped ? "true" : "false")
      << ",\n";
  oss << "    \"run_bounded\": " << (suite.config.run_bounded ? "true" : "false")
      << ",\n";
  oss << "    \"run_offset_sweep\": "
      << (suite.config.run_offset_sweep ? "true" : "false") << ",\n";

  oss << "    \"offset_values\": ";
  write_int_array_json(oss, suite.config.offset_values);
  oss << ",\n";

  oss << "    \"offset_representative_strides\": ";
  write_int_array_json(oss, suite.config.offset_representative_strides);
  oss << ",\n";

  oss << "    \"output_path\": \"" << escape_json(suite.config.output_path) << "\"\n";
  oss << "  },\n";

  oss << "  \"results\": [\n";
  for (size_t i = 0; i < suite.results.size(); ++i) {
    const auto& r = suite.results[i];

    oss << "    {\n";
    oss << "      \"mode\": \"" << escape_json(r.mode) << "\",\n";
    oss << "      \"stride\": " << r.stride << ",\n";
    oss << "      \"base_offset\": " << r.base_offset << ",\n";
    oss << "      \"avg_ms\": " << r.avg_ms << ",\n";
    oss << "      \"launched_threads\": " << r.launched_threads << ",\n";
    oss << "      \"active_threads\": " << r.active_threads << ",\n";
    oss << "      \"accesses_per_thread\": " << r.accesses_per_thread << ",\n";
    oss << "      \"requested_total_accesses\": " << r.requested_total_accesses << ",\n";
    oss << "      \"actual_total_accesses\": " << r.actual_total_accesses << ",\n";
    oss << "      \"actual_work_ratio\": " << r.actual_work_ratio << ",\n";
    oss << "      \"total_bytes_requested\": " << r.total_bytes_requested << ",\n";
    oss << "      \"total_bytes_actual\": " << r.total_bytes_actual << ",\n";
    oss << "      \"requested_bandwidth_gb_s\": " << r.requested_bandwidth_gb_s << ",\n";
    oss << "      \"effective_bandwidth_gb_s\": " << r.effective_bandwidth_gb_s << ",\n";
    oss << "      \"warp_address_span_bytes\": " << r.warp_address_span_bytes << ",\n";
    oss << "      \"unique_index_upper_bound\": " << r.unique_index_upper_bound << ",\n";
    oss << "      \"unique_coverage_ratio\": " << r.unique_coverage_ratio << ",\n";
    oss << "      \"estimated_footprint_bytes\": " << r.estimated_footprint_bytes << ",\n";
    oss << "      \"wraps_address_space\": "
        << (r.wraps_address_space ? "true" : "false") << ",\n";
    oss << "      \"checksum\": " << r.checksum << ",\n";
    oss << "      \"output_mean\": " << r.output_mean << ",\n";
    oss << "      \"output_max_abs\": " << r.output_max_abs << "\n";
    oss << "    }";

    if (i + 1 != suite.results.size()) {
      oss << ",";
    }

    oss << "\n";
  }

  oss << "  ]\n";
  oss << "}\n";

  return oss.str();
}

}  // namespace

SuiteResult run(const Config& config) {
  if (config.strides.empty() && !config.run_offset_sweep) {
    throw std::runtime_error("global_stride_sweep: strides is empty");
  }

  if (!config.run_wrapped && !config.run_bounded && !config.run_offset_sweep) {
    throw std::runtime_error(
        "global_stride_sweep: no mode enabled. Enable run_wrapped, run_bounded, or run_offset_sweep");
  }

  CUDA_CHECK(cudaSetDevice(config.device_id));

  SuiteResult suite;
  suite.probe_id = config.probe_id;
  suite.probe_family = config.probe_family;
  suite.result_schema = config.result_schema;
  suite.device = query_device_info(config.device_id);
  suite.config = config;

  const int launched_threads = config.block_size * config.grid_size;

  std::vector<float> h_input(config.n);
  for (int i = 0; i < config.n; ++i) {
    h_input[i] = 1.0f + static_cast<float>(i % 251) * 0.001f;
  }

  std::vector<float> h_output(launched_threads, 0.0f);

  float* d_input = nullptr;
  float* d_output = nullptr;

  CUDA_CHECK(cudaMalloc(&d_input, sizeof(float) * config.n));
  CUDA_CHECK(cudaMalloc(&d_output, sizeof(float) * launched_threads));

  try {
    CUDA_CHECK(cudaMemcpy(
        d_input,
        h_input.data(),
        sizeof(float) * config.n,
        cudaMemcpyHostToDevice));

    if (config.run_wrapped) {
      for (int stride : config.strides) {
        suite.results.push_back(run_single_case(
            config,
            "wrapped_fixed_work",
            true,
            stride,
            config.base_offset,
            d_input,
            d_output,
            h_output));
      }
    }

    if (config.run_bounded) {
      for (int stride : config.strides) {
        suite.results.push_back(run_single_case(
            config,
            "bounded_no_wrap",
            false,
            stride,
            config.base_offset,
            d_input,
            d_output,
            h_output));
      }
    }

    if (config.run_offset_sweep) {
      std::vector<int> strides = config.offset_representative_strides;
      if (strides.empty()) {
        strides = {1, 8, 32, 64, 256};
      }

      std::vector<int> offsets = config.offset_values;
      if (offsets.empty()) {
        offsets = {0, 32, 64, 128, 256};
      }

      for (int stride : strides) {
        for (int offset : offsets) {
          suite.results.push_back(run_single_case(
              config,
              "wrapped_offset_sweep",
              true,
              stride,
              offset,
              d_input,
              d_output,
              h_output));
        }
      }
    }
  } catch (...) {
    cudaFree(d_input);
    cudaFree(d_output);
    throw;
  }

  CUDA_CHECK(cudaFree(d_input));
  CUDA_CHECK(cudaFree(d_output));

  return suite;
}

void write_json(const SuiteResult& suite, const std::string& output_path) {
  if (output_path.empty()) {
    throw std::runtime_error("global_stride_sweep: output_path is empty");
  }

  std::filesystem::path p(output_path);
  if (p.has_parent_path()) {
    std::filesystem::create_directories(p.parent_path());
  }

  std::ofstream ofs(output_path);
  if (!ofs) {
    throw std::runtime_error("failed to open output file: " + output_path);
  }

  ofs << suite_to_json(suite);
}

}  // namespace probe::global_stride_sweep