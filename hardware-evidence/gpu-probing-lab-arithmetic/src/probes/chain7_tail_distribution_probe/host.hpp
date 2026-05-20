#pragma once

#include "probe/probe_config.hpp"
#include "probe/probe_result.hpp"

#include <vector>

std::vector<ArithmeticProbeRecord> run_chain7_tail_distribution_probe(
    const ProbeConfig& config
);