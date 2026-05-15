#include "common/device_info.hpp"
#include "common/timer.hpp"

#include "src/common/config_loader.hpp"
#include "src/common/result_writer.hpp"

#include "src/probes/arithmetic_dependency_probe/host.hpp"

#include <exception>
#include <iostream>
#include <string>

int main(int argc, char** argv) {
    try {
        std::string config_path = "configs/arithmetic_dependency_probe.cfg";

        if (argc >= 2) {
            config_path = argv[1];
        }

        std::cout << "[Arithmetic Dependency Probe]\n";
        std::cout << "Config: " << config_path << "\n";

        print_device_info();

        ProbeConfig config = load_probe_config(config_path);

        const std::string output_path =
            config.get_string("output_path", "results/raw/arithmetic_dependency_probe.json");

        CpuTimer timer;

        auto records = run_arithmetic_dependency_probe(config);

        const double elapsed_ms = timer.elapsed_ms();

        write_arithmetic_probe_result_json(
            output_path,
            config,
            records
        );

        std::cout << "Records: " << records.size() << "\n";
        std::cout << "Output: " << output_path << "\n";
        std::cout << "Elapsed ms: " << elapsed_ms << "\n";
        std::cout << "Done.\n";

        return 0;
    } catch (const std::exception& e) {
        std::cerr << "[ERROR] " << e.what() << "\n";
        return 1;
    }
}