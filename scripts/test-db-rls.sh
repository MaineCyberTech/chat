#!/usr/bin/env bash
# Real-database RLS tenant-isolation test runner (closes TEST-P2-003).
#
# Boots the local Supabase stack, applies every migration + seed file, then runs
# supabase/tests/rls_tenant_isolation.sql against the real Postgres database.
# Fails closed (non-zero exit) on any error.
#
# Usage:
#   bash scripts/test-db-rls.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if ! command -v supabase >/dev/null 2>&1; then
  echo "error: supabase CLI not found on PATH" >&2
  exit 1
fi
if ! command -v docker >/dev/null 2>&1; then
  echo "error: docker not found on PATH" >&2
  exit 1
fi

echo "==> supabase start (idempotent)"
supabase start

echo "==> supabase db reset (apply migrations + seeds)"
supabase db reset

DB_CONTAINER="$(docker ps --filter 'name=supabase_db_' --format '{{.Names}}' | head -n 1)"
if [ -z "${DB_CONTAINER}" ]; then
  echo "error: could not locate the local Supabase database container (supabase_db_*)" >&2
  exit 1
fi

echo "==> RLS tenant-isolation test against ${DB_CONTAINER}"
docker exec -i "${DB_CONTAINER}" psql -U postgres -d postgres -v ON_ERROR_STOP=1 \
  < supabase/tests/rls_tenant_isolation.sql
