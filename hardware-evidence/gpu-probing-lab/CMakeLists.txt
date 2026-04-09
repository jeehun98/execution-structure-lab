cmake_minimum_required(VERSION 3.24)

project(gpu_probing_lab LANGUAGES CXX CUDA)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

set(CMAKE_CUDA_STANDARD 17)
set(CMAKE_CUDA_STANDARD_REQUIRED ON)

set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

find_package(CUDAToolkit REQUIRED)

# ------------------------------------------------------------
# common library
# ------------------------------------------------------------
add_library(probe_common
    src/common/device_info.cpp
)

target_include_directories(probe_common
    PUBLIC
        ${CMAKE_CURRENT_SOURCE_DIR}/include
        ${CMAKE_CURRENT_SOURCE_DIR}/src
)

target_link_libraries(probe_common
    PUBLIC
        CUDA::cudart
)

set_target_properties(probe_common PROPERTIES
    ARCHIVE_OUTPUT_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}/build/lib
    LIBRARY_OUTPUT_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}/build/lib
)

# ------------------------------------------------------------
# bounded global stride sweep library
# ------------------------------------------------------------
add_library(global_stride_sweep_lib
    src/probes/global_stride_sweep/host.cpp
    src/probes/global_stride_sweep/kernel.cu
)

target_include_directories(global_stride_sweep_lib
    PUBLIC
        ${CMAKE_CURRENT_SOURCE_DIR}/include
        ${CMAKE_CURRENT_SOURCE_DIR}/src
)

target_link_libraries(global_stride_sweep_lib
    PUBLIC
        probe_common
        CUDA::cudart
)

set_target_properties(global_stride_sweep_lib PROPERTIES
    CUDA_SEPARABLE_COMPILATION ON
    CUDA_RESOLVE_DEVICE_SYMBOLS ON
    ARCHIVE_OUTPUT_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}/build/lib
    LIBRARY_OUTPUT_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}/build/lib
)

# ------------------------------------------------------------
# probe runner
# ------------------------------------------------------------
add_executable(probe_runner
    src/main/probe_runner.cpp
)

target_include_directories(probe_runner
    PRIVATE
        ${CMAKE_CURRENT_SOURCE_DIR}/include
        ${CMAKE_CURRENT_SOURCE_DIR}/src
)

target_link_libraries(probe_runner
    PRIVATE
        global_stride_sweep_lib
)

set_target_properties(probe_runner PROPERTIES
    RUNTIME_OUTPUT_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}/build/bin
)