param([string]$RepoRoot='.',[string]$RunId='')
Write-Host 'Step 1: Initialize audit run...'
& "$PSScriptRoot/New-AuditRun.ps1" -RepoRoot $RepoRoot -RunId $RunId
Write-Host 'Step 2: Run audit prompts and save reports under docs/audits/runs/<run_id>/reports/'
Write-Host 'Step 3: Parse stage reports with Update-AuditStage.ps1'
Write-Host 'Step 4: Finalize with Complete-AuditRun.ps1'
Write-Host 'Step 5: Optionally refresh dashboard, generate PR comment preview, and export stakeholder pack.'
