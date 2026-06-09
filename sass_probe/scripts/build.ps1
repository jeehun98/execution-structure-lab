$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$build = Join-Path $root "build"

cmake -S $root -B $build -G "Ninja" `
  -DCMAKE_BUILD_TYPE=Release `
  -DCMAKE_CUDA_ARCHITECTURES=86

cmake --build $build --config Release