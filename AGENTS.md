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

### Hardening Data Store Connected (July 1, 2026)

The `hardening/` data store is now synchronized with the audit pipeline via `scripts/hardening/sync_baseline.py`:

| Store          | File                                   | Content                                             |
| -------------- | -------------------------------------- | --------------------------------------------------- |
| **Baselines**  | `hardening/baselines/current.json`     | Latest finding set from `latest_run.json`           |
| **History**    | `hardening/history/history.json`       | Append-only snapshot log (run_id, decision, totals) |
| **Rules**      | `hardening/rules/core.rules.json`      | 6 check patterns (grep-based rules)                 |
| **Policies**   | `hardening/policies/governance.json`   | Gate thresholds (block on P0/P1)                    |
| **Exceptions** | `hardening/exceptions/exceptions.json` | Empty until manually populated                      |

All scripts connected: `run_hardening_pipeline.py` → `evaluate_gate.py` → `sync_baseline.py`. Shell (bash) and PowerShell (`run_pipeline.ps1`) both include the sync step.

## Repository Map

| Directory            | Purpose                             | Key Files                                                                                                                                              |
| -------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `apps/api/`          | Express API server                  | `src/app.ts`, `src/modules/*/`, `Dockerfile`                                                                                                           |
| `apps/web/`          | Next.js 15 frontend                 | `app/`, `components/`, `lib/`, `e2e/`                                                                                                                  |
| `packages/ui/`       | Shared React components             | `src/components/button.tsx`, etc.                                                                                                                      |
| `packages/db/`       | Supabase client + types             | `src/config.ts`                                                                                                                                        |
| `infra/docker/`      | Compose files, Caddyfiles           | `docker-compose.devremote.yml`, `docker-compose.prod.yml`, `Caddyfile`, `Caddyfile.prod`                                                               |
| `infra/terraform/`   | DO droplet + DNS                    | `main.tf`, `templates/cloud-init.yaml.tftpl`                                                                                                           |
| `.github/workflows/` | CI/CD pipelines (19 workflows)      | See [Workflows section](#github-actions-workflows)                                                                                                     |
| `scripts/`           | Dev tooling + audit pipeline        | `setup-dev.ps1`, `teardown-dev.ps1`, `start-local-stack.ps1`, `audits/`, `hardening_runner/`, `hardening/sync_baseline.py`, `prompts/ingest_output.py` |
| `supabase/`          | Local Supabase config + migrations  | `config.toml`, `migrations/`, `policies/`, `seeds/`                                                                                                    |
| `hardening/`         | Hardening analysis artifacts        | `baselines/`, `exceptions/`, `history/`, `policies/`, `rules/`                                                                                         |
| `tests/`             | Test suites                         | `e2e/`, `integration/`, `setup/`                                                                                                                       |
| `docs/`              | Architecture docs, runbooks, audits | `docs/architecture/`, `docs/prompts/`, `docs/audits/`, `docs/runbooks/`                                                                                |

## Implementation Status

### Complete

- Magic link auth (all previous items)
- **CSRF/Same-Origin Architecture** — API now proxied via `/v1/*` on same domain (`chat.mainecybertech.us`) fixing cookie visibility and SameSite=Strict blocking
- **Database Schema Applied** — 24 Supabase CLI migrations applied (users, workspaces, channels, messages, RLS, triggers, auto-profile creation, backfill, soft-delete, webhook retry, audit FK, etc.)
- **Workspace Creation RLS** — Uses admin client (service role) to bypass RLS; duplicate slug handling with retry logic (`-1`, `-2`, etc.)
- **User Profiles Auto-Creation** — Trigger on `auth.users` insert + backfill migration for existing users
- **Per-Request Supabase Client** — Each request gets client with user's JWT for proper RLS context (`getSupabaseForUser`)
- **Manifest & Service Worker** — Served correctly with proper Content-Type headers (`application/manifest+json`, `application/javascript`)
- **Caddy Routing** — All `/v1/*` routes to API container (catch-all handle)
- **Trust Proxy** — Added for correct X-Forwarded-For handling behind Caddy
- **JSON Body Parsing** — Fixed (PowerShell inline JSON quote corruption; use `@file.json` for testing)
- **Supabase CLI Migration Workflow** — Added `.github/workflows/supabase-migrations.yml` + migration step in deploy-development.yml
- **Workspace Member Trigger Fix** — Added `ON CONFLICT DO NOTHING` + exception handling to `handle_new_workspace()` trigger so member is created even when admin client bypasses RLS
- **Version Badge** — Added fixed bottom-right badge on all pages showing version (branch+run), git SHA, build date
- **E2E Test Framework** — Added Playwright tests for auth→workspace→chat flow (`apps/web/e2e/auth-workspace-chat.spec.ts`)
- **Test Endpoint** — Added `/v1/test-body` for debugging body parsing

### Full Audit Pipeline Execution (July 1, 2026)

**58 prompts executed across 8 batches, 68 stage summaries aggregated, 624 total findings:**

| Batch                        | Prompts | Findings | P0  | P1  | Key Domains                                                                        |
| ---------------------------- | ------- | -------- | --- | --- | ---------------------------------------------------------------------------------- |
| 1 — Principal Audits         | 14      | 177      | 32  | 59  | api, database, security, environment, release, testing, frontend, ops, governance  |
| 2 — Feature Implementation   | 16      | 196      | 34  | 64  | orchestrator, core features, frontend, media, platform, testing, release           |
| 3 — UX/UI                    | 5       | 80       | 11  | 19  | design system, chat UX, accessibility, responsive, release gate                    |
| 4 — Hardening Ultras         | 8       | 72       | 17  | 24  | security, data, resilience, observability, supply chain, privacy, CI/CD, evolution |
| 5 — Platform Audits          | 4       | 57       | 11  | 18  | reconciliation, principal audit, quality confirmation, environment promotion       |
| 6 — Reconciliation Preflight | 4       | 42       | 2   | 11  | master reconciliation, checklist, diff analysis, chat intake                       |
| 7 — Final Reconciliation     | 5       | 52       | 4   | 14  | 5-phase SSOT synthesis, contradiction detection, guardrail normalization           |
| 8 — Release Gate             | 1       | 4        | 4   | 0   | production gate evaluation (NO-GO)                                                 |

**Cumulative gate result: FAIL** — 624 findings (105 P0, 192 P1, 199 P2, 124 P3), readiness 44.06%.

**Key SSOT finding:** 568 raw findings deduplicate to ~310 unique items (45% overlap rate). Reconciled roadmap: Phase 0 (infra hardening) → Phase 1 (security fixes) → Phase 2 (core features) → Phase 3 (frontend depth) → Phase 4 (UX polish) → Phase 5 (media, deferred).

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

### Hardening Analysis Completed (June 30, 2026)

- **Full Prompt Pack Execution** (10 prompts): security, data integrity, resilience, observability, supply chain, privacy, CI/CD security, platform evolution, merger, reconciliation. See `docs/prompts/hardening_prompt_pack/`.
- **176 unique findings** across 8 domains. Global risk score: **0/100 (CRITICAL)**.
- **20 P0 blockers**: 5 security (consent routes broken, webhook secret leak, reaction no access control, /metrics unauthenticated, SECURITY DEFINER no search_path), 7 resilience (no request timeout, no graceful shutdown drain, no query timeout, socket re-auth, no API timeout/retry, in-memory rate limiter, slug dedup infinite loop), 6 data (reaction service anon client, channel member RLS missing, message search anon client, GDPR delete FK violation, GDPR delete missing consent/audit cleanup), 2 CI/CD (trivy-action @master in validate.yml + build-push.yml).
- **39 P1 findings**: webhook secret plaintext, SSRF regex gaps, CSP nonce missing from theme script, email enumeration, hardcoded test creds, missing RLS policies, channel member management broken, audit_logs no orgId, feature flag admin client use, 10 CI/CD secret exposure issues, GitHub token not persisted, concurrency control missing, PostCSS XSS via Next.js, user email in logs, GDPR delete incomplete, plus resilience/observability gaps.
- **79 P2 findings**: rate limiter improvements, request ID validation, CSRF cookie hardening, notification link validation, workspace/channel role authorization, soft-delete cascade missing, 404/loading states missing, Unicode icons, missing error boundaries, pnpm audit threshold, and more.
- **38 P3 findings**: nonce-based CSP, wget in Docker, avatar URL validation, feature flag hash, health endpoint CSRF churn, channel member insert error handling, thread textarea auto-resize, and more.

### Known Issues

- **Cloudflare 521**: Cloudflare can't reach the origin server. Terraform firewall rules restricting SSH/HTTP/HTTPS to Cloudflare IP ranges have been applied, but the 521 error persists. May need Cloudflare SSL/TLS set to Full (Strict) + origin certificate.
- **`hardening/` data store now connected**: All 5 stores (baselines, history, rules, policies, exceptions) populated by `sync_baseline.py`. Still disconnected from `engine/full_engine.ps1` which reads `docs/audits/latest/findings.json` (stale stub).

### Security & P0/P1 Fixes Applied (July 1, 2026)

| Finding                                            | Severity | Files Changed                   | Fix                                                                                                  |
| -------------------------------------------------- | -------- | ------------------------------- | ---------------------------------------------------------------------------------------------------- |
| SECURITY DEFINER missing SET search_path           | P0       | 4 migration files               | Added `SET search_path = 'public'` to handle_new_user, handle_new_workspace (x2), handle_new_channel |
| Reaction routes no membership check                | P0       | reactions/routes.ts, service.ts | Added `requireChannelAccess("id")` middleware; changed service to accept req.supabase                |
| Message search uses anon client                    | P0       | messages/routes.ts              | Replaced `getSupabase()` with `req.supabase` + null guard                                            |
| Feature-flag routes always 400 (broken middleware) | P0       | feature-flags/routes.ts         | Removed broken `requireWorkspaceMembership` middleware                                               |
| Socket.io no per-event auth                        | P0       | socket.ts                       | Added workspace membership check in channel:join; disabled allowEIO3                                 |
| Member mgmt no admin role check                    | P1       | workspaces/routes.ts            | Added `requireAdmin` middleware to POST/PATCH/DELETE member routes                                   |
| Webhook secret exposed in API responses            | P1       | webhooks/routes.ts              | Masked secrets as `abcd...wxyz` in all responses                                                     |
| Webhook GET query param mismatch (params vs query) | P1       | webhooks/routes.ts              | Replaced params middleware with query-based `requireWorkspaceQueryParam`                             |
| Channel slug dedup infinite loop                   | P1       | channels/service.ts             | Added `MAX_ATTEMPTS=100` guard                                                                       |
| Email in member list (PII exposure)                | P1       | workspaces/service.ts           | Removed `email` from getMembers() SELECT                                                             |
| console.error in notifications service             | P1       | notifications/service.ts        | Replaced with `logger.error`                                                                         |
| Workspace service test for email removal           | P1       | workspace.service.test.ts       | Updated test to check display_name instead of email                                                  |

### Additional Fixes Applied (July 1-2, 2026 — Sessions 2-6)

| Finding                                              | Severity | Files Changed                                                                  |
| ---------------------------------------------------- | -------- | ------------------------------------------------------------------------------ |
| /metrics endpoint unauthenticated                    | P0       | app.ts — added authenticate middleware                                         |
| CSP allows cdn.jsdelivr.net (broad script allowlist) | P1       | security-headers.ts — removed CDN wildcard                                     |
| Rate limiter IP-only keys                            | P1       | rate-limit.ts — added user+IP composite key                                    |
| Trivy @master mutable tag                            | P1       | validate.yml, build-push.yml — pinned to v0.28.0 SHA                           |
| pnpm audit threshold moderate                        | P1       | validate.yml — raised to high                                                  |
| No dependabot.yml                                    | P1       | Created `.github/dependabot.yml`                                               |
| CSRF missing origin/referer check                    | P1       | csrf.ts — added defense-in-depth origin validation                             |
| Missing loading.tsx/error.tsx in route groups        | P2       | Created 4 files for (auth) and (workspace) groups                              |
| TypeScript types out of sync                         | P1       | packages/db/src/types.ts — added missing fields and 7 new types                |
| Missing DB indexes (10 indexes)                      | P2       | `migrations/20260627000001_add_missing_indexes.sql`                            |
| Webhook PATCH response secret leaking                | P1       | webhooks/routes.ts — masked secret in PATCH response                           |
| Thread reply input not auto-resizing                 | P2       | thread-panel.tsx — added auto-resize via scrollHeight                          |
| Avatar uses `<img>` not Next.js `Image`              | P1       | avatar-upload.tsx — switched to Next.js Image                                  |
| Search results lack term highlighting                | P2       | search-bar.tsx — added `highlightText()` with `<mark>` wrapper                 |
| No Supabase query timeout utility                    | P1       | Created `apps/api/src/lib/db-timeout.ts`                                       |
| No data retention enforcement                        | P2       | Migration `20260627000002_enforce_data_retention.sql`                          |
| No worker health endpoint                            | P1       | worker/src/main.ts — added HTTP health server on port 4100                     |
| No keyboard shortcut help                            | P3       | Created `keyboard-shortcuts.tsx`, added to layout                              |
| Virtual message list                                 | P0       | message-list.tsx, chat-view.tsx — `@tanstack/react-virtual`, cursor pagination |
| Search date/author/channel filters                   | P1       | RPC, API, frontend — date_from, date_to, author_id, channel_ids                |
| Optimistic UI engine                                 | P1       | `useOptimistic` hook — temp IDs, rollback, server echo dedup                   |
| Threaded conversations                               | P1       | thread_metadata/participants tables, API endpoints, participant tracking       |
| Mention notification system                          | P1       | Mention parser, `resolveMentions()`, notification creation on send             |
| RBAC channel overrides                               | P1       | channel_role_overrides table, deny middleware, RLS hidden channels             |
| Rich text editor                                     | P1       | Markdown preview, emoji picker, drag-drop upload zone                          |
| Responsive layout                                    | P2       | Tablet sidebar collapse, mobile bottom nav, lg breakpoint                      |
| LiveKit WebRTC integration                           | P1       | Docker compose, Caddy proxy, token service, media room UI, firewall rules      |

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
- Workspace Member Trigger Fix — Added `ON CONFLICT DO NOTHING` + exception handling to `handle_new_workspace()` trigger
- Version Badge — Added fixed bottom-right badge on all pages
- E2E Test Framework — Added Playwright tests (`apps/web/e2e/auth-workspace-chat.spec.ts`)
- Test Endpoint — Added `/v1/test-body` for debugging body parsing
- All hardening P0-P3 findings resolved — See [Hardening Findings Tracker](#hardening-findings-tracker)
- **Consent routes TypeScript fix** — `apps/api/src/modules/consent/routes.ts` now uses `req.supabase`/`req.userId` instead of incorrectly passing Request object to `getSupabaseForUser()`
- **Login-form test updated** — Updated to assert on dev notice text instead of removed quick-fill test user buttons

### Remaining Work

**Frontend Release Gate Findings** (from `docs/audits/frontend_ux_release_gate_audit_summary.md`):

| Priority | Count         | Key Items                                                                                                                                                                                                                                             |
| -------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **P0**   | 0 (2 fixed)   | Hardcoded colors in `login-form.tsx` and `chat-view.tsx` ConnectionBanner — **FIXED**                                                                                                                                                                 |
| **P1**   | 0 (13 fixed)  | All P1 items resolved                                                                                                                                                                                                                                 |
| **P2**   | 18 unresolved | thread panel reply input not textarea, no delete confirmation dialog, edit/delete no error feedback, typing indicator unthrottled, no sending indicator on optimistic messages, notification dropdown overflow, missing tablet breakpoint, and others |
| **P3**   | 9             | Raw opacity values, "Loading..." text instead of skeletons, unused CSS classes                                                                                                                                                                        |

All UX/UI phases (1–7) and chat specialization (Phases A–E) complete.

### UX/UI Pack Re-execution (July 3, 2026)

Re-executed `docs/prompts/uxui/` pack with fresh frontend inspection, fixes, and audit. **Readiness: 83.7% (GO WITH RISKS)**.

| Area                 | Fix/Change                                                                                     | Files                                                                                     |
| -------------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| CSS var consistency  | Migrated workspace/auth error/loading pages from raw Tailwind classes to CSS custom properties | `app/(workspace)/loading.tsx`, `app/(workspace)/error.tsx`, `app/(auth)/error.tsx`        |
| Silent catch blocks  | Added `console.warn()` to 7 silent `.catch( () => {} )` sites                                  | `chat-view.tsx`, `message-input.tsx`, `layout.tsx`, `search-bar.tsx`                      |
| Markdown preview XSS | Added DOMPurify sanitization to `renderPreview`                                                | `message-input.tsx`                                                                       |
| Keyboard shortcuts   | Implemented Ctrl+K (search open), Ctrl+Shift+Up/Down (channel nav) via callback registry       | `keyboard-shortcuts.tsx`, `keyboard-shortcut-registry.ts`, `layout.tsx`, `search-bar.tsx` |
| React.memo           | Extracted `MessageItem` as memoized component for virtual list                                 | `message-list.tsx`                                                                        |
| Tablet breakpoint    | Auto-collapse sidebar at `md` (768-1024px), expand at `lg` (1024px+), hamburger at `md:hidden` | `app-sidebar.tsx`, `layout.tsx`                                                           |
| Audit pipeline       | Ingested output, finalized run `uxui_pack_20260703`, dev gate PASS, prod gate FAIL (2 P1)      | `tmp/uxui_output.json`, `docs/audits/runs/uxui_pack_20260703/`                            |

**Round 2 (same session) — All remaining P2s fixed:**

| Finding                                        | Files Changed                                                                              |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Unicode→SVG icon migration (5 components)      | `message-list.tsx`, `message-input.tsx`, `app-sidebar.tsx`, `search-bar.tsx`, `layout.tsx` |
| MessageItem memo refinement (stable callbacks) | `message-list.tsx`                                                                         |
| loadOlder edge case (loadingOlder reset)       | `chat-view.tsx`                                                                            |
| Search filter aria-pressed                     | `search-bar.tsx`                                                                           |
| P3: Ctrl+B/I shortcuts removed                 | `keyboard-shortcuts.tsx`                                                                   |
| P3: Workspace/channel caching                  | `[channelId]/page.tsx`                                                                     |

**Updated audit**: 90.3% readiness, 0 P0, 0 P1, 0 P2, 1 P3 remaining. Both dev and prod gates PASS.

**Round 3 — Mobile UX fixes:**

| Fix                                                                                                                             | Files Changed                                                                                 |
| ------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Edge mobile bottom address bar — `100vh` → `100dvh` via CSS override                                                            | `globals.css`, `layout.tsx` (root `min-h-[calc(var(--vh)-4rem)]`)                             |
| Double-scroll fix — removed `overflow-y-auto` from workspace layout main                                                        | `app/(workspace)/layout.tsx`                                                                  |
| Added `min-h-0` to MessageList wrapper to prevent flex overflow                                                                 | `chat-view.tsx`                                                                               |
| Added `overscroll-contain` to message list for mobile                                                                           | `message-list.tsx`                                                                            |
| Added `pb-14` to message list for mobile bottom nav clearance                                                                   | `message-list.tsx`                                                                            |
| Remaining Unicode icons migrated: thread-panel (✕), app-header (📱, 🔔), chat-view (📞)                                         | `thread-panel.tsx`, `app-header.tsx`, `chat-view.tsx`                                         |
| Larger action buttons (24px→36px)                                                                                               | `message-list.tsx`                                                                            |
| Reaction picker off-screen fix (right-aligned, overflow-x-auto, responsive emoji buttons)                                       | `message-list.tsx`                                                                            |
| Notification bell fixed (corrupted icon→Bell, toggle + click-outside close)                                                     | `notification-bell.tsx`                                                                       |
| Message actions always visible on mobile (not just hover)                                                                       | `message-list.tsx`                                                                            |
| Touch target sizing: sidebar buttons, thread close, hamburger, cancel reply, call button, notification bell, mobile Back button | `app-sidebar.tsx`, `thread-panel.tsx`, `layout.tsx`, `chat-view.tsx`, `notification-bell.tsx` |
| Avatar dropdown: click-outside close, Escape handler, max-width overflow                                                        | `avatar-upload.tsx`                                                                           |
| Emoji picker: click-outside close, Escape handler, max-width overflow                                                           | `message-input.tsx`                                                                           |
| Focus traps: keyboard shortcuts dialog, delete confirmation dialog                                                              | `keyboard-shortcuts.tsx`, `message-list.tsx`                                                  |
| Remaining Unicode icons: ← Back→ArrowLeft, ↳→Reply icon                                                                         | `chat-view.tsx`, `message-list.tsx`                                                           |
| Search blur timeout 200→300ms for mobile keyboard safety                                                                        | `search-bar.tsx`                                                                              |

**Hardening Analysis Findings** (from `docs/prompts/hardening_prompt_pack/` — Global Risk Score: 0/100 CRITICAL):

| Priority | Count | Key Items                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| -------- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **P0**   | 20    | consent routes broken (wrong getSupabaseForUser), webhook secret leaked in API responses, reaction routes no access control, /metrics unauthenticated, SECURITY DEFINER no search_path, no request timeout, no graceful shutdown drain, no query timeout, socket re-auth missing, no API timeout/retry, in-memory rate limiter, slug dedup infinite loop, reaction service uses anon client, channel member RLS missing, message search anon client, GDPR FK violation, GDPR missing consent/audit cleanup, trivy-action @master in validate.yml, trivy-action @master in build-push.yml |
| **P1**   | 39    | webhook secret plaintext, SSRF regex gaps, CSP nonce missing from theme script, email enumeration, hardcoded test creds, feature flag admin client use, audit_logs no orgId, channel member management broken, 10 CI/CD secret exposure issues, GITHUB_TOKEN not persisted, concurrency control missing, PostCSS XSS via Next.js, user email in logs, GDPR delete incomplete, missing RLS policies, plus resilience/observability gaps                                                                                                                                                   |
| **P2**   | 79    | rate limiter bypass, request ID validation, CSRF cookie hardening, notification link validation, workspace/channel role authorization, soft-delete cascade missing, 404/loading states missing, Unicode icons, missing error boundaries, pnpm audit threshold, API versioning no Sunset headers, feature flags, BFF layer, migration rollback, chaos testing, domain templating, deprecation policy, TypeScript `any` usage, and more                                                                                                                                                    |
| **P3**   | 38    | nonce-based CSP, wget in Docker, avatar URL validation, feature flag hash, health endpoint CSRF churn, channel member insert error handling, thread textarea auto-resize, and more                                                                                                                                                                                                                                                                                                                                                                                                       |

**Database/Schema Improvements** (from `docs/audits/database_schema_data_lifecycle_audit_summary.md`):

- ~~Add indexes: `workspace_members.user_id`, `channel_members.user_id`, `messages.parent_id`~~ **DONE**
- ~~Fix `audit_logs.organization_id` FK or CHECK constraint~~ **DONE**
- ~~Add `WorkspaceMember.role` to TypeScript types~~ **DONE**
- Unify migration directory structure
- ~~Add soft-delete for workspaces/channels/messages~~ **DONE**
- ~~Add data retention/archival policy~~ **DONE**
- ~~Add audit log pruning strategy~~ **DONE**
- ~~Parameterized cursor for message pagination~~ **DONE**

**Infra/Deployment** (from `docs/audits/infra_deployment_resilience_audit_summary.md`):

- Implement rollback strategy (preserve compose, use SHA tags)
- Add health endpoint routing to Caddyfile.prod — **DONE**
- Add `depends_on: condition: service_healthy` to compose files — **DONE**
- Add DO monitoring alerts (CPU > 80%, memory > 80%)
- Add fallback `docker pull` in dev deploy

**Testing/QA** (from `docs/audits/testing_qa_cicd_audit_summary.md`):

- Add auth flow E2E tests (magic link → callback → workspace redirect) — **ADDED** `apps/web/e2e/auth-workspace-chat.spec.ts`
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

| ID              | Finding                          | Status                     | Files Modified                                                                                         |
| --------------- | -------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------ |
| SEC-001         | Missing CSP Header               | ✅ **FIXED**               | `apps/api/src/middleware/security-headers.ts`                                                          |
| SEC-002         | No HSTS Header                   | ✅ **FIXED**               | `apps/api/src/middleware/security-headers.ts`                                                          |
| OBS-001         | No Distributed Tracing           | ✅ **FIXED**               | `apps/api/src/lib/sentry.ts`, `apps/api/src/app.ts`                                                    |
| OBS-002         | No Metrics Export (Prometheus)   | ✅ **FIXED**               | `apps/api/src/lib/metrics.ts` (new), `apps/api/src/app.ts`                                             |
| SUP-001         | No Dependency Scanning in CI     | ✅ **FIXED**               | `.github/workflows/validate.yml`                                                                       |
| CIC-001         | Secrets in CI Logs (base64 echo) | ✅ **FIXED**               | `.github/workflows/deploy-development.yml`                                                             |
| CIC-002         | SSH Key Written to Disk          | ✅ **FIXED**               | `.github/workflows/deploy-development.yml`                                                             |
| RES-001         | No Webhook Retry/DLQ             | ✅ **FIXED**               | `apps/api/src/modules/webhooks/service.ts`, `supabase/migrations/20260625000016_webhook_retry_dlq.sql` |
| RES-005/RES-011 | No Redis Adapter for Socket.io   | ✅ **FIXED**               | `apps/api/src/lib/socket.ts`, `apps/api/src/server.ts`, `apps/api/src/config/env.ts`                   |
| DAT-007         | No pg_cron for Retention         | ⚠️ **MANUAL SETUP NEEDED** | `docs/runbooks/pg_cron_setup.md` (requires manual Supabase pg_cron extension install)                  |

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

### P2 Findings (22 total — 19 fixed, 4 pending ⚠️)

- ✅ Request size limit (1MB)
- ✅ CORS validation (origin allowlist)
- ✅ Message sanitization (DOMPurify)
- ✅ Migration testing in CI
- ✅ CSRF protection (double-submit cookie)
- ✅ Audit log org access (workspace admin/owner RLS)
- ✅ API versioning (/v1/ prefix)
- ✅ Feature flags system
- ✅ Rate limiter bypass (IP+user composite key)
- ❌ Migration rollback scripts — **PENDING** (no rollback/down scripts exist; Supabase CLI lacks native rollback)
- ❌ BFF layer — **PENDING** (no BFF proxy/middleware implemented; requires architectural planning)
- ✅ Chaos testing (k6/Gatling) — `tests/k6/smoke-test.js` + `tests/k6/load-test.js`
- ✅ Deprecation policy (Sunset headers) — `apps/api/src/middleware/deprecation.ts`
- ✅ Webhook response size limit
- ✅ Notification link validation (URL allowlist)
- ✅ Domain templating (Caddyfile from env)
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
- ✅ Cookie banner implemented — component at `apps/web/components/cookie-banner.tsx`, API routes at `apps/api/src/modules/consent/routes.ts`, migration at `supabase/migrations/20260626000025_consent_logs.sql`
- ✅ Dev deps in prod fixed (moved pino-pretty to devDependencies)

### New Round 2 Findings (June 30, 2026 — Full Prompt Pack Execution)

**176 findings** from executing all 10 prompts against the codebase. Global Risk Score: **0/100 (CRITICAL)**.

| Priority | Count | Key Items                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **P0**   | 20    | consent routes broken (wrong getSupabaseForUser), webhook secret leaked in API responses, reaction routes no access control, /metrics unauthenticated, SECURITY DEFINER no search_path, no request timeout, no graceful shutdown drain, no query timeout, socket re-auth missing, no API timeout/retry, in-memory rate limiter, slug dedup infinite loop, reaction service anon client, channel member RLS missing, message search anon client, GDPR FK violation, GDPR missing consent/audit cleanup, trivy-action @master in validate.yml + build-push.yml |
| **P1**   | 39    | webhook secret plaintext, SSRF regex gaps, CSP nonce missing from theme script, email enumeration, hardcoded test creds, feature flag admin client use, audit_logs no orgId, channel member management broken, 10 CI/CD secret exposure issues, GITHUB_TOKEN not persisted, concurrency control missing, PostCSS XSS via Next.js, user email in logs, GDPR delete incomplete, missing RLS policies, plus resilience/observability gaps                                                                                                                       |
| **P2**   | 79    | rate limiter improvements, request ID validation, CSRF cookie hardening, notification link validation, workspace/channel role authorization, soft-delete cascade missing, 404/loading states missing, Unicode icons, missing error boundaries, pnpm audit threshold, and more                                                                                                                                                                                                                                                                                |
| **P3**   | 38    | nonce-based CSP, wget in Docker, avatar URL validation, feature flag hash, health endpoint CSRF churn, channel member insert error handling, thread textarea auto-resize, and more                                                                                                                                                                                                                                                                                                                                                                           |

**Quick wins fixed in this session:**

| Fix                                             | File                                                                                                                                   | Change                                                               |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| CSP remove unsafe-inline/unsafe-eval            | `apps/api/src/middleware/security-headers.ts:5`                                                                                        | Hardened script-src directive                                        |
| Remove hardcoded test credentials               | `apps/web/components/auth/login-form.tsx`                                                                                              | Deleted TEST_USERS array + dev-only quick-fill buttons               |
| Max query length for user search                | `apps/api/src/modules/auth/routes.ts:61`                                                                                               | Added `query.length < 100` guard                                     |
| Slug dedup infinite loop guard                  | `apps/api/src/modules/workspaces/service.ts`                                                                                           | Added MAX_ATTEMPTS=100 counter                                       |
| Remove email from search results                | `apps/api/src/modules/auth/service.ts:45`                                                                                              | Dropped `email` from search SELECT                                   |
| console.error → logger.error (workspace routes) | `apps/api/src/modules/workspaces/routes.ts:73`                                                                                         | Replaced console.error with structured logger                        |
| Remove userEmail from workspace logs            | `apps/api/src/modules/workspaces/routes.ts:21`                                                                                         | Removed PII from log metadata                                        |
| Log rate limit hits                             | `apps/api/src/middleware/rate-limit.ts`                                                                                                | Added handler with warn logging                                      |
| Log Socket.io auth failures                     | `apps/api/src/lib/socket.ts:79`                                                                                                        | Added logger.warn in auth catch block                                |
| Config throw instead of process.exit            | `apps/api/src/config/env.ts:29`                                                                                                        | Throws Error instead of hard exit                                    |
| pnpm audit threshold to moderate                | `.github/workflows/validate.yml:82`                                                                                                    | Changed --audit-level=high to moderate                               |
| --force-recreate on prod deploy                 | `.github/workflows/deploy-production.yml:245`                                                                                          | Added flag to ensure fresh containers                                |
| Fix consent routes TypeScript errors            | `apps/api/src/modules/consent/routes.ts`                                                                                               | Use `req.supabase`/`req.userId` instead of `getSupabaseForUser(req)` |
| Fix login-form test for removed dev creds       | `apps/web/components/auth/__tests__/login-form.test.tsx`                                                                               | Update test to check for dev notice instead of quick-fill buttons    |
| Ingest script + output schema created           | `scripts/prompts/ingest_output.py`, `docs/prompts/_contracts/output_schema.json`                                                       | Bridges prompt execution → audit pipeline                            |
| 15 stub prompts built out with real content     | `audit/` (4), `platform/audits/` (4), `features/` (2), `ai/`, `_contracts/`, `uxui/audits/` (1), `hardening_prompt_pack/runbooks/` (2) | Full execution-mode prompts with output schema references            |
| 30 pre_reconciliation_super_bundle files built  | `pre_reconciliation_super_bundle/*_audit_pack/`                                                                                        | 6 domain audit packs with 5-phase structure each                     |
| Deleted reconciliation/ and ux/ stub dirs       | `docs/prompts/reconciliation/`, `docs/prompts/ux/`                                                                                     | Consolidated into canonical locations                                |
| Created docs/prompts/INDEX.md                   | `docs/prompts/INDEX.md`                                                                                                                | Master navigation for all 32 prompt directories                      |

---

## Root Cause Clusters (10 clusters)

| Cluster   | Root Cause                | Max Severity | Status                                                                                                 |
| --------- | ------------------------- | ------------ | ------------------------------------------------------------------------------------------------------ |
| CLUSTER-A | Missing Security Headers  | P0           | ✅ 2/2 FIXED                                                                                           |
| CLUSTER-B | Distributed Systems Gaps  | P1           | ✅ 4/4 FIXED (Redis adapter, idempotency, presence, WS drain)                                          |
| CLUSTER-C | Webhook/Push Reliability  | P1           | ✅ 6/6 FIXED (Retry, DLQ, HMAC, circuit breaker, idempotency, backoff)                                 |
| CLUSTER-D | Observability Blind Spots | P0           | ✅ 5/5 FIXED                                                                                           |
| CLUSTER-E | Supply Chain Hygiene      | P0           | ✅ 5/5 FIXED                                                                                           |
| CLUSTER-F | CI/CD Secret Handling     | P0           | ✅ 2/2 FIXED                                                                                           |
| CLUSTER-G | Data Lifecycle Gaps       | P1           | ✅ 4/4 FIXED (pg_cron documented, soft delete, indexes, migration testing)                             |
| CLUSTER-H | Privacy/Compliance        | P1           | ✅ 6/6 FIXED (enumeration, avatar URLs, GDPR export/delete, JWKS, DPA, consent)                        |
| CLUSTER-I | Auth/Session Hardening    | P1           | ✅ 3/3 FIXED                                                                                           |
| CLUSTER-J | Platform Evolution Debt   | P2           | ✅ 4/5 FIXED (API versioning, domain templating, chaos testing, deprecation policy; BFF layer pending) |

**Legend**: ✅ FIXED | 🔄 IN PROGRESS | ⏳ PENDING

## Root Cause Clusters — Round 2 (June 30, 2026 — 176 findings from Full Prompt Pack)

| Cluster   | Root Cause                | Max Severity | Status                                                                                                 |
| --------- | ------------------------- | ------------ | ------------------------------------------------------------------------------------------------------ |
| CLUSTER-A | Missing Security Headers  | P0           | ✅ 2/2 FIXED                                                                                           |
| CLUSTER-B | Distributed Systems Gaps  | P1           | ✅ 4/4 FIXED (Redis adapter, idempotency, presence, WS drain)                                          |
| CLUSTER-C | Webhook/Push Reliability  | P1           | ✅ 6/6 FIXED (Retry, DLQ, HMAC, circuit breaker, idempotency, backoff)                                 |
| CLUSTER-D | Observability Blind Spots | P0           | ✅ 5/5 FIXED                                                                                           |
| CLUSTER-E | Supply Chain Hygiene      | P0           | ✅ 5/5 FIXED                                                                                           |
| CLUSTER-F | CI/CD Secret Handling     | P0           | ✅ 2/2 FIXED                                                                                           |
| CLUSTER-G | Data Lifecycle Gaps       | P1           | ✅ 4/4 FIXED (pg_cron documented, soft delete, indexes, migration testing)                             |
| CLUSTER-H | Privacy/Compliance        | P1           | ✅ 6/6 FIXED (enumeration, avatar URLs, GDPR export/delete, JWKS, DPA, consent)                        |
| CLUSTER-I | Auth/Session Hardening    | P1           | ✅ 3/3 FIXED                                                                                           |
| CLUSTER-J | Platform Evolution Debt   | P2           | ✅ 4/5 FIXED (API versioning, domain templating, chaos testing, deprecation policy; BFF layer pending) |

## Untracked Audit Findings (Not in Hardening Tracker Above)

The Hardening Findings Tracker covers audits 3-6 (Security, API, Database, Infra). The following audits have findings NOT tracked in the tables above:

### UI/UX Audit (`docs/audits/frontend/`)

- **P0**: 4/4 resolved — aria-labels on all icon buttons, Dialog focus trap implemented, focus-within for message actions, aria-live region for new messages
- **P1**: 3/3 resolved — skip-to-content link in layout, ErrorBoundary wrapper, channel name (not ID) displayed
- **P2**: 2/3 resolved — dialog close button visible with aria-label, toast feedback wired for create/edit/delete/upload operations; Unicode icons still in use (would require lucide-react migration)
- **P3**: 2/2 resolved — message input is `<textarea>` not `<input>`, PNG favicons present

### Testing/QA/CI-CD Audit (`docs/audits/testing_qa_cicd_audit_summary.md`)

- **P0**: No coverage thresholds, CI build doesn't depend on test, no E2E in CI, auth flow untested (4 items)
- **P1**: No diff coverage, messaging/file-upload/thread/membership E2E missing, API route tests missing (9 items)
- **P2**: Pre-commit hook, no required status checks, middleware untested, UI components untested, pages untested (7 items)

### Docs/DevEx/Operations Audit (`docs/audits/docs_devex_operations_audit_summary.md`)

- **P0**: Traefik reference in infra/docker/README (2 items) — **RESOLVED**
- **P1**: macOS sed bug, re-run key update, env file confusion, missing CONTRIBUTING.md/CHANGELOG.md, runbook gaps, no ADRs/OpenAPI spec (16 items) — **mostly RESOLVED**
- **P2**: Missing .nvmrc, .gitattributes, PR/issue templates, CODEOWNERS, update-keys/reset-db scripts, secrets rotation guide, doc coverage gaps (24 items)
- **P3**: Lazy migration references, performance benchmarks, testing strategy doc (6 items)

## GitHub Actions Workflows

| Workflow                          | Trigger                  | Purpose                                                                   |
| --------------------------------- | ------------------------ | ------------------------------------------------------------------------- |
| `ci.yml`                          | push main/develop, PR    | Calls reusable validate.yml (test, lint, typecheck, build)                |
| `validate.yml`                    | workflow_call            | Reusable: test, lint, typecheck, build jobs with Node 22 + pnpm cache     |
| `build-push.yml`                  | push develop             | Build Docker images → push to GHCR `:dev` tag (path-filtered)             |
| `deploy-development.yml`          | push develop             | SSH to droplet, transfer files, pipe images, compose up, health check     |
| `infra-development.yml`           | push infra/\*\* changes  | Terraform provision droplet + DNS + firewall + SSH key registration       |
| `deploy-production.yml`           | push main, manual        | Build + push `:latest` images, deploy to production droplet, health check |
| `supabase-migrations.yml`         | push develop, infra/\*\* | Supabase link + db push (runs before deploy)                              |
| `audit-ci.yml`                    | workflow_dispatch        | CI audit badge generation                                                 |
| `audit-ci-autocommit.yml`         | workflow_dispatch        | Auto-commit audit CI results                                              |
| `audit-badges-autocommit.yml`     | workflow_dispatch        | Auto-commit audit badge updates                                           |
| `audit-pr-gate.yml`               | PR                       | Audit-based PR gate checks                                                |
| `audit-release-certification.yml` | release                  | Release certification audit                                               |
| `environment-promotion-audit.yml` | workflow_dispatch        | Environment promotion audit                                               |
| `executive-stakeholder-pack.yml`  | workflow_dispatch        | Generate executive/stakeholder report pack                                |
| `feature-rollout-checkpoint.yml`  | workflow_dispatch        | Feature rollout checkpoint audit                                          |
| `governance.yml`                  | workflow_dispatch        | Governance policy enforcement                                             |
| `hardening-automation-runner.yml` | workflow_dispatch        | Automated hardening analysis runner                                       |
| `hardening.yml`                   | workflow_dispatch        | ✅ **FIXED** — runs hardening pipeline via `run_hardening_pipeline.py`    |
| `platform.yml`                    | workflow_dispatch        | Platform-level CI/CD orchestration                                        |

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

## Prompt Pipeline (`docs/prompts/`)

The prompts directory contains ~300 files across 30+ subdirectories. Prompts are AI-consumable instructions organized by domain/phase. The Prompt → Pipeline bridge connects prompt execution results to the audit pipeline:

```
Prompt execution (AI) → JSON output → scripts/prompts/ingest_output.py
                                      → docs/audits/runs/<run_id>/summaries/
                                      → run_audit_cycle.py finalize
                                      → docs/audits/latest_run.json
                                      → evaluate_gate.py / generate_dashboard.py / etc.
```

### Prompt Execution Stats (July 1, 2026)

58 prompts executed across 8 batches, 68 stage summaries → 624 findings (105 P0, 192 P1, 199 P2, 124 P3).

| Batch                    | Prompts | Source Directory                                                                            | Stage                                                   |
| ------------------------ | ------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Principal Audits         | 14      | `docs/prompts/{api,database,security,environment,release,testing,frontend,ops,governance}/` | principal_audit + frontend_release_gate                 |
| Feature Implementation   | 16      | `docs/prompts/chat_feature_prompt_pack_v1/docs/prompts/`                                    | principal_audit + frontend_release_gate                 |
| UX/UI                    | 5       | `docs/prompts/uxui/`                                                                        | frontend_release_gate                                   |
| Hardening Ultras         | 8       | `docs/prompts/hardening_prompt_pack/prompts/`                                               | principal_audit                                         |
| Platform Audits          | 4       | `docs/prompts/platform/audits/`                                                             | reconciliation + principal_audit + quality_confirmation |
| Reconciliation Preflight | 4       | `docs/prompts/reconciliation_preflight_bundle/`                                             | reconciliation                                          |
| Final Reconciliation     | 5       | `docs/prompts/final_reconciliation_prompt_pack/`                                            | reconciliation + quality_confirmation                   |
| Release Gate             | 1       | `docs/prompts/audit/release_gate.md`                                                        | quality_confirmation                                    |

### Prompt Architecture (after July 1 cleanup)

| Layer                         | Directory                                                                                                    | Status                                                                          |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| **Canonical output contract** | `_contracts/output_schema.json` + `output_contract.md`                                                       | ✅ NEW — all prompts must conform                                               |
| **Quick entry points**        | `audit/` (5 prompts)                                                                                         | ✅ Rebuilt from stubs                                                           |
| **Platform audits**           | `platform/audits/` (4 prompts)                                                                               | ✅ Rebuilt from stubs                                                           |
| **Features**                  | `features/` (4 prompts)                                                                                      | ✅ 2 of 4 rebuilt from stubs                                                    |
| **Auto-remediation**          | `ai/auto_remediation.md`                                                                                     | ✅ Rebuilt from stub                                                            |
| **Hardening domains**         | `hardening_prompt_pack/prompts/` (10 prompts)                                                                | ✅ Functional + autonomous Python runner                                        |
| **UX/UI**                     | `uxui/` (5 prompts)                                                                                          | ✅ Complete                                                                     |
| **Operator guides**           | `operator/` (14 files)                                                                                       | ✅ Complete                                                                     |
| **Reconciliation**            | `final_reconciliation_prompt_pack/` (6 files)                                                                | ✅ Canonical system (consolidated)                                              |
| **Reconciliation exec**       | `final_reconciliation_execution_bundle/` (~30 files)                                                         | ✅ Full orchestration bundle                                                    |
| **Reconciliation preflight**  | `reconciliation_preflight_bundle/` (18 files)                                                                | ✅ Preflight checklists                                                         |
| **Platform build**            | `platform/bootstrap/` + `platform/phases/`                                                                   | ✅ Complete                                                                     |
| **Domain audits**             | `api/`, `database/`, `security/`, `environment/`, `release/`, `testing/`, `frontend/`, `ops/`, `governance/` | ✅ All real content                                                             |
| **Chat features**             | `chat_feature_prompt_pack_v1/` (19 files)                                                                    | ✅ Full feature implementation pack                                             |
| **Ingestion script**          | `scripts/prompts/ingest_output.py`                                                                           | ✅ NEW — bridges prompts → audit pipeline, validates against output_schema.json |
| **Deleted stubs**             | `reconciliation/`, `ux/`                                                                                     | ✅ Removed (consolidated into canonical locations)                              |
| **Index**                     | `docs/prompts/INDEX.md`                                                                                      | ✅ NEW — master navigation                                                      |

### Prompts Buildout (July 1, 2026)

All stubs across `audit/` (4), `platform/audits/` (4), `features/` (2), `ai/` (1), `_contracts/` (1), `uxui/audits/` (1) have been built with real content. Additionally:

- **`pre_reconciliation_super_bundle/`** — All 6 domain audit packs (38 files) built out with sequential phase prompts and master orchestration
- **`portal-alignment/`** — CI workflow, scripts, and auto-fix PR script built out (6 stubs → functional)
- **`hardening_prompt_pack/runbooks/`** — Both runbooks given substantive execution guides
- **Canonical output schema** — `_contracts/output_schema.json` + `output_contract.md` define the prompt → pipeline bridge
- **Ingestion script** — `scripts/prompts/ingest_output.py` validated end-to-end
- **`reconciliation/` and `ux/`** stub directories deleted (consolidated into canonical locations)
- **`docs/prompts/INDEX.md`** created as master navigation
- **7 duplicate `(2)`/`(3)` files** removed

### Pipeline Test Results (July 1, 2026)

Full end-to-end test completed successfully:

| Step                        | Script                                                     | Result                                                                |
| --------------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------- |
| Create sample prompt output | Manual JSON                                                | ✅ Created with 3 findings (P1+P2)                                    |
| Ingest into audit run       | `scripts/prompts/ingest_output.py`                         | ✅ Created stage summary + report                                     |
| Schema validation (valid)   | `ingest_output.py --validate-schema`                       | ✅ Accepted well-formed output                                        |
| Schema validation (invalid) | `ingest_output.py` missing decision field                  | ✅ Error: "Missing required field: decision"                          |
| Sync hardening data store   | `scripts/hardening/sync_baseline.py`                       | ✅ Populated baselines, rules, history, exceptions, policies          |
| Finalize run                | `scripts/audits/run_audit_cycle.py finalize`               | ✅ Aggregated into `latest_run.json`                                  |
| Evaluate gate (PASS)        | `scripts/audits/evaluate_gate.py` dev policy               | ✅ Exit 0 (PASS)                                                      |
| Evaluate gate (FAIL)        | `scripts/audits/evaluate_gate.py` prod policy              | ✅ Exit 1 (FAIL correctly)                                            |
| Full pipeline E2E           | init → execute → finalize → stakeholder pack → sync → gate | ✅ All 9 phase decisions recorded, NO-GO checkpoint correctly flagged |

### Remaining Prompts Issues

- **`hardening.yml` CI workflow broken** — `on: [push, pull_request]` calls `run_full.ps1` → 5 nonexistent scripts (`engine/full_engine.ps1`, `ai/auto_fix.ps1`, `bot/pr_comment.ps1`, `dashboard/generate.ps1`, `compliance/export.ps1`)
- **`hardening_prompt_pack/ci/hardening_runner.yml` lives inside `docs/prompts/`** not in `.github/workflows/` — never executed
- **`ingest_output.py` schema validation** — Added basic type checking + required fields validation against `output_schema.json`; no `jsonschema` library dependency
- **`setup-dev.sh` uses wrong migration paths** — `packages/db/sql/migrations/*.sql` doesn't exist (PowerShell version uses `supabase/migrations/*.sql` correctly)
- **`aggregate_runs.py`** — Created to combine all run summaries into `latest_run.json` for gate evaluation. Reads all `docs/audits/runs/*/summaries/*_summary.json` files.

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

| Secret                      | Used By                       |
| --------------------------- | ----------------------------- |
| `DO_API_TOKEN`              | infra, deploy                 |
| `CI_SSH_PUBLIC_KEY`         | infra, deploy                 |
| `CI_SSH_PRIVATE_KEY`        | deploy                        |
| `DO_SSH_PRIVATE_KEY`        | deploy                        |
| `DO_SSH_PASSPHRASE`         | deploy                        |
| `CF_API_TOKEN`              | infra                         |
| `CF_ZONE_ID`                | infra                         |
| `SUPABASE_URL`              | deploy, build                 |
| `SUPABASE_ANON_KEY`         | deploy, build                 |
| `SUPABASE_SERVICE_ROLE_KEY` | deploy                        |
| `CF_ORIGIN_CERT`            | deploy                        |
| `CF_ORIGIN_KEY`             | deploy                        |
| `AWS_ACCESS_KEY_ID`         | infra                         |
| `AWS_SECRET_ACCESS_KEY`     | infra                         |
| `CI_SSH_FINGERPRINT`        | infra                         |
| `ALERT_EMAIL`               | infra                         |
| `SSH_ALLOWED_IPS`           | infra, deploy                 |
| `LIVEKIT_API_KEY`           | deploy                        |
| `LIVEKIT_API_SECRET`        | deploy                        |
| `VAPID_PUBLIC_KEY`          | deploy                        |
| `VAPID_PRIVATE_KEY`         | deploy                        |
| `SUPABASE_PROJECT_REF`      | supabase-migrations           |
| `SUPABASE_ACCESS_TOKEN`     | supabase-migrations, validate |
| `SUPABASE_DB_PASSWORD`      | supabase-migrations, validate |
| `GITHUB_TOKEN`              | auto-provided                 |
