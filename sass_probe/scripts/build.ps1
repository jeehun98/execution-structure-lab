param(
    [switch]$Clean,
    [string]$Arch = "86",
    [string]$BuildType = "Release",
    [string]$Target = ""
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

function Normalize-PathString {
    param([string]$Path)

    if ([string]::IsNullOrWhiteSpace($Path)) {
        return ""
    }

    return $Path.Replace('\', '/').Trim().ToLowerInvariant()
}

function Get-CMakeCacheValue {
    param(
        [string]$CacheFile,
        [string]$Key
    )

    if (!(Test-Path $CacheFile)) {
        return $null
    }

    $line = Select-String `
        -Path $CacheFile `
        -Pattern "^$([regex]::Escape($Key)):[^=]*=" `
        -ErrorAction SilentlyContinue |
        Select-Object -First 1

    if (!$line) {
        return $null
    }

    return ($line.Line -replace "^$([regex]::Escape($Key)):[^=]*=", "")
}

function Remove-BuildDir {
    param([string]$BuildDir)

    if (Test-Path $BuildDir) {
        Write-Host "[build.ps1] Removing build directory: $BuildDir"
        Remove-Item -Recurse -Force $BuildDir
    }
}

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$root = $root.Path

$buildDir = Join-Path $root "build"
$cacheFile = Join-Path $buildDir "CMakeCache.txt"

$currentSource = Normalize-PathString $root

$cmakeCmd = Get-Command cmake -ErrorAction Stop
$ninjaCmd = Get-Command ninja -ErrorAction SilentlyContinue

if (!$ninjaCmd) {
    throw "ninja was not found in PATH. Install it or add it to PATH. Example: pip install ninja"
}

$cmakePath = $cmakeCmd.Source
$ninjaPath = $ninjaCmd.Source

Write-Host "[build.ps1] Source    : $root"
Write-Host "[build.ps1] Build     : $buildDir"
Write-Host "[build.ps1] BuildType : $BuildType"
Write-Host "[build.ps1] CUDA arch : $Arch"
Write-Host "[build.ps1] CMake     : $cmakePath"
Write-Host "[build.ps1] Ninja     : $ninjaPath"

if ($Clean) {
    Write-Host "[build.ps1] Clean requested."
    Remove-BuildDir $buildDir
}

if (Test-Path $cacheFile) {
    $cachedSource = Get-CMakeCacheValue $cacheFile "CMAKE_HOME_DIRECTORY"
    $cachedSourceNorm = Normalize-PathString $cachedSource

    if ($cachedSourceNorm -and ($cachedSourceNorm -ne $currentSource)) {
        Write-Host "[build.ps1] CMake cache source path mismatch."
        Write-Host "[build.ps1] Cached : $cachedSource"
        Write-Host "[build.ps1] Current: $root"
        Remove-BuildDir $buildDir
    }
}

if (Test-Path $cacheFile) {
    $cachedBuildType = Get-CMakeCacheValue $cacheFile "CMAKE_BUILD_TYPE"

    if ($cachedBuildType -and ($cachedBuildType -ne $BuildType)) {
        Write-Host "[build.ps1] CMake build type mismatch."
        Write-Host "[build.ps1] Cached : $cachedBuildType"
        Write-Host "[build.ps1] Current: $BuildType"
        Remove-BuildDir $buildDir
    }
}

if (Test-Path $cacheFile) {
    $cachedNinja = Get-CMakeCacheValue $cacheFile "CMAKE_MAKE_PROGRAM"

    if ($cachedNinja -and !(Test-Path $cachedNinja)) {
        Write-Host "[build.ps1] Cached Ninja path does not exist."
        Write-Host "[build.ps1] Cached Ninja: $cachedNinja"
        Write-Host "[build.ps1] Current Ninja: $ninjaPath"
        Remove-BuildDir $buildDir
    }
}

if (Test-Path $cacheFile) {
    $cachedArch = Get-CMakeCacheValue $cacheFile "CMAKE_CUDA_ARCHITECTURES"

    if ($cachedArch -and ($cachedArch -ne $Arch)) {
        Write-Host "[build.ps1] CUDA architecture mismatch."
        Write-Host "[build.ps1] Cached : $cachedArch"
        Write-Host "[build.ps1] Current: $Arch"
        Remove-BuildDir $buildDir
    }
}

$configArgs = @(
    "-S", $root,
    "-B", $buildDir,
    "-G", "Ninja",
    "-DCMAKE_BUILD_TYPE=$BuildType",
    "-DCMAKE_CUDA_ARCHITECTURES=$Arch",
    "-DCMAKE_MAKE_PROGRAM=$ninjaPath"
)

Invoke-Checked -Exe "cmake" -ArgumentList $configArgs

$buildArgs = @(
    "--build", $buildDir,
    "--verbose"
)

if (![string]::IsNullOrWhiteSpace($Target)) {
    $buildArgs += @("--target", $Target)
}

Invoke-Checked -Exe "cmake" -ArgumentList $buildArgs