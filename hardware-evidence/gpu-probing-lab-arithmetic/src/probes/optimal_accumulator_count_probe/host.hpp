#pragma once

#include "probe/probe_config.hpp"
#include "probe/probe_result.hpp"

#include <vector>

std::vector<ArithmeticProbeRecord> run_optimal_accumulator_count_probe(
    const ProbeConfig& config
);