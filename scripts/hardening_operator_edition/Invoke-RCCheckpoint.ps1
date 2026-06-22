param([string]$RepoRoot='.',[string]$PolicyFile='docs/hardening_super_bundle/policies/gate-policy.rc.json')
. "$PSScriptRoot/powershell/HardeningOperator.Common.ps1"
Invoke-HardeningOperatorPython -Script (Join-Path $PSScriptRoot '../audits/evaluate_gate.py') -Arguments @('--repo-root',$RepoRoot,'--policy-file',$PolicyFile,'--out','docs/hardening_super_bundle/examples/results/generated_rc_gate_result.md')
