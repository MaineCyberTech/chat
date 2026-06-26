# MERGED_REPO_AUDIT_SUMMARY — Comparative Repo Audit

**Audit Date:** June 26, 2026
**Repos:** `C:\temp\mainecybertech-portal` (reference) vs `C:\temp\chat` (current)
**Analyst:** AI principal software architect / senior full-stack reviewer

---

## Executive Summary

Two Turborepo monorepos sharing common infrastructure (Express, Next.js 15, Supabase, Caddy, DigitalOcean) but serving fundamentally different domains: **Portal** is a production-hardened MSSP client management platform (769 tests, enterprise features, complex infra), while **Chat** is a modern real-time messaging platform (54 tests, WebSocket/Socket.io, clean modular architecture).

**Key insight:** The repos are complementary, not competitive. Portal excels at enterprise maturity (testing, documentation, operational tooling). Chat excels at modern architecture (feature-based modules, shared UI library, real-time, consolidated CI, Docker HEALTHCHECK, graceful shutdown).

**Core recommendation:** Adopt Portal's operational patterns (seeds, policies, config package, scripts) while preserving Chat's superior modular architecture, real-time capabilities, and modern toolchain. Implement via 6 patch sets in 2 phases (~3 days total).

---

## 1. High-Level Comparison

| Dimension | Portal | Chat | Verdict |
|---|---|---|---|
| **Domain** | MSSP client portal | Real-time workspace chat | Different |
| **Apps** | 3 (api, web, worker) | 2 (api, web) | Portal has worker |
| **API structure** | Flat `routes/` (27 files) | Feature-based `modules/` (5 modules) | **Chat better** |
| **UI package** | Minimal (cn.ts only) | Full 7-component library + tests | **Chat better** |
| **Real-time** | Raw `ws` library | Socket.io (rooms, typing, presence) | **Chat better** |
| **Tests** | 769 (Jest) | 54 (Vitest) | **Portal better** |
| **CI** | 8 separate workflows | Consolidated workflow_call + path filters | **Chat better** |
| **Docker** | No HEALTHCHECK | HEALTHCHECK + graceful shutdown | **Chat better** |
| **Scripts** | 12 (backup, load-testing, local stack) | 4 (basic setup/teardown) | **Portal better** |
| **Supabase** | 15 migrations, seeds, policies, functions | 2 migrations, no seeds/policies/functions | **Portal better** |
| **Infra** | AWS + DO Terraform (complex) | DO-only Terraform (simple) | Chat simpler |
| **Policies** | Separate SQL files per entity | Inlined in migrations | **Portal better** |

---

## 2. Feature Mapping Summary

| Chat Feature | Portal Equivalent | Status |
|---|---|---|
| Workspaces | Organizations | Conceptual equivalent |
| Channels | (none) | Unique to Chat |
| Messages | Ticket comments / Threads | Conceptual equivalent |
| Real-time (Socket.io) | Raw WebSocket | Architecturally different |
| File upload (Supabase Storage) | Document management | Partial equivalent |
| Full-text search | PostgreSQL search | Same tech stack |
| Auth (magic link + JWT) | Auth (JWT + PKCE) | Same Supabase auth |
| Audit logging | Audit tracking | Direct equivalent |
| Webhooks | Webhook management | Direct equivalent |
| (none) | Billing (Stripe) | Missing in Chat |
| (none) | Background worker (BullMQ) | Missing in Chat |
| (none) | Jira/JSM/M365 sync | Missing in Chat |
| (none) | Admin panel UI | Missing in Chat |
| (none) | Marketing/public pages | Missing in Chat |

---

## 3. Best Implementations Worth Adopting

**From Portal (adapt conceptually):**
1. Supabase seed data for reproducible local dev
2. Extracted RLS policy files for easier review
3. Shared config package (ESLint + TSConfig base)
4. Local stack bootstrap scripts
5. Complete .env.example documentation

**From Chat (keep current — already superior):**
1. Feature-based API modules (vs Portal's flat routes/)
2. Shared UI component library (vs Portal's inline components)
3. Socket.io real-time messaging
4. Same-domain Caddy routing (vs Portal's subdomain split)
5. Consolidated CI via workflow_call (vs Portal's 8 workflows)
6. Docker HEALTHCHECK + graceful shutdown
7. Vitest over Jest
8. TailwindCSS v4

---

## 4. Areas to Keep As-Is

| System | Rationale |
|---|---|
| Auth middleware | Working JWT + magic link flow |
| Socket.io event contracts | Core real-time feature |
| Caddy route mappings | Production contracts |
| API module structure | Superior to flat routes/ |
| UI component library | Design system consistency |
| Docker compose | Single-container deployment works |
| CI/CD pipeline | Consolidated and efficient |
| Database schema (2 migrations) | Minimal but correct for current needs |

---

## 5. Risk Register (Top 10)

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Auth middleware breakage | Low | Critical | Gate: comprehensive test coverage before changes |
| API route path changes | Low | High | Gate: coordinated Caddy + front-end + back-end updates |
| Socket.io event contract changes | Low | High | Gate: additive-only pattern |
| Database migration conflicts | Low | High | Gate: additive-only migrations, dry-run against copy |
| Deploy pipeline failure | Medium | Critical | Gate: local compose test before any Caddy/compose changes |
| Droplet OOM with Redis + Worker | Medium | High | Gate: memory monitoring before Phase 3 worker |
| Let's Encrypt cert rate-limit | Medium | High | Gate: use self-signed or Cloudflare certs until Jun 21 |
| Config package build errors | Low | Medium | Gate: pnpm typecheck + lint before merge |
| E2E test flakiness | Medium | Low | Gate: retry logic, test isolation |
| Seed data FK violations | Low | Low | Gate: check migration order, test locally |

---

## 6. Implementation Plan (6 Patch Sets, ~3 Days)

### Phase 1 (~1 day)

| Patch Set | What | Risk | Effort |
|---|---|---|---|
| **PS1** Supabase seeds, policies, functions | Create `supabase/seeds/`, `supabase/policies/`, `supabase/functions/` | None | 30 min |
| **PS2** Shared config package | Create `packages/config/`, update tsconfig/eslint across apps/packages | Low | 30 min |
| **PS3** Environment docs | Complete `.env.example` for api + web | None | 15 min |
| **Gate** | `pnpm test`, `pnpm typecheck`, `pnpm lint`, `supabase start` | | |

### Phase 2 (~2 days)

| Patch Set | What | Risk | Effort |
|---|---|---|---|
| **PS4** Legacy cleanup | Remove Traefik, empty integration tests dir | Low | 5 min |
| **PS5** E2E tests | Add workspace + channel + message Playwright tests | None | 3h |
| **PS6** Local stack script | Add `scripts/start-local-stack.ps1` | None | 1h |
| **Gate** | `pnpm check`, `pnpm test:e2e`, manual smoke test | | |

### Phase 3 (Future, ~1 week)

Module integration tests, security headers audit, API contract documentation

### Phase 4 (Deferrable)

Worker app (BullMQ + Redis), SDK package, notification system

---

## 7. Key Files to Touch

**CREATE:**
- `supabase/seeds/` (4 files: user, workspace, channel, message + README)
- `supabase/policies/` (5 files: workspaces, channels, messages, audit_logs, webhooks)
- `supabase/functions/.gitkeep`
- `packages/config/` (3 files: package.json, eslint.base.mjs, tsconfig.base.json)
- `tests/e2e/workspace.spec.ts`
- `tests/e2e/channel.spec.ts`
- `tests/e2e/message.spec.ts`
- `scripts/start-local-stack.ps1`

**MODIFY:**
- `apps/api/tsconfig.json`, `apps/web/tsconfig.json`, `packages/db/tsconfig.json`, `packages/ui/tsconfig.json`
- `apps/api/eslint.config.mjs`, `apps/web/eslint.config.mjs`
- `apps/api/.env.example`, `apps/web/.env.example`

**REMOVE:**
- `infra/docker/traefik/` (entire directory)
- `tests/integration/README.md`

---

## 8. Final Recommendation

**PROCEED with Phases 1-2 immediately (~3 days total effort).**

The 6 patch sets deliver measurable value (reproducible dev environments, better tooling configs, E2E regression tests) with zero-to-low risk. Portal's operational maturity patterns are worth adopting; Chat's modular architecture and modern toolchain are worth preserving.

**DEFER Phases 3-4** until the app approaches public launch or the 512MB droplet shows capacity headroom for Redis + Worker.

**Do NOT touch:** Auth middleware, Socket.io event contracts, Caddy route mappings, API module structure, UI component library, Docker compose setup, CI/CD pipeline, or existing database schema without the validation gates defined in this audit.