# Release Gate

- Target: `chat` @ `0695894` (`develop`)
- Run: `chat-20261004-full-develop-0695894`
- Decision: **GO WITH CONDITIONS**

## Basis

- No P0 findings at this commit.
- 5 P1, 16 P2, 11 P3 findings (see `risk_register.md`).

## Blocking conditions (must clear before an unconditional GO)

| # | Condition | Findings |
|---|---|---|
| 1 | Strip `CREATE POLICY users_select … USING (true)` and shared-password writes from `seed-database.yml`; forbid production seeding | SEC-P1-001, FINAL-P1-001 |
| 2 | Gate destructive Terraform behind protected environments; separate plan/apply | CI-P1-001, CI-P2-001 |
| 3 | Reconcile prior `verified-fixed` claims to reachable commits/artifacts | EXEC-P2-002 |
| 4 | Scope auth directory and admin dead-letter retry to the caller's workspaces | SEC-P2-001, AUTH-P2-001 |
| 5 | Move service-role key out of the web container | SUPPLY-P2-001 |
| 6 | Land dependency upgrades before 2026-11-03 | DEP-P2-001, FINAL-P2-002 |

## Recommended (non-blocking)

- Wire the RLS SQL test into CI (TEST-P2-001).
- Configure alerting (OBS-P1-001).
- Digest-pin images, sign SBOMs, harden containers (SUPPLY-P3-001..004).
- Add actionlint and least-privilege `permissions:` (CI-P3-001/002).

## Verification required to change the verdict

Re-run the owning prompts (`06`, `10`, `11`, `25`) at the remediated commit, capture artifacts under `verification_log.md`, and confirm zero P1 remains. This run does **not** grant or revoke any external/published gate; it records a delta only.

## Reconciliation

Relative to the prior base audit (`a72b8cc`, GO WITH CONDITIONS), the delta is strongly positive (prior 1 P0 / 24 P1 → now 0 P0 / 5 P1). The prior focused run (`20261004-0700`) marked five findings `verified-fixed`; those commits are not ancestors of HEAD, so this run keeps them `open`.
