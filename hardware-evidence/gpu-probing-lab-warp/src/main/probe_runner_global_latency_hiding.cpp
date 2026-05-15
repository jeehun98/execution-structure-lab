#include <algorithm>
#include <cctype>
#include <cstddef>
#include <cstdint>
#include <filesystem>
#include <fstream>
#include <iostream>
#include <sstream>
#include <stdexcept>
#include <string>
#include <vector>

#include "probes/global_latency_hiding_probe/host.hpp"

namespace {

using probe::global_latency_hiding::GlobalLatencyHidingConfig;
using probe::global_latency_hiding::GlobalLatencyHidingRecord;

std::string trim(const std::string& s) {
    size_t begin = 0;
    while (begin < s.size() &&
           std::isspace(static_cast<unsigned char>(s[begin]))) {
        ++begin;
    }

    size_t end = s.size();
    while (end > begin &&
           std::isspace(static_cast<unsigned char>(s[end - 1]))) {
        --end;
    }

    return s.substr(begin, end - begin);
}

std::vector<std::string> split(const std::string& s, char delim) {
    std::vector<std::string> parts;
    std::stringstream ss(s);
    std::string item;

    while (std::getline(ss, item, delim)) {
        parts.push_back(trim(item));
    }

    return parts;
}

std::vector<int> parse_int_list(const std::string& value) {
    std::vector<int> out;

    for (const std::string& part : split(value, ',')) {
        if (!part.empty()) {
            out.push_back(std::stoi(part));
        }
    }

    return out;
}

GlobalLatencyHidingConfig load_config(const std::string& path) {
    std::ifstream in(path);

    if (!in) {
        throw std::runtime_error("failed to open config file: " + path);
    }

    GlobalLatencyHidingConfig config;

    std::string line;

    while (std::getline(in, line)) {
        const size_t comment_pos = line.find('#');

        if (comment_pos != std::string::npos) {
            line = line.substr(0, comment_pos);
        }

        line = trim(line);

        if (line.empty()) {
            continue;
        }

        const size_t eq_pos = line.find('=');

        if (eq_pos == std::string::npos) {
            throw std::runtime_error("invalid config line: " + line);
        }

        const std::string key = trim(line.substr(0, eq_pos));
        const std::string value = trim(line.substr(eq_pos + 1));

        if (key == "active_warps_values") {
            config.active_warps_values = parse_int_list(value);
        } else if (key == "blocks") {
            config.blocks = std::stoi(value);
        } else if (key == "cycle_budget") {
            config.cycle_budget = static_cast<uint64_t>(std::stoull(value));
        } else if (key == "sample_period") {
            config.sample_period = std::stoi(value);
        } else if (key == "global_elements") {
            config.global_elements = static_cast<size_t>(std::stoull(value));
        } else {
            throw std::runtime_error("unknown config key: " + key);
        }
    }

    return config;
}

uint64_t total_progress_for(
    const std::vector<GlobalLatencyHidingRecord>& records,
    int active_warps
) {
    uint64_t total = 0;

    for (const auto& record : records) {
        if (record.active_warps == active_warps) {
            total += record.progress;
        }
    }

    return total;
}

double average_progress_for(
    const std::vector<GlobalLatencyHidingRecord>& records,
    int active_warps
) {
    uint64_t total = 0;
    uint64_t count = 0;

    for (const auto& record : records) {
        if (record.active_warps == active_warps) {
            total += record.progress;
            ++count;
        }
    }

    if (count == 0) {
        return 0.0;
    }

    return static_cast<double>(total) / static_cast<double>(count);
}

void write_json(
    const std::string& path,
    const GlobalLatencyHidingConfig& config,
    const std::vector<GlobalLatencyHidingRecord>& records
) {
    std::filesystem::create_directories(
        std::filesystem::path(path).parent_path()
    );

    std::ofstream out(path);

    if (!out) {
        throw std::runtime_error("failed to open output file: " + path);
    }

    out << "{\n";
    out << "  \"experiment\": \"global_latency_hiding_probe\",\n";

    out << "  \"config\": {\n";
    out << "    \"active_warps_values\": [";

    for (size_t i = 0; i < config.active_warps_values.size(); ++i) {
        if (i > 0) {
            out << ", ";
        }

        out << config.active_warps_values[i];
    }

    out << "],\n";
    out << "    \"blocks\": " << config.blocks << ",\n";
    out << "    \"cycle_budget\": " << config.cycle_budget << ",\n";
    out << "    \"sample_period\": " << config.sample_period << ",\n";
    out << "    \"global_elements\": " << config.global_elements << "\n";
    out << "  },\n";

    out << "  \"summaries\": [\n";

    for (size_t i = 0; i < config.active_warps_values.size(); ++i) {
        const int active_warps = config.active_warps_values[i];

        out << "    {\n";
        out << "      \"active_warps\": " << active_warps << ",\n";
        out << "      \"average_progress\": "
            << average_progress_for(records, active_warps) << ",\n";
        out << "      \"total_progress\": "
            << total_progress_for(records, active_warps) << "\n";
        out << "    }";

        if (i + 1 < config.active_warps_values.size()) {
            out << ",";
        }

        out << "\n";
    }

    out << "  ],\n";

    out << "  \"records\": [\n";

    for (size_t i = 0; i < records.size(); ++i) {
        const auto& r = records[i];

        out << "    {\n";
        out << "      \"active_warps\": " << r.active_warps << ",\n";
        out << "      \"block\": " << r.block << ",\n";
        out << "      \"warp_id\": " << r.warp_id << ",\n";
        out << "      \"role\": \"" << r.role << "\",\n";
        out << "      \"progress\": " << r.progress << ",\n";
        out << "      \"last_clock\": " << r.last_clock << ",\n";
        out << "      \"sink\": " << r.sink << "\n";
        out << "    }";

        if (i + 1 < records.size()) {
            out << ",";
        }

        out << "\n";
    }

    out << "  ]\n";
    out << "}\n";
}

void print_summary(
    const GlobalLatencyHidingConfig& config,
    const std::vector<GlobalLatencyHidingRecord>& records
) {
    std::cout << "global_latency_hiding_probe\n";
    std::cout << "----------------------------------------\n";

    for (int active_warps : config.active_warps_values) {
        std::cout
            << "active_warps=" << active_warps
            << " average_progress="
            << average_progress_for(records, active_warps)
            << " total_progress="
            << total_progress_for(records, active_warps)
            << "\n";
    }
}

} // namespace

int main(int argc, char** argv) {
    try {
        std::string config_path =
            "configs/global_latency_hiding_probe.cfg";

        std::string output_path =
            "results/raw/global_latency_hiding_probe.json";

        if (argc >= 2) {
            config_path = argv[1];
        }

        if (argc >= 3) {
            output_path = argv[2];
        }

        const GlobalLatencyHidingConfig config = load_config(config_path);

        const std::vector<GlobalLatencyHidingRecord> records =
            probe::global_latency_hiding::run(config);

        write_json(output_path, config, records);
        print_summary(config, records);

        std::cout << "wrote: " << output_path << "\n";

        return 0;
    } catch (const std::exception& e) {
        std::cerr << "error: " << e.what() << "\n";
        return 1;
    }
}