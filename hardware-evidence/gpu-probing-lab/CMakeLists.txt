cmake_minimum_required(VERSION 3.24)

project(gpu_probing_lab LANGUAGES CXX CUDA)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

set(CMAKE_CUDA_STANDARD 17)
set(CMAKE_CUDA_STANDARD_REQUIRED ON)

set(CMAKE_CUDA_ARCHITECTURES 89 CACHE STRING "CUDA architectures")
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

find_package(CUDAToolkit REQUIRED)

set(PROBE_INCLUDE_DIRS
    ${CMAKE_CURRENT_SOURCE_DIR}/include
    ${CMAKE_CURRENT_SOURCE_DIR}/src
)

set(PROBE_RUNTIME_DIR ${CMAKE_CURRENT_SOURCE_DIR}/build/bin)
set(PROBE_LIBRARY_DIR ${CMAKE_CURRENT_SOURCE_DIR}/build/lib)

# ------------------------------------------------------------
# common library
# ------------------------------------------------------------
add_library(probe_common
    src/common/device_info.cpp
    src/common/config_loader.cpp
)

target_include_directories(probe_common
    PUBLIC
        ${PROBE_INCLUDE_DIRS}
)

target_link_libraries(probe_common
    PUBLIC
        CUDA::cudart
)

set_target_properties(probe_common PROPERTIES
    ARCHIVE_OUTPUT_DIRECTORY ${PROBE_LIBRARY_DIR}
    LIBRARY_OUTPUT_DIRECTORY ${PROBE_LIBRARY_DIR}
)

# ------------------------------------------------------------
# warp issue policy probe library
# ------------------------------------------------------------
add_library(warp_issue_policy_probe_lib
    src/probes/warp_issue_policy_probe/host.cpp
    src/probes/warp_issue_policy_probe/kernel.cu
)

target_include_directories(warp_issue_policy_probe_lib
    PUBLIC
        ${PROBE_INCLUDE_DIRS}
)

target_link_libraries(warp_issue_policy_probe_lib
    PUBLIC
        probe_common
        CUDA::cudart
)

set_target_properties(warp_issue_policy_probe_lib PROPERTIES
    CUDA_SEPARABLE_COMPILATION ON
    CUDA_RESOLVE_DEVICE_SYMBOLS ON
    ARCHIVE_OUTPUT_DIRECTORY ${PROBE_LIBRARY_DIR}
    LIBRARY_OUTPUT_DIRECTORY ${PROBE_LIBRARY_DIR}
)

# ------------------------------------------------------------
# warp issue policy probe runner
# ------------------------------------------------------------
add_executable(probe_runner_warp_issue_policy
    src/main/probe_runner_warp_issue_policy.cpp
)

target_include_directories(probe_runner_warp_issue_policy
    PRIVATE
        ${PROBE_INCLUDE_DIRS}
)

target_link_libraries(probe_runner_warp_issue_policy
    PRIVATE
        warp_issue_policy_probe_lib
)

set_target_properties(probe_runner_warp_issue_policy PROPERTIES
    RUNTIME_OUTPUT_DIRECTORY ${PROBE_RUNTIME_DIR}
)