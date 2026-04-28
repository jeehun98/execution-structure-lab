#include "probes/shared_pad_effect/host.hpp"

#include <exception>
#include <iostream>
#include <string>

int main(int argc, char** argv) {
  std::string config_path = "configs/shared_pad_effect.cfg";

  if (argc >= 2) {
    config_path = argv[1];
  }

  try {
    auto cfg = probe::shared_pad_effect::load_config(config_path);

    std::cout << "Running probe: " << cfg.probe_id << std::endl;
    std::cout << "Config: " << config_path << std::endl;

    auto results = probe::shared_pad_effect::run_probe(cfg);

    probe::shared_pad_effect::write_results_json(
        cfg.output_raw,
        cfg,
        results);

    std::cout << "Wrote raw result: " << cfg.output_raw << std::endl;
  } catch (const std::exception& e) {
    std::cerr << "probe failed: " << e.what() << std::endl;
    return 1;
  }

  return 0;
}