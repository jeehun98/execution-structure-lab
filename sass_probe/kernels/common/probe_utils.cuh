#pragma once

#include <cuda_runtime.h>
#include <cstdio>
#include <cstdlib>

#define CUDA_CHECK(expr)                                      \
    do {                                                      \
        cudaError_t err__ = (expr);                           \
        if (err__ != cudaSuccess) {                           \
            std::fprintf(stderr,                              \
                "CUDA error %s:%d: %s\n",                    \
                __FILE__, __LINE__, cudaGetErrorString(err__)); \
            std::exit(1);                                     \
        }                                                     \
    } while (0)

template <typename T>
void fill_host(T* ptr, int n, T scale = T(1)) {
    for (int i = 0; i < n; ++i) {
        ptr[i] = static_cast<T>((i % 17) - 8) * scale;
    }
}