#include "probes/global_stride_sweep/host.hpp"

#include <algorithm>
#include <cctype>
#include <fstream>
#include <iostream>
#include <regex>
#include <sstream>
#include <stdexcept>
#include <string>
#include <vector>

using probe::global_stride_sweep::Config;
using probe::global_stride_sweep::run;
using probe::global_stride_sweep::write_json;

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

std::string read_text_file(const std::string& path) {
  std::ifstream ifs(path);
  if (!ifs) {
    throw std::runtime_error("failed to open config file: " + path);
  }
  std::ostringstream oss;
  oss << ifs.rdbuf();
  return oss.str();
}

std::vector<int> parse_csv_ints(const std::string& value) {
  std::vector<int> out;
  std::stringstream ss(value);
  std::string tok;
  while (std::getline(ss, tok, ',')) {
    tok = trim(tok);
    if (!tok.empty()) {
      out.push_back(std::stoi(tok));
    }
  }
  return out;
}

bool parse_bool_text(const std::string& value) {
  std::string v = trim(value);
  std::transform(v.begin(), v.end(), v.begin(), [](unsigned char c) {
    return static_cast<char>(std::tolower(c));
  });
  return v == "1" || v == "true" || v == "yes" || v == "on";
}

Config parse_cfg(const std::string& text) {
  Config cfg;
  std::stringstream ss(text);
  std::string line;

  while (std::getline(ss, line)) {
    line = trim(line);
    if (line.empty() || line[0] == '#') {
      continue;
    }

    size_t pos = line.find('=');
    if (pos == std::string::npos) {
      continue;
    }

    std::string key = trim(line.substr(0, pos));
    std::string value = trim(line.substr(pos + 1));

    if (key == "device_id") cfg.device_id = std::stoi(value);
    else if (key == "n") cfg.n = std::stoi(value);
    else if (key == "block_size") cfg.block_size = std::stoi(value);
    else if (key == "grid_size") cfg.grid_size = std::stoi(value);
    else if (key == "warmup") cfg.warmup = std::stoi(value);
    else if (key == "repeat") cfg.repeat = std::stoi(value);
    else if (key == "inner_iters") cfg.inner_iters = std::stoi(value);
    else if (key == "total_accesses") cfg.total_accesses = std::stoi(value);
    else if (key == "base_offset") cfg.base_offset = std::stoi(value);
    else if (key == "strides") cfg.strides = parse_csv_ints(value);
    else if (key == "run_wrapped") cfg.run_wrapped = parse_bool_text(value);
    else if (key == "run_bounded") cfg.run_bounded = parse_bool_text(value);
    else if (key == "run_offset_sweep") cfg.run_offset_sweep = parse_bool_text(value);
    else if (key == "offset_values") cfg.offset_values = parse_csv_ints(value);
    else if (key == "offset_representative_strides")
      cfg.offset_representative_strides = parse_csv_ints(value);
    else if (key == "output_path") cfg.output_path = value;
  }

  return cfg;
}

std::string json_match_or_empty(const std::string& text, const std::regex& re) {
  std::smatch m;
  if (std::regex_search(text, m, re) && m.size() >= 2) {
    return m[1].str();
  }
  return "";
}

int json_get_int(const std::string& text, const std::string& key, int def) {
  std::regex re("\"" + key + "\"\\s*:\\s*(-?\\d+)");
  std::string v = json_match_or_empty(text, re);
  return v.empty() ? def : std::stoi(v);
}

bool json_get_bool(const std::string& text, const std::string& key, bool def) {
  std::regex re("\"" + key + "\"\\s*:\\s*(true|false)");
  std::string v = json_match_or_empty(text, re);
  if (v.empty()) return def;
  return v == "true";
}

std::string json_get_string(
    const std::string& text,
    const std::string& key,
    const std::string& def) {
  std::regex re("\"" + key + "\"\\s*:\\s*\"([^\"]*)\"");
  std::string v = json_match_or_empty(text, re);
  return v.empty() ? def : v;
}

std::vector<int> json_get_int_array(
    const std::string& text,
    const std::string& key,
    const std::vector<int>& def) {
  std::regex re("\"" + key + "\"\\s*:\\s*\\[([^\\]]*)\\]");
  std::string body = json_match_or_empty(text, re);
  if (body.empty()) return def;

  std::vector<int> out;
  std::stringstream ss(body);
  std::string tok;
  while (std::getline(ss, tok, ',')) {
    tok = trim(tok);
    if (!tok.empty()) {
      out.push_back(std::stoi(tok));
    }
  }
  return out.empty() ? def : out;
}

Config parse_json(const std::string& text) {
  Config cfg;
  cfg.device_id = json_get_int(text, "device_id", cfg.device_id);
  cfg.n = json_get_int(text, "n", cfg.n);
  cfg.block_size = json_get_int(text, "block_size", cfg.block_size);
  cfg.grid_size = json_get_int(text, "grid_size", cfg.grid_size);
  cfg.warmup = json_get_int(text, "warmup", cfg.warmup);
  cfg.repeat = json_get_int(text, "repeat", cfg.repeat);
  cfg.inner_iters = json_get_int(text, "inner_iters", cfg.inner_iters);
  cfg.total_accesses = json_get_int(text, "total_accesses", cfg.total_accesses);
  cfg.base_offset = json_get_int(text, "base_offset", cfg.base_offset);
  cfg.strides = json_get_int_array(text, "strides", cfg.strides);

  cfg.run_wrapped = json_get_bool(text, "run_wrapped", cfg.run_wrapped);
  cfg.run_bounded = json_get_bool(text, "run_bounded", cfg.run_bounded);
  cfg.run_offset_sweep =
      json_get_bool(text, "run_offset_sweep", cfg.run_offset_sweep);

  cfg.offset_values = json_get_int_array(text, "offset_values", cfg.offset_values);
  cfg.offset_representative_strides =
      json_get_int_array(text, "offset_representative_strides",
                         cfg.offset_representative_strides);

  cfg.output_path = json_get_string(text, "output_path", cfg.output_path);

  return cfg;
}

Config load_config(const std::string& path) {
  const std::string text = read_text_file(path);

  size_t i = 0;
  while (i < text.size() && std::isspace(static_cast<unsigned char>(text[i]))) {
    ++i;
  }

  if (i < text.size() && text[i] == '{') {
    return parse_json(text);
  }
  return parse_cfg(text);
}

}  // namespace

int main(int argc, char** argv) {
  try {
    if (argc < 2) {
      std::cerr << "usage: probe_runner <config_path>\n";
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