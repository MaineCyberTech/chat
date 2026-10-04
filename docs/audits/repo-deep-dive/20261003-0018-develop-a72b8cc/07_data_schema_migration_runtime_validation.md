# 07 — Data, Schema & Migration Runtime Validation

## Audit Metadata

- Run: 20261003-0018-develop-a72b8cc
- Target: `C:\temp\chat` @ `a72b8cc`

## Scope

Schema/migration integrity, RLS/data lifecycle, retention, GDPR deletion, and the production/deploy data mutations.

## Evidence Reviewed

- `supabase/migrations/*` (80), `supabase/rollback/*` (80), `supabase/seeds/*` (6)
- `supabase/migrations/20260724000003_create_gdpr_delete_function.sql`, `20260724000004_fix_gdpr_delete_completeness.sql`
- `supabase/migrations/20260627000002_enforce_data_retention.sql`, `20260625000013_audit_log_pruning.sql`
- `.github/workflows/deploy-production.yml`, `deploy-development.yml`, `validate.yml`, `supabase-migrations.yml`
- `apps/worker/src/processors/data-retention.ts`, `cleanup.ts` (referenced)

## Verification Performed

- Counted migrations vs rollback scripts (80/80).
- Searched for duplicate migration intents.
- Walked `gdpr_delete_user` for FK completeness.
- Inspected deploy workflows for schema/data mutations outside migrations.
- Attempted literal reproduction of migration CI (not run — no local Supabase in audit role).

## Executive Summary

The migration set is large and has matching rollback files, but rollback scripts are only checked for existence — never executed. More seriously, the deploy workflows mutate production schema (RLS) and data (seed users + a shared hardcoded password) outside migration control, and the deploy's `docker system prune --volumes` deletes the Redis named volume. These are P1 data-integrity issues.

## Inventory

| Item | Count | Notes |
|---|---|---|
| Migrations | 80 | includes many `fix_*` |
| Rollback scripts | 80 | existence-checked in CI only |
| Policies dir | 11 | mirrored into migration 20260626000022 |
| Seeds | 6 | executed by deploy workflows |
| Duplicate intent | 2 | `20260704000007_add_user_groups.sql` and `20260705000003_add_user_groups.sql` |

## Findings

### Finding ID: DATA-P1-001 - Deploy workflows seed production with test users and a hardcoded password

- Severity: P1
- Confidence: High
- Area: DATA
- Evidence:
  - `.github/workflows/deploy-production.yml:312-350` — inserts `auth.users`/`public.users` for `%@seed.test` and sets `encrypted_password = '$2a$10$wsjrPx00…'` (redacted) on every push to `main`
  - `.github/workflows/deploy-development.yml:289-329` — same for dev
  - `supabase/seeds/0{1..5}*.sql` executed via Management API
- What is happening: Production database is seeded with test accounts sharing one known bcrypt hash of a well-known password, plus sample data, automatically on deploy.
- Why it matters: known-credential accounts exist in production; seed data pollutes real tenant tables.
- User / business impact: unauthorized login risk; data quality issues.
- Security / privacy / reliability impact: high.
- Recommended fix: never seed production from deploy; make seeding an explicit, environment-guarded, opt-in workflow that cannot target production.
- Suggested validation: production DB has zero `%@seed.test` accounts; deploy performs no INSERT/UPDATE to auth.
- Owner suggestion: Release eng + Security
- Effort estimate: M
- Dependencies: SEC-P0-001
- Status: open

### Finding ID: DATA-P1-002 - Deploy runs `docker system prune -af --volumes`, destroying the Redis named volume

- Severity: P1
- Confidence: High
- Area: DATA
- Evidence:
  - `.github/workflows/deploy-production.yml:284-289` — `docker compose down`, then `docker system prune -af --volumes`
  - `.github/workflows/deploy-development.yml:216-221` — same
  - `infra/docker/docker-compose.prod.yml` — Redis uses named volume `redis-data` with `--appendonly yes`
- What is happening: `docker compose down` removes containers; `prune --volumes` then removes the now-unused named volumes (Redis AOF and Caddy data).
- Why it matters: every deploy discards queued jobs/idempotency/presence state (and Caddy cert state); a deploy during failure recovery loses retry data.
- User / business impact: lost jobs, delayed/lost notifications and webhooks.
- Security / privacy / reliability impact: high (data loss).
- Recommended fix: remove `--volumes` and `--volumes`-implying flags; prune images only, or back up Redis before deploy.
- Suggested validation: deploy twice and confirm `redis-data` volume persists (`docker volume ls`).
- Owner suggestion: Infra
- Effort estimate: S
- Dependencies: None
- Status: open

### Finding ID: DATA-P2-003 - Duplicate `add_user_groups` migrations

- Severity: P2
- Confidence: Medium
- Area: DATA
- Evidence:
  - `supabase/migrations/20260704000007_add_user_groups.sql`
  - `supabase/migrations/20260705000003_add_user_groups.sql`
- What is happening: Two migrations share the same stated purpose on different dates.
- Why it matters: ambiguous schema history; future readers may apply changes twice or assume intent that isn't there.
- User / business impact: migration drift risk.
- Security / privacy / reliability impact: medium.
- Recommended fix: confirm the second is idempotent/guarded; document in a migrations README; don't delete history.
- Suggested validation: fresh `supabase db reset` succeeds and yields the expected schema.
- Owner suggestion: DB owner
- Effort estimate: S
- Dependencies: None
- Status: open

### Finding ID: DATA-P2-004 - Rollback scripts are only proven to exist, never executed

- Severity: P2
- Confidence: High
- Area: DATA
- Evidence:
  - `.github/workflows/validate.yml:346-357` — loops and checks `supabase/rollback/${base}_down.sql` exists; no execution
  - `supabase/rollback/` — 80 down scripts
- What is happening: CI "tests migration rollback" by path existence.
- Why it matters: down scripts may be syntactically invalid or non-inverse; rollback during an incident would fail.
- User / business impact: extended outage during rollback.
- Security / privacy / reliability impact: medium-high.
- Recommended fix: in a CI Supabase instance, apply all migrations, apply downs in reverse, and re-apply ups; fail on error.
- Suggested validation: the above job passes.
- Owner suggestion: DB/CI
- Effort estimate: M
- Dependencies: None
- Status: open

### Finding ID: DATA-P2-005 - `gdpr_delete_user` is a hard multi-table delete with partial coverage and coupled auth deletion

- Severity: P2
- Confidence: Medium
- Area: DATA
- Evidence:
  - `apps/api/src/modules/auth/routes.ts:312-362` — requires password re-auth, calls `gdpr_delete_user`, then `supabase.auth.admin.deleteUser`
  - `supabase/migrations/20260724000004_fix_gdpr_delete_completeness.sql:10-46` — deletes from ~30 tables but not, e.g., `threads`/`message_edit_history` rows where the user is not the owner, nor anonymizes content
  - `..._gdpr_delete_function.sql` / `_fix_handle_user_deletion_fks.sql` show prior FK bugs
- What is happening: Deletion hard-deletes the user's messages and memberships; if `admin.deleteUser` fails after the SQL succeeds, the account is partially deleted and the route returns 500.
- Why it matters: GDPR "right to erasure" may leave traces (others' thread content, audit references) and non-atomic failure leaves inconsistent state.
- User / business impact: compliance exposure; support pain.
- Security / privacy / reliability impact: medium-high.
- Recommended fix: make deletion idempotent and retryable; document what is deleted vs retained/anonymized; cover all FK tables.
- Suggested validation: run deletion on a seeded DB; assert zero remaining rows for the user across all tables.
- Owner suggestion: Privacy/DB
- Effort estimate: M
- Dependencies: None
- Status: open

## Risks

- Production data mutated by CI; Redis state lost each deploy; unvalidated rollbacks.

## Recommendations

1. Move all schema/policy/seed changes into migrations; keep deploy read-only for the DB.
2. Stop volume pruning; back up Redis.

## Quick Wins

- Remove `--volumes` from prune commands.

## Hardening Backlog

- Automated up/down/up migration test; PITR backups.

## Suggested Tests

- Fresh `supabase db reset` on every PR (already partially present, currently non-blocking).
- GDPR deletion completeness assertion.

## Suggested Documentation Updates

- Migration runbook clarifying no deploy-time DDL.

## Open Questions

- Is Supabase PITR/backups enabled for the hosted project? Not visible in repo — Unknown.

## Appendix

- Migrations span 2026-06-25 to 2026-07-24; retention/pruning migrations are 20260625000013 and 20260627000002.
