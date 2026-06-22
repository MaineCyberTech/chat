function Invoke-HardeningOperatorPython {
    param([Parameter(Mandatory=$true)][string]$Script,[string[]]$Arguments)
    $allArgs = @($Script) + $Arguments
    & python @allArgs
    if ($LASTEXITCODE -ne 0) { throw "Hardening operator command failed: $Script $($Arguments -join ' ')" }
}
