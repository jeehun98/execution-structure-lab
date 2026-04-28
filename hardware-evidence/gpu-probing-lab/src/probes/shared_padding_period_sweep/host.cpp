#include "host.hpp"

#include "common/cuda_check.hpp"

#include <cuda_runtime.h>

#include <algorithm>
#include <cctype>
#include <fstream>
#include <iomanip>
#include <iostream>
#include <numeric>
#include <sstream>
#include <stdexcept>
#include <string>
#include <unordered_map>
#include <vector>

namespace probe::shared_padding_period_sweep {

void launch_kernel(
    float* output,
    int num_blocks,
    int threads_per_block,
    int stride,
    int shared_span_floats,
    int padding_period,
    int accesses_per_thread,
    cudaStream_t stream);

namespace {

std::string trim(const std::string& s) {
  size_t b = 0;
  while (b < s.size() && std::isspace(static_cast<unsigned char>(s[b]))) {
    ++b;
  }

  size_t e = s.size();
  while (e > b && std::isspace(static_cast<unsigned char>(s[e - 1]))) {
    --e;
  }

  return s.substr(b, e - b);
}

std::vector<int> parse_int_list(const std::string& value) {
  std::vector<int> out;
  std::stringstream ss(value);
  std::string item;

  while (std::getline(ss, item, ',')) {
    item = trim(item);

    if (!item.empty()) {
      out.push_back(std::stoi(item));
    }
  }

  return out;
}

std::unordered_map<std::string, std::string> read_kv_file(
    const std::string& path) {
  std::ifstream in(path);

  if (!in) {
    throw std::runtime_error("failed to open config: " + path);
  }

  std::unordered_map<std::string, std::string> kv;
  std::string line;

  while (std::getline(in, line)) {
    line = trim(line);

    if (line.empty() || line[0] == '#') {
      continue;
    }

    const auto pos = line.find('=');

    if (pos == std::string::npos) {
      continue;
    }

    const std::string key = trim(line.substr(0, pos));
    const std::string value = trim(line.substr(pos + 1));

    kv[key] = value;
  }

  return kv;
}

std::string escape_json(const std::string& s) {
  std::ostringstream oss;

  for (char c : s) {
    switch (c) {
      case '"':
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

double elapsed_ms(cudaEvent_t start, cudaEvent_t stop) {
  float ms = 0.0f;
  CUDA_CHECK(cudaEventElapsedTime(&ms, start, stop));
  return static_cast<double>(ms);
}

void validate_config(const Config& cfg) {
  if (cfg.num_blocks <= 0) {
    throw std::runtime_error("num_blocks must be positive");
  }

  if (cfg.threads_per_block <= 0) {
    throw std::runtime_error("threads_per_block must be positive");
  }

  if (cfg.accesses_per_thread <= 0) {
    throw std::runtime_error("accesses_per_thread must be positive");
  }

  if (cfg.shared_span_floats <= 0) {
    throw std::runtime_error("shared_span_floats must be positive");
  }

  if (cfg.inner_iters <= 0) {
    throw std::runtime_error("inner_iters must be positive");
  }

  if (cfg.warmup_iters < 0) {
    throw std::runtime_error("warmup_iters must be >= 0");
  }

  if (cfg.repeat_iters <= 0) {
    throw std::runtime_error("repeat_iters must be positive");
  }

  if (cfg.padding_periods.empty()) {
    throw std::runtime_error("padding_periods must not be empty");
  }

  if (cfg.strides.empty()) {
    throw std::runtime_error("strides must not be empty");
  }

  for (int p : cfg.padding_periods) {
    if (p <= 0) {
      throw std::runtime_error("all padding_periods must be positive");
    }
  }

  for (int s : cfg.strides) {
    if (s <= 0) {
      throw std::runtime_error("all strides must be positive");
    }
  }
}

}  // namespace

Config load_config(const std::string& path) {
  Config cfg;
  const auto kv = read_kv_file(path);

  auto get_string = [&](const std::string& key, const std::string& current) {
    auto it = kv.find(key);
    return it == kv.end() ? current : it->second;
  };

  auto get_int = [&](const std::string& key, int current) {
    auto it = kv.find(key);
    return it == kv.end() ? current : std::stoi(it->second);
  };

  cfg.probe_id = get_string("probe_id", cfg.probe_id);
  cfg.output_raw = get_string("output_raw", cfg.output_raw);

  cfg.num_blocks = get_int("num_blocks", cfg.num_blocks);
  cfg.threads_per_block = get_int("threads_per_block", cfg.threads_per_block);
  cfg.accesses_per_thread =
      get_int("accesses_per_thread", cfg.accesses_per_thread);

  cfg.shared_span_floats =
      get_int("shared_span_floats", cfg.shared_span_floats);

  cfg.inner_iters = get_int("inner_iters", cfg.inner_iters);
  cfg.warmup_iters = get_int("warmup_iters", cfg.warmup_iters);
  cfg.repeat_iters = get_int("repeat_iters", cfg.repeat_iters);

  auto pit = kv.find("padding_periods");
  if (pit != kv.end()) {
    cfg.padding_periods = parse_int_list(pit->second);
  }

  auto sit = kv.find("strides");
  if (sit != kv.end()) {
    cfg.strides = parse_int_list(sit->second);
  }

  validate_config(cfg);

  return cfg;
}

RunResult run(const Config& cfg) {
  validate_config(cfg);

  const int launched_threads = cfg.num_blocks * cfg.threads_per_block;
  const size_t output_bytes =
      static_cast<size_t>(launched_threads) * sizeof(float);

  float* d_output = nullptr;
  CUDA_CHECK(cudaMalloc(&d_output, output_bytes));
  CUDA_CHECK(cudaMemset(d_output, 0, output_bytes));

  cudaStream_t stream;
  CUDA_CHECK(cudaStreamCreate(&stream));

  cudaEvent_t start;
  cudaEvent_t stop;
  CUDA_CHECK(cudaEventCreate(&start));
  CUDA_CHECK(cudaEventCreate(&stop));

  RunResult rr;
  rr.probe_id = cfg.probe_id;

  rr.results.reserve(cfg.padding_periods.size() * cfg.strides.size());

  for (int padding_period : cfg.padding_periods) {
    const int padded_shared_span =
        cfg.shared_span_floats + (cfg.shared_span_floats / padding_period) + 1;

    const int shared_bytes =
        padded_shared_span * static_cast<int>(sizeof(float));

    std::cout
        << "padding_period=" << padding_period
        << " padded_shared_span=" << padded_shared_span
        << " shared_bytes=" << shared_bytes
        << std::endl;

    for (int stride : cfg.strides) {
      CUDA_CHECK(cudaMemsetAsync(d_output, 0, output_bytes, stream));

      for (int i = 0; i < cfg.warmup_iters; ++i) {
        launch_kernel(
            d_output,
            cfg.num_blocks,
            cfg.threads_per_block,
            stride,
            cfg.shared_span_floats,
            padding_period,
            cfg.accesses_per_thread,
            stream);
      }

      CUDA_CHECK(cudaStreamSynchronize(stream));

      std::vector<double> samples;
      samples.reserve(static_cast<size_t>(cfg.repeat_iters));

      for (int i = 0; i < cfg.repeat_iters; ++i) {
        CUDA_CHECK(cudaEventRecord(start, stream));

        for (int inner = 0; inner < cfg.inner_iters; ++inner) {
          launch_kernel(
              d_output,
              cfg.num_blocks,
              cfg.threads_per_block,
              stride,
              cfg.shared_span_floats,
              padding_period,
              cfg.accesses_per_thread,
              stream);
        }

        CUDA_CHECK(cudaEventRecord(stop, stream));
        CUDA_CHECK(cudaEventSynchronize(stop));

        const double ms =
            elapsed_ms(start, stop) / static_cast<double>(cfg.inner_iters);

        samples.push_back(ms);
      }

      const auto [min_it, max_it] =
          std::minmax_element(samples.begin(), samples.end());

      const double sum =
          std::accumulate(samples.begin(), samples.end(), 0.0);

      ResultPoint r;
      r.padding_period = padding_period;
      r.stride = stride;
      r.avg_ms = sum / static_cast<double>(samples.size());
      r.min_ms = *min_it;
      r.max_ms = *max_it;

      r.num_blocks = cfg.num_blocks;
      r.threads_per_block = cfg.threads_per_block;
      r.launched_threads = launched_threads;

      r.accesses_per_thread = cfg.accesses_per_thread;
      r.total_accesses =
          static_cast<long long>(launched_threads) *
          static_cast<long long>(cfg.accesses_per_thread);

      r.shared_span_floats = cfg.shared_span_floats;
      r.padded_shared_span_floats = padded_shared_span;
      r.shared_bytes = shared_bytes;

      rr.results.push_back(r);

      std::cout
          << "  stride=" << stride
          << " avg_ms=" << std::fixed << std::setprecision(6) << r.avg_ms
          << " min_ms=" << r.min_ms
          << " max_ms=" << r.max_ms
          << std::endl;
    }
  }

  CUDA_CHECK(cudaEventDestroy(start));
  CUDA_CHECK(cudaEventDestroy(stop));
  CUDA_CHECK(cudaStreamDestroy(stream));
  CUDA_CHECK(cudaFree(d_output));

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
  os << "  \"probe_id\": \"" << escape_json(result.probe_id) << "\",\n";
  os << "  \"category\": \"Shared Memory\",\n";
  os << "  \"label\": \"Shared Padding Period Sweep\",\n";
  os << "  \"description\": \"Sweep padding period to observe whether conflict spike topology moves with logical-to-physical mapping boundaries.\",\n";

  os << "  \"device\": {\n";
  os << "    \"id\": " << device_id << ",\n";
  os << "    \"name\": \"" << escape_json(device_name) << "\",\n";
  os << "    \"cc_major\": " << cc_major << ",\n";
  os << "    \"cc_minor\": " << cc_minor << "\n";
  os << "  },\n";

  os << "  \"config\": {\n";
  os << "    \"num_blocks\": " << cfg.num_blocks << ",\n";
  os << "    \"threads_per_block\": " << cfg.threads_per_block << ",\n";
  os << "    \"accesses_per_thread\": " << cfg.accesses_per_thread << ",\n";
  os << "    \"shared_span_floats\": " << cfg.shared_span_floats << ",\n";
  os << "    \"inner_iters\": " << cfg.inner_iters << ",\n";
  os << "    \"warmup_iters\": " << cfg.warmup_iters << ",\n";
  os << "    \"repeat_iters\": " << cfg.repeat_iters << ",\n";

  os << "    \"padding_periods\": [";
  for (size_t i = 0; i < cfg.padding_periods.size(); ++i) {
    os << cfg.padding_periods[i];
    if (i + 1 < cfg.padding_periods.size()) {
      os << ", ";
    }
  }
  os << "],\n";

  os << "    \"strides\": [";
  for (size_t i = 0; i < cfg.strides.size(); ++i) {
    os << cfg.strides[i];
    if (i + 1 < cfg.strides.size()) {
      os << ", ";
    }
  }
  os << "]\n";
  os << "  },\n";

  os << "  \"results\": [\n";

  for (size_t i = 0; i < result.results.size(); ++i) {
    const auto& r = result.results[i];

    os << "    {\n";
    os << "      \"padding_period\": " << r.padding_period << ",\n";
    os << "      \"stride\": " << r.stride << ",\n";
    os << "      \"avg_ms\": " << r.avg_ms << ",\n";
    os << "      \"min_ms\": " << r.min_ms << ",\n";
    os << "      \"max_ms\": " << r.max_ms << ",\n";
    os << "      \"num_blocks\": " << r.num_blocks << ",\n";
    os << "      \"threads_per_block\": " << r.threads_per_block << ",\n";
    os << "      \"launched_threads\": " << r.launched_threads << ",\n";
    os << "      \"accesses_per_thread\": " << r.accesses_per_thread << ",\n";
    os << "      \"total_accesses\": " << r.total_accesses << ",\n";
    os << "      \"shared_span_floats\": " << r.shared_span_floats << ",\n";
    os << "      \"padded_shared_span_floats\": "
       << r.padded_shared_span_floats << ",\n";
    os << "      \"shared_bytes\": " << r.shared_bytes << "\n";
    os << "    }";

    if (i + 1 < result.results.size()) {
      os << ",";
    }

    os << "\n";
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
    throw std::runtime_error("failed to open output json: " + output_path);
  }

  ofs << to_json(
      result,
      cfg,
      device_id,
      device_name,
      cc_major,
      cc_minor);
}

}  // namespace probe::shared_padding_period_sweep