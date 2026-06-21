# Phase 2 — Feature / Module / Folder Mapping

## 1. Mapping Summary

The reference repo (`mainecybertech-portal`) is a **client portal** with project/ticket/document management, billing, and third-party integrations. The current repo (`chat`) is a **real-time workspace chat** platform. They share a common tech stack (PNPM monorepo, Express + Next.js + Supabase + Caddy + DigitalOcean) but serve fundamentally different domains. Mapping is therefore primarily at the **architectural and infrastructure level** rather than 1:1 feature equivalence.

---

## 2. Folder-to-Folder Mapping

| Current Repo Path           | Reference Repo Path             | Mapping Type              | Notes                                                                                 |
| --------------------------- | ------------------------------- | ------------------------- | ------------------------------------------------------------------------------------- |
| `apps/api/`                 | `apps/api/`                     | **Direct equivalent**     | Both Express apps with Supabase, Sentry, rate limiting                                |
| `apps/api/src/modules/`     | `apps/api/src/routes/`          | **Renamed equivalent**    | Same purpose; modules/ encapsulates routes+service+tests per feature; routes/ is flat |
| `apps/api/src/config/`      | `apps/api/src/config/`          | **Direct equivalent**     | Env validation, config loading                                                        |
| `apps/api/src/lib/`         | `apps/api/src/lib/`             | **Direct equivalent**     | Shared utilities                                                                      |
| `apps/api/src/middleware/`  | `apps/api/src/middleware/`      | **Direct equivalent**     | Auth, error handling, security                                                        |
| `apps/api/src/services/`    | `apps/api/src/services/`        | **Direct equivalent**     | Shared service layer                                                                  |
| `apps/web/`                 | `apps/web/`                     | **Direct equivalent**     | Both Next.js 15 apps                                                                  |
| `apps/web/app/(workspace)/` | `apps/web/app/(portal)/`        | **Conceptual equivalent** | Both are the authenticated app shell, but different domains                           |
| `apps/web/components/`      | `apps/web/components/`          | **Direct equivalent**     | Component directory pattern                                                           |
| `apps/web/lib/`             | `apps/web/lib/`                 | **Direct equivalent**     | Utility/library functions                                                             |
| N/A                         | `apps/worker/`                  | **Missing in current**    | Background job worker                                                                 |
| `packages/db/`              | `packages/sdk/`                 | **Mismatch**              | Current wraps DB client; reference wraps full API SDK                                 |
| `packages/ui/`              | `packages/ui/`                  | **Partial equivalent**    | Current has 7 components; reference has only cn.ts                                    |
| N/A                         | `packages/config/`              | **Missing in current**    | Shared ESLint/TSConfig config                                                         |
| `infra/docker/`             | `infra/digitalocean/`           | **Renamed equivalent**    | Same purpose — Docker compose + Caddy for deployment                                  |
| `infra/terraform/`          | `infra/terraform/digitalocean/` | **Direct equivalent**     | DO droplet provisioning                                                               |
| N/A                         | `infra/terraform/aws/`          | **Missing in current**    | AWS infra (ECS, RDS, S3, etc.)                                                        |
| `supabase/`                 | `supabase/`                     | **Direct equivalent**     | Supabase local config                                                                 |
| `supabase/migrations/`      | `supabase/migrations/`          | **Partial equivalent**    | Current: 2 migrations; Reference: 15 migrations                                       |
| N/A                         | `supabase/seeds/`               | **Missing in current**    | Seed data for local dev                                                               |
| N/A                         | `supabase/functions/`           | **Missing in current**    | Edge functions                                                                        |
| N/A                         | `supabase/policies/`            | **Missing in current**    | RLS policies                                                                          |
| `.github/workflows/`        | `.github/workflows/`            | **Direct equivalent**     | CI/CD pipelines                                                                       |
| `scripts/`                  | `scripts/`                      | **Partial equivalent**    | Current: 4 scripts; Reference: 12 scripts                                             |

---

## 3. Feature-to-Feature Mapping

| Current Repo Feature            | Reference Repo Feature                                | Mapping Type                  | Notes                                                    |
| ------------------------------- | ----------------------------------------------------- | ----------------------------- | -------------------------------------------------------- |
| Workspaces CRUD                 | Organizations CRUD                                    | **Conceptual equivalent**     | Top-level tenant/grouping entity                         |
| Channels CRUD                   | N/A (maybe Projects sub-areas)                        | **Extra in current**          | Chat-specific concept                                    |
| Messages CRUD                   | Ticket comments / document discussion                 | **Conceptual equivalent**     | Both are user-generated content threads                  |
| Real-time messaging (Socket.io) | WebSocket via `ws` library                            | **Architecturally different** | Socket.io vs raw ws; current has rooms, typing, presence |
| File uploads (signed URLs)      | Document management (full system)                     | **Partial equivalent**        | Same Supabase Storage pattern but different scope        |
| Full-text search (tsvector)     | Search (routes/search.ts + search-portal.ts)          | **Conceptual equivalent**     | Both use PostgreSQL search                               |
| Auth (magic link + JWT)         | Auth (routes/auth.ts + lib/auth/)                     | **Direct equivalent**         | Same Supabase auth + JWT approach                        |
| Audit logging                   | Audit (routes/audit.ts + SDK audit.ts)                | **Direct equivalent**         | Both log mutations                                       |
| Webhook delivery                | Webhooks (routes/webhooks.ts + webhook-management.ts) | **Direct equivalent**         | Both have webhook endpoint + management                  |
| Health check                    | Health (routes/health.ts)                             | **Direct equivalent**         | DB connectivity check                                    |
| Rate limiting                   | Rate limiting (express-rate-limit)                    | **Direct equivalent**         | Same library                                             |
| N/A                             | Billing (Stripe)                                      | **Missing in current**        | Subscription management                                  |
| N/A                             | Background jobs (BullMQ + Redis)                      | **Missing in current**        | Async task processing                                    |
| N/A                             | Jira/JSM/M365 sync                                    | **Missing in current**        | Third-party integrations                                 |
| N/A                             | Admin panel                                           | **Missing in current**        | User/org management UI                                   |
| N/A                             | Public/marketing pages                                | **Missing in current**        | Landing, contact, etc.                                   |
| N/A                             | Dashboard                                             | **Missing in current**        | Aggregated project/ticket view                           |
| N/A                             | Notifications system                                  | **Missing in current**        | Email + in-app notification preferences                  |
| N/A                             | SLA tracking                                          | **Missing in current**        | Ticket SLA metrics                                       |

---

## 4. Naming and Organizational Mismatches

| Area              | Reference Repo                      | Current Repo                                                     | Issue                                                        |
| ----------------- | ----------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------ |
| Package naming    | `@mct/*` (api, sdk, ui, config)     | `@chat/*` (api, db, web, ui)                                     | Different org scope — expected for different projects        |
| API organization  | Flat `routes/` directory (27 files) | Feature-based `modules/` (5 modules with routes.ts + service.ts) | Current has cleaner separation of concerns                   |
| Entry point       | `main.ts` → `app.ts`                | `server.ts` → `app.ts`                                           | Different naming but same pattern                            |
| Test runner       | Jest everywhere                     | Vitest everywhere                                                | Different testing framework                                  |
| Build tool        | tsup for API/worker                 | tsc for API                                                      | Different build strategy                                     |
| CI validation     | Separate workflows per check        | Single reusable validate.yml with all checks                     | Current is more consolidated                                 |
| UI package scope  | Minimal (cn.ts only)                | Full component library                                           | Current invested in shared UI; reference keeps UI in web app |
| DB client pattern | SDK encapsulates all API calls      | db package is just Supabase client                               | Different architectural split                                |

---

## 5. Missing in Current Repo

| Missing Item               | Reference Location                       | Impact                                                |
| -------------------------- | ---------------------------------------- | ----------------------------------------------------- |
| Background worker app      | `apps/worker/`                           | No async task processing (email, notifications, sync) |
| Redis                      | docker-compose.yml services              | Required for BullMQ queuing                           |
| Client SDK package         | `packages/sdk/`                          | No typed API client; forces direct Supabase calls     |
| Shared config package      | `packages/config/`                       | No shared ESLint/TSConfig across packages             |
| Seed data for dev          | `supabase/seeds/`                        | Harder to spin up reproducible dev environments       |
| Supabase functions         | `supabase/functions/`                    | No edge functions                                     |
| Supabase policies as files | `supabase/policies/`                     | RLS policies inlined in migrations only               |
| Backup scripts             | `scripts/backup-database.*`              | No automated backup tooling                           |
| Load testing               | `scripts/load-testing/`                  | No performance testing infra                          |
| Local stack scripts        | `scripts/start-local-stack.*`            | No full local environment bootstrap                   |
| Stripe/billing             | `routes/billing.ts`, SDK `billing.ts`    | No payment processing                                 |
| Jira/JSM/M365 integrations | Worker tasks + env vars                  | No third-party sync                                   |
| Admin panel UI             | `components/admin/` (18 components)      | No user/org management UI                             |
| Marketing/public pages     | `app/(public)/`, `components/marketing/` | No landing pages                                      |
| Multi-subdomain Caddy      | Two subdomains (app._, api._)            | Current uses same-domain routing                      |
| AWS Terraform              | `infra/terraform/aws/` (28 files)        | No AWS infra (was likely previous deployment target)  |

---

## 6. Missing in Reference Repo

| Missing Item                    | Current Location                                 | Impact                                                         |
| ------------------------------- | ------------------------------------------------ | -------------------------------------------------------------- |
| Shared UI component library     | `packages/ui/src/components/`                    | Reference keeps UI components in web app; no shared library    |
| Socket.io real-time             | `apps/api` deps + socket.ts                      | Reference uses raw `ws` — no room management, typing, presence |
| Docker HEALTHCHECK              | Dockerfiles                                      | No container health checks                                     |
| Graceful shutdown handlers      | `server.ts`                                      | No SIGTERM/SIGINT drain                                        |
| Bundle analyzer                 | `apps/web/next.config.ts`                        | No build analysis tooling                                      |
| AGENTS.md                       | Root                                             | No architecture documentation in reference                     |
| Path-filtered CI                | `.github/workflows/build-push.yml`               | Reference runs all CI on every push                            |
| `.env.example` files            | `apps/api/.env.example`, `apps/web/.env.example` | Fewer onboarding aids                                          |
| pnpm-workspace.yaml allowBuilds | `pnpm-workspace.yaml`                            | Reference has misconfigured allowBuilds (single char entries)  |

---

## 7. Areas That Look Conceptually Similar but Architecturally Different

| Area                        | Reference Approach                                       | Current Approach                                  | Difference                                                  |
| --------------------------- | -------------------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------- |
| **API routing**             | Flat routes/ with shared middleware                      | Feature modules/ with co-located routes + service | Current is more modular, easier to navigate per feature     |
| **Front-end data fetching** | SDK client (`packages/sdk/client.ts`)                    | Direct Supabase client (`packages/db/src/`)       | Reference abstracts API calls; current talks to DB directly |
| **Auth flow**               | JWT cookie-based with cookie-parser                      | JWT middleware + Supabase session                 | Both use Supabase auth; cookie vs. header strategy differs  |
| **Real-time**               | Raw `ws` library (minimal)                               | Socket.io (rooms, namespaces, events)             | Current has far more sophisticated real-time                |
| **Reverse proxy**           | Separate subdomains (app._ → web:3000, api._ → api:4000) | Same domain with path-based routing               | Current is simpler for client-side                          |
| **CI pipeline**             | Many small workflows (test.yml, lint.yml, typecheck.yml) | Single validate.yml called by ci.yml              | Current uses workflow_call pattern more cleanly             |
| **Terraform**               | Multi-cloud (AWS for compute + DO for droplet)           | DO-only                                           | Reference has more complex/historical infra                 |

---

## 8. Areas That Cannot Yet Be Mapped Reliably

| Area                            | Reason                                                                              |
| ------------------------------- | ----------------------------------------------------------------------------------- |
| **SQL schema details**          | Need to read 15 reference migrations vs. 2 current migrations in full               |
| **RLS policies**                | Reference has them in both migrations and policies/ dir; current has none extracted |
| **Auth session handling**       | Need to inspect exact cookie vs. header patterns in middleware                      |
| **Search implementation**       | Need to compare tsvector query patterns                                             |
| **File upload flow**            | Need to compare signed URL generation and access patterns                           |
| **Webhook delivery guarantees** | Need to inspect retry/idempotency logic in both                                     |
| **Notification delivery**       | Reference has email + in-app; current has none yet                                  |
| **Error handling depth**        | Need to compare Sentry usage and error boundary patterns                            |
| **Performance characteristics** | Reference has load-testing scripts; current has none for baseline                   |
