param([Parameter(Mandatory=$true)][string]$RunId,[string]$RepoRoot='.')
. "$PSScriptRoot/powershell/AuditRunner.Common.ps1"
$script = Join-Path $PSScriptRoot 'export_stakeholder_pack.py'
Invoke-AuditPython -Script $script -Arguments @('--repo-root', $RepoRoot, '--run-id', $RunId)
