$pkgPath = Join-Path $PSScriptRoot "..\package.json"
$pkg = Get-Content $pkgPath -Raw | ConvertFrom-Json
$scripts = $pkg.scripts.PSObject.Properties

$categories = @{
  "Development" = @("dev", "build", "start")
  "Quality"     = @("lint", "typecheck", "test", "format", "format:check", "check", "test:unit", "test:integration", "test:e2e", "test:e2e:ui")
  "Database"    = @("supabase:start", "supabase:stop", "supabase:status")
  "Setup"       = @("bootstrap", "prepare")
  "CI/Deploy"   = @("ci")
  "Cleanup"     = @("clean")
}

$seen = @{}
Write-Host "Available scripts:" -ForegroundColor Cyan
Write-Host ""

foreach ($cat in $categories.Keys) {
  Write-Host "  $cat" -ForegroundColor Yellow
  foreach ($name in $categories[$cat]) {
    $cmd = $scripts | Where-Object { $_.Name -eq $name } | Select-Object -ExpandProperty Value
    if ($cmd) {
      Write-Host "    pnpm $name  ->  $cmd" -ForegroundColor Gray
      $seen[$name] = $true
    }
  }
  Write-Host ""
}

$uncategorized = $scripts | Where-Object { -not $seen.ContainsKey($_.Name) }
if ($uncategorized) {
  Write-Host "  Other" -ForegroundColor Yellow
  foreach ($s in $uncategorized) {
    Write-Host "    pnpm $($s.Name)  ->  $($s.Value)" -ForegroundColor Gray
  }
  Write-Host ""
}
