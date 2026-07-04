# Reconciliation Report

- Prompt: **recon_preflight_decision_log**
- Domain: **audit**
- Run ID: **recon_preflight_decision_log_20260703_063141**
- Generated: **2026-07-03T07:30:00Z**
- Decision: **NO-GO**
- P0: **0**, P1: **3**
- P2: **3**, P3: **1**
- Readiness: **0.00**

## Findings

### P1 — Decision: ADAPT with stale-lock cleanup. Current TF workflow is functional but missing stale-lock handling. Add cleanup step without changing the overall workflow structure.
- **File:** `.github/workflows/infra-development.yml`
- **Category:** D-001: Terraform workflow style
- **Impact:** Prevents TF apply failures from stale locks. Low-risk additive change.
- **Fix:** Add `Remove-Item -LiteralPath '.terraform/terraform.lock.info' -ErrorAction SilentlyContinue` or equivalent before terraform apply.

### P1 — Decision: ADAPT 11 remaining workflows to Corepack pattern. Current 8 Corepack workflows serve as the reference template.
- **File:** `.github/workflows/`
- **Category:** D-002: Corepack CI standardization
- **Impact:** Consistent pnpm setup across all CI pipelines. Reduces version-dependent failures.
- **Fix:** For each of 11 workflows: replace pnpm/action-setup@v4 with enable-corepack → setup-node --corepack-enabled → pnpm install. Change one workflow at a time via separate PRs.

### P1 — Decision: DEFER. Duplicate migration files exist but removing or renaming them risks breaking production migration tracking. Do not touch existing migration files during this reconciliation.
- **File:** `supabase/migrations/`
- **Category:** D-003: Migration deduplication
- **Impact:** Duplicate migrations persist but cause no functional issues. New DB setups get duplicate indexes which is wasteful but not breaking.
- **Fix:** Create a single new migration file that documents the dedup status: '-- Note: 20260625000007 and 20260625000015 are superseded by 20260627000001 and 20260627000002'. No structural changes.

### P2 — Decision: APPLY NOW with generous limits. Add rate-limit middleware to auth routes (login, register, verify) with 10 req/min per IP. Start with warn-only mode for monitoring.
- **File:** `apps/api/src/modules/auth/routes.ts`
- **Category:** D-004: Auth rate limiting
- **Impact:** Prevents brute-force attacks on auth endpoints. Low risk with generous limits and warn-only initial mode.
- **Fix:** Add rateLimit({ windowMs: 60000, max: 10 }) middleware to auth POST routes. Add logger.warn on limit hit.

### P2 — Decision: APPLY AFTER VERIFICATION. Add version column to messages and channels with backward-compatible PATCH (optional version field). Requires frontend update before enforcement.
- **File:** `apps/api/src/modules/messages/service.ts`
- **Category:** D-005: Message optimistic locking
- **Impact:** Prevents lost update problem. Must be rolled out in phases: (1) add column, (2) deploy server with backward compat, (3) update frontend to send version, (4) enforce version check.
- **Fix:** Phase 1: migration adding version column. Phase 2: server PATCH accepts optional version. Phase 3 (deferred): enforce 409 on version mismatch.

### P2 — Decision: DEFER. Worker processors are stubs. Implementing them now during reconciliation risks introducing background processing bugs without monitoring infrastructure.
- **File:** `apps/worker/src/processors/`
- **Category:** D-006: Worker processor implementation
- **Impact:** Worker remains cosmetic but no new bugs introduced. Background processing stays no-op, as it is currently.
- **Fix:** Defer to post-reconciliation phase. Prerequisites: (1) monitoring/alerting for worker, (2) DLQ/retry infrastructure, (3) per-processor deploy cycle.

### P3 — Decision: SKIP. .mjs vs .js config naming is cosmetic and creates unnecessary git churn. No functional difference with modern Node.
- **File:** `packages/`
- **Category:** D-007: Config file .mjs naming
- **Impact:** Cosmetic only. No action needed.
- **Fix:** No changes. Mark as intentionally skipped in reconciliation output.
