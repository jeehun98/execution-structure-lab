cmake_minimum_required(VERSION 3.24)

# Allow build.ps1 -Arch 75 / 86 / 89 etc. to override this.
# If not provided from command line, default to sm_86.
if(NOT DEFINED CMAKE_CUDA_ARCHITECTURES OR CMAKE_CUDA_ARCHITECTURES STREQUAL "")
    set(CMAKE_CUDA_ARCHITECTURES 86 CACHE STRING "CUDA architectures" FORCE)
endif()

project(sass_probe LANGUAGES CXX CUDA)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

set(CMAKE_CUDA_STANDARD 17)
set(CMAKE_CUDA_STANDARD_REQUIRED ON)

# Ninja is single-config, so set default build type if not provided.
if(NOT CMAKE_CONFIGURATION_TYPES AND NOT CMAKE_BUILD_TYPE)
    set(CMAKE_BUILD_TYPE Release CACHE STRING "Build type" FORCE)
endif()

set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/bin)

function(add_probe name src)
    set(options NO_FAST_MATH)
    set(oneValueArgs)
    set(multiValueArgs CUDA_OPTIONS)

    cmake_parse_arguments(PROBE
        "${options}"
        "${oneValueArgs}"
        "${multiValueArgs}"
        ${ARGN}
    )

    add_executable(${name} ${src})

    set_target_properties(${name} PROPERTIES
        RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/bin
        CUDA_SEPARABLE_COMPILATION OFF
        CUDA_RESOLVE_DEVICE_SYMBOLS OFF
    )

    target_compile_features(${name} PRIVATE
        cxx_std_17
        cuda_std_17
    )

    target_compile_options(${name} PRIVATE
        $<$<COMPILE_LANGUAGE:CUDA>:-O3>
        $<$<COMPILE_LANGUAGE:CUDA>:-lineinfo>
        $<$<COMPILE_LANGUAGE:CUDA>:-Xptxas=-v>
        $<$<COMPILE_LANGUAGE:CUDA>:-Xptxas=-O3>
    )

    if(NOT PROBE_NO_FAST_MATH)
        target_compile_options(${name} PRIVATE
            $<$<COMPILE_LANGUAGE:CUDA>:--use_fast_math>
        )
    endif()

    foreach(opt IN LISTS PROBE_CUDA_OPTIONS)
        target_compile_options(${name} PRIVATE
            $<$<COMPILE_LANGUAGE:CUDA>:${opt}>
        )
    endforeach()
endfunction()

# ------------------------------------------------------------------------------
# 00_memory
# ------------------------------------------------------------------------------

add_probe(ldg_basic
    kernels/00_memory/ldg_basic.cu
)

add_probe(stg_basic
    kernels/00_memory/stg_basic.cu
)

add_probe(copy_global
    kernels/00_memory/copy_global.cu
)

# ------------------------------------------------------------------------------
# 01_arithmetic
# ------------------------------------------------------------------------------

add_probe(add_f32
    kernels/01_arithmetic/add_f32.cu
)

add_probe(mul_f32
    kernels/01_arithmetic/mul_f32.cu
)

add_probe(fma_f32
    kernels/01_arithmetic/fma_f32.cu
)

# FMA contraction check.
# Do not use --use_fast_math here, because we want to isolate fmad contraction.
add_probe(fma_contract_f32
    kernels/01_arithmetic/fma_contract_f32.cu
    NO_FAST_MATH
)

add_probe(fma_contract_f32_no_fmad
    kernels/01_arithmetic/fma_contract_f32.cu
    NO_FAST_MATH
    CUDA_OPTIONS
        --fmad=false
)

# ------------------------------------------------------------------------------
# 02_control
# ------------------------------------------------------------------------------

add_probe(relu_f32
    kernels/02_control/relu_f32.cu
)

add_probe(clamp_f32
    kernels/02_control/clamp_f32.cu
)

# ------------------------------------------------------------------------------
# 03_reduction
# ------------------------------------------------------------------------------

add_probe(reduce_sum_f32
    kernels/03_reduction/reduce_sum_f32.cu
)

# ------------------------------------------------------------------------------
# 05_nn_ops
# ------------------------------------------------------------------------------

add_probe(softmax_small_f32
    kernels/05_nn_ops/softmax_small_f32.cu
)

add_probe(online_softmax_f32
    kernels/05_nn_ops/online_softmax_f32.cu
)