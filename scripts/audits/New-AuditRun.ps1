param([string]$RepoRoot='.', [string]$RunId='', [string]$Prefix='')
. "$PSScriptRoot/powershell/AuditRunner.Common.ps1"
$script = Join-Path $PSScriptRoot 'run_audit_cycle.py'
$args = @('init', '--repo-root', $RepoRoot)
if ($RunId) { $args += @('--run-id', $RunId) }
if ($Prefix) { $args += @('--prefix', $Prefix) }
Invoke-AuditPython -Script $script -Arguments $args
