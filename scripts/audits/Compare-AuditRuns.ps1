param([Parameter(Mandatory=$true)][string]$PreviousRunId,[Parameter(Mandatory=$true)][string]$CurrentRunId,[string]$RepoRoot='.')
. "$PSScriptRoot/powershell/AuditRunner.Common.ps1"
$script = Join-Path $PSScriptRoot 'diff_audit_runs.py'
Invoke-AuditPython -Script $script -Arguments @('--repo-root', $RepoRoot, '--previous-run-id', $PreviousRunId, '--current-run-id', $CurrentRunId)
