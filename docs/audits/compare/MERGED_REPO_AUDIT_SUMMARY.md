# MERGED_REPO_AUDIT_SUMMARY — Comparative Repo Audit

**Audit Date:** June 26, 2026
**Last Updated:** June 26, 2026 (findings resolved)
**Repos:** `C:\temp\mainecybertech-portal` (reference) vs `C:\temp\chat` (current)
**Status:** ✅ All findings from audit resolved

---

## Executive Summary

Two Turborepo monorepos sharing common infrastructure (Express, Next.js 15, Supabase, Caddy, DigitalOcean) but serving fundamentally different domains: **Portal** is a production-hardened MSSP client management platform (769 tests, enterprise features, complex infra), while **Chat** is a modern real-time messaging platform (WebSocket/Socket.io, clean modular architecture).

**Current state:** Chat repo is more mature than the audit baseline suggested. It already has 3 apps (api, web, worker), 22 Supabase migrations, seed data, a shared config package, E2E test suite, and comprehensive .env.example files. The audit's 8 findings were all resolved:

| Finding                    | Resolution                               | Files Created/Modified                  |
| -------------------------- | ---------------------------------------- | --------------------------------------- |
| Missing RLS policy files   | Extracted from all 22 migrations         | 11 policy files in `supabase/policies/` |
| Missing functions dir      | Created placeholder                      | `supabase/functions/.gitkeep`           |
| Outdated setup script      | Fixed migration path, added seed loading | `scripts/setup-dev.ps1`                 |
| Missing local stack script | Created quick-restart script             | `scripts/start-local-stack.ps1`         |

---

## 1. High-Level Comparison

| Dimension         | Portal                                    | Chat                                                   | Verdict           |
| ----------------- | ----------------------------------------- | ------------------------------------------------------ | ----------------- |
| **Domain**        | MSSP client portal                        | Real-time workspace chat                               | Different         |
| **Apps**          | 3 (api, web, worker)                      | 3 (api, web, worker)                                   | Equivalent        |
| **API structure** | Flat `routes/` (27 files)                 | Feature-based `modules/` (5 modules)                   | **Chat better**   |
| **UI package**    | Minimal (cn.ts only)                      | Full 7-component library + tests                       | **Chat better**   |
| **Real-time**     | Raw `ws` library                          | Socket.io (rooms, typing, presence)                    | **Chat better**   |
| **Tests**         | 769 (Jest)                                | 4 E2E + unit tests (Vitest)                            | **Portal better** |
| **CI**            | 8 separate workflows                      | Consolidated workflow_call + path filters              | **Chat better**   |
| **Docker**        | No HEALTHCHECK                            | HEALTHCHECK + graceful shutdown                        | **Chat better**   |
| **Scripts**       | 12 (backup, load-testing, local stack)    | 6 (setup, teardown, local-stack)                       | Portal deeper     |
| **Supabase**      | 15 migrations, seeds, policies, functions | 22 migrations, 8 seeds, 11 policy files, functions dir | Equivalent        |
| **Infra**         | AWS + DO Terraform (complex)              | DO-only Terraform (simple)                             | Chat simpler      |
| **Policies**      | Separate SQL files per entity             | Standalone policy files extracted                      | ✅ Resolved       |

---

## 2. Feature Mapping Summary

| Chat Feature                   | Portal Equivalent         | Status                    |
| ------------------------------ | ------------------------- | ------------------------- |
| Workspaces                     | Organizations             | Conceptual equivalent     |
| Channels                       | (none)                    | Unique to Chat            |
| Messages                       | Ticket comments / Threads | Conceptual equivalent     |
| Real-time (Socket.io)          | Raw WebSocket             | Architecturally different |
| File upload (Supabase Storage) | Document management       | Partial equivalent        |
| Full-text search               | PostgreSQL search         | Same tech stack           |
| Auth (magic link + JWT)        | Auth (JWT + PKCE)         | Same Supabase auth        |
| Audit logging                  | Audit tracking            | Direct equivalent         |
| Webhooks                       | Webhook management        | Direct equivalent         |
| (none)                         | Billing (Stripe)          | Missing in Chat           |
| (none)                         | Jira/JSM/M365 sync        | Missing in Chat           |
| (none)                         | Admin panel UI            | Missing in Chat           |
| (none)                         | Marketing/public pages    | Missing in Chat           |

---

## 3. Best Implementations Worth Adopting

**From Portal (adopted):**

1. ✅ Supabase seed data — 8 seed files exist (`supabase/seeds/`)
2. ✅ RLS policy files — 11 files extracted (`supabase/policies/`)
3. ✅ Shared config package — exists (`packages/config/`), root eslint imports from it
4. ✅ Local stack script — created (`scripts/start-local-stack.ps1`)
5. ✅ .env.example docs — both api + web have complete examples

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

| System                          | Rationale                         |
| ------------------------------- | --------------------------------- |
| Auth middleware                 | Working JWT + magic link flow     |
| Socket.io event contracts       | Core real-time feature            |
| Caddy route mappings            | Production contracts              |
| API module structure            | Superior to flat routes/          |
| UI component library            | Design system consistency         |
| Docker compose                  | Single-container deployment works |
| CI/CD pipeline                  | Consolidated and efficient        |
| Database schema (22 migrations) | Correct for current needs         |

---

## 5. Risk Register (Top 10)

| Risk                             | Likelihood | Impact   | Mitigation                                                |
| -------------------------------- | ---------- | -------- | --------------------------------------------------------- |
| Auth middleware breakage         | Low        | Critical | Gate: comprehensive test coverage before changes          |
| API route path changes           | Low        | High     | Gate: coordinated Caddy + front-end + back-end updates    |
| Socket.io event contract changes | Low        | High     | Gate: additive-only pattern                               |
| Database migration conflicts     | Low        | High     | Gate: additive-only migrations, dry-run against copy      |
| Deploy pipeline failure          | Medium     | Critical | Gate: local compose test before any Caddy/compose changes |
| Droplet OOM with Redis + Worker  | Medium     | High     | Gate: memory monitoring before enabling worker            |
| Let's Encrypt cert rate-limit    | Medium     | High     | Gate: use self-signed or Cloudflare certs until Jun 21    |
| Config package build errors      | Low        | Medium   | Gate: pnpm typecheck + lint before merge                  |
| E2E test flakiness               | Medium     | Low      | Gate: retry logic, test isolation                         |
| Seed data FK violations          | Low        | Low      | Gate: check migration order, test locally                 |

---

## 6. Findings Resolution Status

| #   | Finding                               | Action Taken                                                   | Files                                             | Status          |
| --- | ------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------- | --------------- |
| 1   | Missing Supabase seed data            | Already existed (8 seed files)                                 | `supabase/seeds/*.sql`                            | ✅ Pre-existing |
| 2   | RLS policies inlined in migrations    | Extracted to standalone files                                  | 11 files in `supabase/policies/`                  | ✅ **Fixed**    |
| 3   | Missing Supabase functions dir        | Created placeholder                                            | `supabase/functions/.gitkeep`                     | ✅ **Fixed**    |
| 4   | Missing shared config package         | Already existed with root eslint integration                   | `packages/config/`                                | ✅ Pre-existing |
| 5   | Missing .env.example completeness     | Both files already documented all vars                         | `apps/api/.env.example`, `apps/web/.env.example`  | ✅ Pre-existing |
| 6   | Legacy Traefik config                 | Already removed                                                | —                                                 | ✅ Pre-existing |
| 7   | E2E test coverage                     | Already had 4 spec files                                       | `tests/e2e/` (auth, file-upload, home, messaging) | ✅ Pre-existing |
| 8   | Missing local stack script            | Created with Supabase key sync + seed loading                  | `scripts/start-local-stack.ps1`                   | ✅ **Fixed**    |
| 9   | Outdated setup-dev.ps1 migration path | Fixed to reference `supabase/migrations/` + added seed loading | `scripts/setup-dev.ps1`                           | ✅ **Fixed**    |

---

## 7. Implementation Summary

All 6 audit patch sets have been completed or verified as already satisfied:

### Phase 1 (Completed)

| Patch Set                                   | What                                                                | Status  |
| ------------------------------------------- | ------------------------------------------------------------------- | ------- |
| **PS1** Supabase seeds, policies, functions | 8 seed files (pre-existing), 11 policy files, functions placeholder | ✅ Done |
| **PS2** Shared config package               | Pre-existing with root eslint integration                           | ✅ Done |
| **PS3** Environment docs                    | Both .env.example files complete                                    | ✅ Done |

### Phase 2 (Completed)

| Patch Set                  | What                                                                 | Status  |
| -------------------------- | -------------------------------------------------------------------- | ------- |
| **PS4** Legacy cleanup     | Traefik already removed; integration tests README kept (has content) | ✅ Done |
| **PS5** E2E tests          | 4 pre-existing spec files (auth, file-upload, home, messaging)       | ✅ Done |
| **PS6** Local stack script | Created `scripts/start-local-stack.ps1`                              | ✅ Done |

### Phase 3 (Recommended — ~1 week)

| Item                       | Notes                                           |
| -------------------------- | ----------------------------------------------- |
| Module integration tests   | Expand from 1 test per module to 3-5 per module |
| Security headers audit     | Verify CSP/HSTS implementation                  |
| API contract documentation | Document Socket.io events + REST endpoints      |

### Phase 4 (Deferrable)

| Item                | Notes                                                         |
| ------------------- | ------------------------------------------------------------- |
| Expand E2E coverage | Add workspace create, channel CRUD, message edit/delete flows |
| Notification system | Email + push notification delivery                            |
| Load testing        | Before public launch                                          |

---

## 8. Final Recommendation

**All audit findings have been resolved.** The Chat repo is now aligned with Portal's operational patterns (seeds, policies, functions, config package, scripts) while preserving its superior modular architecture and real-time capabilities.

**Implement Phase 3** (module integration tests, security audit, API docs) when team capacity allows — estimated 1 week.

**Defer Phase 4** until the app approaches public launch.

**Critical guardrails (do not break):** Auth middleware, Socket.io event contracts, Caddy route mappings, API module structure, UI component library, Docker compose, CI/CD pipeline, existing database schema. All require validation gates before changes.
