$enf = Get-Content docs/audits/latest/enforcement.json | ConvertFrom-Json
"# Platform Dashboard`nFail: $($enf.fail)" | Out-File docs/dashboard/index.md