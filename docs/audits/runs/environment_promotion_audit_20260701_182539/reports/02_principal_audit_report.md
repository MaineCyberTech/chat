# Principal Audit Report

- Prompt: **environment_promotion_audit**
- Domain: **environment**
- Run ID: **environment_promotion_audit_20260701_182539**
- Generated: **2026-07-01T18:25:38Z**
- Decision: **NO-GO**
- P0: **2**, P1: **3**
- P2: **2**, P3: **2**
- Readiness: **50.00**

## Findings

### P0 — Terraform state key hardcoded without environment interpolation — dev and prod share the same state file

- **File:** `infra/terraform/versions.tf`
- **Category:** domains
- **Impact:** Parallel Terraform operations for dev and prod will corrupt state; irreversible state conflicts on concurrent applies
- **Fix:** Use ${var.environment} in backend key to isolate environment state

### P0 — Same SUPABASE_PROJECT_REF secret for dev and prod — no separate Supabase project per environment

- **File:** `.github/workflows/supabase-migrations.yml`
- **Category:** secrets
- **Impact:** Migrations applied from develop branch directly target the same database as main branch migrations
- **Fix:** Create separate Supabase projects for dev and prod; add separate secret names

### P1 — Prod Caddyfile only has /health route for health checks; dev Caddyfile has /healthz and /health\* with API subdomain

- **File:** `infra/docker/Caddyfile.prod`
- **Category:** caddy_tls
- **Impact:** Health check routing differs between environments — deployment validation may succeed in dev but fail in prod
- **Fix:** Standardize health endpoints: add /healthz and /health\* handle_path to prod Caddyfile

### P1 — SMTP/email env vars not configured in any deployment workflow — SMTP_HOST/PORT/USER/PASS and EMAIL_FROM all missing

- **File:** `.github/workflows/`
- **Category:** secrets
- **Impact:** Password reset and transactional emails non-functional in both dev and prod environments
- **Fix:** Add SMTP configuration secrets to all deploy workflows; validate at deploy time

### P1 — No backup/restore procedure documented for production — Supabase PITR is the only recovery option but undocumented

- **File:** ``
- **Category:** backup_config
- **Impact:** Production data recovery during incident requires guessing procedures; no documented RTO/RPO
- **Fix:** Create docs/runbooks/backup-restore.md with PITR procedure, storage backup, and DR runbook

### P2 — Default droplet size s-1vcpu-512mb-10gb known to OOM — documented in AGENTS.md but not updated in Terraform

- **File:** `infra/terraform/variables.tf`
- **Category:** resource_limits
- **Impact:** New dev droplets provision at undersized spec; OOM under normal load
- **Fix:** Update default droplet_size to s-2vcpu-2gb in variables.tf

### P2 — Production version badge build-args not passed — NEXT_PUBLIC_APP_VERSION, NEXT_PUBLIC_GIT_SHA, NEXT_PUBLIC_BUILD_TIME omitted

- **File:** `.github/workflows/deploy-production.yml`
- **Category:** image_tags
- **Impact:** Production always shows 'v0.0.0-dev' and 'local'; cannot identify deployed version from badge
- **Fix:** Add NEXT_PUBLIC_APP_VERSION=${{ github.ref_name }}-${{ github.run_number }}, NEXT_PUBLIC_GIT_SHA, NEXT_PUBLIC_BUILD_TIME to web Docker build

### P3 — Dev API subdomain (chat-api.mainecybertech.us) deployed but unused — DNS + Caddy block exist but nothing consumes it

- **File:** ``
- **Category:** domains
- **Impact:** Wasted TLS cert, DNS record, and Caddy config; all API traffic goes through same-domain /v1/\* proxy
- **Fix:** Remove unused API subdomain DNS record for development; document as future option

### P3 — No external uptime monitoring for production — only Docker HEALTHCHECK and deploy-time validation

- **File:** ``
- **Category:** health_endpoints
- **Impact:** Production downtime detected only when users report it or email alerts trigger for CPU/memory
- **Fix:** Add free-tier uptime monitoring (UptimeRobot or Better Uptime) checking /healthz every 5 minutes
