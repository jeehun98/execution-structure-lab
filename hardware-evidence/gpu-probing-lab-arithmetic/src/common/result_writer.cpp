#include "result_writer.hpp"

#include <filesystem>
#include <fstream>
#include <iomanip>
#include <stdexcept>

namespace {

std::string json_escape(const std::string& s) {
    std::string out;
    out.reserve(s.size());

    for (char c : s) {
        switch (c) {
            case '\\': out += "\\\\"; break;
            case '"':  out += "\\\""; break;
            case '\n': out += "\\n"; break;
            case '\r': out += "\\r"; break;
            case '\t': out += "\\t"; break;
            default:   out += c; break;
        }
    }

    return out;
}

} // namespace

void write_arithmetic_probe_result_json(
    const std::string& output_path,
    const ProbeConfig& config,
    const std::vector<ArithmeticProbeRecord>& records
) {
    std::filesystem::path out_path(output_path);

    if (out_path.has_parent_path()) {
        std::filesystem::create_directories(out_path.parent_path());
    }

    std::ofstream out(output_path);
    if (!out.is_open()) {
        throw std::runtime_error("Failed to open output file: " + output_path);
    }

    const std::string probe_name = config.get_string("probe_name", "arithmetic_dependency_probe");

    out << "{\n";
    out << "  \"probe\": \"" << json_escape(probe_name) << "\",\n";
    out << "  \"description\": \"Compares independent arithmetic workloads and dependent arithmetic chains.\",\n";

    out << "  \"config\": {\n";
    out << "    \"blocks\": " << config.get_int("blocks", 1) << ",\n";
    out << "    \"threads_per_block\": " << config.get_int("threads_per_block", 128) << ",\n";
    out << "    \"warps_per_block\": " << config.get_int("warps_per_block", 4) << ",\n";
    out << "    \"repeat\": " << config.get_int("repeat", 1) << ",\n";
    out << "    \"use_clock_budget\": " << (config.get_bool("use_clock_budget", true) ? "true" : "false") << ",\n";
    out << "    \"clock_budget_cycles\": " << config.get_u64("clock_budget_cycles", 10000000ULL) << ",\n";
    out << "    \"iterations\": " << config.get_u64("iterations", 100000ULL) << "\n";
    out << "  },\n";

    out << "  \"records\": [\n";

    for (std::size_t i = 0; i < records.size(); ++i) {
        const auto& r = records[i];

        out << "    {\n";
        out << "      \"run\": " << r.run << ",\n";
        out << "      \"block_id\": " << r.block_id << ",\n";
        out << "      \"warp_id\": " << r.warp_id << ",\n";
        out << "      \"role_id\": " << r.role_id << ",\n";
        out << "      \"role\": \"" << json_escape(r.role) << "\",\n";
        out << "      \"progress\": " << r.progress << ",\n";
        out << "      \"last_clock\": " << r.last_clock << ",\n";
        out << "      \"sink\": " << std::setprecision(8) << r.sink << "\n";
        out << "    }";

        if (i + 1 < records.size()) {
            out << ",";
        }

        out << "\n";
    }

    out << "  ]\n";
    out << "}\n";
}