#include "probes/shared_padding_period_sweep/host.hpp"

#include <cuda_runtime.h>

#include <exception>
#include <iostream>
#include <string>

namespace cfg = probe::shared_padding_period_sweep;

int main(int argc, char** argv) {
  try {
    std::string config_path = "configs/shared_padding_period_sweep.cfg";
    std::string output_path;

    if (argc >= 2) {
      config_path = argv[1];
    }

    cfg::Config config = cfg::load_config(config_path);

    if (argc >= 3) {
      output_path = argv[2];
    } else {
      output_path = config.output_raw;
    }

    int device_id = 0;
    cudaError_t err = cudaGetDevice(&device_id);

    if (err != cudaSuccess) {
      throw std::runtime_error("cudaGetDevice failed");
    }

    cudaDeviceProp prop{};
    err = cudaGetDeviceProperties(&prop, device_id);

    if (err != cudaSuccess) {
      throw std::runtime_error("cudaGetDeviceProperties failed");
    }

    std::cout << "probe: " << config.probe_id << "\n";
    std::cout << "config: " << config_path << "\n";
    std::cout << "output: " << output_path << "\n";
    std::cout << "device: " << prop.name << "\n";

    cfg::RunResult result = cfg::run(config);

    cfg::write_json(
        result,
        config,
        output_path,
        device_id,
        prop.name,
        prop.major,
        prop.minor);

    std::cout << "wrote: " << output_path << "\n";
    std::cout << "result points: " << result.results.size() << "\n";

    return 0;
  } catch (const std::exception& e) {
    std::cerr << "error: " << e.what() << "\n";
    return 1;
  }
}