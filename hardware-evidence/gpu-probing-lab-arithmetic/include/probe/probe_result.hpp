#pragma once

#include <cstdint>
#include <string>

struct ArithmeticProbeRecord {
    int run = 0;
    int block_id = 0;
    int warp_id = 0;
    int role_id = 0;

    std::string role;

    std::uint64_t progress = 0;
    std::uint64_t last_clock = 0;

    float sink = 0.0f;
};

struct DeviceArithmeticProbeRecord {
    int block_id;
    int warp_id;
    int role_id;

    unsigned long long progress;
    unsigned long long last_clock;

    float sink;
};