#include <cstddef>
#include <cstdint>
#include <filesystem>
#include <fstream>
#include <iostream>
#include <stdexcept>
#include <string>
#include <unordered_map>
#include <vector>

#include "probes/warp_issue_policy_probe/host.hpp"

using probe::warp_issue_policy::WarpIssueConfig;
using probe::warp_issue_policy::WarpIssueRecord;

static std::unordered_map<std::string, std::string>
load_cfg(const std::string& path) {
    std::ifstream in(path);

    if (!in) {
        throw std::runtime_error("failed to open config: " + path);
    }

    std::unordered_map<std::string, std::string> values;
    std::string line;

    while (std::getline(in, line)) {
        if (line.empty()) {
            continue;
        }

        if (line[0] == '#') {
            continue;
        }

        const auto pos = line.find('=');

        if (pos == std::string::npos) {
            continue;
        }

        std::string key = line.substr(0, pos);
        std::string value = line.substr(pos + 1);

        values[key] = value;
    }

    return values;
}

static int get_int(
    const std::unordered_map<std::string, std::string>& cfg,
    const std::string& key,
    int fallback
) {
    const auto it = cfg.find(key);

    if (it == cfg.end()) {
        return fallback;
    }

    return std::stoi(it->second);
}

static uint64_t get_u64(
    const std::unordered_map<std::string, std::string>& cfg,
    const std::string& key,
    uint64_t fallback
) {
    const auto it = cfg.find(key);

    if (it == cfg.end()) {
        return fallback;
    }

    return std::stoull(it->second);
}

static size_t get_size(
    const std::unordered_map<std::string, std::string>& cfg,
    const std::string& key,
    size_t fallback
) {
    const auto it = cfg.find(key);

    if (it == cfg.end()) {
        return fallback;
    }

    return static_cast<size_t>(std::stoull(it->second));
}

static std::string get_string(
    const std::unordered_map<std::string, std::string>& cfg,
    const std::string& key,
    const std::string& fallback
) {
    const auto it = cfg.find(key);

    if (it == cfg.end()) {
        return fallback;
    }

    return it->second;
}

static void write_json(
    const std::string& path,
    const WarpIssueConfig& config,
    const std::vector<WarpIssueRecord>& records
) {
    const std::filesystem::path out_path(path);

    if (out_path.has_parent_path()) {
        std::filesystem::create_directories(out_path.parent_path());
    }

    std::ofstream out(path);

    if (!out) {
        throw std::runtime_error("failed to write output: " + path);
    }

    out << "{\n";
    out << "  \"experiment\": \"warp_issue_policy_probe\",\n";
    out << "  \"config\": {\n";
    out << "    \"mode\": " << config.mode << ",\n";
    out << "    \"blocks\": " << config.blocks << ",\n";
    out << "    \"cycle_budget\": " << config.cycle_budget << ",\n";
    out << "    \"sample_period\": " << config.sample_period << ",\n";
    out << "    \"global_elements\": " << config.global_elements << "\n";
    out << "  },\n";
    out << "  \"records\": [\n";

    for (size_t i = 0; i < records.size(); ++i) {
        const auto& r = records[i];

        out << "    {\n";
        out << "      \"mode\": " << r.mode << ",\n";
        out << "      \"block\": " << r.block_id << ",\n";
        out << "      \"warp_id\": " << r.warp_id << ",\n";
        out << "      \"role\": \"" << r.role << "\",\n";
        out << "      \"progress\": " << r.progress << ",\n";
        out << "      \"last_clock\": " << r.last_clock << ",\n";
        out << "      \"sink\": " << r.sink << "\n";
        out << "    }";

        if (i + 1 != records.size()) {
            out << ",";
        }

        out << "\n";
    }

    out << "  ]\n";
    out << "}\n";
}

int main(int argc, char** argv) {
    try {
        std::string cfg_path = "configs/warp_issue_policy_probe.cfg";

        if (argc >= 2) {
            cfg_path = argv[1];
        }

        const auto cfg_values = load_cfg(cfg_path);

        WarpIssueConfig config;
        config.mode = get_int(cfg_values, "mode", 0);
        config.blocks = get_int(cfg_values, "blocks", 1);
        config.cycle_budget =
            get_u64(cfg_values, "cycle_budget", 200000000ULL);
        config.sample_period =
            get_int(cfg_values, "sample_period", 256);
        config.global_elements =
            get_size(cfg_values, "global_elements", 1 << 24);

        const std::string output_path = get_string(
            cfg_values,
            "output",
            "results/raw/warp_issue_policy_probe.json"
        );

        const auto records = probe::warp_issue_policy::run(config);

        write_json(output_path, config, records);

        std::cout << "wrote " << output_path << "\n";

        for (const auto& r : records) {
            std::cout
                << "mode=" << r.mode
                << " block=" << r.block_id
                << " warp=" << r.warp_id
                << " role=" << r.role
                << " progress=" << r.progress
                << " last_clock=" << r.last_clock
                << " sink=" << r.sink
                << "\n";
        }

        return 0;
    } catch (const std::exception& e) {
        std::cerr << "error: " << e.what() << "\n";
        return 1;
    }
}