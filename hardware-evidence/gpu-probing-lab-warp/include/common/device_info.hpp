#pragma once

#include <cstddef>
#include <string>

struct DeviceInfo {
  int device_id = 0;
  std::string name;
  int major = 0;
  int minor = 0;
  int sm_count = 0;
  std::size_t global_mem_bytes = 0;
};

DeviceInfo get_device_info(int device_id);
std::string device_info_to_json(const DeviceInfo& info, int indent = 2);