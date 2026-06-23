
Write-Host '=== FULL PIPELINE ==='
pwsh ./scripts/orchestrator/run_audit.ps1
pwsh ./scripts/orchestrator/run_fix.ps1
pwsh ./scripts/orchestrator/run_reconcile.ps1
pwsh ./scripts/orchestrator/run_features.ps1
pwsh ./scripts/orchestrator/run_release.ps1
