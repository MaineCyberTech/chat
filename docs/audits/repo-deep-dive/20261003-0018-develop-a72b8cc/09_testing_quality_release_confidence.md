# 09 — Testing, Quality & Release Confidence

## Audit Metadata

- Run: 20261003-0018-develop-a72b8cc
- Target: `C:\temp\chat` @ `a72b8cc`

## Scope

Unit/integration/E2E coverage, gating, flakiness, and release-confidence mechanisms.

## Evidence Reviewed

- `packages/config/vitest.config.base.ts`, `vitest.config.ts`, `playwright.config.ts`
- 77 `*.test.ts(x)` files; `tests/e2e/*` (15 specs); `tests/integration/health.test.ts`
- `.github/workflows/validate.yml`, `ci.yml`
- `test-signin.json`, `test-signin.example.json`
- `docs/audits/compare/audit_final_testing_20260724.md`

## Verification Performed

- Counted test files and located E2E auth dependency.
- Checked coverage thresholds and whether checks gate the build.
- Traced `validate.yml` job dependencies (`build` needs only selected jobs).

## Executive Summary

There is a reasonable unit-test suite, but release confidence is undermined by non-blocking gates: E2E is `continue-on-error: true`, diff coverage is `continue-on-error: true`, `pnpm audit` is advisory, and E2E silently skips without a credential file. Migration rollback is existence-only. Effective gating on `main` is limited.

## Inventory

| Suite | Count | Gating |
|---|---|---|
| Unit tests | 77 files | Yes (`test` job) |
| Coverage thresholds | 35/30/25/35 | Yes for `pnpm test`, but diff-coverage step `continue-on-error` |
| E2E specs | 15 | No (`continue-on-error: true`) |
| Integration | 1 (`health.test.ts`) | Not in workflows |
| Chaos | 2 shell scenarios | Manual |

## Findings

### Finding ID: TEST-P1-001 - E2E tests skip without `test-signin.json` and are non-blocking

- Severity: P1
- Confidence: High
- Area: TEST
- Evidence:
  - `test-signin.json` (tracked credential; see SEC-P1-002)
  - `docs/audits/compare/audit_final_testing_20260724.md:203-218` — "~20 of ~29 tests require `test-signin.json` to actually run"; "Tests never run in CI"
  - `.github/workflows/validate.yml:428-431` — `Run E2E tests` has `continue-on-error: true`
- What is happening: The only end-to-end coverage depends on a local secret file and cannot fail the pipeline.
- Why it matters: no real user-flow regression protection; the strongest signal is opt-in and non-blocking.
- User / business impact: regressions reach production.
- Security / privacy / reliability impact: high release-confidence gap.
- Recommended fix: provision a test user via the Supabase admin API in a setup fixture; run E2E in CI against local Supabase; make it blocking.
- Suggested validation: E2E job fails on a deliberately broken flow.
- Owner suggestion: QA/CI
- Effort estimate: M
- Dependencies: SEC-P1-002
- Status: open

### Finding ID: TEST-P2-002 - Low coverage thresholds and non-blocking diff coverage

- Severity: P2
- Confidence: High
- Area: TEST
- Evidence:
  - `packages/config/vitest.config.base.ts:33-38` — lines 35, functions 30, branches 25, statements 35
  - `.github/workflows/validate.yml:96-121` — diff coverage step `continue-on-error: true`; required 20/20/15/20
- What is happening: Coverage floors are low and the change-focused check cannot fail.
- Why it matters: new code can be merged untested.
- User / business impact: latent defects.
- Security / privacy / reliability impact: medium.
- Recommended fix: raise thresholds incrementally; make diff coverage blocking at an agreed level.
- Suggested validation: PR touching untested code fails.
- Owner suggestion: QA
- Effort estimate: M
- Dependencies: None
- Status: open

### Finding ID: TEST-P2-003 - No real-database/RLS integration test tier

- Severity: P2
- Confidence: High
- Area: TEST
- Evidence:
  - Only `tests/integration/health.test.ts` exists
  - Unit tests mock Supabase (module `__tests__` use mocks), so the anon-client/RLS defects (ARCH-P1-001/002, SEC-P1-003/004/005) are invisible to them
- What is happening: The test suite never exercises Postgres/RLS.
- Why it matters: entire classes of tenant-isolation bugs pass CI.
- User / business impact: security regressions ship.
- Security / privacy / reliability impact: high.
- Recommended fix: add a tier that boots local Supabase, applies migrations, and runs authz assertions.
- Suggested validation: a cross-tenant read attempt fails in the test.
- Owner suggestion: QA/Security
- Effort estimate: L
- Dependencies: DATA-P2-004
- Status: open

### Finding ID: TEST-P2-004 - Migration rollback is validated by file existence only

- Severity: P2
- Confidence: High
- Area: TEST
- Evidence:
  - `.github/workflows/validate.yml:346-357` — existence loop only (cross-ref DATA-P2-004)
- What is happening: "Test migration rollback" does not test rollback.
- Why it matters: false assurance.
- User / business impact: failed rollback during incident.
- Security / privacy / reliability impact: medium-high.
- Recommended fix: execute down scripts in CI.
- Suggested validation: rollback job executes and passes.
- Owner suggestion: DB/CI
- Effort estimate: M
- Dependencies: None
- Status: open

## Risks

- Non-blocking gates give false confidence; `build` job depends only on lint/typecheck/test/security-audit/migration-test/openapi-validate, not E2E.

## Recommendations

1. Make E2E blocking and self-provisioning.
2. Add RLS integration tests.
3. Raise/restore coverage gates.

## Quick Wins

- Remove `continue-on-error: true` from E2E once provisioning exists.

## Hardening Backlog

- Contract tests, load/chaos scheduled runs, flake tracking.

## Suggested Tests

- Authz matrix, webhook retry, socket join, GDPR deletion.

## Suggested Documentation Updates

- Testing strategy doc reconciling README test-count claims (says 54/12; repo has 77 test files).

## Open Questions

- What is the actual measured coverage at this commit? Not run (no install in audit role) — Unknown.

## Appendix

- `playwright.config.ts` exists; E2E specs under `tests/e2e/`.
