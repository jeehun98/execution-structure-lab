#include "probes/shared_bank_conflict_stride/host.hpp"

#include <cuda_runtime.h>

#include <cctype>
#include <fstream>
#include <iostream>
#include <regex>
#include <sstream>
#include <stdexcept>
#include <string>
#include <vector>

namespace cfg = probe::shared_bank_conflict_stride;

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

bool parse_bool_text(const std::string& value) {
  std::string v = trim(value);

  for (char& c : v) {
    c = static_cast<char>(std::tolower(static_cast<unsigned char>(c)));
  }

  return v == "1" || v == "true" || v == "yes" || v == "on";
}

std::vector<int> parse_int_list(const std::string& value) {
  std::vector<int> result;
  std::stringstream ss(value);
  std::string item;

  while (std::getline(ss, item, ',')) {
    item = trim(item);

    if (!item.empty()) {
      result.push_back(std::stoi(item));
    }
  }

  return result;
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

bool looks_like_json(const std::string& text) {
  size_t i = 0;

  while (i < text.size() && std::isspace(static_cast<unsigned char>(text[i]))) {
    ++i;
  }

  return i < text.size() && text[i] == '{';
}

std::string json_match_or_empty(
    const std::string& text,
    const std::string& pattern) {
  std::regex re(pattern);
  std::smatch m;

  if (std::regex_search(text, m, re) && m.size() >= 2) {
    return m[1].str();
  }

  return "";
}

int json_get_int(
    const std::string& text,
    const std::string& key,
    int def) {
  std::string v =
      json_match_or_empty(text, "\"" + key + "\"\\s*:\\s*(-?\\d+)");

  return v.empty() ? def : std::stoi(v);
}

bool json_get_bool(
    const std::string& text,
    const std::string& key,
    bool def) {
  std::string v =
      json_match_or_empty(text, "\"" + key + "\"\\s*:\\s*(true|false)");

  if (v.empty()) {
    return def;
  }

  return v == "true";
}

std::vector<int> json_get_int_array(
    const std::string& text,
    const std::string& key) {
  const std::string pattern =
      "\"" + key + "\"\\s*:\\s*\\[([^\\]]*)\\]";

  std::string body = json_match_or_empty(text, pattern);

  if (body.empty()) {
    return {};
  }

  return parse_int_list(body);
}

cfg::Config parse_cfg(const std::string& text) {
  cfg::Config c;

  std::stringstream ss(text);
  std::string line;

  while (std::getline(ss, line)) {
    line = trim(line);

    if (line.empty() || line[0] == '#') {
      continue;
    }

    const size_t pos = line.find('=');

    if (pos == std::string::npos) {
      continue;
    }

    const std::string key = trim(line.substr(0, pos));
    const std::string value = trim(line.substr(pos + 1));

    if (key == "block_size") {
      c.block_size = std::stoi(value);
    } else if (key == "grid_size") {
      c.grid_size = std::stoi(value);
    } else if (key == "shared_span_floats") {
      c.shared_span_floats = std::stoi(value);
    } else if (key == "accesses_per_thread") {
      c.accesses_per_thread = std::stoi(value);
    } else if (key == "warmup") {
      c.warmup = std::stoi(value);
    } else if (key == "repeat") {
      c.repeat = std::stoi(value);
    } else if (key == "max_stride") {
      c.max_stride = std::stoi(value);
    } else if (key == "strides") {
      c.strides = parse_int_list(value);
    } else if (key == "use_modulo_wrap") {
      c.use_modulo_wrap = parse_bool_text(value);
    } else if (key == "write_mode") {
      c.write_mode = parse_bool_text(value);
    } else if (key == "pad_every_32") {
      c.pad_every_32 = parse_bool_text(value);
    }
  }

  return c;
}

cfg::Config parse_json(const std::string& text) {
  cfg::Config c;

  c.block_size =
      json_get_int(text, "block_size", c.block_size);

  c.grid_size =
      json_get_int(text, "grid_size", c.grid_size);

  c.shared_span_floats =
      json_get_int(text, "shared_span_floats", c.shared_span_floats);

  c.accesses_per_thread =
      json_get_int(text, "accesses_per_thread", c.accesses_per_thread);

  c.warmup =
      json_get_int(text, "warmup", c.warmup);

  c.repeat =
      json_get_int(text, "repeat", c.repeat);

  c.max_stride =
      json_get_int(text, "max_stride", c.max_stride);

  c.strides =
      json_get_int_array(text, "strides");

  c.use_modulo_wrap =
      json_get_bool(text, "use_modulo_wrap", c.use_modulo_wrap);

  c.write_mode =
      json_get_bool(text, "write_mode", c.write_mode);

  c.pad_every_32 =
      json_get_bool(text, "pad_every_32", c.pad_every_32);

  return c;
}

cfg::Config load_config(const std::string& path) {
  const std::string text = read_text_file(path);

  return looks_like_json(text) ? parse_json(text) : parse_cfg(text);
}

void write_text_file(const std::string& path, const std::string& text) {
  std::ofstream ofs(path);

  if (!ofs) {
    throw std::runtime_error("failed to open output file: " + path);
  }

  ofs << text;
}

}  // namespace

int main(int argc, char** argv) {
  try {
    if (argc < 3) {
      std::cerr
          << "usage: probe_runner_shared_bank_conflict_stride "
          << "<config_path> <output_path>\n";
      return 1;
    }

    const std::string config_path = argv[1];
    const std::string output_path = argv[2];

    cfg::Config config = load_config(config_path);

    cfg::RunResult result = cfg::run(config);

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

    const std::string json = cfg::to_json(
        result,
        config,
        device_id,
        prop.name,
        prop.major,
        prop.minor);

    write_text_file(output_path, json);

    std::cout << "probe: " << result.probe << "\n";
    std::cout << "output: " << output_path << "\n";
    std::cout << "results: " << result.results.size() << "\n";

    if (!config.strides.empty()) {
      std::cout << "explicit strides: " << config.strides.size() << "\n";
    } else {
      std::cout << "explicit strides: none; fallback max_stride="
                << config.max_stride << "\n";
    }

    return 0;
  } catch (const std::exception& e) {
    std::cerr << "error: " << e.what() << "\n";
    return 1;
  }
}