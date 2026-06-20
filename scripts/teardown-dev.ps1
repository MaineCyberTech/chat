# Local development teardown script
# Usage: .\scripts\teardown-dev.ps1

Write-Host "=== Chat Platform - Local Dev Teardown ===" -ForegroundColor Cyan

# Stop Supabase
Write-Host "`nStopping local Supabase..." -ForegroundColor Yellow
npx supabase stop 2>$null

# Clean build artifacts
Write-Host "Cleaning build artifacts..." -ForegroundColor Yellow
Remove-Item -Recurse -Force apps/api/dist, apps/web/.next, packages/db/dist, packages/ui/dist, .turbo -ErrorAction SilentlyContinue
Remove-Item *.tsbuildinfo -ErrorAction SilentlyContinue

Write-Host "`nTeardown complete. Local Supabase stopped, build artifacts cleaned." -ForegroundColor Green
