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

    if (key == "device_id") cfg.device_id = std::stoi(value);
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
  cfg.device_id = cfgutil::json_get_int(text, "device_id", cfg.device_id);
  cfg.n = cfgutil::json_get_int(text, "n", cfg.n);
  cfg.block_size = cfgutil::json_get_int(text, "block_size", cfg.block_size);
  cfg.grid_size = cfgutil::json_get_int(text, "grid_size", cfg.grid_size);
  cfg.warmup = cfgutil::json_get_int(text, "warmup", cfg.warmup);
  cfg.repeat = cfgutil::json_get_int(text, "repeat", cfg.repeat);
  cfg.inner_iters = cfgutil::json_get_int(text, "inner_iters", cfg.inner_iters);
  cfg.total_accesses = cfgutil::json_get_int(text, "total_accesses", cfg.total_accesses);
  cfg.base_offset = cfgutil::json_get_int(text, "base_offset", cfg.base_offset);
  cfg.strides = cfgutil::json_get_int_array(text, "strides", cfg.strides);

  cfg.run_wrapped = cfgutil::json_get_bool(text, "run_wrapped", cfg.run_wrapped);
  cfg.run_bounded = cfgutil::json_get_bool(text, "run_bounded", cfg.run_bounded);
  cfg.run_offset_sweep = cfgutil::json_get_bool(text, "run_offset_sweep", cfg.run_offset_sweep);

  cfg.offset_values = cfgutil::json_get_int_array(text, "offset_values", cfg.offset_values);
  cfg.offset_representative_strides =
      cfgutil::json_get_int_array(
          text,
          "offset_representative_strides",
          cfg.offset_representative_strides);

  cfg.output_path = cfgutil::json_get_string(text, "output_path", cfg.output_path);
  return cfg;
}

Config load_config(const std::string& path) {
  const std::string text = cfgutil::read_text_file(path);
  return cfgutil::looks_like_json(text) ? parse_json(text) : parse_cfg(text);
}

} // namespace

int main(int argc, char** argv) {
  try {
    if (argc < 2) {
      std::cerr << "usage: probe_runner_global_stride <config_path>\n";
      return 1;
    }

    const std::string config_path = argv[1];
    Config cfg = load_config(config_path);

    auto suite = run(cfg);
    write_json(suite, cfg.output_path);

    std::cout << "probe: " << suite.probe << "\n";
    std::cout << "output: " << cfg.output_path << "\n";
    std::cout << "results: " << suite.results.size() << "\n";
    return 0;
  } catch (const std::exception& e) {
    std::cerr << "error: " << e.what() << "\n";
    return 1;
  }
}