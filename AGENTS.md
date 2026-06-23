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

| Directory            | Purpose                              | Key Files                                                                                                              |
| -------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `apps/api/`          | Express API server                   | `src/app.ts`, `src/modules/*/`, `Dockerfile`                                                                           |
| `apps/web/`          | Next.js 15 frontend                  | `app/`, `components/`, `lib/`                                                                                          |
| `packages/ui/`       | Shared React components              | `src/components/button.tsx`, etc.                                                                                      |
| `packages/db/`       | Supabase client + types + migrations | `src/config.ts`, `sql/`, `sql/migrations/006_user_preferences.sql`                                                     |
| `infra/docker/`      | Compose files, Caddyfiles            | `docker-compose.devremote.yml`, `docker-compose.prod.yml`, `Caddyfile`, `Caddyfile.prod`                               |
| `infra/terraform/`   | DO droplet + DNS                     | `main.tf`, `templates/cloud-init.yaml.tftpl`                                                                           |
| `.github/workflows/` | CI/CD pipelines                      | `ci.yml`, `validate.yml`, `build-push.yml`, `deploy-development.yml`, `deploy-production.yml`, `infra-development.yml` |
| `scripts/`           | Dev tooling                          | `setup-dev.ps1`, `teardown-dev.ps1`                                                                                    |
| `supabase/`          | Local Supabase config                | `config.toml`                                                                                                          |
| `docs/`              | Architecture docs, runbooks, audits  | `docs/architecture/`, `docs/prompts/`, `docs/audits/`                                                                  |

## Implementation Status

### Complete

- Magic link auth (Supabase) with JWT middleware
- Workspaces & channels CRUD with RLS policies
- Real-time messaging (Socket.io rooms, typing, presence)
- Threaded replies, message edit/delete
- File uploads (Supabase Storage signed URLs)
- Full-text search (PostgreSQL tsvector)
- Rate limiting + Zod validation on all API routes
- 8 UI components (Avatar, Badge, Button, Dialog, Input, SidebarGroup, Skeleton, ThemeToggle)
- 7 SQL migrations, 5 RLS policy sets, 1 function
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
- Subdomain API routing (Caddy reverse proxies `chat-api.*` subdomain to `api:4000`) with fallback same-domain routing for `/socket.io`
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
- Terraform remote state config (DO Spaces backend configured)
- CONTRIBUTING.md with dev workflow and PR guidelines
- Avatar upload UI (dropdown upload from app header, signed URL flow)
- Production deploy workflow tested (node version 22, SSH secrets, REPO_LC env)
- Production approval gate configured (GitHub Environment on deploy job)
- Design system token architecture (7 token modules in `packages/ui/src/tokens/`)
- 7 UI components updated to use semantic CSS variables (`var(--color-*)`)
- Tailwind v4 CSS-first configuration with `@theme` and automatic dark mode
- 7 additional app components migrated (ChatView, AppSidebar, NotificationBell, AvatarUpload, CreateWorkspaceDialog, CreateChannelDialog, LandingShell)
- Accessibility pass: ARIA roles, focus-visible, reduced motion, touch targets, body scroll lock
- Client-side theme toggle (`ThemeToggle`) with `useTheme` hook, `ThemeProvider`, and `html.dark` class-based dark mode
- Anti-FOUC inline script in root layout
- User preferences DB migration (`006_user_preferences.sql`) with RLS policies
- `GET /auth/preferences` and `PATCH /auth/preferences` API endpoints with Zod validation
- User preferences TypeScript types (`UserPreferences`, `ThemePreference`)
- Cross-tenant search leak fixed (SECURITY DEFINER → SECURITY INVOKER + auth.uid() check)
- Route-level membership middleware (requireWorkspaceMembership, requireChannelAccess)
- Workspace/channel member management endpoints (add, remove, update role)
- Idempotency key support for message creation
- Terraform firewall rules restricted to Cloudflare IP ranges
- Incident response & database migration runbooks

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

### Remaining Work

**Frontend Release Gate Findings** (from `docs/audits/frontend_ux_release_gate_audit_summary.md`):

| Priority | Count         | Key Items                                                                                                                                                                                                                                                                                                                               |
| -------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **P0**   | 0 (2 fixed)   | Hardcoded colors in `login-form.tsx` and `chat-view.tsx` ConnectionBanner — **FIXED**                                                                                                                                                                                                                                                   |
| **P1**   | 0 (13 fixed)  | All P1 items resolved                                                                                                                                                                                                                                                                                                                   |
| **P2**   | 19 (11 fixed) | ~~No tablet breakpoint~~, ~~low contrast on tertiary text~~, ~~small touch targets~~, duplicate CSS config, ~~missing loading states in thread panel~~, ~~no error boundary for message fetch failure~~, ~~body scroll lock broken~~, no slide animations, ~~no debounce on typing indicator~~, ~~audit logging retry/queue mechanism~~ |
| **P3**   | 12            | Dead code, raw values, no `not-found.tsx`/`error.tsx`, no settings UI, no avatar preview                                                                                                                                                                                                                                                |

All UX/UI phases (1–7) and chat specialization (Phases A–E) complete.

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

## GitHub Actions Workflows

| Workflow                 | Trigger                 | Purpose                                                                   |
| ------------------------ | ----------------------- | ------------------------------------------------------------------------- |
| `ci.yml`                 | push main/develop, PR   | Calls reusable validate.yml (test, lint, typecheck, build)                |
| `validate.yml`           | workflow_call           | Reusable: test, lint, typecheck, build jobs with Node 22 + pnpm cache     |
| `build-push.yml`         | push develop            | Build Docker images → push to GHCR `:dev` tag (path-filtered)             |
| `deploy-development.yml` | push develop            | SSH to droplet, transfer files, pipe images, compose up, health check     |
| `infra-development.yml`  | push infra/\*\* changes | Terraform provision droplet + DNS + firewall + SSH key registration       |
| `deploy-production.yml`  | push main, manual       | Build + push `:latest` images, deploy to production droplet, health check |

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
