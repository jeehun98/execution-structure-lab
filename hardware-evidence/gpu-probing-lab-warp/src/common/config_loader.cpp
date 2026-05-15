#include "common/config_loader.hpp"

#include <algorithm>
#include <cctype>
#include <fstream>
#include <regex>
#include <sstream>
#include <stdexcept>

namespace common::config_loader {

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

bool looks_like_json(const std::string& text) {
  size_t i = 0;
  while (i < text.size() && std::isspace(static_cast<unsigned char>(text[i]))) {
    ++i;
  }
  return i < text.size() && text[i] == '{';
}

std::string json_match_or_empty(const std::string& text, const std::string& pattern) {
  std::regex re(pattern);
  std::smatch m;
  if (std::regex_search(text, m, re) && m.size() >= 2) {
    return m[1].str();
  }
  return "";
}

int json_get_int(const std::string& text, const std::string& key, int def) {
  std::string v = json_match_or_empty(text, "\"" + key + "\"\\s*:\\s*(-?\\d+)");
  return v.empty() ? def : std::stoi(v);
}

bool json_get_bool(const std::string& text, const std::string& key, bool def) {
  std::string v = json_match_or_empty(text, "\"" + key + "\"\\s*:\\s*(true|false)");
  if (v.empty()) return def;
  return v == "true";
}

std::string json_get_string(
    const std::string& text,
    const std::string& key,
    const std::string& def) {
  std::string v = json_match_or_empty(text, "\"" + key + "\"\\s*:\\s*\"([^\"]*)\"");
  return v.empty() ? def : v;
}

std::vector<int> json_get_int_array(
    const std::string& text,
    const std::string& key,
    const std::vector<int>& def) {
  std::string body = json_match_or_empty(text, "\"" + key + "\"\\s*:\\s*\\[([^\\]]*)\\]");
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

} // namespace common::config_loader