#pragma once

#include "probe/probe_config.hpp"
#include "probe/probe_result.hpp"

#include <vector>

std::vector<ArithmeticProbeRecord> run_arithmetic_dependency_probe(
    const ProbeConfig& config
);