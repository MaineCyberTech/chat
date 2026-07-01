# Principal Audit Report

- Prompt: **environment_drift_audit**
- Domain: **environment**
- Run ID: **environment_drift_audit_20260701_071112**
- Generated: **2026-07-01T07:11:05Z**
- Decision: **NO-GO**
- P0: **3**, P1: **5**
- P2: **4**, P3: **2**
- Readiness: **37.00**

## Findings

### P0 — Production Caddyfile missing API subdomain block — chat-api.mainecybertech.com DNS exists but Caddy does not serve it

- **File:** `infra/docker/Caddyfile.prod`
- **Category:** domain_consistency
- **Impact:** Direct API access to production API subdomain gets no TLS termination — mysterious connection failures
- **Fix:** Add site block for chat-api.mainecybertech.com to Caddyfile.prod, or remove the unused DNS record

### P0 — Same Terraform state key for both environments — no environment isolation in state key

- **File:** `infra/terraform/versions.tf`
- **Category:** domain_consistency
- **Impact:** Dev and prod Terraform operations use the same state — one environment's changes can corrupt the other
- **Fix:** Use environment-specific state keys (e.g., infra/terraform/${var.environment}.tfstate)

### P0 — API env schema and shared config package have 11 variable mismatches (optional vs required, missing vars, name conflicts)

- **File:** `apps/api/src/config/env.ts`
- **Category:** env_variable_parity
- **Impact:** API starts with missing required config; EMAIL_FROM vs SMTP_FROM name collision causes silent fallback
- **Fix:** Synchronize env.ts with env-schema.ts; resolve EMAIL_FROM/SMTP_FROM naming; add REDIS_TLS, SENTRY_ENVIRONMENT, VAPID_SUBJECT

### P1 — SMTP/email env vars not set in any deployment workflow — SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM all missing

- **File:** `.github/workflows/deploy-development.yml`
- **Category:** env_variable_parity
- **Impact:** Password reset emails and transactional emails will fail in deployed environments
- **Fix:** Add SMTP configuration with SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM secrets to both deploy workflows

### P1 — Sentry DSN never set in any deployment — SENTRY_DSN and NEXT_PUBLIC_SENTRY_DSN not configured

- **File:** `.github/workflows/deploy-development.yml`
- **Category:** feature_flag_gaps
- **Impact:** Error tracking in deployed environments silently falls back to unconfigured state — no error capture
- **Fix:** Add SENTRY_DSN and NEXT_PUBLIC_SENTRY_DSN secrets to both deploy workflows

### P1 — Dev API subdomain (chat-api.mainecybertech.us) deployed but unused — DNS + Caddy block but nothing uses it

- **File:** `infra/terraform/main.tf`
- **Category:** domain_consistency
- **Impact:** Wasted TLS cert issuance, DNS record, and Caddy config — all API traffic goes through same-domain /v1/\* proxy
- **Fix:** Remove API subdomain DNS record for development, or document as future architecture option

### P1 — Web env schema missing 4 validated variables: NEXT_PUBLIC_SENTRY_DSN, NEXT_PUBLIC_APP_VERSION, NEXT_PUBLIC_GIT_SHA, NEXT_PUBLIC_BUILD_TIME

- **File:** `apps/web/lib/env.ts`
- **Category:** env_variable_parity
- **Impact:** Version badge always shows '0.0.0-dev' and 'local' in production; Sentry not configured on frontend
- **Fix:** Add these vars to apps/web/lib/env.ts Zod schema

### P2 — Default droplet size is s-1vcpu-512mb-10gb but 512MB is known to cause OOM (documented in AGENTS.md)

- **File:** `infra/terraform/variables.tf`
- **Category:** env_variable_parity
- **Impact:** Development droplet will run out of memory under normal load
- **Fix:** Update default droplet size to s-2vcpu-2gb in terraform variables.tf

### P2 — Supabase migrations use same SUPABASE_PROJECT_REF for both dev and prod — no separate Supabase project

- **File:** `.github/workflows/supabase-migrations.yml`
- **Category:** domain_consistency
- **Impact:** Migrations applied via develop branch directly affect the same database as main
- **Fix:** Use separate Supabase projects for development and production with separate project ref secrets

### P2 — No frontend feature flag client — flags only available server-side through API

- **File:** `apps/api/src/lib/feature-flags.ts`
- **Category:** feature_flag_gaps
- **Impact:** Cannot gate frontend features with feature flags; flag evaluation requires API round-trip
- **Fix:** Create frontend feature flag client (or inject flags from server props) for client-side feature gating

### P2 — Feature flags use in-memory cache per instance — no Redis-backed cache invalidation

- **File:** `apps/api/src/lib/feature-flags.ts`
- **Category:** feature_flag_gaps
- **Impact:** Multi-instance deployments see stale flag state up to 60s; flag change on one instance invalidates only that instance's cache
- **Fix:** Use Redis pub/sub for cross-instance cache invalidation

### P3 — Dev Caddyfile lacks static asset caching that prod has — no Cache-Control max-age for static assets

- **File:** `infra/docker/Caddyfile`
- **Category:** domain_consistency
- **Impact:** Development environment serves static assets without browser caching — slower local dev experience
- **Fix:** Add @static matcher with max-age directive to dev Caddyfile

### P3 — Push subscription service reads VAPID_PUBLIC_KEY and EMAIL_FROM directly from process.env instead of validated env schema

- **File:** `apps/api/src/modules/notifications/push-subscription-service.ts`
- **Category:** env_variable_parity
- **Impact:** Env var validation bypassed — missing vars cause silent runtime failures instead of startup errors
- **Fix:** Import validated env config instead of reading process.env directly
