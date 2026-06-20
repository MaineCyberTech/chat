#!/usr/bin/env bash
# Local development teardown script
# Usage: bash scripts/teardown-dev.sh
set -e

echo "=== Chat Platform — Local Dev Teardown ==="

echo "Stopping local Supabase..."
npx supabase stop 2>/dev/null || true

echo "Cleaning build artifacts..."
rm -rf apps/api/dist apps/web/.next packages/db/dist packages/ui/dist .turbo
rm -f *.tsbuildinfo

echo ""
echo "Teardown complete. Local Supabase stopped, build artifacts cleaned."
