# Reconciliation Report

- Prompt: **environment_drift_audit**
- Domain: **environment**
- Run ID: **environment_drift_audit_20260708_073230**
- Generated: **2026-07-07T03:42:00Z**
- Decision: **GO WITH RISKS**
- P0: **0**, P1: **0**
- P2: **4**, P3: **3**
- Readiness: **64.00**

## Findings

### P2 — API env schema uses .optional() for SUPABASE_URL and SUPABASE_ANON_KEY while worker schema requires them
- **File:** `apps/api/src/config/env.ts`
- **Category:** config_consistency
- **Impact:** Drift between environments: API starts without Supabase (degraded mode), worker crashes without Supabase. This inconsistency makes deployment expectations unclear and leads to different behavior per service.
- **Fix:** Align API env schema with worker schema: make SUPABASE_URL and SUPABASE_ANON_KEY required. Remove the degraded-mode path or add explicit env flag for running without database.

### P2 — HEALTH_PORT not defined in any environment schema; read directly from process.env with fallback to 4100
- **File:** `apps/worker/src/main.ts`
- **Category:** health_port
- **Impact:** The worker health port is not validated or documented in the shared environment schema. Deployments that set a non-numeric HEALTH_PORT will silently use the fallback.
- **Fix:** Add HEALTH_PORT to packages/config/env-schema.ts with number coercion. Default to 4100 in schema, not in code.

### P2 — No deployment preview environments exist for testing infrastructure changes before production
- **File:** `infra/docker/`
- **Category:** deployment_parity
- **Impact:** Infrastructure changes (Docker Compose, Caddyfile, env vars) cannot be validated in an isolated environment before reaching production, risking breaking changes to the live deployment.
- **Fix:** Add a staging environment with a separate Docker Compose file and Caddy config. Use Terraform workspaces or separate tfvars files for staging. Wire into CI/CD for auto-deploy on PR.

### P2 — No .env.example file or env template committed to repository for onboarding
- **File:** `apps/api/src/config/env.ts`
- **Category:** env_tooling
- **Impact:** New developers must guess required environment variables by reading code. This slows onboarding and creates risk of missing required config in new environments.
- **Fix:** Create .env.example at repo root documenting every environment variable, its type, default, and which service uses it. Add a pre-start check comparing against the schema.

### P3 — No environment drift detection tooling to compare dev vs staging vs production env configurations
- **File:** `packages/config/env-schema.ts`
- **Category:** env_tooling
- **Impact:** Configuration drift between environments goes undetected until a runtime failure occurs in production that cannot be reproduced locally.
- **Fix:** Add a script (scripts/audit/env-drift-check.ts) that compares expected environment variables against actual in each deployment. Integrate into CI/CD as a pre-deploy check.

### P3 — Console.warn/error used directly in PWA push client instead of structured logging through the application logger
- **File:** `apps/web/lib/pwa/push-client.ts`
- **Category:** deployment_parity
- **Impact:** PWA push notification errors in production are not captured in structured logs or Sentry, making debugging push delivery failures difficult.
- **Fix:** Replace console.warn/console.error with proper logger calls or Sentry capture. Ensure push notification errors are visible in production observability tooling.

### P3 — Environment variable documentation does not specify which variables are required per service (api, worker, web)
- **File:** ``
- **Category:** env_tooling
- **Impact:** Operators setting up a new deployment must reverse-engineer which env vars each service needs, increasing setup time and misconfiguration risk.
- **Fix:** Annotate each env var in .env.example with a service tag: [api], [worker], [web], [all]. Generate per-service .env.example files from the schema.
