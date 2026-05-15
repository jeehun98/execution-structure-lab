#include "common/device_info.hpp"
#include "common/cuda_check.hpp"

#include <cuda_runtime.h>

#include <iostream>

void print_device_info() {
    int device = 0;
    CUDA_CHECK(cudaGetDevice(&device));

    cudaDeviceProp prop{};
    CUDA_CHECK(cudaGetDeviceProperties(&prop, device));

    std::cout << "=== CUDA Device Info ===\n";
    std::cout << "Device ID: " << device << "\n";
    std::cout << "Name: " << prop.name << "\n";
    std::cout << "Compute Capability: " << prop.major << "." << prop.minor << "\n";
    std::cout << "SM Count: " << prop.multiProcessorCount << "\n";
    std::cout << "Warp Size: " << prop.warpSize << "\n";
    std::cout << "Max Threads Per Block: " << prop.maxThreadsPerBlock << "\n";
    std::cout << "Shared Mem Per Block: " << prop.sharedMemPerBlock << "\n";
    std::cout << "Shared Mem Per Block Opt-in: " << prop.sharedMemPerBlockOptin << "\n";
    std::cout << "Regs Per Block: " << prop.regsPerBlock << "\n";
    std::cout << "Clock Rate kHz: " << prop.clockRate << "\n";
    std::cout << "========================\n";
}