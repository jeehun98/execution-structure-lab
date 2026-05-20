cmake_minimum_required(VERSION 3.24)

project(gpu_probing_lab_arithmetic LANGUAGES CXX CUDA)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

set(CMAKE_CUDA_STANDARD 17)
set(CMAKE_CUDA_STANDARD_REQUIRED ON)

if(NOT DEFINED CMAKE_CUDA_ARCHITECTURES)
    set(CMAKE_CUDA_ARCHITECTURES 86)
endif()

find_package(CUDAToolkit REQUIRED)

# ------------------------------------------------------------
# Common include paths
# ------------------------------------------------------------

set(GPU_PROBING_INCLUDE_DIRS
    ${CMAKE_CURRENT_SOURCE_DIR}/include
    ${CMAKE_CURRENT_SOURCE_DIR}/src
)

# ------------------------------------------------------------
# Common source files shared by all probe runners
# ------------------------------------------------------------

set(GPU_PROBING_COMMON_SOURCES
    src/common/config_loader.cpp
    src/common/device_info.cpp
    src/common/result_writer.cpp
)

# ------------------------------------------------------------
# Helper function for adding one probe runner
#
# Usage:
#   add_probe_runner(
#       NAME controlled_arithmetic_chain
#       CUDA_OPTIONS -Xptxas=-v
#   )
#
# This expects:
#   src/main/probe_runner_<NAME>.cpp
#   src/probes/<NAME>_probe/host.cpp
#   src/probes/<NAME>_probe/kernel.cu
#
# Output target:
#   probe_runner_<NAME>
# ------------------------------------------------------------

function(add_probe_runner)
    set(options)
    set(oneValueArgs NAME)
    set(multiValueArgs CUDA_OPTIONS EXTRA_SOURCES EXTRA_LIBS)

    cmake_parse_arguments(PROBE
        "${options}"
        "${oneValueArgs}"
        "${multiValueArgs}"
        ${ARGN}
    )

    if(NOT PROBE_NAME)
        message(FATAL_ERROR "add_probe_runner requires NAME")
    endif()

    set(target_name probe_runner_${PROBE_NAME})
    set(probe_dir src/probes/${PROBE_NAME}_probe)

    add_executable(${target_name}
        src/main/probe_runner_${PROBE_NAME}.cpp

        ${GPU_PROBING_COMMON_SOURCES}

        ${probe_dir}/host.cpp
        ${probe_dir}/kernel.cu

        ${PROBE_EXTRA_SOURCES}
    )

    target_include_directories(${target_name}
        PRIVATE
        ${GPU_PROBING_INCLUDE_DIRS}
    )

    target_link_libraries(${target_name}
        PRIVATE
        CUDA::cudart
        ${PROBE_EXTRA_LIBS}
    )

    if(PROBE_CUDA_OPTIONS)
        target_compile_options(${target_name}
            PRIVATE
            $<$<COMPILE_LANGUAGE:CUDA>:${PROBE_CUDA_OPTIONS}>
        )
    endif()

    set_target_properties(${target_name} PROPERTIES
        CUDA_SEPARABLE_COMPILATION ON
    )
endfunction()

# ------------------------------------------------------------
# Probe runners
# ------------------------------------------------------------

add_probe_runner(
    NAME arithmetic_dependency
    CUDA_OPTIONS --use_fast_math
)

add_probe_runner(
    NAME controlled_arithmetic_chain
    CUDA_OPTIONS -Xptxas=-v
)

add_probe_runner(
    NAME irregular_fma_dependency_shape
    CUDA_OPTIONS -Xptxas=-v
)

add_probe_runner(
    NAME chain7_tail_distribution
    CUDA_OPTIONS -Xptxas=-v
)

add_probe_runner(
    NAME optimal_accumulator_count
    CUDA_OPTIONS -Xptxas=-v
)