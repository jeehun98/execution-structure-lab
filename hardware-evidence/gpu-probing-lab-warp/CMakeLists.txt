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

# ------------------------------------------------------------
# global latency hiding probe library
# ------------------------------------------------------------
add_library(global_latency_hiding_probe_lib
    src/probes/global_latency_hiding_probe/host.cpp
    src/probes/global_latency_hiding_probe/kernel.cu
)

target_include_directories(global_latency_hiding_probe_lib
    PUBLIC
        ${PROBE_INCLUDE_DIRS}
)

target_link_libraries(global_latency_hiding_probe_lib
    PUBLIC
        probe_common
        CUDA::cudart
)

set_target_properties(global_latency_hiding_probe_lib PROPERTIES
    CUDA_SEPARABLE_COMPILATION ON
    CUDA_RESOLVE_DEVICE_SYMBOLS ON
    ARCHIVE_OUTPUT_DIRECTORY ${PROBE_LIBRARY_DIR}
    LIBRARY_OUTPUT_DIRECTORY ${PROBE_LIBRARY_DIR}
)

# ------------------------------------------------------------
# global latency hiding probe runner
# ------------------------------------------------------------
add_executable(probe_runner_global_latency_hiding
    src/main/probe_runner_global_latency_hiding.cpp
)

target_include_directories(probe_runner_global_latency_hiding
    PRIVATE
        ${PROBE_INCLUDE_DIRS}
)

target_link_libraries(probe_runner_global_latency_hiding
    PRIVATE
        global_latency_hiding_probe_lib
)

set_target_properties(probe_runner_global_latency_hiding PROPERTIES
    RUNTIME_OUTPUT_DIRECTORY ${PROBE_RUNTIME_DIR}
)

# ------------------------------------------------------------
# warp progress divergence probe library
# ------------------------------------------------------------
add_library(warp_progress_divergence_probe_lib
    src/probes/warp_progress_divergence_probe/host.cpp
    src/probes/warp_progress_divergence_probe/kernel.cu
)

target_include_directories(warp_progress_divergence_probe_lib
    PUBLIC
        ${PROBE_INCLUDE_DIRS}
)

target_link_libraries(warp_progress_divergence_probe_lib
    PUBLIC
        probe_common
        CUDA::cudart
)

set_target_properties(warp_progress_divergence_probe_lib PROPERTIES
    CUDA_SEPARABLE_COMPILATION ON
    CUDA_RESOLVE_DEVICE_SYMBOLS ON
    ARCHIVE_OUTPUT_DIRECTORY ${PROBE_LIBRARY_DIR}
    LIBRARY_OUTPUT_DIRECTORY ${PROBE_LIBRARY_DIR}
)

# ------------------------------------------------------------
# warp progress divergence probe runner
# ------------------------------------------------------------
add_executable(probe_runner_warp_progress_divergence
    src/main/probe_runner_warp_progress_divergence.cpp
)

target_include_directories(probe_runner_warp_progress_divergence
    PRIVATE
        ${PROBE_INCLUDE_DIRS}
)

target_link_libraries(probe_runner_warp_progress_divergence
    PRIVATE
        warp_progress_divergence_probe_lib
)

set_target_properties(probe_runner_warp_progress_divergence PROPERTIES
    RUNTIME_OUTPUT_DIRECTORY ${PROBE_RUNTIME_DIR}
)

# ------------------------------------------------------------
# warp signature repeatability probe library
# ------------------------------------------------------------
add_library(warp_signature_repeatability_probe_lib
    src/probes/warp_signature_repeatability_probe/host.cpp
    src/probes/warp_signature_repeatability_probe/kernel.cu
)

target_include_directories(warp_signature_repeatability_probe_lib
    PUBLIC
        ${PROBE_INCLUDE_DIRS}
)

target_link_libraries(warp_signature_repeatability_probe_lib
    PUBLIC
        probe_common
        CUDA::cudart
)

set_target_properties(warp_signature_repeatability_probe_lib PROPERTIES
    CUDA_SEPARABLE_COMPILATION ON
    CUDA_RESOLVE_DEVICE_SYMBOLS ON
    ARCHIVE_OUTPUT_DIRECTORY ${PROBE_LIBRARY_DIR}
    LIBRARY_OUTPUT_DIRECTORY ${PROBE_LIBRARY_DIR}
)

# ------------------------------------------------------------
# warp signature repeatability probe runner
# ------------------------------------------------------------
add_executable(probe_runner_warp_signature_repeatability
    src/main/probe_runner_warp_signature_repeatability.cpp
)

target_include_directories(probe_runner_warp_signature_repeatability
    PRIVATE
        ${PROBE_INCLUDE_DIRS}
)

target_link_libraries(probe_runner_warp_signature_repeatability
    PRIVATE
        warp_signature_repeatability_probe_lib
)

set_target_properties(probe_runner_warp_signature_repeatability PROPERTIES
    RUNTIME_OUTPUT_DIRECTORY ${PROBE_RUNTIME_DIR}
)

# ------------------------------------------------------------
# warp signature permutation probe library
# ------------------------------------------------------------
add_library(warp_signature_permutation_probe_lib
    src/probes/warp_signature_permutation_probe/host.cpp
    src/probes/warp_signature_permutation_probe/kernel.cu
)

target_include_directories(warp_signature_permutation_probe_lib
    PUBLIC
        ${PROBE_INCLUDE_DIRS}
)

target_link_libraries(warp_signature_permutation_probe_lib
    PUBLIC
        probe_common
        CUDA::cudart
)

set_target_properties(warp_signature_permutation_probe_lib PROPERTIES
    CUDA_SEPARABLE_COMPILATION ON
    CUDA_RESOLVE_DEVICE_SYMBOLS ON
    ARCHIVE_OUTPUT_DIRECTORY ${PROBE_LIBRARY_DIR}
    LIBRARY_OUTPUT_DIRECTORY ${PROBE_LIBRARY_DIR}
)

# ------------------------------------------------------------
# warp signature permutation probe runner
# ------------------------------------------------------------
add_executable(probe_runner_warp_signature_permutation
    src/main/probe_runner_warp_signature_permutation.cpp
)

target_include_directories(probe_runner_warp_signature_permutation
    PRIVATE
        ${PROBE_INCLUDE_DIRS}
)

target_link_libraries(probe_runner_warp_signature_permutation
    PRIVATE
        warp_signature_permutation_probe_lib
)

set_target_properties(probe_runner_warp_signature_permutation PROPERTIES
    RUNTIME_OUTPUT_DIRECTORY ${PROBE_RUNTIME_DIR}
)

# ------------------------------------------------------------
# mixed workload probe library
# ------------------------------------------------------------
add_library(mixed_workload_probe_lib
    src/probes/mixed_workload_probe/host.cpp
    src/probes/mixed_workload_probe/kernel.cu
)

target_include_directories(mixed_workload_probe_lib
    PUBLIC
        ${PROBE_INCLUDE_DIRS}
)

target_link_libraries(mixed_workload_probe_lib
    PUBLIC
        probe_common
        CUDA::cudart
)

set_target_properties(mixed_workload_probe_lib PROPERTIES
    CUDA_SEPARABLE_COMPILATION ON
    CUDA_RESOLVE_DEVICE_SYMBOLS ON
    ARCHIVE_OUTPUT_DIRECTORY ${PROBE_LIBRARY_DIR}
    LIBRARY_OUTPUT_DIRECTORY ${PROBE_LIBRARY_DIR}
)

# ------------------------------------------------------------
# mixed workload probe runner
# ------------------------------------------------------------
add_executable(probe_runner_mixed_workload
    src/main/probe_runner_mixed_workload.cpp
)

target_include_directories(probe_runner_mixed_workload
    PRIVATE
        ${PROBE_INCLUDE_DIRS}
)

target_link_libraries(probe_runner_mixed_workload
    PRIVATE
        mixed_workload_probe_lib
)

set_target_properties(probe_runner_mixed_workload PROPERTIES
    RUNTIME_OUTPUT_DIRECTORY ${PROBE_RUNTIME_DIR}
)

# ------------------------------------------------------------
# global memory contention amplification probe library
# ------------------------------------------------------------
add_library(global_memory_contention_amplification_probe_lib
    src/probes/global_memory_contention_amplification_probe/host.cpp
    src/probes/global_memory_contention_amplification_probe/kernel.cu
)

target_include_directories(global_memory_contention_amplification_probe_lib
    PUBLIC
        ${PROBE_INCLUDE_DIRS}
)

target_link_libraries(global_memory_contention_amplification_probe_lib
    PUBLIC
        probe_common
        CUDA::cudart
)

set_target_properties(global_memory_contention_amplification_probe_lib PROPERTIES
    CUDA_SEPARABLE_COMPILATION ON
    CUDA_RESOLVE_DEVICE_SYMBOLS ON
    ARCHIVE_OUTPUT_DIRECTORY ${PROBE_LIBRARY_DIR}
    LIBRARY_OUTPUT_DIRECTORY ${PROBE_LIBRARY_DIR}
)

# ------------------------------------------------------------
# global memory contention amplification probe runner
# ------------------------------------------------------------
add_executable(probe_runner_global_memory_contention_amplification
    src/main/probe_runner_global_memory_contention_amplification.cpp
)

target_include_directories(probe_runner_global_memory_contention_amplification
    PRIVATE
        ${PROBE_INCLUDE_DIRS}
)

target_link_libraries(probe_runner_global_memory_contention_amplification
    PRIVATE
        global_memory_contention_amplification_probe_lib
)

set_target_properties(probe_runner_global_memory_contention_amplification PROPERTIES
    RUNTIME_OUTPUT_DIRECTORY ${PROBE_RUNTIME_DIR}
)

# ------------------------------------------------------------
# latency hiding ratio probe library
# ------------------------------------------------------------
add_library(latency_hiding_ratio_probe_lib
    src/probes/latency_hiding_ratio_probe/host.cpp
    src/probes/latency_hiding_ratio_probe/kernel.cu
)

target_include_directories(latency_hiding_ratio_probe_lib
    PUBLIC
        ${PROBE_INCLUDE_DIRS}
)

target_link_libraries(latency_hiding_ratio_probe_lib
    PUBLIC
        probe_common
        CUDA::cudart
)

set_target_properties(latency_hiding_ratio_probe_lib PROPERTIES
    CUDA_SEPARABLE_COMPILATION ON
    CUDA_RESOLVE_DEVICE_SYMBOLS ON
    ARCHIVE_OUTPUT_DIRECTORY ${PROBE_LIBRARY_DIR}
    LIBRARY_OUTPUT_DIRECTORY ${PROBE_LIBRARY_DIR}
)

# ------------------------------------------------------------
# latency hiding ratio probe runner
# ------------------------------------------------------------
add_executable(probe_runner_latency_hiding_ratio
    src/main/probe_runner_latency_hiding_ratio.cpp
)

target_include_directories(probe_runner_latency_hiding_ratio
    PRIVATE
        ${PROBE_INCLUDE_DIRS}
)

target_link_libraries(probe_runner_latency_hiding_ratio
    PRIVATE
        latency_hiding_ratio_probe_lib
)

set_target_properties(probe_runner_latency_hiding_ratio PROPERTIES
    RUNTIME_OUTPUT_DIRECTORY ${PROBE_RUNTIME_DIR}
)

# ------------------------------------------------------------
# latency hiding warmup stability probe library
# ------------------------------------------------------------
add_library(latency_hiding_warmup_stability_probe_lib
    src/probes/latency_hiding_warmup_stability_probe/host.cpp
    src/probes/latency_hiding_warmup_stability_probe/kernel.cu
)

target_include_directories(latency_hiding_warmup_stability_probe_lib
    PUBLIC
        ${PROBE_INCLUDE_DIRS}
)

target_link_libraries(latency_hiding_warmup_stability_probe_lib
    PUBLIC
        probe_common
        CUDA::cudart
)

set_target_properties(latency_hiding_warmup_stability_probe_lib PROPERTIES
    CUDA_SEPARABLE_COMPILATION ON
    CUDA_RESOLVE_DEVICE_SYMBOLS ON
    ARCHIVE_OUTPUT_DIRECTORY ${PROBE_LIBRARY_DIR}
    LIBRARY_OUTPUT_DIRECTORY ${PROBE_LIBRARY_DIR}
)

# ------------------------------------------------------------
# latency hiding warmup stability probe runner
# ------------------------------------------------------------
add_executable(probe_runner_latency_hiding_warmup_stability
    src/main/probe_runner_latency_hiding_warmup_stability.cpp
)

target_include_directories(probe_runner_latency_hiding_warmup_stability
    PRIVATE
        ${PROBE_INCLUDE_DIRS}
)

target_link_libraries(probe_runner_latency_hiding_warmup_stability
    PRIVATE
        latency_hiding_warmup_stability_probe_lib
)

set_target_properties(probe_runner_latency_hiding_warmup_stability PROPERTIES
    RUNTIME_OUTPUT_DIRECTORY ${PROBE_RUNTIME_DIR}
)

# ------------------------------------------------------------
# ready warp supply probe library
# ------------------------------------------------------------
add_library(ready_warp_supply_probe_lib
    src/probes/ready_warp_supply_probe/host.cpp
    src/probes/ready_warp_supply_probe/kernel.cu
)

target_include_directories(ready_warp_supply_probe_lib
    PUBLIC
        ${PROBE_INCLUDE_DIRS}
)

target_link_libraries(ready_warp_supply_probe_lib
    PUBLIC
        probe_common
        CUDA::cudart
)

set_target_properties(ready_warp_supply_probe_lib PROPERTIES
    CUDA_SEPARABLE_COMPILATION ON
    CUDA_RESOLVE_DEVICE_SYMBOLS ON
    ARCHIVE_OUTPUT_DIRECTORY ${PROBE_LIBRARY_DIR}
    LIBRARY_OUTPUT_DIRECTORY ${PROBE_LIBRARY_DIR}
)

# ------------------------------------------------------------
# ready warp supply probe runner
# ------------------------------------------------------------
add_executable(probe_runner_ready_warp_supply
    src/main/probe_runner_ready_warp_supply.cpp
)

target_include_directories(probe_runner_ready_warp_supply
    PRIVATE
        ${PROBE_INCLUDE_DIRS}
)

target_link_libraries(probe_runner_ready_warp_supply
    PRIVATE
        ready_warp_supply_probe_lib
)

set_target_properties(probe_runner_ready_warp_supply PROPERTIES
    RUNTIME_OUTPUT_DIRECTORY ${PROBE_RUNTIME_DIR}
)

# ------------------------------------------------------------
# shared memory ready interference probe library
# ------------------------------------------------------------
add_library(shared_memory_ready_interference_probe_lib
    src/probes/shared_memory_ready_interference_probe/host.cpp
    src/probes/shared_memory_ready_interference_probe/kernel.cu
)

target_include_directories(shared_memory_ready_interference_probe_lib
    PUBLIC
        ${PROBE_INCLUDE_DIRS}
)

target_link_libraries(shared_memory_ready_interference_probe_lib
    PUBLIC
        probe_common
        CUDA::cudart
)

set_target_properties(shared_memory_ready_interference_probe_lib PROPERTIES
    CUDA_SEPARABLE_COMPILATION ON
    CUDA_RESOLVE_DEVICE_SYMBOLS ON
    ARCHIVE_OUTPUT_DIRECTORY ${PROBE_LIBRARY_DIR}
    LIBRARY_OUTPUT_DIRECTORY ${PROBE_LIBRARY_DIR}
)

# ------------------------------------------------------------
# shared memory ready interference probe runner
# ------------------------------------------------------------
add_executable(probe_runner_shared_memory_ready_interference
    src/main/probe_runner_shared_memory_ready_interference.cpp
)

target_include_directories(probe_runner_shared_memory_ready_interference
    PRIVATE
        ${PROBE_INCLUDE_DIRS}
)

target_link_libraries(probe_runner_shared_memory_ready_interference
    PRIVATE
        shared_memory_ready_interference_probe_lib
)

set_target_properties(probe_runner_shared_memory_ready_interference PROPERTIES
    RUNTIME_OUTPUT_DIRECTORY ${PROBE_RUNTIME_DIR}
)

# ------------------------------------------------------------
# composition transient probe library
# ------------------------------------------------------------
add_library(composition_transient_probe_lib
    src/probes/composition_transient_probe/host.cpp
    src/probes/composition_transient_probe/kernel.cu
)

target_include_directories(composition_transient_probe_lib
    PUBLIC
        ${PROBE_INCLUDE_DIRS}
)

target_link_libraries(composition_transient_probe_lib
    PUBLIC
        probe_common
        CUDA::cudart
)

set_target_properties(composition_transient_probe_lib PROPERTIES
    CUDA_SEPARABLE_COMPILATION ON
    CUDA_RESOLVE_DEVICE_SYMBOLS ON
    ARCHIVE_OUTPUT_DIRECTORY ${PROBE_LIBRARY_DIR}
    LIBRARY_OUTPUT_DIRECTORY ${PROBE_LIBRARY_DIR}
)

# ------------------------------------------------------------
# composition transient probe runner
# ------------------------------------------------------------
add_executable(probe_runner_composition_transient
    src/main/probe_runner_composition_transient.cpp
)

target_include_directories(probe_runner_composition_transient
    PRIVATE
        ${PROBE_INCLUDE_DIRS}
)

target_link_libraries(probe_runner_composition_transient
    PRIVATE
        composition_transient_probe_lib
)

set_target_properties(probe_runner_composition_transient PROPERTIES
    RUNTIME_OUTPUT_DIRECTORY ${PROBE_RUNTIME_DIR}
)

# ------------------------------------------------------------
# composition phase repeatability probe library
# ------------------------------------------------------------
add_library(composition_phase_repeatability_probe_lib
    src/probes/composition_phase_repeatability_probe/host.cpp
    src/probes/composition_phase_repeatability_probe/kernel.cu
)

target_include_directories(composition_phase_repeatability_probe_lib
    PUBLIC
        ${PROBE_INCLUDE_DIRS}
)

target_link_libraries(composition_phase_repeatability_probe_lib
    PUBLIC
        probe_common
        CUDA::cudart
)

set_target_properties(composition_phase_repeatability_probe_lib PROPERTIES
    CUDA_SEPARABLE_COMPILATION ON
    CUDA_RESOLVE_DEVICE_SYMBOLS ON
    ARCHIVE_OUTPUT_DIRECTORY ${PROBE_LIBRARY_DIR}
    LIBRARY_OUTPUT_DIRECTORY ${PROBE_LIBRARY_DIR}
)

# ------------------------------------------------------------
# composition phase repeatability probe runner
# ------------------------------------------------------------
add_executable(probe_runner_composition_phase_repeatability
    src/main/probe_runner_composition_phase_repeatability.cpp
)

target_include_directories(probe_runner_composition_phase_repeatability
    PRIVATE
        ${PROBE_INCLUDE_DIRS}
)

target_link_libraries(probe_runner_composition_phase_repeatability
    PRIVATE
        composition_phase_repeatability_probe_lib
)

set_target_properties(probe_runner_composition_phase_repeatability PROPERTIES
    RUNTIME_OUTPUT_DIRECTORY ${PROBE_RUNTIME_DIR}
)

# ------------------------------------------------------------
# scheduler phase probe library
# ------------------------------------------------------------
add_library(scheduler_phase_probe_lib
    src/probes/scheduler_phase_probe/host.cpp
    src/probes/scheduler_phase_probe/kernel.cu
)

target_include_directories(scheduler_phase_probe_lib
    PUBLIC
        ${PROBE_INCLUDE_DIRS}
)

target_link_libraries(scheduler_phase_probe_lib
    PUBLIC
        probe_common
        CUDA::cudart
)

set_target_properties(scheduler_phase_probe_lib PROPERTIES
    CUDA_SEPARABLE_COMPILATION ON
    CUDA_RESOLVE_DEVICE_SYMBOLS ON
    ARCHIVE_OUTPUT_DIRECTORY ${PROBE_LIBRARY_DIR}
    LIBRARY_OUTPUT_DIRECTORY ${PROBE_LIBRARY_DIR}
)

# ------------------------------------------------------------
# scheduler phase probe runner
# ------------------------------------------------------------
add_executable(probe_runner_scheduler_phase
    src/main/probe_runner_scheduler_phase.cpp
)

target_include_directories(probe_runner_scheduler_phase
    PRIVATE
        ${PROBE_INCLUDE_DIRS}
)

target_link_libraries(probe_runner_scheduler_phase
    PRIVATE
        scheduler_phase_probe_lib
)

set_target_properties(probe_runner_scheduler_phase PROPERTIES
    RUNTIME_OUTPUT_DIRECTORY ${PROBE_RUNTIME_DIR}
)
# ------------------------------------------------------------
# normalized window probe library
# ------------------------------------------------------------
add_library(normalized_window_probe_lib
    src/probes/normalized_window_probe/host.cpp
    src/probes/normalized_window_probe/kernel.cu
)

target_include_directories(normalized_window_probe_lib
    PUBLIC
        ${PROBE_INCLUDE_DIRS}
)

target_link_libraries(normalized_window_probe_lib
    PUBLIC
        probe_common
        CUDA::cudart
)

set_target_properties(normalized_window_probe_lib PROPERTIES
    CUDA_SEPARABLE_COMPILATION ON
    CUDA_RESOLVE_DEVICE_SYMBOLS ON
    ARCHIVE_OUTPUT_DIRECTORY ${PROBE_LIBRARY_DIR}
    LIBRARY_OUTPUT_DIRECTORY ${PROBE_LIBRARY_DIR}
)

# ------------------------------------------------------------
# normalized window probe runner
# ------------------------------------------------------------
add_executable(probe_runner_normalized_window
    src/main/probe_runner_normalized_window.cpp
)

target_include_directories(probe_runner_normalized_window
    PRIVATE
        ${PROBE_INCLUDE_DIRS}
)

target_link_libraries(probe_runner_normalized_window
    PRIVATE
        normalized_window_probe_lib
)

set_target_properties(probe_runner_normalized_window PROPERTIES
    RUNTIME_OUTPUT_DIRECTORY ${PROBE_RUNTIME_DIR}
)

# ------------------------------------------------------------
# launch perturbation probe library
# ------------------------------------------------------------
add_library(launch_perturbation_probe_lib
    src/probes/launch_perturbation_probe/host.cpp
    src/probes/launch_perturbation_probe/kernel.cu
)

target_include_directories(launch_perturbation_probe_lib
    PUBLIC
        ${PROBE_INCLUDE_DIRS}
)

target_link_libraries(launch_perturbation_probe_lib
    PUBLIC
        probe_common
        CUDA::cudart
)

set_target_properties(launch_perturbation_probe_lib PROPERTIES
    CUDA_SEPARABLE_COMPILATION ON
    CUDA_RESOLVE_DEVICE_SYMBOLS ON
    ARCHIVE_OUTPUT_DIRECTORY ${PROBE_LIBRARY_DIR}
    LIBRARY_OUTPUT_DIRECTORY ${PROBE_LIBRARY_DIR}
)

# ------------------------------------------------------------
# launch perturbation probe runner
# ------------------------------------------------------------
add_executable(probe_runner_launch_perturbation
    src/main/probe_runner_launch_perturbation.cpp
)

target_include_directories(probe_runner_launch_perturbation
    PRIVATE
        ${PROBE_INCLUDE_DIRS}
)

target_link_libraries(probe_runner_launch_perturbation
    PRIVATE
        launch_perturbation_probe_lib
)

set_target_properties(probe_runner_launch_perturbation PROPERTIES
    RUNTIME_OUTPUT_DIRECTORY ${PROBE_RUNTIME_DIR}
)