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
# global stride sweep library
# ------------------------------------------------------------
add_library(global_stride_sweep_lib
    src/probes/global_stride_sweep/host.cpp
    src/probes/global_stride_sweep/kernel.cu
)

target_include_directories(global_stride_sweep_lib
    PUBLIC
        ${PROBE_INCLUDE_DIRS}
)

target_link_libraries(global_stride_sweep_lib
    PUBLIC
        probe_common
        CUDA::cudart
)

set_target_properties(global_stride_sweep_lib PROPERTIES
    CUDA_SEPARABLE_COMPILATION ON
    CUDA_RESOLVE_DEVICE_SYMBOLS ON
    ARCHIVE_OUTPUT_DIRECTORY ${PROBE_LIBRARY_DIR}
    LIBRARY_OUTPUT_DIRECTORY ${PROBE_LIBRARY_DIR}
)

# ------------------------------------------------------------
# shared bank conflict stride library
# ------------------------------------------------------------
add_library(shared_bank_conflict_stride_lib
    src/probes/shared_bank_conflict_stride/host.cpp
    src/probes/shared_bank_conflict_stride/kernel.cu
)

target_include_directories(shared_bank_conflict_stride_lib
    PUBLIC
        ${PROBE_INCLUDE_DIRS}
)

target_link_libraries(shared_bank_conflict_stride_lib
    PUBLIC
        probe_common
        CUDA::cudart
)

set_target_properties(shared_bank_conflict_stride_lib PROPERTIES
    CUDA_SEPARABLE_COMPILATION ON
    CUDA_RESOLVE_DEVICE_SYMBOLS ON
    ARCHIVE_OUTPUT_DIRECTORY ${PROBE_LIBRARY_DIR}
    LIBRARY_OUTPUT_DIRECTORY ${PROBE_LIBRARY_DIR}
)

# ------------------------------------------------------------
# global stride probe runner
# ------------------------------------------------------------
add_executable(probe_runner_global_stride
    src/main/probe_runner_global_stride.cpp
)

target_include_directories(probe_runner_global_stride
    PRIVATE
        ${PROBE_INCLUDE_DIRS}
)

target_link_libraries(probe_runner_global_stride
    PRIVATE
        global_stride_sweep_lib
)

set_target_properties(probe_runner_global_stride PROPERTIES
    RUNTIME_OUTPUT_DIRECTORY ${PROBE_RUNTIME_DIR}
)

# ------------------------------------------------------------
# shared bank conflict stride probe runner
# ------------------------------------------------------------
add_executable(probe_runner_shared_bank_conflict_stride
    src/main/probe_runner_shared_bank_conflict_stride.cpp
)

target_include_directories(probe_runner_shared_bank_conflict_stride
    PRIVATE
        ${PROBE_INCLUDE_DIRS}
)

target_link_libraries(probe_runner_shared_bank_conflict_stride
    PRIVATE
        shared_bank_conflict_stride_lib
)

set_target_properties(probe_runner_shared_bank_conflict_stride PROPERTIES
    RUNTIME_OUTPUT_DIRECTORY ${PROBE_RUNTIME_DIR}
)

# ------------------------------------------------------------
# shared pad effect library
# ------------------------------------------------------------
add_library(shared_pad_effect_lib
    src/probes/shared_pad_effect/host.cpp
    src/probes/shared_pad_effect/kernel.cu
)

target_include_directories(shared_pad_effect_lib
    PUBLIC
        ${PROBE_INCLUDE_DIRS}
)

target_link_libraries(shared_pad_effect_lib
    PUBLIC
        probe_common
        CUDA::cudart
)

set_target_properties(shared_pad_effect_lib PROPERTIES
    CUDA_SEPARABLE_COMPILATION ON
    CUDA_RESOLVE_DEVICE_SYMBOLS ON
    ARCHIVE_OUTPUT_DIRECTORY ${PROBE_LIBRARY_DIR}
    LIBRARY_OUTPUT_DIRECTORY ${PROBE_LIBRARY_DIR}
)

# ------------------------------------------------------------
# shared pad effect probe runner
# ------------------------------------------------------------
add_executable(probe_runner_shared_pad_effect
    src/main/probe_runner_shared_pad_effect.cpp
)

target_include_directories(probe_runner_shared_pad_effect
    PRIVATE
        ${PROBE_INCLUDE_DIRS}
)

target_link_libraries(probe_runner_shared_pad_effect
    PRIVATE
        shared_pad_effect_lib
)

set_target_properties(probe_runner_shared_pad_effect PROPERTIES
    RUNTIME_OUTPUT_DIRECTORY ${PROBE_RUNTIME_DIR}
)