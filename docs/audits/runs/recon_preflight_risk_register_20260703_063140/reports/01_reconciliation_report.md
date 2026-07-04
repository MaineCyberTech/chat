# Reconciliation Report

- Prompt: **recon_preflight_risk_register**
- Domain: **audit**
- Run ID: **recon_preflight_risk_register_20260703_063140**
- Generated: **2026-07-03T07:25:00Z**
- Decision: **GO WITH RISKS**
- P0: **0**, P1: **5**
- P2: **3**, P3: **1**
- Readiness: **0.00**

## Findings

### P1 — Risk: Standardizing 19 workflows to Corepack pattern could break CI if any workflow has a version-specific dependency on the old pnpm/action-setup@v4 behavior.

- **File:** `.github/workflows/`
- **Category:** R-001: CI/CD Workflow Standardization
- **Impact:** CI pipeline fails silently or produces wrong build outputs. Blast radius: all builds, tests, and deploys.
- **Fix:** Mitigation: Add Corepack migration as a separate PR. Run all CI checks on the PR branch. Keep old workflows intact until new ones pass. Rollback: revert the single workflow standardization commit.

### P1 — Risk: Adding rate limiting to auth routes could break legitimate login flows if limits are too strict. Users may be unable to log in after a few attempts.

- **File:** `apps/api/src/modules/auth/routes.ts`
- **Category:** R-002: Auth Rate Limiting
- **Impact:** Users locked out of their accounts. Blast radius: all users attempting to log in. Business-critical.
- **Fix:** Mitigation: Start with generous limits (10 req/min per IP for login). Monitor logs for false positives. Use warn logging, not blocking, initially. Rollback: remove rate-limit middleware from auth routes.

### P1 — Risk: Adding version column to messages table requires a migration. Existing messages will have NULL version. Clients must be updated to send version on PATCH. Old clients without version header will get 409 errors.

- **File:** `apps/api/src/modules/messages/service.ts`
- **Category:** R-003: Optimistic Locking on Messages
- **Impact:** Frontend message editing breaks until all client instances are updated. Blast radius: all users editing messages.
- **Fix:** Mitigation: Make version optional on server (backward compatible). If no version sent, skip conflict check. Add version field to PATCH only after frontend is deployed. Rollback: revert migration, remove version check.

### P1 — Risk: Removing duplicate migration files could break Supabase CLI migration tracking if production has already applied both copies.

- **File:** `supabase/migrations/`
- **Category:** R-004: Migration Deduplication
- **Impact:** Future db push operations fail with 'migration already applied' errors. Blast radius: all environments. Recovery requires manual migration state manipulation.
- **Fix:** Mitigation: Do NOT remove or rename existing migrations during reconciliation. Create a new migration that documents deduplication intent. Rollback: revert the documentation migration (trivial).

### P1 — Risk: Implementing actual logic in 4 stub worker processors could introduce subtle bugs in webhook delivery, notification processing, search indexing, and cleanup paths that currently work (by being no-ops).

- **File:** `apps/worker/src/processors/`
- **Category:** R-005: Worker Processors
- **Impact:** Webhook delivery fails silently, notifications get lost, search indexes stale, cleanup never runs. Blast radius: all features depending on background processing.
- **Fix:** Mitigation: Implement processors one at a time, starting with the lowest-risk (cleanup). Each processor gets its own deploy cycle with monitoring. Rollback: revert the processor implementation, worker falls back to no-op behavior.

### P2 — Risk: Changing Caddyfile to support both production and development domains could introduce TLS cert issues or routing misconfigurations.

- **File:** `infra/docker/`
- **Category:** R-006: Caddyfile Domain Handling
- **Impact:** Production site goes down or serves wrong content. Blast radius: all users.
- **Fix:** Mitigation: Test Caddy config changes on devremote compose first. Keep prod Caddyfile.prod unchanged — only modify Caddyfile (used by devremote). Rollback: revert Caddyfile changes.

### P2 — Risk: Fixing setup-dev.sh migration path could break developers who have workarounds in place (symlinks, aliases) for the broken path.

- **File:** `scripts/setup-dev.sh`
- **Category:** R-007: Setup-dev.sh Fix
- **Impact:** Low — only affects new developers running setup for the first time. Existing devs already have working environments.
- **Fix:** Mitigation: Fix the path. Existing devs are unaffected. Rollback: revert the single changed path.

### P2 — Risk: Adopting instrumentation.ts from develop snapshot could conflict with existing SentryErrorBoundary.tsx. If both are adopted, Sentry may double-capture errors or cause initialization order bugs.

- **File:** `apps/web/components/`
- **Category:** R-008: Sentry Strategy Reconciliation
- **Impact:** Duplicate error reporting, inflated error counts, or missed errors due to initialization race conditions.
- **Fix:** Mitigation: Review Sentry initialization in both approaches. If compatible, merge. If conflicting, choose one approach and remove the other. Rollback: revert Sentry changes, keep existing error boundary.

### P3 — Risk: Renaming .js config files to .mjs for parity with develop would create large git diffs and potentially break IDE integrations.

- **File:** `packages/`
- **Category:** R-009: Config File Extension Changes
- **Impact:** Trivial — cosmetic only. But git blame is disrupted for the changed files.
- **Fix:** Mitigation: Do NOT change config file extensions during reconciliation. Mark as intentionally SKIPPED.
