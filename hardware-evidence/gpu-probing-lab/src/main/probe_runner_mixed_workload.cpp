#include "../probes/mixed_workload_probe/host.hpp"

#include <cstdint>
#include <fstream>
#include <iostream>
#include <stdexcept>
#include <string>
#include <unordered_map>

using mixed_workload_probe::Config;
using mixed_workload_probe::run_probe;

static std::string trim(const std::string& s) {
    const auto start = s.find_first_not_of(" \t\r\n");
    if (start == std::string::npos) return "";

    const auto end = s.find_last_not_of(" \t\r\n");
    return s.substr(start, end - start + 1);
}

static std::unordered_map<std::string, std::string> load_cfg(const std::string& path) {
    std::ifstream in(path);
    if (!in.is_open()) {
        throw std::runtime_error("failed to open config: " + path);
    }

    std::unordered_map<std::string, std::string> kv;

    std::string line;
    while (std::getline(in, line)) {
        line = trim(line);

        if (line.empty()) continue;
        if (line[0] == '#') continue;

        const auto eq = line.find('=');
        if (eq == std::string::npos) continue;

        const std::string key = trim(line.substr(0, eq));
        const std::string value = trim(line.substr(eq + 1));

        kv[key] = value;
    }

    return kv;
}

static int get_int(
    const std::unordered_map<std::string, std::string>& kv,
    const std::string& key,
    int fallback
) {
    auto it = kv.find(key);
    if (it == kv.end()) return fallback;
    return std::stoi(it->second);
}

static std::uint64_t get_u64(
    const std::unordered_map<std::string, std::string>& kv,
    const std::string& key,
    std::uint64_t fallback
) {
    auto it = kv.find(key);
    if (it == kv.end()) return fallback;
    return static_cast<std::uint64_t>(std::stoull(it->second));
}

static std::string get_string(
    const std::unordered_map<std::string, std::string>& kv,
    const std::string& key,
    const std::string& fallback
) {
    auto it = kv.find(key);
    if (it == kv.end()) return fallback;
    return it->second;
}

int main(int argc, char** argv) {
    try {
        std::string config_path = "configs/mixed_workload_probe.cfg";

        if (argc >= 2) {
            config_path = argv[1];
        }

        const auto kv = load_cfg(config_path);

        Config config;

        config.num_runs_per_scenario =
            get_int(kv, "num_runs_per_scenario", config.num_runs_per_scenario);

        config.num_scenarios =
            get_int(kv, "num_scenarios", config.num_scenarios);

        config.warmup_runs =
            get_int(kv, "warmup_runs", config.warmup_runs);

        config.blocks =
            get_int(kv, "blocks", config.blocks);

        config.warps_per_block =
            get_int(kv, "warps_per_block", config.warps_per_block);

        config.threads_per_block =
            get_int(kv, "threads_per_block", config.threads_per_block);

        config.cycle_budget =
            get_u64(kv, "cycle_budget", config.cycle_budget);

        config.global_buffer_size =
            get_int(kv, "global_buffer_size", config.global_buffer_size);

        config.output_path =
            get_string(kv, "output_path", config.output_path);

        run_probe(config);
        return 0;
    }
    catch (const std::exception& e) {
        std::cerr << "[mixed_workload_probe] error: "
                  << e.what()
                  << "\n";
        return 1;
    }
}