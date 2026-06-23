#!/usr/bin/env bash
# Local development setup script
# Usage: bash scripts/setup-dev.sh
set -e

echo "=== Chat Platform — Local Dev Setup ==="

# 1. Check prerequisites
command -v node >/dev/null 2>&1 || { echo "Node.js is required. Install from https://nodejs.org"; exit 1; }
command -v pnpm >/dev/null 2>&1 || { echo "pnpm is required. Run: npm install -g pnpm@9"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "Docker is required for local Supabase. Install Docker Desktop"; exit 1; }

# 2. Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
  cp .env.local.example .env.local
fi

# 3. Install dependencies
echo "=== Installing dependencies ==="
pnpm install

# 4. Build packages (needed for workspace links)
echo "=== Building packages ==="
pnpm build

# 5. Start local Supabase
echo "=== Starting local Supabase ==="
if npx supabase status >/dev/null 2>&1; then
  echo "Supabase already running"
else
  npx supabase start
fi

# 6. Get keys from Supabase and update .env.local
echo "=== Configuring environment ==="
ANON_KEY=$(npx supabase status -o json 2>/dev/null | grep -o '"anon_key":"[^"]*"' | cut -d'"' -f4 || echo "")
SERVICE_KEY=$(npx supabase status -o json 2>/dev/null | grep -o '"service_role_key":"[^"]*"' | cut -d'"' -f4 || echo "")
SUPABASE_URL="http://127.0.0.1:54321"

if [ -n "$ANON_KEY" ]; then
  # Update .env.local with local Supabase keys (always update, not just on first run)
  if [[ "$(uname -s)" == "Darwin" ]]; then
    sed -i '' "s|SUPABASE_ANON_KEY=.*|SUPABASE_ANON_KEY=$ANON_KEY|" .env.local
    sed -i '' "s|SUPABASE_SERVICE_ROLE_KEY=.*|SUPABASE_SERVICE_ROLE_KEY=$SERVICE_KEY|" .env.local
    sed -i '' "s|SUPABASE_URL=.*|SUPABASE_URL=$SUPABASE_URL|" .env.local
    sed -i '' "s|NEXT_PUBLIC_SUPABASE_URL=.*|NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL|" .env.local
    sed -i '' "s|NEXT_PUBLIC_SUPABASE_ANON_KEY=.*|NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY|" .env.local
  else
    sed -i "s|SUPABASE_ANON_KEY=.*|SUPABASE_ANON_KEY=$ANON_KEY|" .env.local
    sed -i "s|SUPABASE_SERVICE_ROLE_KEY=.*|SUPABASE_SERVICE_ROLE_KEY=$SERVICE_KEY|" .env.local
    sed -i "s|SUPABASE_URL=.*|SUPABASE_URL=$SUPABASE_URL|" .env.local
    sed -i "s|NEXT_PUBLIC_SUPABASE_URL=.*|NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL|" .env.local
    sed -i "s|NEXT_PUBLIC_SUPABASE_ANON_KEY=.*|NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY|" .env.local
  fi
fi

# 7. Run SQL migrations
echo "=== Running SQL migrations ==="
for f in packages/db/sql/migrations/*.sql packages/db/sql/functions/*.sql packages/db/sql/policies/*.sql; do
  [ -f "$f" ] && echo "  Running $(basename $f)..." && npx supabase db execute --file "$f" 2>/dev/null || true
done

echo ""
echo "=== Setup complete! ==="
echo "  Frontend:  http://localhost:3000"
echo "  API:       http://localhost:4000"
echo "  Supabase:  http://localhost:54323"
echo "  Inbucket:  http://localhost:54324 (view emails)"
echo ""
echo "Run 'pnpm dev' to start the application."
