#include "common/device_info.hpp"
#include "common/cuda_check.hpp"

#include <cuda_runtime.h>
#include <sstream>

DeviceInfo get_device_info(int device_id) {
  cudaDeviceProp prop{};
  CUDA_CHECK(cudaGetDeviceProperties(&prop, device_id));

  DeviceInfo info;
  info.device_id = device_id;
  info.name = prop.name;
  info.major = prop.major;
  info.minor = prop.minor;
  info.sm_count = prop.multiProcessorCount;
  info.global_mem_bytes = prop.totalGlobalMem;
  return info;
}

std::string device_info_to_json(const DeviceInfo& info, int indent) {
  std::string pad(indent, ' ');
  std::ostringstream oss;
  oss << "{\n";
  oss << pad << "\"device_id\": " << info.device_id << ",\n";
  oss << pad << "\"name\": \"" << info.name << "\",\n";
  oss << pad << "\"compute_capability\": \"" << info.major << "." << info.minor << "\",\n";
  oss << pad << "\"sm_count\": " << info.sm_count << ",\n";
  oss << pad << "\"global_mem_bytes\": " << info.global_mem_bytes << "\n";
  oss << std::string(indent >= 2 ? indent - 2 : 0, ' ') << "}";
  return oss.str();
}