param([string]$RepoRoot='.',[string]$PolicyFile='docs/hardening_super_bundle/policies/gate-policy.dev.json')
. "$PSScriptRoot/powershell/AuditRunner.Common.ps1"
Invoke-AuditPython -Script (Join-Path $PSScriptRoot 'evaluate_gate.py') -Arguments @('--repo-root',$RepoRoot,'--policy-file',$PolicyFile)
