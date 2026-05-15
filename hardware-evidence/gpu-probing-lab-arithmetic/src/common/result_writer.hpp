#pragma once

#include "probe/probe_config.hpp"
#include "probe/probe_result.hpp"

#include <string>
#include <vector>

void write_arithmetic_probe_result_json(
    const std::string& output_path,
    const ProbeConfig& config,
    const std::vector<ArithmeticProbeRecord>& records
);