# 07 — Data, Schema & Migration Runtime Validation

## Audit Metadata

- Run: `chat-20261004-full-develop-0695894`
- Target: `C:\temp\chat` @ `0695894`

## Scope

Schema/migration integrity, rollback validation, duplicate migrations, GDPR deletion, and deploy-time data mutations.

## Evidence Reviewed

- `supabase/migrations/*` (76), `supabase/rollback/*` (76), `supabase/seeds/*`
- `supabase/tests/rls_tenant_isolation.sql`
- `.github/workflows/validate.yml` (migration/rollback job), `deploy-development.yml`, `deploy-production.yml`, `supabase-migrations.yml`
- `docs/operations/deployment-policy.md`
- `apps/worker/src/processors/data-retention.ts`, `cleanup.ts` (referenced)

## Verification Performed

- Counted migrations vs rollback scripts (76/76).
- Identified duplicate-stated migrations.
- Re-checked the previously reported deploy-time data mutations and volume pruning against HEAD.
- Checked whether the migration rollback job now executes down scripts.

## Executive Summary

Migration hygiene is materially improved: the rollback CI job now **executes** down scripts in reverse and re-applies ups (prior DATA-P2-004 fixed), and deploy no longer prunes named volumes (`docker system prune -af`, no `--volumes`; prior DATA-P1-002 fixed). Two issues remain: duplicate `add_user_groups` migrations, and a documented deployment policy that still contradicts the development deploy workflow. The production data-seeding mechanism now lives only in the manually dispatchable seed workflow (SEC-P1-001).

## Inventory

| Item | Count | Notes |
|---|---|---|
| Migrations | 76 | matching 76 rollback scripts |
| Rollback scripts | 76 | executed by `validate.yml:395-428` |
| Duplicate intent | 1 pair | `20260704000007` / `20260705000003` `add_user_groups` |
| RLS tests | 1 SQL file | `supabase/tests/rls_tenant_isolation.sql` (not run by CI) |

## Reconciliation of prior data findings

| Prior ID | Verdict at HEAD | Evidence |
|---|---|---|
| DATA-P1-001 (deploy seeds prod test users) | `partially-fixed` | No seed user/password writes remain in `deploy-production.yml`/`deploy-development.yml`; the capability persists only in the manual seed workflow (SEC-P1-001). |
| DATA-P1-002 (`docker system prune --volumes`) | `verified-fixed` | `deploy-production.yml:319,424`, `deploy-development.yml:219` now use `docker system prune -af`. |
| DATA-P2-004 (rollback existence-only) | `verified-fixed` | `validate.yml:395-428` applies downs in reverse and re-applies ups, failing on error. |
| DATA-P2-005 (GDPR delete partial) | `partially-fixed` | New `apps/api/src/modules/auth/__tests__/gdpr-delete.test.ts`; completeness across all FK tables still warrants a dedicated review. |

## Findings

### Finding ID: DATA-P2-001 - Duplicate `add_user_groups` migrations

- Severity: P2
- Confidence: Medium
- Area: DATA
- Evidence:
  - `supabase/migrations/20260704000007_add_user_groups.sql`
  - `supabase/migrations/20260705000003_add_user_groups.sql`
- What is happening: Two migrations share the same stated purpose on different dates.
- Why it matters: Ambiguous schema history; a future reader may assume intent that is not present, and drift is harder to diagnose.
- User / business impact: Migration drift risk.
- Security / privacy / reliability impact: Medium.
- Recommended fix: Confirm the second is idempotent/guarded; document intent in a migrations README; do not delete history.
- Suggested validation: Fresh `supabase db reset` succeeds and yields the expected schema.
- Owner suggestion: DB owner
- Effort estimate: S
- Dependencies: None
- Status: open

### Finding ID: CONF-P3-001 - Deployment policy contradicts the development deploy workflow (DB changes)

- Severity: P3
- Confidence: High
- Area: CONF
- Evidence:
  - `docs/operations/deployment-policy.md:35-37` — "Deploys ship application images only. Schema, RLS policies, functions, and seed data are applied through versioned, reviewed channels — never from a deploy workflow."
  - `.github/workflows/deploy-development.yml` runs `supabase link … && supabase db push --include-all` inside the deploy workflow.
  - `.github/workflows/supabase-migrations.yml` auto-applies migrations on push to `main`/`develop`.
- What is happening: Documented control contradicts code.
- Why it matters: Reviewers and auditors trust the doc; schema changes can reach environments without the documented gate.
- User / business impact: Governance/audit risk.
- Security / privacy / reliability impact: Medium.
- Recommended fix: Reconcile doc and workflow (either remove migrations from deploy or update the policy explicitly), and state which channels are permitted.
- Suggested validation: Policy text and workflows agree.
- Owner suggestion: Release eng
- Effort estimate: S
- Dependencies: SEC-P1-001, FINAL-P1-001
- Status: open

## Risks

- Ambiguous migration history; doc/control divergence.

## Recommendations

1. Document the duplicate migration intent.
2. Reconcile deployment policy with actual DB-change channels.

## Quick Wins

- Add a migration README entry for the duplicate pair.

## Hardening Backlog

- Automated up/down/up against a fresh Supabase instance (now partially present).

## Suggested Tests

- Fresh `supabase db reset` on every PR (present; blocking).
- GDPR deletion completeness assertion.

## Suggested Documentation Updates

- Migration runbook clarifying no deploy-time DDL.

## Open Questions

- Is Supabase PITR/backups enabled for the hosted project? Not visible in-repo — Unknown.

## Appendix

- Migrations span 2026-06/07; 76 up / 76 down.
