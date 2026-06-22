param([string]$RepoRoot='.',[string]$OutFile='docs/audits/dashboard/pr_comment_preview.md')
. "$PSScriptRoot/powershell/AuditRunner.Common.ps1"
$script = Join-Path $PSScriptRoot 'generate_pr_comment.py'
Invoke-AuditPython -Script $script -Arguments @('--repo-root', $RepoRoot, '--out', $OutFile)
