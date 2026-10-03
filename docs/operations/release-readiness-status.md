# Release Readiness Status

> Commit-stamped status generated from an independent repository audit. Treat this file as
> the current release status for the audited commit; the "all clean" / "0 P0, 0 P1" summaries
> in `AGENTS.md` and the older audit notes are **historical** and do not describe this commit.

- **Audit run**: `20261003-0018-develop-a72b8cc`
- **Audited commit**: `a72b8cc43590848b052bd5e8954dbbc726b3d7fd` (branch `develop`)
- **Date**: 2026-10-03
- **Status**: **GO WITH CONDITIONS — broad release blocked**

## Findings at the audited commit

| Severity  |  Count |
| --------- | -----: |
| P0        |      1 |
| P1        |     24 |
| P2        |     31 |
| P3        |      7 |
| **Total** | **63** |

Totals are transcribed from the audit run's machine-readable `findings.json`. Do not hand-edit
them; regenerate after a re-audit at the remediated commit.

## Release gate

The audit's release verdict is **GO WITH CONDITIONS**: broad release is blocked until the
blocking conditions below are met and re-verified at a remediated commit.

### Blocking conditions

1. Deploy pipeline no longer runs RLS/seed/DDL SQL; `users_select_own` restored via migration
   (`SEC-P0-001`, `CI-P1-002`, `DATA-P1-001`).
2. All `/v1/admin` and `/v1/export|import` endpoints scoped to the caller's workspaces
   (`SEC-P1-003/004/005/006`).
3. Backend tenant data access uses per-user Supabase clients (`ARCH-P1-001/002`, `FINAL-P1-001`).
4. SSH restricted to operator CIDRs (`SEC-P1-007`).
5. Committed credential removed and rotated (`SEC-P1-002`, `SUPPLY-P1-001`).
6. Deploys stop deleting Docker volumes (`DATA-P1-002`, `CI-P1-004`).
7. E2E and security scans gate the build (`CI-P1-003`, `TEST-P1-001`).

The ordered remediation set is the audit run's patch plan (`patch_plan.md`), executed as draft
remediation PRs. Findings move to `verified-fixed` only when they have an artifact captured at the
remediated commit.

## Verification limits

- Runtime state of the hosted environments is **Unknown** from the repository — for example,
  whether the weakened `users` RLS policy has already been applied by a deploy. Verify out of band.
- This status is advisory and does not override any published gate. It exists so that repository
  documentation does not claim a readiness that the audited code does not support.
