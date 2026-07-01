# Full pipeline runner: audits findings from latest_run.json, enforces gates, generates artifacts
# Usage: pwsh ./scripts/automation/run_full.ps1

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $RepoRoot

Write-Host "=== Full Hardening Pipeline ===" -ForegroundColor Cyan

# Step 1: Check if latest_run.json exists
$latestRun = "docs/audits/latest_run.json"
if (-not (Test-Path $latestRun)) {
    Write-Host "WARN: No latest_run.json found. Run 'scripts/audits/run_audit_cycle.py init' first." -ForegroundColor Yellow
    exit 0
}

# Step 2: Generate a run ID and run the hardening pipeline
$runId = "auto_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
Write-Host "Running hardening pipeline (run: $runId)..." -ForegroundColor Green

python scripts/hardening_runner/run_hardening_pipeline.py init --repo-root . --run-id $runId
python scripts/hardening_runner/run_hardening_pipeline.py execute --repo-root . --run-id $runId
python scripts/hardening_runner/run_hardening_pipeline.py finalize --repo-root . --run-id $runId
python scripts/hardening_runner/generate_executive_stakeholder_pack.py --repo-root . --run-id $runId

# Step 3: Evaluate gate
Write-Host "`n=== Gate Evaluation ===" -ForegroundColor Cyan
python scripts/audits/evaluate_gate.py --repo-root . --policy-file docs/hardening_super_bundle/policies/gate-policy.dev.json
if ($LASTEXITCODE -ne 0) {
    Write-Host "GATE FAILED: Blocking issues found" -ForegroundColor Red
    exit $LASTEXITCODE
}

# Step 4: Generate dashboard and badges
Write-Host "`n=== Dashboard and Badges ===" -ForegroundColor Cyan
python scripts/audits/generate_dashboard.py --repo-root . 2>$null
python scripts/audits/generate_badges.py --repo-root . 2>$null

Write-Host "`n=== Pipeline Complete ===" -ForegroundColor Green
