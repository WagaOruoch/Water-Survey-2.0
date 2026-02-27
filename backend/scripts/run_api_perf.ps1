param(
    [ValidateSet("smoke", "load")]
    [string]$Preset = "load",
    [int]$Runs = 20,
    [int]$Warmup = 3,
    [string]$Email = ""
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Split-Path -Parent $scriptDir
$pythonExe = Join-Path $backendDir "venv\Scripts\python.exe"

if (-not (Test-Path $pythonExe)) {
    throw "Python executable not found at $pythonExe. Create/activate backend venv first."
}

$reportsDir = Join-Path $backendDir "perf-reports"
if (-not (Test-Path $reportsDir)) {
    New-Item -ItemType Directory -Path $reportsDir | Out-Null
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$jsonPath = Join-Path $reportsDir "api-benchmark-$timestamp.json"
$csvPath = Join-Path $reportsDir "api-benchmark-$timestamp.csv"

Push-Location $backendDir
try {
    if ($Email.Trim().Length -gt 0) {
        & $pythonExe manage.py benchmark_apis --preset $Preset --runs $Runs --warmup $Warmup --output-json $jsonPath --output-csv $csvPath --email $Email
    } else {
        & $pythonExe manage.py benchmark_apis --preset $Preset --runs $Runs --warmup $Warmup --output-json $jsonPath --output-csv $csvPath
    }

    Write-Host ""
    Write-Host "Benchmark reports saved:" -ForegroundColor Green
    Write-Host "- $jsonPath"
    Write-Host "- $csvPath"
} finally {
    Pop-Location
}
