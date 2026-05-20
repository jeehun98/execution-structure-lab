#pragma once

#include "probe/probe_config.hpp"
#include "probe/probe_result.hpp"

#include <vector>

std::vector<ArithmeticProbeRecord> run_irregular_fma_dependency_shape_probe(
    const ProbeConfig& config
);