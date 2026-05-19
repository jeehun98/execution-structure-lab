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

include_directories(
    ${CMAKE_CURRENT_SOURCE_DIR}/include
    ${CMAKE_CURRENT_SOURCE_DIR}/src
)

add_executable(probe_runner_arithmetic_dependency
    src/main/probe_runner_arithmetic_dependency.cpp

    src/common/config_loader.cpp
    src/common/device_info.cpp
    src/common/result_writer.cpp

    src/probes/arithmetic_dependency_probe/host.cpp
    src/probes/arithmetic_dependency_probe/kernel.cu
)

target_link_libraries(probe_runner_arithmetic_dependency
    PRIVATE
    CUDA::cudart
)

target_compile_options(probe_runner_arithmetic_dependency PRIVATE
    $<$<COMPILE_LANGUAGE:CUDA>:--use_fast_math>
)

set_target_properties(probe_runner_arithmetic_dependency PROPERTIES
    CUDA_SEPARABLE_COMPILATION ON
)

add_executable(probe_runner_controlled_arithmetic_chain
    src/main/probe_runner_controlled_arithmetic_chain.cpp

    src/common/config_loader.cpp
    src/common/device_info.cpp
    src/common/result_writer.cpp

    src/probes/controlled_arithmetic_chain_probe/host.cpp
    src/probes/controlled_arithmetic_chain_probe/kernel.cu
)

target_include_directories(probe_runner_controlled_arithmetic_chain
    PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}/include
    ${CMAKE_CURRENT_SOURCE_DIR}/src
)

target_link_libraries(probe_runner_controlled_arithmetic_chain
    PRIVATE
    CUDA::cudart
)

target_compile_options(probe_runner_controlled_arithmetic_chain PRIVATE
    $<$<COMPILE_LANGUAGE:CUDA>:-Xptxas=-v>
)

set_target_properties(probe_runner_controlled_arithmetic_chain PROPERTIES
    CUDA_SEPARABLE_COMPILATION ON
)