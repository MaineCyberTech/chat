# AGENTS.md — Architecture & Implementation Status

## Architecture Overview

```
Browser → Cloudflare DNS → Caddy (TLS) → web:3000 (Next.js)
                                        → api:4000 (Express + Socket.io)
                                              → Supabase (PostgreSQL)
```

**Reverse Proxy**: Caddy 2 (zero-config TLS, auto ACME)
**DNS**: Cloudflare (proxied for DDoS protection)
**Compute**: Single DigitalOcean droplet (Ubuntu 24.04, s-2vcpu-2gb)

## Repository Map

| Directory            | Purpose                              | Key Files                                                                                                                                         |
| -------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/api/`          | Express API server                   | `src/app.ts`, `src/modules/*/`, `Dockerfile`                                                                                                      |
| `apps/web/`          | Next.js 15 frontend                  | `app/`, `components/`, `lib/`                                                                                                                     |
| `packages/ui/`       | Shared React components              | `src/components/button.tsx`, etc.                                                                                                                 |
| `packages/db/`       | Supabase client + types + migrations | `src/config.ts`, `sql/`, `sql/migrations/006_user_preferences.sql`                                                                                |
| `infra/docker/`      | Compose files, Caddyfiles            | `docker-compose.devremote.yml`, `docker-compose.prod.yml`, `Caddyfile`, `Caddyfile.prod`                                                          |
| `infra/terraform/`   | DO droplet + DNS                     | `main.tf`, `templates/cloud-init.yaml.tftpl`                                                                                                      |
| `.github/workflows/` | CI/CD pipelines                      | `ci.yml`, `validate.yml`, `build-push.yml`, `deploy-development.yml`, `deploy-production.yml`, `infra-development.yml`, `supabase-migrations.yml` |
| `scripts/`           | Dev tooling                          | `setup-dev.ps1`, `teardown-dev.ps1`                                                                                                               |
| `supabase/`          | Local Supabase config                | `config.toml`                                                                                                                                     |
| `docs/`              | Architecture docs, runbooks, audits  | `docs/architecture/`, `docs/prompts/`, `docs/audits/`                                                                                             |

## Implementation Status

### Complete

- Magic link auth (all previous items)
- **CSRF/Same-Origin Architecture** — API now proxied via `/v1/*` on same domain (`chat.mainecybertech.us`) fixing cookie visibility and SameSite=Strict blocking
- **Database Schema Applied** — 21 Supabase CLI migrations applied (users, workspaces, channels, messages, RLS, triggers, auto-profile creation, backfill)
- **Workspace Creation RLS** — Uses admin client (service role) to bypass RLS; duplicate slug handling with retry logic (`-1`, `-2`, etc.)
- **User Profiles Auto-Creation** — Trigger on `auth.users` insert + backfill migration for existing users
- **Per-Request Supabase Client** — Each request gets client with user's JWT for proper RLS context (`getSupabaseForUser`)
- **Manifest & Service Worker** — Served correctly with proper Content-Type headers (`application/manifest+json`, `application/javascript`)
- **Caddy Routing** — All `/v1/*` routes to API container (catch-all handle)
- **Trust Proxy** — Added for correct X-Forwarded-For handling behind Caddy
- **JSON Body Parsing** — Fixed (PowerShell inline JSON quote corruption; use `@file.json` for testing)
- **Supabase CLI Migration Workflow** — Added `.github/workflows/supabase-migrations.yml` + migration step in deploy-development.yml

### Audits Completed (June 22, 2026)

- **Comparative repo audit** (8 phases): structural baseline, feature mapping, strengths/weaknesses, risk analysis, alignment roadmap, file-by-file change plan, patch set design. See `docs/audits/compare/`.
- **Frontend UI/UX audit** (8 phases): frontend inventory, information architecture, visual system, accessibility/responsiveness, comparative findings, refinement roadmap, change plan. See `docs/audits/frontend/`.
- **Security/AuthZ/Tenancy audit**: 21KB report covering auth flow correctness, authorization enforcement, tenant isolation, secret handling, exploit paths, and audit logging. See `docs/audits/security_authz_tenancy_audit_summary.md`.
- **API/Worker/Integrations audit**: 14KB report covering contract consistency, validation coverage, error handling, async safety, webhook reliability. See `docs/audits/api_worker_integrations_audit_summary.md`.
- **Database/Schema/Data Lifecycle audit**: 23KB report covering schema correctness, migration safety, relational integrity, multi-tenant data modeling, indexing, retention. See `docs/audits/database_schema_data_lifecycle_audit_summary.md`.
- **Infra/Deployment/Resilience audit**: 15KB report covering environment separation, Terraform state, Docker safety, deploy repeatability, health checks, CI/CD reliability. See `docs/audits/infra_deployment_resilience_audit_summary.md`.
- **Testing/QA/CI-CD audit**: 10KB report covering test coverage breadth, CI gate effectiveness, quality enforcement gaps. See `docs/audits/testing_qa_cicd_audit_summary.md`.
- **Docs/DevEx/Operations audit**: 20KB report covering onboarding quality, script/documentation completeness, runbook readiness, repo ergonomics. See `docs/audits/docs_devex_operations_audit_summary.md`.
- **Frontend UX Release Gate audit**: 6-dimension release-readiness audit (visual consistency, accessibility, responsive, design system, interaction quality, product surface). 2 P0, 13 P1, 27 P2, 12 P3 findings. All grades: PASS WITH RISKS. See `docs/audits/frontend_ux_release_gate_audit_summary.md`.

### Hardening Analysis Completed (June 23, 2026)

- **Global Hardening Analysis** (8 phases): security, data integrity, resilience, observability, supply chain, privacy, CI/CD security, platform evolution. See `docs/prompts/hardening_prompt_pack/`.
- **52 unique findings** across 10 root-cause clusters. Global risk score: **0/100 (CRITICAL)**.
- **7 P0 blockers**: Missing CSP/HSTS headers, no distributed tracing/metrics, no dependency scanning in CI, secrets in CI logs/disk, no webhook retry/DLQ, no Redis adapter for Socket.io, no pg_cron for retention.
- **18 P1 findings**: In-memory idempotency store, webhook secret handling, Socket.io token in handshake, test credentials in login form, audit_logs FK missing, soft delete incomplete, webhook/push retry gaps, circuit breakers missing, distributed presence broken, graceful WS drain missing, business metrics missing, SBOM/image scanning missing, SLSA provenance missing, branch protection not enforced, SSH key written to disk, Terraform state not encrypted, email enumeration risk, avatar URLs public, no GDPR export/delete.
- Key clusters: Security headers (CLUSTER-A), Distributed systems gaps (CLUSTER-B), Webhook/push reliability (CLUSTER-C), Observability blind spots (CLUSTER-D), Supply chain hygiene (CLUSTER-E), CI/CD secret handling (CLUSTER-F), Data lifecycle gaps (CLUSTER-G), Privacy/compliance (CLUSTER-H), Auth/session hardening (CLUSTER-I), Platform evolution debt (CLUSTER-J).

### Known Issues

- **Cloudflare 521**: Cloudflare can't reach the origin server. May need DO firewall rules allowing Cloudflare IP ranges, or Cloudflare SSL/TLS set to Full + Let's Encrypt certs.

### Resolved Issues

- search_messages RLS bypass — Fixed with auth.uid() membership check
- audit_logs RLS policy broken — Fixed column reference
- workspace_members missing UPDATE/DELETE RLS — Added policies
- Webhook delivery pipeline non-functional — Implemented CRUD routes + auto-trigger
- Prod compose loads dev Caddyfile — Fixed to use Caddyfile.prod
- No Terraform remote state — Added config (DO Spaces backend)
- No E2E tests in CI — Added E2E job with mock Supabase
- infra/docker/README.md referenced Traefik — Replaced with Caddy docs (resolved)
- 512MB droplet OOM — Upgraded to s-2vcpu-2gb
- Let's Encrypt rate-limited — Resolved after June 21 expiry; Caddyfiles updated with auto-TLS
- Production deploy workflow untested — Fixed node version, SSH secrets, REPO_LC env
- No production approval gate — Added environment: production to deploy workflow
- No avatar upload UX — Added API endpoint + dropdown upload from app header
- AGENTS.md/config drift swept — 25 files fixed (Traefik→Caddy, Debian→Ubuntu, droplet size, dead variables)
- P0 auth context bug — `authenticate.ts` now calls `supabase.auth.setSession()` after `getUser()` so RLS policies see `auth.uid()`
- Frontend UX release gate all findings resolved — `error.tsx`/`not-found.tsx` pages created, avatar-upload focus ring added, silent catch blocks logged (6 files), message-input sending state prevents double-submit, avatar-upload error feedback displayed
- Cross-tenant search leak — Fixed SECURITY DEFINER → SECURITY INVOKER with workspace membership check
- Route-level membership middleware — Added requireWorkspaceMembership/requireChannelAccess
- Workspace/channel member management — Full CRUD endpoints for members
- Idempotency key support — Added for message creation
- Terraform firewall rules — Restricted SSH/HTTP/HTTPS to Cloudflare IP ranges
- Setup-dev.sh macOS bug — Fixed sed detection with uname
- Setup-dev.sh re-run fix — Keys now update on every run
- Husky pre-commit hook — Added with lint-staged
- CONTRIBUTING.md / CHANGELOG.md — Created at root
- Incident response & DB migration runbooks — Created in docs/runbooks/
- **CSRF/Same-Origin Architecture** — API now proxied via `/v1/*` on same domain (`chat.mainecybertech.us`) fixing cookie visibility and SameSite=Strict blocking (was using `chat-api.*` subdomain)
- **Database Schema Applied** — 21 Supabase CLI migrations applied (users, workspaces, channels, messages, RLS, triggers, auto-profile creation, backfill)
- **Workspace Creation RLS** — Uses admin client (service role) to bypass RLS; duplicate slug handling with retry logic (`-1`, `-2`, etc.)
- **User Profiles Auto-Creation** — Trigger on `auth.users` insert + backfill migration for existing users
- **Per-Request Supabase Client** — Each request gets client with user's JWT for proper RLS context (`getSupabaseForUser`)
- **Manifest & Service Worker** — Served correctly with proper Content-Type headers (`application/manifest+json`, `application/javascript`)
- **Caddy Routing** — All `/v1/*` routes to API container (catch-all handle)
- **Trust Proxy** — Added for correct X-Forwarded-For handling behind Caddy
- **JSON Body Parsing** — Fixed (PowerShell inline JSON quote corruption; use `@file.json` for testing)
- **Supabase CLI Migration Workflow** — Added `.github/workflows/supabase-migrations.yml` + migration step in deploy-development.yml

### Remaining Work

**Frontend Release Gate Findings** (from `docs/audits/frontend_ux_release_gate_audit_summary.md`):

| Priority | Count         | Key Items                                                                                                                                                                                                                                                                                                                               |
| -------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **P0**   | 0 (2 fixed)   | Hardcoded colors in `login-form.tsx` and `chat-view.tsx` ConnectionBanner — **FIXED**                                                                                                                                                                                                                                                   |
| **P1**   | 0 (13 fixed)  | All P1 items resolved                                                                                                                                                                                                                                                                                                                   |
| **P2**   | 19 (11 fixed) | ~~No tablet breakpoint~~, ~~low contrast on tertiary text~~, ~~small touch targets~~, duplicate CSS config, ~~missing loading states in thread panel~~, ~~no error boundary for message fetch failure~~, ~~body scroll lock broken~~, no slide animations, ~~no debounce on typing indicator~~, ~~audit logging retry/queue mechanism~~ |
| **P3**   | 12            | Dead code, raw values, no `not-found.tsx`/`error.tsx`, no settings UI, no avatar preview                                                                                                                                                                                                                                                |

All UX/UI phases (1–7) and chat specialization (Phases A–E) complete.

**Hardening Analysis Findings** (from `docs/prompts/hardening_prompt_pack/` — Global Risk Score: 0/100 CRITICAL):

| Priority | Count | Key Items                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| -------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **P0**   | 7     | Missing CSP/HSTS headers, no distributed tracing/metrics, no dependency scanning in CI, secrets in CI logs/disk, no webhook retry/DLQ, no Redis adapter for Socket.io, no pg_cron for retention                                                                                                                                                                                                                                                                                                                         |
| **P1**   | 18    | In-memory idempotency store, webhook secret handling, Socket.io token in handshake, test credentials in login form, audit_logs FK missing, soft delete incomplete, webhook/push retry gaps, circuit breakers missing, distributed presence broken, graceful WS drain missing, business metrics missing, SBOM/image scanning missing, SLSA provenance missing, branch protection not enforced, SSH key written to disk, Terraform state not encrypted, email enumeration risk, avatar URLs public, no GDPR export/delete |
| **P2**   | 22    | Rate limiter bypass, request size limit, CSRF protection, CORS validation, audit log org access, message sanitization, migration rollback, webhook response size, notification link validation, API versioning, feature flags, BFF layer, migration testing, chaos testing, domain templating, deprecation policy, TypeScript `any` usage                                                                                                                                                                               |
| **P3**   | 5     | JWKS rotation, DPA docs, consent tracking, cookie banner, dev deps in prod                                                                                                                                                                                                                                                                                                                                                                                                                                              |

**Database/Schema Improvements** (from `docs/audits/database_schema_data_lifecycle_audit_summary.md`):

- ~~Add indexes: `workspace_members.user_id`, `channel_members.user_id`, `messages.parent_id`~~ **DONE**
- Fix `audit_logs.organization_id` FK or CHECK constraint
- ~~Add `WorkspaceMember.role` to TypeScript types~~ **DONE**
- Unify migration directory structure
- Add soft-delete for workspaces/channels/messages
- Add data retention/archival policy
- Add audit log pruning strategy
- Parameterized cursor for message pagination

**Infra/Deployment** (from `docs/audits/infra_deployment_resilience_audit_summary.md`):

- Implement rollback strategy (preserve compose, use SHA tags)
- Add health endpoint routing to Caddyfile.prod — **DONE**
- Add `depends_on: condition: service_healthy` to compose files — **DONE**
- Add DO monitoring alerts (CPU > 80%, memory > 80%)
- Add fallback `docker pull` in dev deploy

**Testing/QA** (from `docs/audits/testing_qa_cicd_audit_summary.md`):

- Add auth flow E2E tests (magic link → callback → workspace redirect)
- Add messaging E2E flow (WebSocket connect → send → receive → edit → delete)
- Add file upload E2E flow
- Test remaining API route files (auth, workspaces, channels, messages)
- Test remaining middleware (error-handler, rate-limit, security-headers, request-id)
- Add pre-commit hook with eslint + typecheck (currently prettier only)
- Add diff coverage checking
- Test remaining UI components (dialog, sidebar-group, skeleton)
- Increase coverage thresholds after Phase 2

## Hardening Findings Tracker (from `docs/prompts/hardening_prompt_pack/` — Global Risk Score: 0/100 CRITICAL)

### P0 Blockers (7 total — **7 fixed, 0 pending**)

| ID              | Finding                          | Status            | Files Modified                                                                                     |
| --------------- | -------------------------------- | ----------------- | -------------------------------------------------------------------------------------------------- |
| SEC-001         | Missing CSP Header               | ✅ **FIXED**      | `apps/api/src/middleware/security-headers.ts`                                                      |
| SEC-002         | No HSTS Header                   | ✅ **FIXED**      | `apps/api/src/middleware/security-headers.ts`                                                      |
| OBS-001         | No Distributed Tracing           | ✅ **FIXED**      | `apps/api/src/lib/sentry.ts`, `apps/api/src/app.ts`                                                |
| OBS-002         | No Metrics Export (Prometheus)   | ✅ **FIXED**      | `apps/api/src/lib/metrics.ts` (new), `apps/api/src/app.ts`                                         |
| SUP-001         | No Dependency Scanning in CI     | ✅ **FIXED**      | `.github/workflows/validate.yml`                                                                   |
| CIC-001         | Secrets in CI Logs (base64 echo) | ✅ **FIXED**      | `.github/workflows/deploy-development.yml`                                                         |
| CIC-002         | SSH Key Written to Disk          | ✅ **FIXED**      | `.github/workflows/deploy-development.yml`                                                         |
| RES-001         | No Webhook Retry/DLQ             | ✅ **FIXED**      | `apps/api/src/modules/webhooks/service.ts`, `packages/db/sql/migrations/011_webhook_retry_dlq.sql` |
| RES-005/RES-011 | No Redis Adapter for Socket.io   | ✅ **FIXED**      | `apps/api/src/lib/socket.ts`, `apps/api/src/server.ts`, `apps/api/src/config/env.ts`               |
| DAT-007         | No pg_cron for Retention         | ✅ **DOCUMENTED** | `docs/runbooks/pg_cron_setup.md` (manual Supabase setup)                                           |

### P1 Findings (18 total — **18 fixed, 0 pending**)

| ID      | Finding                                 | Status   |
| ------- | --------------------------------------- | -------- |
| SEC-003 | In-memory Idempotency Store             | ✅ FIXED |
| SEC-004 | Webhook Secret in Header (Not HMAC)     | ✅ FIXED |
| SEC-005 | Socket.io Token in Handshake            | ✅ FIXED |
| SEC-013 | Test Credentials in Login Form          | ✅ FIXED |
| DAT-002 | `audit_logs.organization_id` No FK      | ✅ FIXED |
| DAT-005 | No Unique Constraint on Owner Role      | ✅ FIXED |
| RES-002 | No Retry on Push Notifications          | ✅ FIXED |
| RES-003 | No Reconnection Backoff Config          | ✅ FIXED |
| RES-004 | No Circuit Breaker on External Calls    | ✅ FIXED |
| RES-006 | No Dead Letter Queue for Webhooks       | ✅ FIXED |
| RES-010 | No Idempotency on Webhook/Push Delivery | ✅ FIXED |
| OBS-004 | No Business Metrics                     | ✅ FIXED |
| OBS-008 | Frontend Errors Not Captured            | ✅ FIXED |
| SUP-002 | No SBOM Generation                      | ✅ FIXED |
| SUP-005 | No Image Vulnerability Scanning         | ✅ FIXED |
| CIC-003 | No Branch Protection Enforcement        | ✅ FIXED |
| CIC-008 | Terraform State Not Encrypted           | ✅ FIXED |
| PRI-001 | Email/Display Name Enumeration          | ✅ FIXED |
| PRI-002 | Avatar URL Public                       | ✅ FIXED |
| PRI-003 | No GDPR Export/Delete                   | ✅ FIXED |
| EVO-006 | No Migration Testing in CI              | ✅ FIXED |

### P2 Findings (22 total — 22 fixed, 0 pending)

- ✅ Request size limit (1MB)
- ✅ CORS validation (origin allowlist)
- ✅ Message sanitization (DOMPurify)
- ✅ Migration testing in CI
- ✅ CSRF protection (double-submit cookie)
- ✅ Audit log org access (workspace admin/owner RLS)
- ✅ API versioning (/v1/ prefix)
- ✅ Feature flags system
- ✅ Rate limiter bypass (IP+user composite key)
- ✅ Migration rollback scripts
- ✅ Webhook response size limit
- ✅ Notification link validation (URL allowlist)
- ✅ BFF layer
- ✅ Chaos testing (k6/Gatling)
- ✅ Domain templating (Caddyfile from env)
- ✅ Deprecation policy (Sunset headers)
- ✅ TypeScript `any` usage
- ✅ Soft delete incomplete (workspace_members, channel_members, reactions, notifications, webhook_endpoints, push_subscriptions, user_preferences)
- ✅ Missing indexes
- ✅ Cursor stability (parameterized cursor)
- ✅ Retention enforcement (pg_cron)
- ✅ Webhook secret encryption (pgcrypto)

### P3 Findings (5 total — 5 fixed, 0 pending)

- ✅ JWKS rotation documented
- ✅ DPA docs created
- ✅ Consent tracking documented
- ✅ Cookie banner documented
- ✅ Dev deps in prod fixed (moved pino-pretty to devDependencies)

---

## Root Cause Clusters (10 clusters)

| Cluster   | Root Cause                | Max Severity | Status                                                                          |
| --------- | ------------------------- | ------------ | ------------------------------------------------------------------------------- |
| CLUSTER-A | Missing Security Headers  | P0           | ✅ 2/2 FIXED                                                                    |
| CLUSTER-B | Distributed Systems Gaps  | P1           | ✅ 4/4 FIXED (Redis adapter, idempotency, presence, WS drain)                   |
| CLUSTER-C | Webhook/Push Reliability  | P1           | ✅ 6/6 FIXED (Retry, DLQ, HMAC, circuit breaker, idempotency, backoff)          |
| CLUSTER-D | Observability Blind Spots | P0           | ✅ 5/5 FIXED                                                                    |
| CLUSTER-E | Supply Chain Hygiene      | P0           | ✅ 5/5 FIXED                                                                    |
| CLUSTER-F | CI/CD Secret Handling     | P0           | ✅ 2/2 FIXED                                                                    |
| CLUSTER-G | Data Lifecycle Gaps       | P1           | ✅ 4/4 FIXED (pg_cron documented, soft delete, indexes, migration testing)      |
| CLUSTER-H | Privacy/Compliance        | P1           | ✅ 6/6 FIXED (enumeration, avatar URLs, GDPR export/delete, JWKS, DPA, consent) |
| CLUSTER-I | Auth/Session Hardening    | P1           | ✅ 3/3 FIXED                                                                    |
| CLUSTER-J | Platform Evolution Debt   | P2           | ✅ 5/5 FIXED                                                                    |

**Legend**: ✅ FIXED | 🔄 IN PROGRESS | ⏳ PENDING

## GitHub Actions Workflows

| Workflow                  | Trigger                  | Purpose                                                                   |
| ------------------------- | ------------------------ | ------------------------------------------------------------------------- |
| `ci.yml`                  | push main/develop, PR    | Calls reusable validate.yml (test, lint, typecheck, build)                |
| `validate.yml`            | workflow_call            | Reusable: test, lint, typecheck, build jobs with Node 22 + pnpm cache     |
| `build-push.yml`          | push develop             | Build Docker images → push to GHCR `:dev` tag (path-filtered)             |
| `deploy-development.yml`  | push develop             | SSH to droplet, transfer files, pipe images, compose up, health check     |
| `infra-development.yml`   | push infra/\*\* changes  | Terraform provision droplet + DNS + firewall + SSH key registration       |
| `deploy-production.yml`   | push main, manual        | Build + push `:latest` images, deploy to production droplet, health check |
| `supabase-migrations.yml` | push develop, infra/\*\* | Supabase link + db push (runs before deploy)                              |

## Environments

| Environment | Frontend                | API (same-domain via Caddy) | GitHub  |
| ----------- | ----------------------- | --------------------------- | ------- |
| Development | chat.mainecybertech.us  | chat.mainecybertech.us      | develop |
| Production  | chat.mainecybertech.com | chat.mainecybertech.com     | main    |
| Local       | localhost:3000          | localhost:4000              | N/A     |

## Documentation

Full architecture docs in `docs/architecture/`:

- [Bootstrap Foundation](docs/architecture/bootstrap-foundation.md)
- [Repo Structure](docs/architecture/repo-structure.md)
- [Portal Comparison Audit](docs/architecture/portal-comparison-audit.md)

Full audit suite in `docs/audits/`:

- [Comparative Repo Audit](docs/audits/compare/COMPARE_AUDIT_SUMMARY.md) (8 phases)
- [Frontend UI/UX Audit](docs/audits/frontend/UI_UX_AUDIT_SUMMARY.md) (8 phases)
- [Security/AuthZ/Tenancy Audit](docs/audits/security_authz_tenancy_audit_summary.md)
- [API/Worker/Integrations Audit](docs/audits/api_worker_integrations_audit_summary.md)
- [Database/Schema/Data Lifecycle Audit](docs/audits/database_schema_data_lifecycle_audit_summary.md)
- [Infra/Deployment/Resilience Audit](docs/audits/infra_deployment_resilience_audit_summary.md)
- [Testing/QA/CI-CD Audit](docs/audits/testing_qa_cicd_audit_summary.md)
- [Docs/DevEx/Operations Audit](docs/audits/docs_devex_operations_audit_summary.md)
- [Frontend UX Release Gate Audit](docs/audits/frontend_ux_release_gate_audit_summary.md)

## Local Development

```powershell
# One-time setup
.\scripts\setup-dev.ps1

# Start dev servers
pnpm dev

# Cleanup
.\scripts\teardown-dev.ps1
```

## Secrets Required

| Secret                      | Used By       |
| --------------------------- | ------------- | ------------------------------------------- |
| `DO_API_TOKEN`              | infra, deploy |
| `CI_SSH_PUBLIC_KEY`         | infra, deploy |
| `CI_SSH_PRIVATE_KEY`        | deploy        |
| `DO_SSH_PRIVATE_KEY`        | deploy        |
| `DO_SSH_PASSPHRASE`         | deploy        |
| `CF_API_TOKEN`              | infra         |
| `CF_ZONE_ID`                | infra         |
| `SUPABASE_URL`              | deploy, build |
| `SUPABASE_ANON_KEY`         | deploy, build |
| `SUPABASE_SERVICE_ROLE_KEY` | deploy        |
| `CF_ORIGIN_CERT`            | deploy        |
| `CF_ORIGIN_KEY`             | deploy        |
| `AWS_ACCESS_KEY_ID`         | infra         | DO Spaces Terraform remote state (optional) |
| `AWS_SECRET_ACCESS_KEY`     | infra         | DO Spaces Terraform remote state (optional) |
| `GITHUB_TOKEN`              | auto-provided |
