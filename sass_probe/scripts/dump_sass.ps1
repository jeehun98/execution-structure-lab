$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$buildBin = Join-Path $root "build/bin"

$targets = @(
    @{ name = "ldg_basic";          group = "00_memory" },
    @{ name = "stg_basic";          group = "00_memory" },
    @{ name = "copy_global";        group = "00_memory" },

    @{ name = "add_f32";            group = "01_arithmetic" },
    @{ name = "mul_f32";            group = "01_arithmetic" },
    @{ name = "fma_f32";            group = "01_arithmetic" },

    @{ name = "relu_f32";           group = "02_control" },
    @{ name = "clamp_f32";          group = "02_control" },

    @{ name = "reduce_sum_f32";     group = "03_reduction" },

    @{ name = "softmax_small_f32";  group = "05_nn_ops" },
    @{ name = "online_softmax_f32"; group = "05_nn_ops" }

    @{ name = "flashattention_toy_f32"; group = "05_nn_ops" }
)
foreach ($t in $targets) {
    $name = $t.name
    $group = $t.group

    $exe = Join-Path $buildBin "$name.exe"

    $sassDir = Join-Path $root "sass/sm86/$group"
    $ptxDir  = Join-Path $root "ptx/sm86/$group"

    New-Item -ItemType Directory -Force -Path $sassDir | Out-Null
    New-Item -ItemType Directory -Force -Path $ptxDir | Out-Null

    if (!(Test-Path $exe)) {
        Write-Host "Missing executable: $exe"
        continue
    }

    Write-Host "Dumping $name"

    cuobjdump --dump-sass $exe > (Join-Path $sassDir "$name.sass")
    cuobjdump --dump-ptx  $exe > (Join-Path $ptxDir "$name.ptx")
}