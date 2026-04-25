#include "probes/global_stride_sweep/host.hpp"
#include "common/config_loader.hpp"

#include <iostream>
#include <sstream>
#include <stdexcept>
#include <string>

using probe::global_stride_sweep::Config;
using probe::global_stride_sweep::run;
using probe::global_stride_sweep::write_json;

namespace cfgutil = common::config_loader;

namespace {

Config parse_cfg(const std::string& text) {
  Config cfg;
  std::stringstream ss(text);
  std::string line;

  while (std::getline(ss, line)) {
    line = cfgutil::trim(line);
    if (line.empty() || line[0] == '#') {
      continue;
    }

    size_t pos = line.find('=');
    if (pos == std::string::npos) {
      continue;
    }

    std::string key = cfgutil::trim(line.substr(0, pos));
    std::string value = cfgutil::trim(line.substr(pos + 1));

    if (key == "probe_id") cfg.probe_id = value;
    else if (key == "probe_family") cfg.probe_family = value;
    else if (key == "result_schema") cfg.result_schema = value;
    else if (key == "device_id") cfg.device_id = std::stoi(value);
    else if (key == "n") cfg.n = std::stoi(value);
    else if (key == "block_size") cfg.block_size = std::stoi(value);
    else if (key == "grid_size") cfg.grid_size = std::stoi(value);
    else if (key == "warmup") cfg.warmup = std::stoi(value);
    else if (key == "repeat") cfg.repeat = std::stoi(value);
    else if (key == "inner_iters") cfg.inner_iters = std::stoi(value);
    else if (key == "total_accesses") cfg.total_accesses = std::stoi(value);
    else if (key == "base_offset") cfg.base_offset = std::stoi(value);
    else if (key == "strides") cfg.strides = cfgutil::parse_csv_ints(value);
    else if (key == "run_wrapped") cfg.run_wrapped = cfgutil::parse_bool_text(value);
    else if (key == "run_bounded") cfg.run_bounded = cfgutil::parse_bool_text(value);
    else if (key == "run_offset_sweep") cfg.run_offset_sweep = cfgutil::parse_bool_text(value);
    else if (key == "offset_values") cfg.offset_values = cfgutil::parse_csv_ints(value);
    else if (key == "offset_representative_strides")
      cfg.offset_representative_strides = cfgutil::parse_csv_ints(value);
    else if (key == "output_path") cfg.output_path = value;
  }

  return cfg;
}

Config parse_json(const std::string& text) {
  Config cfg;

  cfg.probe_id =
      cfgutil::json_get_string(text, "probe_id", cfg.probe_id);
  cfg.probe_family =
      cfgutil::json_get_string(text, "probe_family", cfg.probe_family);
  cfg.result_schema =
      cfgutil::json_get_string(text, "result_schema", cfg.result_schema);

  cfg.device_id = cfgutil::json_get_int(text, "device_id", cfg.device_id);
  cfg.n = cfgutil::json_get_int(text, "n", cfg.n);
  cfg.block_size = cfgutil::json_get_int(text, "block_size", cfg.block_size);
  cfg.grid_size = cfgutil::json_get_int(text, "grid_size", cfg.grid_size);
  cfg.warmup = cfgutil::json_get_int(text, "warmup", cfg.warmup);
  cfg.repeat = cfgutil::json_get_int(text, "repeat", cfg.repeat);
  cfg.inner_iters = cfgutil::json_get_int(text, "inner_iters", cfg.inner_iters);
  cfg.total_accesses =
      cfgutil::json_get_int(text, "total_accesses", cfg.total_accesses);
  cfg.base_offset =
      cfgutil::json_get_int(text, "base_offset", cfg.base_offset);

  cfg.strides = cfgutil::json_get_int_array(text, "strides", cfg.strides);

  cfg.run_wrapped =
      cfgutil::json_get_bool(text, "run_wrapped", cfg.run_wrapped);
  cfg.run_bounded =
      cfgutil::json_get_bool(text, "run_bounded", cfg.run_bounded);
  cfg.run_offset_sweep =
      cfgutil::json_get_bool(text, "run_offset_sweep", cfg.run_offset_sweep);

  cfg.offset_values =
      cfgutil::json_get_int_array(text, "offset_values", cfg.offset_values);

  cfg.offset_representative_strides =
      cfgutil::json_get_int_array(
          text,
          "offset_representative_strides",
          cfg.offset_representative_strides);

  cfg.output_path =
      cfgutil::json_get_string(text, "output_path", cfg.output_path);

  return cfg;
}

Config load_config(const std::string& path) {
  const std::string text = cfgutil::read_text_file(path);
  return cfgutil::looks_like_json(text) ? parse_json(text) : parse_cfg(text);
}

std::string default_output_path(const Config& cfg) {
  if (cfg.run_bounded && !cfg.run_wrapped && !cfg.run_offset_sweep) {
    return "results/raw/global_stride_sweep_bounded.json";
  }

  if (cfg.run_wrapped && !cfg.run_bounded && !cfg.run_offset_sweep) {
    return "results/raw/global_stride_sweep_fixed_work.json";
  }

  if (cfg.run_offset_sweep && !cfg.run_wrapped && !cfg.run_bounded) {
    return "results/raw/global_stride_sweep_offset_sweep.json";
  }

  return "results/raw/global_stride_sweep.json";
}

void validate_config(const Config& cfg) {
  if (cfg.probe_id.empty()) {
    throw std::runtime_error("probe_id must not be empty");
  }

  if (cfg.probe_family.empty()) {
    throw std::runtime_error("probe_family must not be empty");
  }

  if (cfg.result_schema.empty()) {
    throw std::runtime_error("result_schema must not be empty");
  }

  if (cfg.n <= 0) {
    throw std::runtime_error("n must be positive");
  }

  if (cfg.block_size <= 0) {
    throw std::runtime_error("block_size must be positive");
  }

  if (cfg.grid_size <= 0) {
    throw std::runtime_error("grid_size must be positive");
  }

  if (cfg.warmup < 0) {
    throw std::runtime_error("warmup must be non-negative");
  }

  if (cfg.repeat <= 0) {
    throw std::runtime_error("repeat must be positive");
  }

  if (cfg.inner_iters <= 0) {
    throw std::runtime_error("inner_iters must be positive");
  }

  if (cfg.total_accesses <= 0) {
    throw std::runtime_error("total_accesses must be positive");
  }

  if (!cfg.run_wrapped && !cfg.run_bounded && !cfg.run_offset_sweep) {
    throw std::runtime_error(
        "at least one mode must be enabled: run_wrapped, run_bounded, or run_offset_sweep");
  }

  if ((cfg.run_wrapped || cfg.run_bounded) && cfg.strides.empty()) {
    throw std::runtime_error("strides must not be empty when run_wrapped or run_bounded is enabled");
  }

  if (cfg.run_offset_sweep &&
      cfg.strides.empty() &&
      cfg.offset_representative_strides.empty()) {
    throw std::runtime_error(
        "offset_representative_strides or strides must not be empty when run_offset_sweep is enabled");
  }
}

}  // namespace

int main(int argc, char** argv) {
  try {
    if (argc < 2) {
      std::cerr << "usage: probe_runner_global_stride <config_path> [output_path]\n";
      return 1;
    }

    const std::string config_path = argv[1];
    Config cfg = load_config(config_path);

    if (argc >= 3) {
      cfg.output_path = argv[2];
    }

    if (cfg.output_path.empty()) {
      cfg.output_path = default_output_path(cfg);
    }

    validate_config(cfg);

    auto suite = run(cfg);
    write_json(suite, cfg.output_path);

    std::cout << "probe: " << suite.probe << "\n";
    std::cout << "probe_id: " << suite.probe_id << "\n";
    std::cout << "probe_family: " << suite.probe_family << "\n";
    std::cout << "result_schema: " << suite.result_schema << "\n";
    std::cout << "config: " << config_path << "\n";
    std::cout << "output: " << cfg.output_path << "\n";
    std::cout << "results: " << suite.results.size() << "\n";

    return 0;
  } catch (const std::exception& e) {
    std::cerr << "error: " << e.what() << "\n";
    return 1;
  }
}