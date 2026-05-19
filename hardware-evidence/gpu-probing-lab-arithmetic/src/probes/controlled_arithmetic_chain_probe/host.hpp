#pragma once

#include "probe/probe_config.hpp"
#include "probe/probe_result.hpp"

#include <vector>

std::vector<ArithmeticProbeRecord> run_controlled_arithmetic_chain_probe(
    const ProbeConfig& config
);