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

## Test Structure

| Test File        | Endpoints Tested              | Dependencies         |
| ---------------- | ----------------------------- | -------------------- |
| `health.test.ts` | `GET /health`, `GET /healthz` | API server, database |

## Adding Tests

1. Create a `.test.ts` file in `tests/integration/`
2. Use `vitest` (describe/it/expect)
3. Read `API_URL` from environment (default: `http://localhost:4000`)
4. Mark tests that require specific services with `describe.skipIf`
