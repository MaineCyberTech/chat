# Quick local stack restart (assumes setup-dev.ps1 has been run once)
# Usage: .\scripts\start-local-stack.ps1

$ErrorActionPreference = "Stop"
Write-Host "=== Starting Local Stack ===" -ForegroundColor Cyan

# 1. Start Supabase if not running
$status = npx supabase status 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Starting Supabase..." -ForegroundColor Yellow
    npx supabase start
} else {
    Write-Host "Supabase already running" -ForegroundColor Green
}

# 2. Sync environment keys from local Supabase
$statusJson = npx supabase status -o json 2>$null | ConvertFrom-Json
if ($statusJson) {
    $anonKey = $statusJson.anon_key
    $serviceKey = $statusJson.service_role_key
    $url = "http://127.0.0.1:54321"

    if ($anonKey) {
        if (Test-Path .env.local) {
            (Get-Content .env.local) -replace 'SUPABASE_ANON_KEY=.*', "SUPABASE_ANON_KEY=$anonKey" | Set-Content .env.local
            (Get-Content .env.local) -replace 'SUPABASE_SERVICE_ROLE_KEY=.*', "SUPABASE_SERVICE_ROLE_KEY=$serviceKey" | Set-Content .env.local
            (Get-Content .env.local) -replace 'SUPABASE_URL=.*', "SUPABASE_URL=$url" | Set-Content .env.local
            (Get-Content .env.local) -replace 'NEXT_PUBLIC_SUPABASE_URL=.*', "NEXT_PUBLIC_SUPABASE_URL=$url" | Set-Content .env.local
            (Get-Content .env.local) -replace 'NEXT_PUBLIC_SUPABASE_ANON_KEY=.*', "NEXT_PUBLIC_SUPABASE_ANON_KEY=$anonKey" | Set-Content .env.local
        }
    }
}

# 3. Load seed data if available
if (Test-Path supabase/seeds) {
    Write-Host "Loading seed data..." -ForegroundColor Cyan
    Get-ChildItem supabase/seeds/*.sql | Sort-Object Name | ForEach-Object {
        Write-Host "  Seeding $($_.Name)..."
        npx supabase db execute --file $_.FullName 2>$null
    }
    Write-Host "Seed data loaded" -ForegroundColor Green
}

Write-Host "`n=== Stack ready ===" -ForegroundColor Green
Write-Host "  Frontend:  http://localhost:3000"
Write-Host "  API:       http://localhost:4000"
Write-Host "  Supabase:  http://localhost:54323"
Write-Host "  Inbucket:  http://localhost:54324"
Write-Host ""
Write-Host "Run 'pnpm dev' to start the application."