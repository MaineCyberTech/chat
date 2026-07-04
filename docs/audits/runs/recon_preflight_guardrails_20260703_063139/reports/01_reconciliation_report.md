# Reconciliation Report

- Prompt: **recon_preflight_guardrails**
- Domain: **audit**
- Run ID: **recon_preflight_guardrails_20260703_063139**
- Generated: **2026-07-03T07:10:00Z**
- Decision: **NO-GO**
- P0: **1**, P1: **3**
- P2: **2**, P3: **2**
- Readiness: **0.00**

## Findings

### P0 — Auth guardrail identified: authenticate middleware has a known P0 bug history (had to call setSession after getUser for RLS visibility) — any change to auth flow risks breaking RLS context for all operations

- **File:** `apps/api/src/middleware/authenticate.ts`
- **Category:** Auth Guardrail
- **Impact:** Auth is the single highest-risk area. Past fix needed session re-initialization after getUser(). A regression would make all RLS policies invisible, leaking data cross-tenant.
- **Fix:** Treat auth middleware as a frozen file during reconciliation. Any auth changes require: (1) dedicated test, (2) human review, (3) staging deploy verification

### P1 — All /v1/\* routes are proxied via Caddy — any route path change, HTTP method change, or middleware reordering could silently break the proxy routing without producing a 5xx error (Caddy would return 404)

- **File:** `apps/api/src/modules/`
- **Category:** API Contract Guardrail
- **Impact:** Route changes that don't match Caddy's upstream expectations produce silent failures (404s instead of expected endpoints). Debugging requires checking both API and Caddy logs.
- **Fix:** Freeze /v1/\* route contract during reconciliation. Any route changes must be mirrored in Caddyfile changes and tested end-to-end.

### P1 — Production docker-compose has no depends_on health conditions (unlike devremote which does) — changing deployment order or health check patterns could cause production startup failures that don't manifest in dev

- **File:** `infra/docker/docker-compose.prod.yml`
- **Category:** Deployment Guardrail
- **Impact:** Production containers may start in any order. If reconciliation adds health check dependencies to prod compose, containers that rely on startup order (e.g., API waiting for DB) may fail on first deploy.
- **Fix:** Any changes to docker-compose.prod.yml must be tested against a staging environment first. Add health checks incrementally, not as a batch

### P1 — CI build-push and deploy workflows use GITHUB_TOKEN with write permissions for packages and contents — any workflow change could accidentally introduce a secret-leaking step or alter the deploy sequence

- **File:** `.github/workflows/`
- **Category:** CI/CD Guardrail
- **Impact:** Workflow changes during reconciliation have the highest blast radius: they control deployment, image building, and secrets. A single misconfigured step could leak all GitHub secrets or deploy broken images.
- **Fix:** CI/CD workflow changes during reconciliation must be: (1) reviewed by a second party, (2) tested on a fork/separate branch, (3) applied with a separate PR from code changes

### P2 — Duplicate migration files exist — any reconciliation that reorders, renames, or deduplicates migrations risks creating migration chains that don't match production's applied migration history

- **File:** `supabase/migrations/`
- **Category:** Migration Guardrail
- **Impact:** Supabase CLI tracks applied migrations by filename prefix. Renaming or removing a migration that has already been applied in production will break future db push operations.
- **Fix:** Only ADD new migrations during reconciliation. Do not modify, rename, or remove existing migration files. Deduplication is a separate infra task with its own verification.

### P2 — 24 secrets are required across all environments — reconciliation adding new integrations would expand this list, but there is no documented process for adding a new required secret without breaking existing deployments

- **File:** `apps/api/src/config/env.ts`
- **Category:** Secret Guardrail
- **Impact:** Adding a new env var that is required at startup will crash the API on the next deploy if the secret isn't set in all environments (dev, prod, CI).
- **Fix:** New secrets added during reconciliation must: (1) have defaults for backward compatibility, (2) be documented in all env example files, (3) be added to GitHub secrets, (4) be added to CI workflows

### P3 — Unicode icons still exist in 5 components (thread-panel, app-header, chat-view, message-list, message-input) and there are 18 P2 UX findings remaining — visual polish is a known non-goal for reconciliation

- **File:** `apps/web/components/`
- **Category:** Non-Goal: Visual Polish
- **Impact:** These are explicitly deferred aesthetic concerns. Reconciliation should not attempt to fix visual issues beyond critical accessibility (aria-labels, focus management).
- **Fix:** Tag all visual/UX items as 'deferred - not reconciliation scope'. Only include accessibility P0/P1 items in the reconciliation change plan.
