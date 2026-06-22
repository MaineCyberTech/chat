$enf = Get-Content docs/audits/latest/enforcement.json | ConvertFrom-Json
"# Dashboard`nFail: $($enf.fail)" | Out-File docs/dashboard/index.md