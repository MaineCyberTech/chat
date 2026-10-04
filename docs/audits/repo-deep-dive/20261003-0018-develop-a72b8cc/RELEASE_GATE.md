# Release Gate

Run: `20261003-0018-develop-a72b8cc` · Target: `C:\temp\chat` @ `a72b8cc` · Profile: base

## Verdict

**GO WITH CONDITIONS**

Advisory decision: the blockers are concrete but bounded and mostly S/M to remediate; broad release is blocked until the conditions below are met and re-verified.

## Blocking conditions (must be true)

| # | Condition | Findings | Evidence required to close |
|---:|---|---|---|
| 1 | Deploy pipeline no longer runs RLS/seed/DDL SQL; `users_select_own` restored via migration | SEC-P0-001, CI-P1-002, DATA-P1-001 | diff of `.github/workflows/deploy-*.yml`; SQL assertion that a user cannot read another user's row |
| 2 | All `/v1/admin` and `/v1/export|import` endpoints scoped to the caller's workspaces | SEC-P1-003/004/005/006 | cross-tenant negative tests passing |
| 3 | Backend tenant data access uses per-user Supabase clients | ARCH-P1-001/002, FINAL-P1-001 | integration tests with real RLS (webhook, socket, push) |
| 4 | SSH restricted to operator CIDRs | SEC-P1-007 | `terraform plan`; external port scan |
| 5 | Committed credential removed and rotated | SEC-P1-002, SUPPLY-P1-001 | secret scan clean; `git ls-files` clean |
| 6 | Deploys stop deleting Docker volumes | DATA-P1-002, CI-P1-004 | volume persists across two deploys |
| 7 | E2E and security scans gate the build | CI-P1-003, TEST-P1-001 | a red check blocks merge |

## Non-blocking conditions (strongly recommended)

- RLS integration test tier (TEST-P2-003).
- Migration up/down/up execution (DATA-P2-004).
- Durable webhook retries + stable idempotency (FEAT-P1-002/003).
- Alerting configured (OBS-P1-001).
- Actions SHA-pinned; prod SBOM (SUPPLY-P2-002/004).
- HA/backup plan and restore drill (ARCH-P2-003).

## Evidence basis

- 63 findings across 13 reports in this run; severity totals P0 1 / P1 24 / P2 31 / P3 7.
- Code/config inspected at commit `a72b8cc`; no application code modified.

## Reconciliation

- Repository docs claim "0 P0, 0 P1 … ALL CLEAN" (`AGENTS.md`). This run **does not** reconcile with that claim: a P0 exists at this commit (SEC-P0-001). All prior published verdicts are neither granted nor revoked here; a re-audit at the remediated commit is required.
- Runtime state of hosted environments is **Unknown** (whether the RLS policy has already been applied). Verify out of band.

## Decision owner

Engineering leadership / release manager. This artifact is advisory and must not be used to override an existing published gate.
