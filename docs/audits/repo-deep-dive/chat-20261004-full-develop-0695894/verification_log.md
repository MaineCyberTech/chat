# Verification Log

Run `chat-20261004-full-develop-0695894` · Target `chat` @ `0695894`.

This log reconciles findings from prior runs against the current commit. Status moves to `verified-fixed` only with a reproducing artifact **at this commit**.

## Prior focused run (`chat-20261004-0700-develop-0695894`)

The focused register marked five findings `verified-fixed` citing merge commits. `git merge-base --is-ancestor <sha> HEAD` returns false for every cited SHA, and the underlying code is still present. Therefore these revert to `open` at HEAD.

| Finding | Prior status | Cited commit reachable? | Code present at HEAD? | New status |
|---|---|---|---|---|
| SEC-P1-001 | verified-fixed | No (#88 @ 3115ab3) | Yes — `seed-database.yml:71,85` | open |
| CI-P1-001 | verified-fixed | No (#89 @ b32bd0f) | Yes — `deploy-production.yml:140` | open |
| AUTH-P2-001 | verified-fixed | No (#90 @ e687345) | Yes — `admin/routes.ts:360` | open |
| SEC-P2-001 | verified-fixed | No (#91 @ a70ebe1) | Yes — `auth/service.ts:44-64` | open |
| SUPPLY-P2-001 | verified-fixed | No (#92 @ a498513) | Yes — `docker-compose.prod.yml:3-7` | open |

## Prior base run (`chat-20261003-0018-develop-a72b8cc`) — re-checked at HEAD

| Prior finding | Verdict at `0695894` | Evidence |
|---|---|---|
| SEC-P0-001 (deploy sets `users_select USING (true)`) | `verified-fixed` in deploy; residual in seed workflow | No `CREATE POLICY users_select USING (true)` in `deploy-*`; `seed-database.yml:85` still has it (SEC-P1-001). |
| DATA-P1-001 (deploy seeds test users) | `partially-fixed` | Deploy workflows contain no `%@seed.test`/`encrypted_password`; capability remains in the seed workflow. |
| DATA-P1-002 (`docker system prune --volumes`) | `verified-fixed` | `docker system prune -af` in `deploy-production.yml:319,424`, `deploy-development.yml:219`. |
| DATA-P2-004 / TEST-P2-004 (rollback existence-only) | `verified-fixed` | `validate.yml:395-428` executes downs in reverse. |
| ARCH-P1-001 (webhooks anon client) | `verified-fixed` | `webhooks/service.ts` uses `getSupabaseAdmin()`; durable retries in `lib/webhook-queue.ts`. |
| ARCH-P1-002 (socket anon client) | `verified-fixed` | `socket.ts:140` `getSupabaseForUser(token)`. |
| FEAT-P1-001 (magic-link no-op) | `verified-fixed` | `auth/service.ts:67-90` calls `signInWithOtp`. |
| FEAT-P1-002 (non-durable retries) | `verified-fixed` | `lib/webhook-queue.ts`. |
| FEAT-P2-003 (idempotency key regenerated) | `verified-fixed` | Key generated once (`service.ts:216`) and passed to retry job (`:359`); worker reuses it (`webhook-delivery.ts:183`). |
| API-P1-001 (`/metrics` any user) | `verified-fixed` | `app.ts:103` `requireMetricsAccess`. |
| API-P2-002/003/004, API-P3-005 | `verified-fixed` | error-envelope test; `lib/postgrest-filter.ts`; `validators/auth.ts:12-25`; `openapi-coverage.test.ts`. |
| TEST-P1-001 (E2E non-blocking) | `verified-fixed` | `validate.yml:485-513` self-provisions and blocks. |
| TEST-P2-002 (low thresholds / non-blocking diff) | `verified-fixed` | `vitest.config.base.ts:34-37` (36/40/60/36); no `continue-on-error` in `validate.yml`. |
| TEST-P2-003 (no real-DB RLS tier) | `partially-fixed` | SQL test + `scripts/test-db-rls.sh` exist but are not run in CI → TEST-P2-001. |
| INV-P2-002 (tracked `test-signin.json`) | `verified-fixed` | Not in `git ls-files`. |
| HYG-P2-001 (`tmp_prompt_outputs/`, `test-results/`) | `verified-fixed` | Not in `git ls-files`. |
| HYG-P2-002 (one-off scripts) | `partially-fixed` | `scripts/fix_p0*.py` etc. removed; duplicate `requireAdmin`/migrations remain (ARCH-P3-002, DATA-P2-001). |
| INV-P2-003 / EXEC-P2-002 (docs overstate readiness) | `verified-fixed` | `AGENTS.md:7,15,272` now labels the all-clean claim historical and cites the `a72b8cc` audit. |
| ARCH-P2-003 (single-node) | `still-open` | ARCH-P2-001. |
| OBS-P1-001 (no alerting) | `still-open` | OBS-P1-001. |

## Commands executed

- `git rev-parse --short HEAD` → `0695894`; `git merge-base --is-ancestor <sha> HEAD` for the five cited SHAs → not ancestors.
- `git ls-files`, `git ls-files -s` (modes), `git grep` for RLS/policy/seed/prune/rollback/metrics/validators.
- `Get-ChildItem`/`git ls-files` counts (migrations 76, rollback 76, workflows 22, tests 80).

## Limitations

- No network/vuln-DB access; fixed-version availability for flagged CVEs is `Unknown`.
- GitHub server-side branch protection/ruleset/environment/reviewer config and secret values are not visible from the tree → `Unknown`.
- Live containers were not run; runtime policy state is `Unknown`.

## Correction (2026-10-04)

This pilot audited a clone frozen at `0695894`; `develop` had already advanced to `86bf76d`. The five findings tied to the earlier remediation (seed/RLS, destructive Terraform, dead-letter IDOR, user directory, service-role key) are **verified-fixed** by their merge commits (#88-#92), which are ancestors of `develop`. `EXEC-P2-002` was a stale-base false positive.
