# Phase 1 — Repo Inventory + Structural Baseline

## 1. Repo A Inventory (Reference: `C:\temp\mainecybertech-portal`)

**Name**: `client-portal` — Maine Cybertech client portal  
**Package Manager**: pnpm@10.34.3, Node >=18  
**Monorepo tool**: Turborepo (turbo.json with build, dev, lint, test, test:watch, test:coverage, typecheck)

### Apps (3)

| App      | Path           | Framework                                 | Test                  |
| -------- | -------------- | ----------------------------------------- | --------------------- |
| `api`    | `apps/api/`    | Express (routes/ pattern, 27 route files) | Jest + supertest      |
| `web`    | `apps/web/`    | Next.js 15 (turbopack dev)                | Jest + Playwright e2e |
| `worker` | `apps/worker/` | BullMQ + Redis background tasks           | Jest                  |

### Packages (3)

| Package       | Path               | Purpose                                                                                                                                                                                                                |
| ------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@mct/config` | `packages/config/` | Shared eslint config, base tsconfig                                                                                                                                                                                    |
| `@mct/sdk`    | `packages/sdk/`    | Client SDK (21 modules: api-keys, audit, auth, billing, bulk, client, dashboard, documents, memberships, notifications, organizations, profiles, projects, roles, search, sla, tickets, types, users, webhooks, index) |
| `@mct/ui`     | `packages/ui/`     | Shared React utility (cn.ts only)                                                                                                                                                                                      |

### API Routes (27 files in `apps/api/src/routes/`)

admin, api-keys, audit, auth, billing, bulk, dashboard, docs, documents, health, memberships, notification-preferences, notifications, organizations, profiles, projects, public, roles, search-portal, search, sla, tickets, users, webhook-management, webhooks

### Worker Tasks (6 in `apps/worker/src/tasks/`)

jira-sync, jsm-sync, m365-calendar-sync, scheduled-notifications, stripe-reconcile, index

### Web App Pages

- Route groups: `(admin)`, `(portal)`, `(public)`, `auth`
- Portal pages: billing, dashboard, documents (with [documentId]), notifications (with preferences), profile, projects (with [projectId]), support (with [ticketId]), timeline

### Web Components

- `components/admin/` — 18 admin components (AdminDocumentsCenterClient, AdminTicketCenterClient, ProjectTaskListV5, etc.)
- `components/marketing/` — 4 components (ContactForm, MarketingHeader, ParticleBackground, ServiceCard)
- `components/portal/` — 12 components (PortalDocumentsCenterClient, SupportCenterClient, etc.)
- Root: CommentBody, DocumentPreview, EmptyState, HealthDashboardClient, NotificationBell, NotificationsPageClient

### Web Lib

- `lib/auth/` — admin.ts, auth-actions.ts, membership.ts
- Root: api.ts, client-api.ts, cn.ts, cookie-domain.ts, logger.ts, notifications-actions.ts, org-actions.ts

### Supabase (`supabase/`)

- 15 migrations (5302026 through 5302043) including: consolidated bootstrap, permissions, notifications, jira fields, org branding, webhook endpoints, public interactions, ticket commenting, portal access, sla logs, api keys, document shares
- seeds/ dir with 5 seed files
- functions/, policies/, snippets/ dirs

### Infra

- `infra/digitalocean/` — Caddyfile (multi-domain, separate api subdomain), docker-compose.yml (5 services: redis, api, worker, web, caddy), deploy.sh
- `infra/terraform/aws/` — Extensive Terraform (28 files): compute, network, secrets, alarms, slack-alarms, dns (Cloudflare), github-oidc, supabase, vercel, variables, outputs
- `infra/terraform/digitalocean/` — Simpler: droplet.tf, dns.tf, firewall.tf, cloud-init.yml

### CI/CD (8 workflows)

validate.yml (workflow_call: test, lint, typecheck), deploy-do.yml, e2e.yml, lint.yml, supabase-migrations.yml, terraform-do.yml, test.yml, typecheck.yml

### Scripts (12)

load-testing/, backup-database.ps1/.sh, install-terraform.ps1, local_dev_reset_and_verify automated scripts, start-local-stack.ps1/.sh, start_project_with_supabase_env.ps1, sync_supabase_env.auto.v2.ps1, teardown-local-stack.ps1/.sh, test-local-seeds.sh, test-local-stack.ps1

### Other

- Dockerfile per app (tsup multi-format builds)
- Root: eslint.config.mjs, SECURITY.md, CONTRIBUTING.md, LICENSE, docs/ directory

---

## 2. Repo B Inventory (Current: `C:\temp\chat`)

**Name**: `chat-platform` — Real-time workspace communication platform  
**Package Manager**: pnpm@9.15.4, Node >=20  
**Monorepo tool**: Turborepo (turbo.json with build, dev, lint, typecheck, test, clean)

### Apps (2)

| App         | Path        | Framework                                         | Test                    |
| ----------- | ----------- | ------------------------------------------------- | ----------------------- |
| `@chat/api` | `apps/api/` | Express + Socket.io (modules/ pattern, 5 modules) | Vitest                  |
| `@chat/web` | `apps/web/` | Next.js 15                                        | Vitest + Playwright e2e |

### Packages (2)

| Package    | Path           | Purpose                                                                                   |
| ---------- | -------------- | ----------------------------------------------------------------------------------------- |
| `@chat/db` | `packages/db/` | Supabase client + config + types + SQL (migrations, policies, functions, seeds)           |
| `@chat/ui` | `packages/ui/` | 7 React components (Avatar, Badge, Button, Dialog, Input, SidebarGroup, Skeleton) + tests |

### API Modules (5 in `apps/api/src/modules/`)

auth, channels, health, messages, workspaces  
Each module has: routes.ts, service.ts, **tests**/ (5 test files total)

### API Source Structure (no routes/ dir, uses modules/ dir)

### Web App Pages

- Route groups: `(auth)`, `(workspace)`
- Pages: `(workspace)/[workspaceSlug]/page.tsx`, `(workspace)/[workspaceSlug]/[channelId]/page.tsx`, `auth/` (magic link), root `page.tsx`

### Web Components

- `components/auth/` — auth-context.tsx, login-form.tsx (+ test)
- `components/channel/` — channel-list.tsx, create-channel-dialog.tsx
- `components/chat/` — chat-view.tsx, message-input.tsx, message-list.tsx, search-bar.tsx (+ tests)
- `components/home/` — landing-shell.tsx (+ test)
- `components/workspace/` — app-sidebar.tsx, create-workspace-dialog.tsx, workspace-list.tsx (+ tests)
- Root: app-header.tsx

### Web Lib

- `lib/supabase/` — client.ts
- Root: api.ts, env.ts, sentry.ts, socket.ts

### Supabase (`supabase/`)

- config.toml (15.5KB, detailed)
- 2 migrations: audit_logs.sql, webhooks.sql
- No seeds, functions, policies, or snippets dirs

### Tests (`tests/`)

- `tests/e2e/` — home.spec.ts (1 file)
- `tests/integration/` — README.md only
- `tests/setup/` — vitest.setup.ts
- 49 unit tests across 11 files total (API modules + UI components)

### Infra

- `infra/docker/` — Caddyfile (same-domain routing: /health, /auth, /workspaces, /channels, /messages, /socket.io proxied to API), Caddyfile.prod, docker-compose.devremote.yml (3 services: caddy, web, api), docker-compose.prod.yml, Caddy (legacy traefik/ dir removed)
- `infra/terraform/` — main.tf, variables.tf, outputs.tf, versions.tf, locals.tf, cloud-init.yaml.tftpl (DigitalOcean only)

### CI/CD (6 workflows)

ci.yml (push/PR triggers → calls validate.yml), validate.yml (workflow_call: test, lint, format:check, typecheck, build), build-push.yml (path-filtered), deploy-development.yml (comprehensive SSH deploy), deploy-production.yml, infra-development.yml (Terraform + import workaround)

### Scripts (4)

setup-dev.ps1, setup-dev.sh, teardown-dev.ps1, teardown-dev.sh

### Other

- Dockerfile per app (tsc build), Dockerfile.dev per app
- Root: eslint.config.mjs, SECURITY.md, .editorconfig, AGENTS.md, docs/ directory

---

## 3. Structural Similarities

| Aspect         | Both Repos                                 |
| -------------- | ------------------------------------------ |
| Monorepo       | pnpm workspaces + Turborepo                |
| Frontend       | Next.js 15 (React 19)                      |
| Backend        | Express (TypeScript, ESM)                  |
| Database       | Supabase (PostgreSQL)                      |
| Auth           | Supabase auth (JWT)                        |
| Proxy          | Caddy 2 reverse proxy                      |
| Validation     | Zod                                        |
| Logging        | Pino                                       |
| Error tracking | Sentry                                     |
| Testing        | Unit tests per module, E2E with Playwright |
| Deployment     | Docker compose on DigitalOcean droplet     |
| Git hooks      | husky + lint-staged                        |
| Infra-as-code  | Terraform (DigitalOcean)                   |

---

## 4. Structural Differences

| Dimension                    | Reference (portal)                                                          | Current (chat)                                                |
| ---------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **Apps**                     | 3 (api, web, worker)                                                        | 2 (api, web) — no worker                                      |
| **Packages**                 | 3 (config, sdk, ui)                                                         | 2 (db, ui) — no shared config or SDK                          |
| **API organization**         | routes/ (flat, 27 files)                                                    | modules/ (feature-based, 5 modules)                           |
| **API transport**            | Express HTTP + ws                                                           | Express HTTP + Socket.io (real-time)                          |
| **API deps**                 | jsonwebtoken, multer, stripe, nodemailer, cookie-parser                     | socket.io, no JWT/multer/stripe/nodemailer                    |
| **SDK**                      | Full client SDK (21 modules)                                                | No SDK; @chat/db serves as simple DB client                   |
| **UI package**               | Minimal (cn.ts only)                                                        | Full 7-component library with tests                           |
| **Background jobs**          | BullMQ + Redis worker                                                       | None                                                          |
| **Third-party integrations** | Stripe, Jira, JSM, M365 Calendar, AWS SQS                                   | None                                                          |
| **Supabase setup**           | 15 migrations, seeds, functions, policies                                   | 2 migrations, no seeds/functions/policies                     |
| **Terraform**                | AWS + DigitalOcean (complex, 28+ AWS files)                                 | DigitalOcean only (simple)                                    |
| **CI workflows**             | 8 individual workflows (test, lint, typecheck separate)                     | 6 integrated workflows (ci.yml calls validate.yml with build) |
| **Scripts**                  | 12 scripts (backup, load-testing, local stack mgmt)                         | 4 scripts (basic setup/teardown)                              |
| **Test runner**              | Jest (API, web, worker, SDK)                                                | Vitest (API, web, UI)                                         |
| **Build tool**               | tsup (api, worker) + next build                                             | tsc (api) + next build                                        |
| **API entry point**          | main.ts (bootstraps app.ts)                                                 | server.ts (bootstraps app.ts)                                 |
| **Web app scope**            | Client portal (projects, tickets, billing, documents, notifications, admin) | Workspace chat (channels, messages, real-time)                |
| **Domain model**             | Organizations → Projects → Tickets → Documents                              | Workspaces → Channels → Messages                              |
| **Node engine**              | >=18                                                                        | >=20                                                          |
| **pnpm version**             | 10.34.3                                                                     | 9.15.4                                                        |

---

## 5. Likely Core Systems

### Reference Repo

- **Auth system** (`routes/auth.ts`, `lib/auth/`, SDK `auth.ts`) — JWT + Supabase auth
- **Project/Ticket management** (`routes/projects.ts`, `routes/tickets.ts`, SDK modules) — core domain
- **Document management** (`routes/documents.ts`, SDK `documents.ts`) — file uploads + versioning
- **Billing** (`routes/billing.ts`, SDK `billing.ts`) — Stripe integration
- **Notification system** (`routes/notifications.ts`, worker `scheduled-notifications.ts`) — email + in-app
- **Admin panel** (`routes/admin.ts`, `components/admin/`) — user/org management
- **Webhook system** (`routes/webhooks.ts`, `routes/webhook-management.ts`, SDK `webhooks.ts`)
- **Worker/background jobs** — BullMQ + Redis for async processing

### Current Repo

- **Real-time messaging** (`modules/messages/`, Socket.io) — core domain
- **Channel management** (`modules/channels/`)
- **Workspace management** (`modules/workspaces/`)
- **Auth** (`modules/auth/`) — Magic link + JWT middleware
- **Health check** (`modules/health/`) — DB connectivity + latency

---

## 6. Likely Fragile / High-Risk Areas

### Reference Repo

- **30KB+ AdminDocumentsCenterClient.tsx** and **AdminTicketCenterClient.tsx** — very large single components
- **Billing** with Stripe — financial correctness, webhook idempotency
- **Jira/JSM/M365 sync** in worker — external API dependencies, error handling
- **15 SQL migrations** — risk of migration conflicts/complexity
- **SDK module interdependencies** — 21 modules with cross-references

### Current Repo

- **Real-time state management** (Socket.io rooms, presence, typing indicators) — inherently complex
- **Let's Encrypt cert rate-limit** — blocking HTTPS until Jun 21
- **512MB droplet** — OOM under load with 3 containers (Caddy + Web + API)
- **2 SQL migrations only** — schema may be incomplete
- **No background worker** — time-sensitive tasks lack async processing
- **No Supabase local seeds** — harder to reproduce dev environments

---

## 7. Unknowns / Areas Needing Deeper Inspection

- **Reference**: What is the `archive/` directory? (present in root but not inspected)
- **Reference**: Full content of 15 SQL migrations (need to assess complexity)
- **Reference**: Exact auth flow (JWT + Supabase magic link vs. session cookies)
- **Reference**: How front-end API calls are structured (SDK vs. direct fetch)
- **Current**: Socket.io exact event contracts and room management logic
- **Current**: How file uploads (Supabase Storage signed URLs) work end-to-end
- **Current**: Full-text search implementation (tsvector query patterns)
- **Both**: Exact RLS policy details for multi-tenancy
- **Both**: Error handling and recovery patterns
- **Both**: Rate limiting configuration thresholds
