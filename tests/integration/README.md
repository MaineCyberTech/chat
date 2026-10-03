# Integration Tests

Integration tests verify interactions between multiple modules or services.

## Running Tests

```bash
# Run all integration tests (requires API running with DB)
pnpm test:integration

# Run specific test file
npx vitest run tests/integration/health.test.ts

# Run with environment variables
API_URL=http://localhost:4000 npx vitest run tests/integration/
```

## Prerequisites

- Local Supabase instance running (`pnpm supabase start`)
- API server running (`pnpm dev` in `apps/api`)
- Redis running (optional, for Redis-dependent tests)

## Real-database / RLS tier

Unit tests mock Supabase, so Postgres/RLS and tenant-isolation regressions are
invisible to them. `supabase/tests/rls_tenant_isolation.sql` runs against a real
local Postgres with every migration + seed applied and asserts that an
authenticated user cannot read another workspace's rows (workspaces,
workspace_members, channels, messages). It exits non-zero on any leak.

```bash
# Boots local Supabase, applies migrations + seeds, runs the RLS assertions
pnpm test:rls

# Or run it directly against an already-reset database
docker exec -i supabase_db_chat psql -U postgres -d postgres \
  -v ON_ERROR_STOP=1 -f - < supabase/tests/rls_tenant_isolation.sql
```

The `migration-test` job in `.github/workflows/validate.yml` runs every
`supabase/tests/*.sql` file against the real database and is blocking.

## Test Structure

| Test File                            | Endpoints / Behavior Tested                  | Dependencies         |
| ------------------------------------ | -------------------------------------------- | -------------------- |
| `health.test.ts`                     | `GET /health`, `GET /healthz`                | API server, database |
| `supabase/tests/rls_tenant_isolation.sql` | Cross-tenant reads denied by RLS       | Local Supabase DB    |

## Adding Tests

1. Create a `.test.ts` file in `tests/integration/`
2. Use `vitest` (describe/it/expect)
3. Read `API_URL` from environment (default: `http://localhost:4000`)
4. Mark tests that require specific services with `describe.skipIf`

### Adding RLS / database tests

1. Create a `.sql` file in `supabase/tests/` that `RAISE EXCEPTION`s on failure
2. Assume migrations + seeds from `supabase db reset` are applied
3. Simulate a tenant with `set local role authenticated;` and
   `set local request.jwt.claims = '{"sub":"<user-uuid>","role":"authenticated"}';`
4. Wrap the test in `begin; ... rollback;` so it never mutates the database
