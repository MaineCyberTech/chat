# Reconciliation Report

- Prompt: **final_reconciliation_repo_audit**
- Domain: **reconciliation**
- Run ID: **final_reconciliation_repo_audit_20260701_182538**
- Generated: **2026-07-01T18:25:38Z**
- Decision: **GO WITH RISKS**
- P0: **1**, P1: **3**
- P2: **4**, P3: **3**
- Readiness: **71.00**

## Findings

### P0 — Feature-flag routes reference requireWorkspaceMembership('workspaceId') but no :workspaceId param exists in route path — every request returns 400

- **File:** `apps/api/src/modules/feature-flags/routes.ts`
- **Category:** phase_contracts
- **Impact:** Feature flags completely non-functional; all workspace feature-flag operations silently fail
- **Fix:** Remove requireWorkspaceMembership or add workspaceId as a body/query parameter

### P1 — API env schema uses EMAIL_FROM while shared packages/config/env-schema.ts uses SMTP_FROM — same purpose, different env var names

- **File:** `apps/api/src/config/env.ts`
- **Category:** env_drift
- **Impact:** Operators may set SMTP_FROM expecting it to be read, but API reads EMAIL_FROM and falls back silently
- **Fix:** Standardize on a single name (EMAIL_FROM), update shared schema to match

### P1 — Web env schema missing NEXT_PUBLIC_SENTRY_DSN, NEXT_PUBLIC_APP_VERSION, NEXT_PUBLIC_GIT_SHA, NEXT_PUBLIC_BUILD_TIME — all used in code but not validated

- **File:** `apps/web/lib/env.ts`
- **Category:** env_drift
- **Impact:** Version badge shows '0.0.0-dev' and 'local' in production; Sentry not configured on frontend
- **Fix:** Add missing vars to apps/web/lib/env.ts Zod schema

### P1 — Terraform state key is hardcoded with no environment interpolation — same state key for dev and prod

- **File:** `infra/terraform/versions.tf`
- **Category:** naming_consistency
- **Impact:** Parallel dev and prod Terraform operations corrupt each other's state
- **Fix:** Use ${var.environment} in state key to isolate environments

### P2 — Runbook references packages/db/sql/migrations/ directory which no longer exists — all migrations consolidated under supabase/migrations/

- **File:** `docs/runbooks/database-migrations.md`
- **Category:** dead_files
- **Impact:** Operators following runbook will look in wrong directory for migration files
- **Fix:** Update runbook to reference supabase/migrations/ as the single source of migrations

### P2 — Duplicate policy file sets exist: docs/hardening_super_bundle/policies/ and docs/audits/policies/ — risk of drift

- **File:** ``
- **Category:** dead_files
- **Impact:** Policy changes may be applied to one set but not the other; inconsistent gating
- **Fix:** Consolidate to single source of truth (hardening/policies/) and remove duplicates

### P2 — Migration sequence gap in 20260626 batch — jumps from 01 to 22 suggesting deleted or renumbered migrations

- **File:** ``
- **Category:** naming_consistency
- **Impact:** Potential confusion about migration history; Supabase CLI tracking may conflict
- **Fix:** Audit migration sequence; renumber or add placeholder files to fill gaps

### P2 — Webhook GET route reads workspace_id from query param but middleware checks req.params.workspaceId — they never match

- **File:** `apps/api/src/modules/webhooks/routes.ts`
- **Category:** phase_contracts
- **Impact:** Webhook listing bypasses workspace membership check via query param
- **Fix:** Create middleware that reads from req.query.workspace_id instead of req.params

### P3 — Production Caddyfile missing API subdomain block for chat-api.mainecybertech.com — DNS record exists but Caddy does not serve it

- **File:** `infra/docker/Caddyfile.prod`
- **Category:** naming_consistency
- **Impact:** Wasted DNS record; direct API subdomain access gets no response
- **Fix:** Remove unused DNS record or add Caddy site block for completeness

### P3 — Default droplet size still s-1vcpu-512mb-10gb despite known OOM issues — AGENTS.md documents upgrade to s-2vcpu-2gb

- **File:** `infra/terraform/variables.tf`
- **Category:** env_drift
- **Impact:** New dev droplets provisioned with undersized spec will experience OOM
- **Fix:** Update default droplet_size to s-2vcpu-2gb in terraform variables.tf

### P3 — Stale index (2).md file found in dashboard directory — appears to be a duplicate from a copy conflict

- **File:** `docs/audits/`
- **Category:** dead_files
- **Impact:** Git tracking noise; confusing for maintainers
- **Fix:** Remove duplicate index (2).md file
