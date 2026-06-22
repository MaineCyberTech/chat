param([Parameter(Mandatory=$true)][string]$RunId,[Parameter(Mandatory=$true)][ValidateSet('reconciliation','principal_audit','quality_confirmation','frontend_release_gate')][string]$Stage,[string]$RepoRoot='.',[string]$ReportFile='',[string]$SummaryFile='')
. "$PSScriptRoot/powershell/AuditRunner.Common.ps1"
$script = Join-Path $PSScriptRoot 'parse_markdown_report.py'
$args = @('--repo-root', $RepoRoot, '--run-id', $RunId, '--stage', $Stage)
if ($ReportFile) { $args += @('--report-file', $ReportFile) }
if ($SummaryFile) { $args += @('--summary-file', $SummaryFile) }
Invoke-AuditPython -Script $script -Arguments $args
