#include "config_loader.hpp"

#include <algorithm>
#include <cctype>
#include <fstream>
#include <iostream>
#include <sstream>
#include <stdexcept>

namespace {

std::string trim(const std::string& s) {
    std::size_t begin = 0;
    while (begin < s.size() && std::isspace(static_cast<unsigned char>(s[begin]))) {
        begin++;
    }

    std::size_t end = s.size();
    while (end > begin && std::isspace(static_cast<unsigned char>(s[end - 1]))) {
        end--;
    }

    return s.substr(begin, end - begin);
}

} // namespace

ProbeConfig load_probe_config(const std::string& path) {
    std::ifstream file(path);
    if (!file.is_open()) {
        throw std::runtime_error("Failed to open config file: " + path);
    }

    ProbeConfig config;

    std::string line;
    int line_no = 0;

    while (std::getline(file, line)) {
        line_no++;

        std::string stripped = trim(line);

        if (stripped.empty()) {
            continue;
        }

        if (stripped[0] == '#') {
            continue;
        }

        auto pos = stripped.find('=');
        if (pos == std::string::npos) {
            std::cerr << "[WARN] Ignoring invalid config line "
                      << line_no << ": " << line << "\n";
            continue;
        }

        std::string key = trim(stripped.substr(0, pos));
        std::string value = trim(stripped.substr(pos + 1));

        if (key.empty()) {
            std::cerr << "[WARN] Ignoring config line with empty key at "
                      << line_no << "\n";
            continue;
        }

        config.values[key] = value;
    }

    return config;
}