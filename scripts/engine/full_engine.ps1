$findings = Get-Content docs/audits/latest/findings.json | ConvertFrom-Json
$fail=$false
foreach ($f in $findings){ if($f.severity -in @("P0","P1")){ $fail=$true }}
@{fail=$fail} | ConvertTo-Json | Out-File docs/audits/latest/enforcement.json
if($fail){ exit 1 }