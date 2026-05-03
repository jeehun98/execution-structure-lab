#include <cctype>
#include <cstddef>
#include <cstdint>
#include <filesystem>
#include <fstream>
#include <iostream>
#include <stdexcept>
#include <string>
#include <vector>

#include "probes/warp_progress_divergence_probe/host.hpp"

namespace {

using probe::warp_progress_divergence::WarpProgressDivergenceConfig;
using probe::warp_progress_divergence::WarpProgressDivergenceRecord;

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

WarpProgressDivergenceConfig load_config(const std::string& path) {
    std::ifstream in(path);

    if (!in) {
        throw std::runtime_error("failed to open config file: " + path);
    }

    WarpProgressDivergenceConfig config;

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

        if (key == "blocks") {
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

void write_json(
    const std::string& path,
    const WarpProgressDivergenceConfig& config,
    const std::vector<WarpProgressDivergenceRecord>& records
) {
    std::filesystem::create_directories(
        std::filesystem::path(path).parent_path()
    );

    std::ofstream out(path);

    if (!out) {
        throw std::runtime_error("failed to open output file: " + path);
    }

    out << "{\n";
    out << "  \"experiment\": \"warp_progress_divergence_probe\",\n";

    out << "  \"config\": {\n";
    out << "    \"blocks\": " << config.blocks << ",\n";
    out << "    \"cycle_budget\": " << config.cycle_budget << ",\n";
    out << "    \"sample_period\": " << config.sample_period << ",\n";
    out << "    \"global_elements\": " << config.global_elements << "\n";
    out << "  },\n";

    out << "  \"records\": [\n";

    for (size_t i = 0; i < records.size(); ++i) {
        const auto& r = records[i];

        out << "    {\n";
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
    const std::vector<WarpProgressDivergenceRecord>& records
) {
    std::cout << "warp_progress_divergence_probe\n";
    std::cout << "----------------------------------------\n";

    for (const auto& r : records) {
        std::cout
            << "block=" << r.block
            << " warp=" << r.warp_id
            << " role=" << r.role
            << " progress=" << r.progress
            << " last_clock=" << r.last_clock
            << " sink=" << r.sink
            << "\n";
    }
}

} // namespace

int main(int argc, char** argv) {
    try {
        std::string config_path =
            "configs/warp_progress_divergence_probe.cfg";

        std::string output_path =
            "results/raw/warp_progress_divergence_probe.json";

        if (argc >= 2) {
            config_path = argv[1];
        }

        if (argc >= 3) {
            output_path = argv[2];
        }

        const WarpProgressDivergenceConfig config =
            load_config(config_path);

        const std::vector<WarpProgressDivergenceRecord> records =
            probe::warp_progress_divergence::run(config);

        write_json(output_path, config, records);
        print_summary(records);

        std::cout << "wrote: " << output_path << "\n";

        return 0;
    } catch (const std::exception& e) {
        std::cerr << "error: " << e.what() << "\n";
        return 1;
    }
}