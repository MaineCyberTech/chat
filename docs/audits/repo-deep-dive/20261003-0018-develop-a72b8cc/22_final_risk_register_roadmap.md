# 22 — Final Risk Register, Roadmap & Patch Plan

## Audit Metadata

- Run: 20261003-0018-develop-a72b8cc
- Target: `C:\temp\chat` @ `a72b8cc`
- Profile: base

## Scope

Synthesis of all domain findings into a risk register, roadmap, and patch plan.

## Evidence Reviewed

- Reports `01`–`21` in this run (INV, ARCH, FEAT, SEC, DATA, API, TEST, CI, SUPPLY, OBS, HYG).

## Verification Performed

- De-duplicated findings; identified shared root causes.
- Cross-checked severity assignment against the shared severity model.

## Executive Summary

Two root causes dominate: (1) **backend data access uses the anonymous Supabase role where authenticated/least-privilege is required**, and (2) **CI/deploy bypasses migration governance and weakens production RLS**. A third cluster is release confidence: gates are advisory. The system is feature-rich but not tenant-safe or release-safe at this commit.

## Inventory

- 63 findings total: P0 1, P1 24, P2 31, P3 7 (per-area counts in `audit_manifest.json`).

## Findings

### Finding ID: FINAL-P1-001 - Systemic Supabase client/role mismatch

- Severity: P1
- Confidence: High
- Area: FINAL
- Evidence:
  - `apps/api/src/modules/webhooks/service.ts` (anon), `apps/api/src/lib/socket.ts` (anon), `apps/api/src/modules/notifications/push-subscription-service.ts:88` (anon)
  - `apps/api/src/lib/supabase.ts:158-191` — anon vs user vs admin clients
  - RLS policies are `TO authenticated`
- What is happening: Multiple services bypass the per-user client, so RLS-gated features fail or run unauthenticated.
- Why it matters: functional outages plus lost defense-in-depth.
- User / business impact: webhooks, push, presence broken; trust erosion.
- Security / privacy / reliability impact: high.
- Recommended fix: codify a rule "tenant data ⇒ per-user client; admin client only after explicit authorization" and refactor offending services.
- Suggested validation: integration tests exercise real RLS.
- Owner suggestion: API lead
- Effort estimate: M
- Dependencies: TEST-P2-003
- Status: open

### Finding ID: FINAL-P1-002 - Deploy pipeline mutates schema/policies/data outside migrations

- Severity: P1
- Confidence: High
- Area: FINAL
- Evidence:
  - `deploy-production.yml:340-347` (RLS), `:312-350` (seed users/passwords), `deploy-development.yml` equivalents
- What is happening: CI is an unsanctioned migration channel.
- Why it matters: non-reproducible schema; hidden security regressions.
- User / business impact: compliance/release risk.
- Security / privacy / reliability impact: high.
- Recommended fix: remove all DDL/DML from deploy; use migrations + protected seed workflow.
- Suggested validation: deploy pipeline has no `database/query` writes.
- Owner suggestion: Release eng
- Effort estimate: M
- Dependencies: SEC-P0-001, DATA-P1-001
- Status: open

### Finding ID: FINAL-P2-003 - Release confidence limited by advisory gates

- Severity: P2
- Confidence: High
- Area: FINAL
- Evidence:
  - `validate.yml` E2E/coverage/audit non-blocking; `build-push.yml` Trivy non-blocking
- What is happening: quality/security signals do not gate.
- Why it matters: regressions ship.
- User / business impact: production defects.
- Security / privacy / reliability impact: medium-high.
- Recommended fix: make agreed checks blocking.
- Suggested validation: broken flow fails CI.
- Owner suggestion: QA/CI
- Effort estimate: M
- Dependencies: TEST-P1-001
- Status: open

## Risks

Top risks (see `risk_register.md` for the register): production PII exposure via RLS policy, automated production DB mut/seed, tenant-isolation gaps in admin/export, exposed SSH, non-durable integrations.

## Recommendations

1. **Immediate (same day):** remove deploy RLS/seed DDL; fix `users_select`; remove/rotate `test-signin.json`; restrict SSH.
2. **This week:** scope admin endpoints; correct Supabase client selection; make E2E/security gates blocking.
3. **This month:** RLS integration tests; migration up/down/up; alerting; HA/backup.

## Quick Wins

- Delete `--volumes` prune; delete the two DB-query deploy steps; restrict `/metrics`.

## Hardening Backlog

- Platform-admin role; OTel tracing; signed images/SBOM for prod; curated audit store.

## Suggested Tests

- Cross-tenant matrix; webhook retry durability; socket membership; GDPR deletion completeness.

## Suggested Documentation Updates

- Correct status claims in `AGENTS.md`/`README.md`; write CI governance + security model docs.

## Open Questions

- Are hosted envs configured with production environment reviewers and PITR? Unknown.

## Appendix

- Roadmap/patch detail: `roadmap.md`, `patch_plan.md`.
