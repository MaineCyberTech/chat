$exceptions = Get-Content hardening/exceptions/exceptions.json | ConvertFrom-Json
foreach ($ex in $exceptions) {
 if ([datetime]$ex.expires -lt (Get-Date)) { exit 1 }
}