$policies = Get-Content hardening/policies/governance.json | ConvertFrom-Json
if(-not $policies.block_on){ exit 1 }
