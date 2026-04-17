#pragma once

#include <string>
#include <vector>

namespace common::config_loader {

std::string trim(const std::string& s);
std::string read_text_file(const std::string& path);
std::vector<int> parse_csv_ints(const std::string& value);
bool parse_bool_text(const std::string& value);

bool looks_like_json(const std::string& text);

std::string json_match_or_empty(const std::string& text, const std::string& pattern);
int json_get_int(const std::string& text, const std::string& key, int def);
bool json_get_bool(const std::string& text, const std::string& key, bool def);
std::string json_get_string(const std::string& text, const std::string& key, const std::string& def);
std::vector<int> json_get_int_array(
    const std::string& text,
    const std::string& key,
    const std::vector<int>& def);

} // namespace common::config_loader