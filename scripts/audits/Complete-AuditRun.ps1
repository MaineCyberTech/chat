param([Parameter(Mandatory=$true)][string]$RunId,[string]$RepoRoot='.')
. "$PSScriptRoot/powershell/AuditRunner.Common.ps1"
$script = Join-Path $PSScriptRoot 'run_audit_cycle.py'
Invoke-AuditPython -Script $script -Arguments @('finalize', '--repo-root', $RepoRoot, '--run-id', $RunId)
