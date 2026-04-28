#include "host.hpp"

#include "common/cuda_check.hpp"

#include <cuda_runtime.h>

#include <algorithm>
#include <chrono>
#include <fstream>
#include <iomanip>
#include <iostream>
#include <numeric>
#include <sstream>
#include <stdexcept>
#include <string>
#include <unordered_map>

namespace probe::shared_pad_effect {

void launch_shared_pad_effect_kernel(
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
  const auto begin = s.find_first_not_of(" \t\r\n");
  if (begin == std::string::npos) {
    return "";
  }

  const auto end = s.find_last_not_of(" \t\r\n");
  return s.substr(begin, end - begin + 1);
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

std::unordered_map<std::string, std::string> read_kv_file(const std::string& path) {
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

double elapsed_ms(cudaEvent_t start, cudaEvent_t stop) {
  float ms = 0.0f;
  CUDA_CHECK(cudaEventElapsedTime(&ms, start, stop));
  return static_cast<double>(ms);
}

}  // namespace

SharedPadEffectConfig load_config(const std::string& path) {
  SharedPadEffectConfig cfg;
  const auto kv = read_kv_file(path);

  auto get_string = [&](const std::string& key, std::string current) {
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
  cfg.accesses_per_thread = get_int("accesses_per_thread", cfg.accesses_per_thread);

  cfg.shared_span_floats = get_int("shared_span_floats", cfg.shared_span_floats);
  cfg.padding_period = get_int("padding_period", cfg.padding_period);

  cfg.inner_iters = get_int("inner_iters", cfg.inner_iters);
  cfg.warmup_iters = get_int("warmup_iters", cfg.warmup_iters);
  cfg.repeat_iters = get_int("repeat_iters", cfg.repeat_iters);

  auto it = kv.find("strides");
  if (it != kv.end()) {
    cfg.strides = parse_int_list(it->second);
  }

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

  if (cfg.padding_period <= 0) {
    throw std::runtime_error("padding_period must be positive");
  }

  if (cfg.strides.empty()) {
    throw std::runtime_error("strides must not be empty");
  }

  return cfg;
}

std::vector<SharedPadEffectResult> run_probe(const SharedPadEffectConfig& cfg) {
  const int launched_threads = cfg.num_blocks * cfg.threads_per_block;
  const size_t output_bytes = static_cast<size_t>(launched_threads) * sizeof(float);

  float* d_output = nullptr;
  CUDA_CHECK(cudaMalloc(&d_output, output_bytes));
  CUDA_CHECK(cudaMemset(d_output, 0, output_bytes));

  cudaStream_t stream;
  CUDA_CHECK(cudaStreamCreate(&stream));

  cudaEvent_t start;
  cudaEvent_t stop;
  CUDA_CHECK(cudaEventCreate(&start));
  CUDA_CHECK(cudaEventCreate(&stop));

  std::vector<SharedPadEffectResult> results;

  for (const int stride : cfg.strides) {
    if (stride <= 0) {
      throw std::runtime_error("stride must be positive");
    }

    for (int i = 0; i < cfg.warmup_iters; ++i) {
      launch_shared_pad_effect_kernel(
          d_output,
          cfg.num_blocks,
          cfg.threads_per_block,
          stride,
          cfg.shared_span_floats,
          cfg.padding_period,
          cfg.accesses_per_thread,
          stream);
    }

    CUDA_CHECK(cudaStreamSynchronize(stream));

    std::vector<double> samples;
    samples.reserve(cfg.repeat_iters);

    for (int i = 0; i < cfg.repeat_iters; ++i) {
      CUDA_CHECK(cudaEventRecord(start, stream));

      for (int inner = 0; inner < cfg.inner_iters; ++inner) {
        launch_shared_pad_effect_kernel(
            d_output,
            cfg.num_blocks,
            cfg.threads_per_block,
            stride,
            cfg.shared_span_floats,
            cfg.padding_period,
            cfg.accesses_per_thread,
            stream);
      }

      CUDA_CHECK(cudaEventRecord(stop, stream));
      CUDA_CHECK(cudaEventSynchronize(stop));

      const double ms = elapsed_ms(start, stop) / static_cast<double>(cfg.inner_iters);
      samples.push_back(ms);
    }

    const double sum = std::accumulate(samples.begin(), samples.end(), 0.0);
    const double avg = sum / static_cast<double>(samples.size());

    const auto [min_it, max_it] = std::minmax_element(samples.begin(), samples.end());

    SharedPadEffectResult result;
    result.stride = stride;
    result.num_blocks = cfg.num_blocks;
    result.threads_per_block = cfg.threads_per_block;
    result.launched_threads = launched_threads;
    result.accesses_per_thread = cfg.accesses_per_thread;
    result.shared_span_floats = cfg.shared_span_floats;
    result.padded_shared_span_floats =
        cfg.shared_span_floats + (cfg.shared_span_floats / cfg.padding_period) + 1;
    result.padding_period = cfg.padding_period;
    result.total_accesses =
        static_cast<long long>(launched_threads) *
        static_cast<long long>(cfg.accesses_per_thread);
    result.avg_ms = avg;
    result.min_ms = *min_it;
    result.max_ms = *max_it;

    results.push_back(result);

    std::cout
        << "stride=" << stride
        << " avg_ms=" << std::fixed << std::setprecision(6) << avg
        << " min_ms=" << *min_it
        << " max_ms=" << *max_it
        << std::endl;
  }

  CUDA_CHECK(cudaEventDestroy(start));
  CUDA_CHECK(cudaEventDestroy(stop));
  CUDA_CHECK(cudaStreamDestroy(stream));
  CUDA_CHECK(cudaFree(d_output));

  return results;
}

void write_results_json(
    const std::string& path,
    const SharedPadEffectConfig& cfg,
    const std::vector<SharedPadEffectResult>& results) {
  std::ofstream out(path);
  if (!out) {
    throw std::runtime_error("failed to open output json: " + path);
  }

  out << "{\n";
  out << "  \"probe_id\": \"" << cfg.probe_id << "\",\n";
  out << "  \"category\": \"Shared Memory\",\n";
  out << "  \"label\": \"Shared Padding Effect\",\n";
  out << "  \"description\": \"Padded shared-memory stride sweep for bank conflict mitigation evidence.\",\n";
  out << "  \"config\": {\n";
  out << "    \"num_blocks\": " << cfg.num_blocks << ",\n";
  out << "    \"threads_per_block\": " << cfg.threads_per_block << ",\n";
  out << "    \"accesses_per_thread\": " << cfg.accesses_per_thread << ",\n";
  out << "    \"shared_span_floats\": " << cfg.shared_span_floats << ",\n";
  out << "    \"padded_shared_span_floats\": "
      << cfg.shared_span_floats + (cfg.shared_span_floats / cfg.padding_period) + 1 << ",\n";
  out << "    \"padding_period\": " << cfg.padding_period << ",\n";
  out << "    \"inner_iters\": " << cfg.inner_iters << ",\n";
  out << "    \"warmup_iters\": " << cfg.warmup_iters << ",\n";
  out << "    \"repeat_iters\": " << cfg.repeat_iters << "\n";
  out << "  },\n";

  out << "  \"results\": [\n";

  for (size_t i = 0; i < results.size(); ++i) {
    const auto& r = results[i];

    out << "    {\n";
    out << "      \"stride\": " << r.stride << ",\n";
    out << "      \"avg_ms\": " << std::fixed << std::setprecision(6) << r.avg_ms << ",\n";
    out << "      \"min_ms\": " << r.min_ms << ",\n";
    out << "      \"max_ms\": " << r.max_ms << ",\n";
    out << "      \"num_blocks\": " << r.num_blocks << ",\n";
    out << "      \"threads_per_block\": " << r.threads_per_block << ",\n";
    out << "      \"launched_threads\": " << r.launched_threads << ",\n";
    out << "      \"accesses_per_thread\": " << r.accesses_per_thread << ",\n";
    out << "      \"total_accesses\": " << r.total_accesses << ",\n";
    out << "      \"shared_span_floats\": " << r.shared_span_floats << ",\n";
    out << "      \"padded_shared_span_floats\": " << r.padded_shared_span_floats << ",\n";
    out << "      \"padding_period\": " << r.padding_period << "\n";
    out << "    }";

    if (i + 1 != results.size()) {
      out << ",";
    }

    out << "\n";
  }

  out << "  ]\n";
  out << "}\n";
}

}  // namespace probe::shared_pad_effect