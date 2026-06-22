$baseline = Get-Content hardening/baselines/current.json | ConvertFrom-Json
$current = Get-Content docs/audits/latest/findings.json | ConvertFrom-Json
$diff = Compare-Object $baseline $current -Property id,severity
$diff | ConvertTo-Json | Out-File docs/audits/latest/diff.json