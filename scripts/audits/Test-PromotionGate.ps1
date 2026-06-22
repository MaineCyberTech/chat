param([string]$RepoRoot='.',[string]$SourceBranch='',[Parameter(Mandatory=$true)][ValidateSet('development','production')][string]$TargetEnvironment,[string]$PolicyFile='docs/hardening_super_bundle/policies/gate-policy.prod.json')
. "$PSScriptRoot/powershell/AuditRunner.Common.ps1"
Invoke-AuditPython -Script (Join-Path $PSScriptRoot 'evaluate_promotion_gate.py') -Arguments @('--repo-root',$RepoRoot,'--source-branch',$SourceBranch,'--target-environment',$TargetEnvironment,'--policy-file',$PolicyFile)
