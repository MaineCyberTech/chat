# 09 — Testing, Quality & Release Confidence

## Audit Metadata

- Run: `chat-20261004-full-develop-0695894`
- Target: `C:\temp\chat` @ `0695894`

## Scope

Unit/integration/E2E coverage, gating, and release-confidence mechanisms.

## Evidence Reviewed

- `packages/config/vitest.config.base.ts`, `vitest.config.ts`, `playwright.config.ts`
- 80 `*.test.ts(x)` files; 14 `tests/e2e` specs
- `supabase/tests/rls_tenant_isolation.sql`, `scripts/test-db-rls.sh`
- `.github/workflows/validate.yml`, `ci.yml`

## Verification Performed

- Counted test files and located E2E provisioning.
- Checked coverage thresholds and whether previously non-blocking steps now gate.
- Confirmed the rollback job now executes down scripts.
- Searched workflows and `package.json` for any invocation of the RLS tenant-isolation test.

## Executive Summary

Release confidence improved substantially. E2E is now self-provisioning (generates a local `test-signin.json` after `supabase db reset`) and blocking; the previous `continue-on-error` flags are gone from `validate.yml`; coverage thresholds were raised (36/40/60/36); and migration rollback is executed rather than existence-checked. One gap remains: the real-database RLS tenant-isolation test exists but is not wired into CI or any package script.

## Inventory

| Suite | Count | Gating |
|---|---|---|
| Unit tests | 80 files | Yes (`test` job) |
| Coverage thresholds | 36/40/60/36 | Yes (`pnpm test`) |
| E2E specs | 14 | Yes (blocking, self-provisioning) |
| RLS SQL test | 1 (`supabase/tests/rls_tenant_isolation.sql`) | No — not invoked by CI |
| Chaos | 2 shell scenarios | Manual |

## Reconciliation of prior testing findings

| Prior ID | Verdict at HEAD | Evidence |
|---|---|---|
| TEST-P1-001 (E2E skip/non-blocking) | `verified-fixed` | `validate.yml:485-513` installs Chromium, runs `supabase db reset`, provisions `test-signin.json`, and runs `pnpm test:e2e` with no `continue-on-error`. |
| TEST-P2-002 (low thresholds / non-blocking diff coverage) | `verified-fixed` | `packages/config/vitest.config.base.ts:34-37` (36/40/60/36); no `continue-on-error` remains in `validate.yml`. |
| TEST-P2-004 (rollback existence-only) | `verified-fixed` | `validate.yml:395-428` executes downs in reverse and re-applies ups. |
| TEST-P2-003 (no real-DB RLS tier) | `partially-fixed` | `supabase/tests/rls_tenant_isolation.sql` + `scripts/test-db-rls.sh` exist, but CI does not run them. |

## Findings

### Finding ID: TEST-P2-001 - RLS tenant-isolation SQL test exists but is not run by CI

- Severity: P2
- Confidence: High
- Area: TEST
- Evidence:
  - `supabase/tests/rls_tenant_isolation.sql` — asserts cross-tenant isolation directly against Postgres.
  - `scripts/test-db-rls.sh:38` — the only reader (`< supabase/tests/rls_tenant_isolation.sql`).
  - `git grep` of `.github/workflows/` and `package.json` for `rls_tenant_isolation` / `test-db-rls` returns no invocation.
- What is happening: A real-database tenant-isolation test is present but no CI job or package script executes it; unit tests mock Supabase and therefore cannot catch RLS/tenant bugs.
- Why it matters: Entire classes of tenant-isolation regressions (the kind that produced prior P0/P1 findings) pass CI.
- User / business impact: Security regressions ship.
- Security / privacy / reliability impact: High.
- Recommended fix: Add a CI job (or a `package.json` script) that boots local Supabase, applies migrations, and runs `scripts/test-db-rls.sh`, making it blocking.
- Suggested validation: A deliberately broken RLS policy fails the job.
- Owner suggestion: QA/Security
- Effort estimate: S (the harness already exists)
- Dependencies: SEC-P1-001, SEC-P2-001
- Status: open

## Risks

- RLS regressions are invisible to the current suite.

## Recommendations

1. Wire `scripts/test-db-rls.sh` into the `validate.yml` E2E/Supabase job.

## Quick Wins

- One-line CI step after `supabase db reset` to run the RLS script.

## Hardening Backlog

- Expand the SQL test to every tenant table and the service-role bypass paths.
- Flake tracking; scheduled chaos/load runs.

## Suggested Tests

- Authz matrix, webhook retry durability, socket membership, GDPR deletion.

## Suggested Documentation Updates

- Testing strategy doc reconciling test counts.

## Open Questions

- Why was the RLS script not wired into CI? Unknown (intent).

## Appendix

- `playwright.config.ts` exists; 14 E2E specs under `tests/e2e/`.
