#include "host.hpp"

#include "common/cuda_check.hpp"

#include <cuda_runtime.h>

#include <algorithm>
#include <cmath>
#include <fstream>
#include <iomanip>
#include <sstream>
#include <stdexcept>
#include <string>
#include <vector>

namespace probe::shared_bank_conflict_stride {
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

  void tic() {
    CUDA_CHECK(cudaEventRecord(start));
  }

  float toc_ms() {
    CUDA_CHECK(cudaEventRecord(stop));
    CUDA_CHECK(cudaEventSynchronize(stop));
    float ms = 0.0f;
    CUDA_CHECK(cudaEventElapsedTime(&ms, start, stop));
    return ms;
  }
};

std::string escape_json(const std::string& s) {
  std::ostringstream oss;
  for (char c : s) {
    switch (c) {
      case '\"': oss << "\\\""; break;
      case '\\': oss << "\\\\"; break;
      case '\n': oss << "\\n"; break;
      case '\r': oss << "\\r"; break;
      case '\t': oss << "\\t"; break;
      default: oss << c; break;
    }
  }
  return oss.str();
}

} // namespace

void launch_shared_bank_conflict_stride_kernel(
    float* out,
    int block_size,
    int grid_size,
    int shared_span_floats,
    int accesses_per_thread,
    int stride,
    bool use_modulo_wrap,
    bool write_mode,
    bool pad_every_32);

std::vector<int> default_stride_values(int max_stride) {
  std::vector<int> v;
  for (int s = 1; s <= max_stride; ++s) {
    v.push_back(s);
  }
  return v;
}

static ResultPoint run_single_case(
    const Config& cfg,
    int stride,
    float* d_out,
    std::vector<float>& h_out) {
  ResultPoint r;
  r.stride = stride;
  r.block_size = cfg.block_size;
  r.grid_size = cfg.grid_size;
  r.launched_threads = cfg.block_size * cfg.grid_size;
  r.accesses_per_thread = cfg.accesses_per_thread;
  r.actual_total_accesses =
      static_cast<long long>(r.launched_threads) *
      static_cast<long long>(cfg.accesses_per_thread);
  r.shared_span_floats = cfg.shared_span_floats;
  r.shared_span_bytes = cfg.shared_span_floats * static_cast<int>(sizeof(float));
  r.use_modulo_wrap = cfg.use_modulo_wrap;
  r.write_mode = cfg.write_mode;
  r.pad_every_32 = cfg.pad_every_32;

  for (int i = 0; i < cfg.warmup; ++i) {
    launch_shared_bank_conflict_stride_kernel(
        d_out,
        cfg.block_size,
        cfg.grid_size,
        cfg.shared_span_floats,
        cfg.accesses_per_thread,
        stride,
        cfg.use_modulo_wrap,
        cfg.write_mode,
        cfg.pad_every_32);
  }
  CUDA_CHECK(cudaDeviceSynchronize());

  EventTimer timer;
  float ms_sum = 0.0f;

  for (int i = 0; i < cfg.repeat; ++i) {
    timer.tic();
    launch_shared_bank_conflict_stride_kernel(
        d_out,
        cfg.block_size,
        cfg.grid_size,
        cfg.shared_span_floats,
        cfg.accesses_per_thread,
        stride,
        cfg.use_modulo_wrap,
        cfg.write_mode,
        cfg.pad_every_32);
    ms_sum += timer.toc_ms();
  }

  r.avg_ms = ms_sum / static_cast<float>(cfg.repeat);

  CUDA_CHECK(cudaMemcpy(
      h_out.data(),
      d_out,
      sizeof(float) * static_cast<size_t>(r.launched_threads),
      cudaMemcpyDeviceToHost));

  double checksum = 0.0;
  double sum = 0.0;
  double max_abs = 0.0;

  for (float v : h_out) {
    const double dv = static_cast<double>(v);
    checksum += dv;
    sum += dv;
    max_abs = std::max(max_abs, std::abs(dv));
  }

  r.checksum = checksum;
  r.output_mean = h_out.empty() ? 0.0 : (sum / static_cast<double>(h_out.size()));
  r.output_max_abs = max_abs;

  return r;
}

RunResult run(const Config& cfg) {
  if (cfg.block_size <= 0) {
    throw std::runtime_error("block_size must be > 0");
  }
  if (cfg.grid_size <= 0) {
    throw std::runtime_error("grid_size must be > 0");
  }
  if (cfg.shared_span_floats <= 0) {
    throw std::runtime_error("shared_span_floats must be > 0");
  }
  if (cfg.accesses_per_thread <= 0) {
    throw std::runtime_error("accesses_per_thread must be > 0");
  }
  if (cfg.max_stride <= 0) {
    throw std::runtime_error("max_stride must be > 0");
  }

  RunResult rr;
  rr.probe = "shared_bank_conflict_stride";

  const int launched_threads = cfg.block_size * cfg.grid_size;
  const size_t out_count = static_cast<size_t>(launched_threads);
  const size_t out_bytes = out_count * sizeof(float);

  float* d_out = nullptr;
  CUDA_CHECK(cudaMalloc(&d_out, out_bytes));
  CUDA_CHECK(cudaMemset(d_out, 0, out_bytes));

  std::vector<float> h_out(out_count, 0.0f);
  const auto strides = default_stride_values(cfg.max_stride);

  rr.results.reserve(strides.size());
  for (int stride : strides) {
    rr.results.push_back(run_single_case(cfg, stride, d_out, h_out));
  }

  CUDA_CHECK(cudaFree(d_out));
  return rr;
}

std::string to_json(
    const RunResult& result,
    const Config& cfg,
    int device_id,
    const std::string& device_name,
    int cc_major,
    int cc_minor) {
  std::ostringstream os;
  os << std::fixed << std::setprecision(6);

  os << "{\n";
  os << "  \"probe\": \"" << escape_json(result.probe) << "\",\n";
  os << "  \"device\": {\n";
  os << "    \"id\": " << device_id << ",\n";
  os << "    \"name\": \"" << escape_json(device_name) << "\",\n";
  os << "    \"cc_major\": " << cc_major << ",\n";
  os << "    \"cc_minor\": " << cc_minor << "\n";
  os << "  },\n";
  os << "  \"config\": {\n";
  os << "    \"block_size\": " << cfg.block_size << ",\n";
  os << "    \"grid_size\": " << cfg.grid_size << ",\n";
  os << "    \"shared_span_floats\": " << cfg.shared_span_floats << ",\n";
  os << "    \"accesses_per_thread\": " << cfg.accesses_per_thread << ",\n";
  os << "    \"warmup\": " << cfg.warmup << ",\n";
  os << "    \"repeat\": " << cfg.repeat << ",\n";
  os << "    \"max_stride\": " << cfg.max_stride << ",\n";
  os << "    \"use_modulo_wrap\": " << (cfg.use_modulo_wrap ? "true" : "false") << ",\n";
  os << "    \"write_mode\": " << (cfg.write_mode ? "true" : "false") << ",\n";
  os << "    \"pad_every_32\": " << (cfg.pad_every_32 ? "true" : "false") << "\n";
  os << "  },\n";
  os << "  \"results\": [\n";

  for (size_t i = 0; i < result.results.size(); ++i) {
    const auto& r = result.results[i];
    os << "    {\n";
    os << "      \"stride\": " << r.stride << ",\n";
    os << "      \"avg_ms\": " << r.avg_ms << ",\n";
    os << "      \"block_size\": " << r.block_size << ",\n";
    os << "      \"grid_size\": " << r.grid_size << ",\n";
    os << "      \"launched_threads\": " << r.launched_threads << ",\n";
    os << "      \"accesses_per_thread\": " << r.accesses_per_thread << ",\n";
    os << "      \"actual_total_accesses\": " << r.actual_total_accesses << ",\n";
    os << "      \"shared_span_floats\": " << r.shared_span_floats << ",\n";
    os << "      \"shared_span_bytes\": " << r.shared_span_bytes << ",\n";
    os << "      \"use_modulo_wrap\": " << (r.use_modulo_wrap ? "true" : "false") << ",\n";
    os << "      \"write_mode\": " << (r.write_mode ? "true" : "false") << ",\n";
    os << "      \"pad_every_32\": " << (r.pad_every_32 ? "true" : "false") << ",\n";
    os << "      \"checksum\": " << r.checksum << ",\n";
    os << "      \"output_mean\": " << r.output_mean << ",\n";
    os << "      \"output_max_abs\": " << r.output_max_abs << "\n";
    os << "    }" << (i + 1 < result.results.size() ? "," : "") << "\n";
  }

  os << "  ]\n";
  os << "}\n";

  return os.str();
}

void write_json(
    const RunResult& result,
    const Config& cfg,
    const std::string& output_path,
    int device_id,
    const std::string& device_name,
    int cc_major,
    int cc_minor) {
  std::ofstream ofs(output_path);
  if (!ofs) {
    throw std::runtime_error("failed to open output file: " + output_path);
  }

  ofs << to_json(result, cfg, device_id, device_name, cc_major, cc_minor);
}

} // namespace probe::shared_bank_conflict_stride