# Hardening diff/validate/enforce pipeline
# Usage: pwsh ./scripts/automation/run_pipeline.ps1

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $RepoRoot

Write-Host "=== Hardening Pipeline ===" -ForegroundColor Cyan

# Step 1: Sync baseline
Write-Host "Step 1: Syncing baseline..." -ForegroundColor Green
python scripts/hardening/sync_baseline.py --repo-root .

# Step 2: Diff baseline vs exceptions
Write-Host "Step 2: Running diff..." -ForegroundColor Green
$diffResult = & ./scripts/hardening/diff.ps1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Diff found changes" -ForegroundColor Yellow
}

# Step 3: Validate exceptions
Write-Host "Step 3: Validating exceptions..." -ForegroundColor Green
& ./scripts/hardening/validate_exceptions.ps1
if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING: Expired exceptions found" -ForegroundColor Yellow
}

# Step 4: Enforce
Write-Host "Step 4: Enforcing gates..." -ForegroundColor Green
& ./scripts/hardening/enforce.ps1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ENFORCEMENT FAILED: P0/P1 findings detected" -ForegroundColor Red
    exit 1
}

Write-Host "=== Pipeline Complete (PASS) ===" -ForegroundColor Green
