$enf = Get-Content docs/audits/latest/enforcement.json | ConvertFrom-Json
$time = Get-Date
"# Dashboard`nTime: $time`nFail: $($enf.fail)" | Out-File docs/dashboard/index.md