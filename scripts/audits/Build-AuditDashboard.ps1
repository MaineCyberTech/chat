param([string]$RepoRoot='.')
. "$PSScriptRoot/powershell/AuditRunner.Common.ps1"
$script = Join-Path $PSScriptRoot 'generate_dashboard.py'
Invoke-AuditPython -Script $script -Arguments @('--repo-root', $RepoRoot)
