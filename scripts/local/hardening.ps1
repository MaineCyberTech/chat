
param([string]$command)

switch ($command) {
  "run" { pwsh ./scripts/orchestrator/run_all.ps1 }
  "audit" { pwsh ./scripts/orchestrator/run_audit.ps1 }
  "fix" { pwsh ./scripts/orchestrator/run_fix.ps1 }
  "reconcile" { pwsh ./scripts/orchestrator/run_reconcile.ps1 }
  "features" { pwsh ./scripts/orchestrator/run_features.ps1 }
  "release" { pwsh ./scripts/orchestrator/run_release.ps1 }
  default { Write-Host "Usage: hardening [run|audit|fix|reconcile|features|release]" }
}
