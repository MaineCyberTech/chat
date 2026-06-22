function Invoke-AuditPython {
    param([Parameter(Mandatory=$true)][string]$Script,[string[]]$Arguments)
    $allArgs = @($Script) + $Arguments
    & python @allArgs
    if ($LASTEXITCODE -ne 0) { throw "Python audit command failed: $Script $($Arguments -join ' ')" }
}
