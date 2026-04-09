#include "probes/global_stride_sweep/host.hpp"

#include <exception>
#include <iostream>
#include <string>

static void print_usage() {
  std::cout
    << "Usage:\n"
    << "  probe_runner --probe global_stride_sweep --config <config_path>\n"
    << "  probe_runner --probe global_stride_sweep_fixed_work --config <config_path>\n";
}

int main(int argc, char** argv) {
  std::string probe;
  std::string config_path;

  for (int i = 1; i < argc; ++i) {
    std::string arg = argv[i];
    if (arg == "--probe" && i + 1 < argc) {
      probe = argv[++i];
    } else if (arg == "--config" && i + 1 < argc) {
      config_path = argv[++i];
    }
  }

  if (probe.empty() || config_path.empty()) {
    print_usage();
    return 1;
  }

  try {
    if (probe == "global_stride_sweep") {
      auto config = load_global_stride_sweep_config(config_path);
      auto result = run_global_stride_sweep(config);
      write_global_stride_sweep_result_json(result);
      std::cout << "[done] wrote result to " << config.output_path << std::endl;
      return 0;
    }

    if (probe == "global_stride_sweep_fixed_work") {
      auto config = load_global_stride_sweep_fixed_work_config(config_path);
      auto result = run_global_stride_sweep_fixed_work(config);
      write_global_stride_sweep_fixed_work_result_json(result);
      std::cout << "[done] wrote result to " << config.output_path << std::endl;
      return 0;
    }

    std::cerr << "unknown probe: " << probe << std::endl;
    return 2;
  } catch (const std::exception& e) {
    std::cerr << "[error] " << e.what() << std::endl;
    return 3;
  }
}