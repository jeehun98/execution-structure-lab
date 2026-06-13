param(
    [switch]$Clean,
    [string]$Arch = "86"
)

$ErrorActionPreference = "Stop"

function Invoke-Checked {
    param(
        [string]$Exe,
        [string[]]$ArgumentList
    )

    Write-Host "[build.ps1] Running: $Exe $($ArgumentList -join ' ')"

    & $Exe @ArgumentList

    if ($LASTEXITCODE -ne 0) {
        throw "$Exe failed with exit code $LASTEXITCODE"
    }
}

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$root = $root.Path

$buildDir = Join-Path $root "build"
$cacheFile = Join-Path $buildDir "CMakeCache.txt"

$currentSource = $root.Replace('\', '/').ToLowerInvariant()

if ($Clean -and (Test-Path $buildDir)) {
    Write-Host "[build.ps1] Cleaning build directory..."
    Remove-Item -Recurse -Force $buildDir
}

if ((Test-Path $cacheFile) -and (Test-Path $buildDir)) {
    $cacheSourceLine = Select-String `
        -Path $cacheFile `
        -Pattern "^CMAKE_HOME_DIRECTORY:INTERNAL=" `
        -ErrorAction SilentlyContinue

    if ($cacheSourceLine) {
        $cachedSource = $cacheSourceLine.Line -replace "^CMAKE_HOME_DIRECTORY:INTERNAL=", ""
        $cachedSource = $cachedSource.Replace('\', '/').ToLowerInvariant()

        if ($cachedSource -ne $currentSource) {
            Write-Host "[build.ps1] CMake cache source path mismatch."
            Write-Host "[build.ps1] Cached : $cachedSource"
            Write-Host "[build.ps1] Current: $currentSource"
            Write-Host "[build.ps1] Removing old build directory..."

            Remove-Item -Recurse -Force $buildDir
        }
    }
}

Write-Host "[build.ps1] Source : $root"
Write-Host "[build.ps1] Build  : $buildDir"
Write-Host "[build.ps1] CUDA arch: $Arch"

$configArgs = @(
    "-S", $root,
    "-B", $buildDir,
    "-G", "Ninja",
    "-DCMAKE_BUILD_TYPE=Release",
    "-DCMAKE_CUDA_ARCHITECTURES=$($Arch)"
)

Invoke-Checked -Exe "cmake" -ArgumentList $configArgs

$buildArgs = @(
    "--build", $buildDir,
    "--config", "Release"
)

Invoke-Checked -Exe "cmake" -ArgumentList $buildArgs