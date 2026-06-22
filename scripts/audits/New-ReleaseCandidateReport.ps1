param([Parameter(Mandatory=$true)][string]$RunId,[string]$RepoRoot='.')
. "$PSScriptRoot/powershell/AuditRunner.Common.ps1"
$script = Join-Path $PSScriptRoot 'generate_release_candidate_report.py'
Invoke-AuditPython -Script $script -Arguments @('--repo-root', $RepoRoot, '--run-id', $RunId)
