#pragma once

#include <cuda_runtime.h>

#include <cstdlib>
#include <iostream>
#include <string>

#define CUDA_CHECK(expr)                                                     \
    do {                                                                     \
        cudaError_t _err = (expr);                                           \
        if (_err != cudaSuccess) {                                           \
            std::cerr << "[CUDA ERROR] " << cudaGetErrorString(_err)         \
                      << "\n  at " << __FILE__ << ":" << __LINE__           \
                      << "\n  expr: " << #expr << std::endl;                \
            std::exit(EXIT_FAILURE);                                         \
        }                                                                    \
    } while (0)