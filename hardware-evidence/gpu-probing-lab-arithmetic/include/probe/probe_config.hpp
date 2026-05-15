#pragma once

#include <cstdint>
#include <string>
#include <unordered_map>

struct ProbeConfig {
    std::unordered_map<std::string, std::string> values;

    std::string get_string(const std::string& key, const std::string& fallback = "") const {
        auto it = values.find(key);
        if (it == values.end()) {
            return fallback;
        }
        return it->second;
    }

    int get_int(const std::string& key, int fallback = 0) const {
        auto it = values.find(key);
        if (it == values.end()) {
            return fallback;
        }
        return std::stoi(it->second);
    }

    std::uint64_t get_u64(const std::string& key, std::uint64_t fallback = 0) const {
        auto it = values.find(key);
        if (it == values.end()) {
            return fallback;
        }
        return static_cast<std::uint64_t>(std::stoull(it->second));
    }

    bool get_bool(const std::string& key, bool fallback = false) const {
        auto it = values.find(key);
        if (it == values.end()) {
            return fallback;
        }

        const std::string& v = it->second;
        return v == "1" || v == "true" || v == "TRUE" || v == "yes" || v == "YES";
    }
};