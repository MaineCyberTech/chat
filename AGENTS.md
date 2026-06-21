# AGENTS.md — Architecture & Implementation Status

## Architecture Overview

```
Browser → Cloudflare DNS → Caddy (TLS) → web:3000 (Next.js)
                                        → api:4000 (Express + Socket.io)
                                              → Supabase (PostgreSQL)
```

**Reverse Proxy**: Caddy 2 (zero-config TLS, auto ACME)
**DNS**: Cloudflare (proxied for DDoS protection)
**Compute**: Single DigitalOcean droplet (Ubuntu 24.04, s-1vcpu-512mb-10gb)

## Repository Map

| Directory            | Purpose                             | Key Files                                                                     |
| -------------------- | ----------------------------------- | ----------------------------------------------------------------------------- |
| `apps/api/`          | Express API server                  | `src/app.ts`, `src/modules/*/`, `Dockerfile`                                  |
| `apps/web/`          | Next.js 15 frontend                 | `app/`, `components/`, `lib/`                                                 |
| `packages/ui/`       | Shared React components             | `src/components/button.tsx`, etc.                                             |
| `packages/db/`       | Supabase client + types             | `src/config.ts`, `sql/`                                                       |
| `infra/docker/`      | Compose files, Caddyfile            | `docker-compose.devremote.yml`                                                |
| `infra/terraform/`   | DO droplet + DNS                    | `main.tf`, `templates/cloud-init.yaml.tftpl`                                  |
| `.github/workflows/` | CI/CD pipelines                     | `ci.yml`, `deploy-development.yml`, `build-push.yml`, `infra-development.yml` |
| `scripts/`           | Dev tooling                         | `setup-dev.ps1`, `teardown-dev.ps1`                                           |
| `supabase/`          | Local Supabase config               | `config.toml`                                                                 |
| `docs/`              | Architecture docs, runbooks, audits | `docs/architecture/`, `docs/prompts/`, `docs/audits/`                         |

## Implementation Status

### Complete

- Magic link auth (Supabase) with JWT middleware
- Workspaces & channels CRUD with RLS policies
- Real-time messaging (Socket.io rooms, typing, presence)
- Threaded replies, message edit/delete
- File uploads (Supabase Storage signed URLs)
- Full-text search (PostgreSQL tsvector)
- Rate limiting + Zod validation on all API routes
- 7 UI components (Avatar, Badge, Button, Dialog, Input, SidebarGroup, Skeleton)
- 6 SQL migrations, 5 RLS policy sets, 2 functions
- 54 unit tests across 12 files
- Caddy reverse proxy with auto-TLS
- Docker multi-stage builds (node:22-alpine)
- CI pipeline (validate → build images → push GHCR)
- Deploy pipeline (provision → pipe images → compose up → health check)
- Infra pipeline (Terraform import → apply → SSH health check)
- Local dev with Supabase CLI
- One-command setup/teardown scripts
- Security headers middleware (CSP, HSTS, XSS, framing, referrer, permissions)
- Dependabot config (weekly npm + GHA updates, grouped deps)
- SECURITY.md (vulnerability disclosure, sensitive areas)
- .editorconfig (consistent editor settings)
- Graceful shutdown handlers (10s drain timeout on SIGTERM/SIGINT)
- Health check with DB connectivity + latency (returns 503 when degraded)
- Zod env validation with LOG_LEVEL, SENTRY_DSN, SMTP config
- Sentry error tracking (API via @sentry/node, web via @sentry/nextjs)
- husky + lint-staged pre-commit hooks (prettier on staged files)
- Reusable validate.yml workflow_call (called by ci.yml)
- Path filters on deploy/build workflows (reduce unnecessary runs)
- Concurrency control with cancel-in-progress on deploy/build
- .env.example files for API and Web (developer onboarding)
- Pino structured logger (pino-pretty in dev, JSON in prod)
- Audit logging on all mutations (message, channel, workspace create/update/delete)
- Webhook endpoint + delivery tracking (SQL migrations + RLS policies)
- Same-domain API routing (Caddy reverse proxies /workspaces, /channels, /messages, /auth, /socket.io to API)
- Bundle analyzer for web (ANALYZE=true flag)
- Docker HEALTHCHECK on both API and web containers
- Server-side workspace membership checks on channel/message create routes
- UUID validation middleware on all resource route params
- In-app notification system (reply notifications, notification bell UI, unread polling)
- Webhook delivery pipeline (CRUD routes, auto-trigger on message/channel events, delivery logging)
- Responsive sidebar layout (hamburger menu at <768px breakpoint)
- CI gate: build depends on test; E2E tests run with mock Supabase
- Focus trap + close button on Dialog component
- ErrorBoundary wrapping workspace layout
- aria-labels on all icon buttons, focus-within for keyboard users
- Channel name displayed in ChatView header (not raw ID)
- aria-live polite region for new message announcements
- Docker mem_limit on all services (web=256m, api=192m, caddy=64m)
- Coverage thresholds (lines 40%, functions 30%, branches 30%)
- Auth flow tests (login form render, success, error states)
- Storage bucket RLS scoped by user_id
- Terraform remote state config (commented out, DO Spaces docs)
- CONTRIBUTING.md with dev workflow and PR guidelines

### Audits Completed (June 21, 2026)

- **Comparative repo audit** (8 phases): structural baseline, feature mapping, strengths/weaknesses, risk analysis, alignment roadmap, file-by-file change plan, patch set design. See `docs/audits/compare/`.
- **Frontend UI/UX audit** (8 phases): frontend inventory, information architecture, visual system, accessibility/responsiveness, comparative findings, refinement roadmap, change plan. See `docs/audits/frontend/`.
- **Security/AuthZ/Tenancy audit**: 21KB report covering auth flow correctness, authorization enforcement, tenant isolation, secret handling, exploit paths, and audit logging. See `docs/audits/security_authz_tenancy_audit_summary.md`.
- **API/Worker/Integrations audit**: 14KB report covering contract consistency, validation coverage, error handling, async safety, webhook reliability. See `docs/audits/api_worker_integrations_audit_summary.md`.
- **Database/Schema/Data Lifecycle audit**: 23KB report covering schema correctness, migration safety, relational integrity, multi-tenant data modeling, indexing, retention. See `docs/audits/database_schema_data_lifecycle_audit_summary.md`.
- **Infra/Deployment/Resilience audit**: 15KB report covering environment separation, Terraform state, Docker safety, deploy repeatability, health checks, CI/CD reliability. See `docs/audits/infra_deployment_resilience_audit_summary.md`.
- **Testing/QA/CI-CD audit**: 10KB report covering test coverage breadth, CI gate effectiveness, quality enforcement gaps. See `docs/audits/testing_qa_cicd_audit_summary.md`.
- **Docs/DevEx/Operations audit**: 20KB report covering onboarding quality, script/documentation completeness, runbook readiness, repo ergonomics. See `docs/audits/docs_devex_operations_audit_summary.md`.

### Known Issues

- **Cloudflare 521**: Cloudflare can't reach the origin server. May need DO firewall rules allowing Cloudflare IP ranges, or Cloudflare SSL/TLS set to Full + Let's Encrypt certs.

### Resolved Issues

- search_messages RLS bypass — Fixed with auth.uid() membership check
- audit_logs RLS policy broken — Fixed column reference
- workspace_members missing UPDATE/DELETE RLS — Added policies
- Webhook delivery pipeline non-functional — Implemented CRUD routes + auto-trigger
- Prod compose loads dev Caddyfile — Fixed to use Caddyfile.prod
- No Terraform remote state — Added config (commented out)
- No E2E tests in CI — Added E2E job with mock Supabase
- infra/docker/README.md references Traefik — Replaced with Caddy docs
- 512MB droplet OOM — Upgraded to s-2vcpu-2gb
- Let's Encrypt rate-limited — Resolved after June 21 expiry; Caddyfiles updated with auto-TLS
- Production deploy workflow untested — Fixed node version, SSH secrets, REPO_LC env

### Remaining Work

| Priority | Task                     | Notes                                                     |
| -------- | ------------------------ | --------------------------------------------------------- |
| LOW      | Production approval gate | GitHub Environment with required reviewers for production |
| LOW      | User profile avatars     | Avatar component exists but no upload flow                |

## GitHub Actions Workflows

| Workflow                 | Trigger                 | Purpose                                                               |
| ------------------------ | ----------------------- | --------------------------------------------------------------------- |
| `ci.yml`                 | push main/develop, PR   | Calls reusable validate.yml (test, lint, typecheck, build)            |
| `validate.yml`           | workflow_call           | Reusable: test, lint, typecheck, build jobs with Node 22 + pnpm cache |
| `build-push.yml`         | push develop            | Build Docker images → push to GHCR `:dev` tag (path-filtered)         |
| `deploy-development.yml` | push develop            | SSH to droplet, transfer files, pipe images, compose up, health check |
| `infra-development.yml`  | push infra/\*\* changes | Terraform provision droplet + DNS + firewall                          |

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
| --------------------------- | ------------- |
| `DO_API_TOKEN`              | infra, deploy |
| `CI_SSH_PUBLIC_KEY`         | infra         |
| `CI_SSH_PRIVATE_KEY`        | deploy        |
| `CF_API_TOKEN`              | infra         |
| `CF_ZONE_ID`                | infra         |
| `SUPABASE_URL`              | deploy, build |
| `SUPABASE_ANON_KEY`         | deploy, build |
| `SUPABASE_SERVICE_ROLE_KEY` | deploy        |
| `CF_ORIGIN_CERT`            | deploy        |
| `CF_ORIGIN_KEY`             | deploy        |
| `GITHUB_TOKEN`              | auto-provided |
