param([string]$RepoRoot='.',[string]$SourceBranch='',[string]$PolicyFile='docs/hardening_super_bundle/policies/gate-policy.prod.json')
. "$PSScriptRoot/powershell/HardeningOperator.Common.ps1"
Invoke-HardeningOperatorPython -Script (Join-Path $PSScriptRoot '../audits/evaluate_promotion_gate.py') -Arguments @('--repo-root',$RepoRoot,'--source-branch',$SourceBranch,'--target-environment','production','--policy-file',$PolicyFile,'--out','docs/hardening_super_bundle/examples/results/generated_prod_gate_result.md')
