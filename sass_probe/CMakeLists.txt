cmake_minimum_required(VERSION 3.24)
project(sass_probe LANGUAGES CXX CUDA)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CUDA_STANDARD 17)

set(CMAKE_CUDA_ARCHITECTURES 86)

set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/bin)

function(add_probe name src)
    add_executable(${name} ${src})
    set_target_properties(${name} PROPERTIES
        CUDA_SEPARABLE_COMPILATION OFF
        CUDA_RESOLVE_DEVICE_SYMBOLS OFF
    )

    target_compile_options(${name} PRIVATE
        $<$<COMPILE_LANGUAGE:CUDA>:
            --use_fast_math
            -lineinfo
            -Xptxas=-v
            -Xptxas=-O3
        >
    )
endfunction()

add_probe(ldg_basic kernels/00_memory/ldg_basic.cu)
add_probe(stg_basic kernels/00_memory/stg_basic.cu)
add_probe(copy_global kernels/00_memory/copy_global.cu)

add_probe(add_f32 kernels/01_arithmetic/add_f32.cu)
add_probe(mul_f32 kernels/01_arithmetic/mul_f32.cu)
add_probe(fma_f32 kernels/01_arithmetic/fma_f32.cu)