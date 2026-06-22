$diff = Get-Content docs/audits/latest/diff.json | ConvertFrom-Json
$fail=$false
foreach ($d in $diff){ if($d.severity -in @("P0","P1")){ $fail=$true }}
@{fail=$fail} | ConvertTo-Json | Out-File docs/audits/latest/enforcement.json
if($fail){exit 1}