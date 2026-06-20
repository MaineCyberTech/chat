# Local development setup script
# Usage: .\scripts\setup-dev.ps1

$ErrorActionPreference = "Stop"
Write-Host "=== Chat Platform - Local Dev Setup ===" -ForegroundColor Cyan

# 1. Create .env.local if missing
if (-not (Test-Path .env.local)) {
    Copy-Item .env.local.example .env.local
    Write-Host "Created .env.local from example" -ForegroundColor Green
}

# 2. Install dependencies
Write-Host "`n=== Installing dependencies ===" -ForegroundColor Cyan
pnpm install

# 3. Build packages
Write-Host "`n=== Building packages ===" -ForegroundColor Cyan
pnpm build

# 4. Start local Supabase
Write-Host "`n=== Starting local Supabase ===" -ForegroundColor Cyan
$status = npx supabase status 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "Supabase already running" -ForegroundColor Green
} else {
    npx supabase start
}

# 5. Get keys from Supabase status
Write-Host "`n=== Configuring environment ===" -ForegroundColor Cyan
$statusJson = npx supabase status -o json 2>$null | ConvertFrom-Json
if ($statusJson) {
    $anonKey = $statusJson.anon_key
    $serviceKey = $statusJson.service_role_key
    $url = "http://127.0.0.1:54321"

    if ($anonKey) {
        (Get-Content .env.local) -replace 'SUPABASE_ANON_KEY=.*', "SUPABASE_ANON_KEY=$anonKey" | Set-Content .env.local
        (Get-Content .env.local) -replace 'SUPABASE_SERVICE_ROLE_KEY=.*', "SUPABASE_SERVICE_ROLE_KEY=$serviceKey" | Set-Content .env.local
        (Get-Content .env.local) -replace 'SUPABASE_URL=.*', "SUPABASE_URL=$url" | Set-Content .env.local
        (Get-Content .env.local) -replace 'NEXT_PUBLIC_SUPABASE_URL=.*', "NEXT_PUBLIC_SUPABASE_URL=$url" | Set-Content .env.local
        (Get-Content .env.local) -replace 'NEXT_PUBLIC_SUPABASE_ANON_KEY=.*', "NEXT_PUBLIC_SUPABASE_ANON_KEY=$anonKey" | Set-Content .env.local
    }
}

# 6. Run SQL migrations
Write-Host "`n=== Running SQL migrations ===" -ForegroundColor Cyan
Get-ChildItem packages/db/sql/migrations/*.sql, packages/db/sql/functions/*.sql, packages/db/sql/policies/*.sql | ForEach-Object {
    Write-Host "  Running $($_.Name)..."
    npx supabase db execute --file $_.FullName 2>$null
}

Write-Host "`n=== Setup complete! ===" -ForegroundColor Green
Write-Host "  Frontend:  http://localhost:3000"
Write-Host "  API:       http://localhost:4000"
Write-Host "  Supabase:  http://localhost:54323"
Write-Host "  Inbucket:  http://localhost:54324 (view emails)"
Write-Host ""
Write-Host "Run 'pnpm dev' to start the application."
