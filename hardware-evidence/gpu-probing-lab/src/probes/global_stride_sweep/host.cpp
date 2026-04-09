#include "host.hpp"

#include "common/cuda_check.hpp"
#include "common/device_info.hpp"
#include "common/timer.hpp"

#include <cuda_runtime.h>

#include <algorithm>
#include <cctype>
#include <filesystem>
#include <fstream>
#include <iostream>
#include <sstream>
#include <stdexcept>
#include <string>
#include <vector>

namespace {

std::string trim(const std::string& s) {
  std::size_t first = 0;
  while (first < s.size() && std::isspace(static_cast<unsigned char>(s[first]))) {
    ++first;
  }

  std::size_t last = s.size();
  while (last > first && std::isspace(static_cast<unsigned char>(s[last - 1]))) {
    --last;
  }

  return s.substr(first, last - first);
}

std::vector<int> parse_int_list(const std::string& value) {
  std::vector<int> out;
  std::stringstream ss(value);
  std::string token;

  while (std::getline(ss, token, ',')) {
    token = trim(token);
    if (!token.empty()) {
      out.push_back(std::stoi(token));
    }
  }

  return out;
}

std::string escape_json_string(const std::string& s) {
  std::string out;
  out.reserve(s.size());

  for (char c : s) {
    switch (c) {
      case '\\': out += "\\\\"; break;
      case '"': out += "\\\""; break;
      case '\n': out += "\\n"; break;
      case '\r': out += "\\r"; break;
      case '\t': out += "\\t"; break;
      default: out += c; break;
    }
  }

  return out;
}

}  // namespace

GlobalStrideSweepFixedWorkConfig load_global_stride_sweep_fixed_work_config(const std::string& path) {
  std::ifstream ifs(path);
  if (!ifs) {
    throw std::runtime_error("failed to open config file: " + path);
  }

  GlobalStrideSweepFixedWorkConfig config;
  std::string line;

  while (std::getline(ifs, line)) {
    line = trim(line);
    if (line.empty() || line[0] == '#') {
      continue;
    }

    auto pos = line.find('=');
    if (pos == std::string::npos) {
      continue;
    }

    std::string key = trim(line.substr(0, pos));
    std::string value = trim(line.substr(pos + 1));

    if (key == "device_id") {
      config.device_id = std::stoi(value);
    } else if (key == "n") {
      config.n = std::stoi(value);
    } else if (key == "block_size") {
      config.block_size = std::stoi(value);
    } else if (key == "grid_size") {
      config.grid_size = std::stoi(value);
    } else if (key == "warmup") {
      config.warmup = std::stoi(value);
    } else if (key == "repeat") {
      config.repeat = std::stoi(value);
    } else if (key == "inner_iters") {
      config.inner_iters = std::stoi(value);
    } else if (key == "total_accesses") {
      config.total_accesses = std::stoi(value);
    } else if (key == "base_offset") {
      config.base_offset = std::stoi(value);
    } else if (key == "strides") {
      config.strides = parse_int_list(value);
    } else if (key == "output_path") {
      config.output_path = value;
    }
  }

  if (config.n <= 0) {
    throw std::runtime_error("config.n must be > 0");
  }
  if (config.block_size <= 0) {
    throw std::runtime_error("config.block_size must be > 0");
  }
  if (config.grid_size <= 0) {
    throw std::runtime_error("config.grid_size must be > 0");
  }
  if (config.repeat <= 0) {
    throw std::runtime_error("config.repeat must be > 0");
  }
  if (config.warmup < 0) {
    throw std::runtime_error("config.warmup must be >= 0");
  }
  if (config.inner_iters <= 0) {
    throw std::runtime_error("config.inner_iters must be > 0");
  }
  if (config.total_accesses <= 0) {
    throw std::runtime_error("config.total_accesses must be > 0");
  }
  if (config.strides.empty()) {
    throw std::runtime_error("config.strides must not be empty");
  }
  if (config.output_path.empty()) {
    throw std::runtime_error("config.output_path must not be empty");
  }

  return config;
}

GlobalStrideSweepFixedWorkResult run_global_stride_sweep_fixed_work(
    const GlobalStrideSweepFixedWorkConfig& config) {
  CUDA_CHECK(cudaSetDevice(config.device_id));

  const int n = config.n;
  const int block_size = config.block_size;
  const int grid_size = config.grid_size;
  const int launched_threads = block_size * grid_size;
  const int inner_iters = config.inner_iters;
  const int total_accesses = config.total_accesses;
  const int base_offset = config.base_offset;
  const int accesses_per_thread =
      (total_accesses + launched_threads - 1) / launched_threads;

  std::vector<float> h_input(n, 1.0f);

  float* d_input = nullptr;
  float* d_output = nullptr;

  CUDA_CHECK(cudaMalloc(&d_input, sizeof(float) * n));
  CUDA_CHECK(cudaMalloc(&d_output, sizeof(float) * launched_threads));
  CUDA_CHECK(cudaMemcpy(d_input, h_input.data(), sizeof(float) * n, cudaMemcpyHostToDevice));
  CUDA_CHECK(cudaMemset(d_output, 0, sizeof(float) * launched_threads));

  GlobalStrideSweepFixedWorkResult result;
  result.config = config;
  result.device = get_device_info(config.device_id);

  try {
    for (int stride : config.strides) {
      for (int i = 0; i < config.warmup; ++i) {
        launch_global_stride_sweep_fixed_work_kernel(
            d_input,
            d_output,
            n,
            stride,
            inner_iters,
            total_accesses,
            base_offset,
            accesses_per_thread,
            launched_threads,
            block_size);
      }
      CUDA_CHECK(cudaDeviceSynchronize());

      CudaEventTimer timer;
      double total_ms = 0.0;

      for (int i = 0; i < config.repeat; ++i) {
        timer.start();
        launch_global_stride_sweep_fixed_work_kernel(
            d_input,
            d_output,
            n,
            stride,
            inner_iters,
            total_accesses,
            base_offset,
            accesses_per_thread,
            launched_threads,
            block_size);
        total_ms += timer.stop();
      }

      CUDA_CHECK(cudaDeviceSynchronize());

      GlobalStrideSweepFixedWorkPoint point;
      point.stride = stride;
      point.avg_ms = total_ms / static_cast<double>(config.repeat);
      point.launched_threads = launched_threads;
      point.total_accesses = total_accesses;
      point.accesses_per_thread = accesses_per_thread;
      point.active_threads = std::min(launched_threads, total_accesses);
      point.total_bytes_requested =
          static_cast<std::size_t>(total_accesses) * sizeof(float);

      result.points.push_back(point);
    }
  } catch (...) {
    if (d_input) {
      cudaFree(d_input);
    }
    if (d_output) {
      cudaFree(d_output);
    }
    throw;
  }

  CUDA_CHECK(cudaFree(d_input));
  CUDA_CHECK(cudaFree(d_output));

  return result;
}

void write_global_stride_sweep_fixed_work_result_json(
    const GlobalStrideSweepFixedWorkResult& result) {
  const std::filesystem::path out_path(result.config.output_path);
  if (out_path.has_parent_path()) {
    std::filesystem::create_directories(out_path.parent_path());
  }

  std::ofstream ofs(out_path);
  if (!ofs) {
    throw std::runtime_error("failed to open output file: " + result.config.output_path);
  }

  ofs << "{\n";
  ofs << "  \"probe\": \"global_stride_sweep_fixed_work\",\n";
  ofs << "  \"device\": " << device_info_to_json(result.device, 4) << ",\n";
  ofs << "  \"config\": {\n";
  ofs << "    \"device_id\": " << result.config.device_id << ",\n";
  ofs << "    \"n\": " << result.config.n << ",\n";
  ofs << "    \"block_size\": " << result.config.block_size << ",\n";
  ofs << "    \"grid_size\": " << result.config.grid_size << ",\n";
  ofs << "    \"warmup\": " << result.config.warmup << ",\n";
  ofs << "    \"repeat\": " << result.config.repeat << ",\n";
  ofs << "    \"inner_iters\": " << result.config.inner_iters << ",\n";
  ofs << "    \"total_accesses\": " << result.config.total_accesses << ",\n";
  ofs << "    \"base_offset\": " << result.config.base_offset << ",\n";
  ofs << "    \"output_path\": \"" << escape_json_string(result.config.output_path) << "\",\n";
  ofs << "    \"strides\": [";

  for (std::size_t i = 0; i < result.config.strides.size(); ++i) {
    if (i > 0) {
      ofs << ", ";
    }
    ofs << result.config.strides[i];
  }

  ofs << "]\n";
  ofs << "  },\n";
  ofs << "  \"results\": [\n";

  for (std::size_t i = 0; i < result.points.size(); ++i) {
    const auto& p = result.points[i];
    ofs << "    {\n";
    ofs << "      \"stride\": " << p.stride << ",\n";
    ofs << "      \"avg_ms\": " << p.avg_ms << ",\n";
    ofs << "      \"launched_threads\": " << p.launched_threads << ",\n";
    ofs << "      \"active_threads\": " << p.active_threads << ",\n";
    ofs << "      \"total_accesses\": " << p.total_accesses << ",\n";
    ofs << "      \"accesses_per_thread\": " << p.accesses_per_thread << ",\n";
    ofs << "      \"total_bytes_requested\": " << p.total_bytes_requested << "\n";
    ofs << "    }";
    if (i + 1 < result.points.size()) {
      ofs << ",";
    }
    ofs << "\n";
  }

  ofs << "  ]\n";
  ofs << "}\n";
}