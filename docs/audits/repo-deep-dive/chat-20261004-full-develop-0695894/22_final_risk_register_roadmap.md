# 22 — Final Risk Register, Roadmap & Patch Plan

## Audit Metadata

- Run: `chat-20261004-full-develop-0695894`
- Target: `C:\temp\chat` @ `0695894`
- Profile: base

## Scope

Synthesis of all domain findings into a risk register, roadmap, and patch plan.

## Evidence Reviewed

- Reports `01`–`21` in this run; `risk_register.md`, `follow_up_register.md`, `patch_plan.md`, `roadmap.md`.
- Prior focused run `chat-20261004-0700-develop-0695894` and prior base run `20261003-0018-develop-a72b8cc`.

## Verification Performed

- De-duplicated findings; identified shared root causes.
- Cross-checked severity assignment against the shared severity model.
- Verified that the prior run's `verified-fixed` claims cite commits not reachable from HEAD.

## Executive Summary

The repository improved substantially since `a72b8cc`: the production deploy pipeline no longer weakens the users RLS policy or seeds test users, Redis volumes are no longer pruned on deploy, migration rollback is executed, E2E/coverage/security gates are blocking, and the webhook/socket/contract defects are fixed. Two root causes remain: (1) a manually dispatchable seed workflow can still mutate production RLS and write shared-password accounts, and (2) several CI governance controls (production provision approval, workflow permissions, branch coverage, workflow lint) are still weak. A third cluster is dependency risk-acceptance expiring `2026-11-03`.

## Inventory

- 32 findings total: P0 0, P1 5, P2 16, P3 11 (per-area counts in `audit_manifest.json`).

## Findings

### Finding ID: FINAL-P1-001 - Manual seed workflow remains an out-of-band schema/RLS/data mutation channel

- Severity: P1
- Confidence: High
- Area: FINAL
- Evidence:
  - `.github/workflows/seed-database.yml:4-13` (production option), `:71` (shared password hash), `:85` (`users_select USING (true)`).
  - `docs/operations/deployment-policy.md:35-37` forbids deploy-time DDL/DML, yet the seed workflow remains a dispatchable channel (CONF-P3-001).
  - Synthesises SEC-P1-001; deploy workflows themselves no longer seed (verified).
- What is happening: The sanctioned-seeming seed workflow can still regress RLS and create predictable credentials, outside migration review.
- Why it matters: A single authorized dispatch can reintroduce the prior P0-level exposure.
- User / business impact: Cross-tenant PII exposure; account takeover.
- Security / privacy / reliability impact: High.
- Recommended fix: Strip RLS/credential writes from the seed workflow; restrict seeding to non-production; make schema changes migration-only.
- Suggested validation: Seed workflow contains no `CREATE POLICY`/`encrypted_password`; production cannot be selected.
- Owner suggestion: Release eng + Security
- Effort estimate: S
- Dependencies: SEC-P1-001, CONF-P3-001
- Status: open

### Finding ID: FINAL-P2-002 - Dependency security exceptions expire 2026-11-03, after which CI fails hard

- Severity: P2
- Confidence: Medium
- Area: FINAL
- Evidence:
  - `.trivyignore` header `# exp:2026-11-03`; `.pnpm-audit-exceptions.json` same expiry.
  - `validate.yml` and `build-push.yml` fail closed on HIGH/CRITICAL.
  - Synthesises DEP-P2-001.
- What is happening: A broad, time-boxed exception set suppresses current HIGH/CRITICAL findings.
- Why it matters: Either vulnerable dependencies ship, or releases block abruptly at expiry.
- User / business impact: Security exposure or release blockage.
- Security / privacy / reliability impact: Medium-high.
- Recommended fix: Land the dependency upgrades before expiry; shrink the allowlist to per-CVE entries with tracking issues.
- Suggested validation: Trivy/audit clean without exceptions.
- Owner suggestion: Security
- Effort estimate: M
- Dependencies: DEP-P2-001
- Status: open

## Risks

Top risks (see `risk_register.md`): production RLS/data mutation via the seed workflow; destructive production provisioning without approval; cross-tenant admin IDOR and auth directory; expiring dependency exceptions.

## Recommendations

1. **Immediate:** strip RLS/credential writes from the seed workflow; gate production Terraform behind a protected environment.
2. **This week:** scope the auth directory and dead-letter retry; move `SUPABASE_SERVICE_ROLE_KEY` out of the web container; fix branch protection/`permissions:`.
3. **This month:** land dependency upgrades; wire the RLS SQL test into CI; alerting; container digest pinning.

## Quick Wins

- Delete the `CREATE POLICY`/`encrypted_password` lines from `seed-database.yml`.
- Drop unused `id-token: write` from `deploy-production.yml`.

## Hardening Backlog

- Digest-pinned images, SBOM signing/attestation, HA Redis, distributed tracing.

## Suggested Tests

- Cross-tenant matrix; webhook SSRF redirect; RLS SQL test in CI; migration up/down/up.

## Suggested Documentation Updates

- Reconcile `deployment-policy.md` with workflows; document admin tenancy model.

## Open Questions

- Are server-side environment reviewers configured? Unknown from the tree.
- Has the seed workflow ever been run against production? Runtime policy state Unknown.

## Appendix

- Roadmap/patch detail: `roadmap.md`, `patch_plan.md`.
