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

The `hardening/` data store is synchronized with the audit pipeline via `scripts/hardening/sync_baseline.py`:

| Store          | File                                   | Content                                             |
| -------------- | -------------------------------------- | --------------------------------------------------- |
| **Baselines**  | `hardening/baselines/current.json`     | Latest finding set from `latest_run.json`           |
| **History**    | `hardening/history/history.json`       | Append-only snapshot log (run_id, decision, totals) |
| **Rules**      | `hardening/rules/core.rules.json`      | 6 check patterns (grep-based rules)                 |
| **Policies**   | `hardening/policies/governance.json`   | Gate thresholds (block on P0/P1)                    |
| **Exceptions** | `hardening/exceptions/exceptions.json` | Empty until manually populated                      |

## Repository Map

| Directory            | Purpose                             | Key Files                                                                                                                                              |
| -------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `apps/api/`          | Express API server                  | `src/app.ts`, `src/modules/*/`, `Dockerfile`                                                                                                           |
| `apps/web/`          | Next.js 15 frontend                 | `app/`, `components/`, `lib/`, `e2e/`                                                                                                                  |
| `packages/ui/`       | Shared React components             | `src/components/button.tsx`, etc.                                                                                                                      |
| `packages/db/`       | Supabase client + types             | `src/config.ts`, `src/types.ts`, `src/stores/`                                                                                                         |
| `infra/docker/`      | Compose files, Caddyfiles           | `docker-compose.devremote.yml`, `docker-compose.prod.yml`, `Caddyfile`, `Caddyfile.prod`                                                               |
| `infra/terraform/`   | DO droplet + DNS                    | `main.tf`, `templates/cloud-init.yaml.tftpl`                                                                                                           |
| `.github/workflows/` | CI/CD pipelines (19 workflows)      | See [Workflows section](#github-actions-workflows)                                                                                                     |
| `scripts/`           | Dev tooling + audit pipeline        | `setup-dev.ps1`, `teardown-dev.ps1`, `start-local-stack.ps1`, `audits/`, `hardening_runner/`, `hardening/sync_baseline.py`, `prompts/ingest_output.py` |
| `supabase/`          | Local Supabase config + migrations  | `config.toml`, `migrations/`, `policies/`, `seeds/`                                                                                                    |
| `hardening/`         | Hardening analysis artifacts        | `baselines/`, `exceptions/`, `history/`, `policies/`, `rules/`                                                                                         |
| `tests/`             | Test suites                         | `e2e/`, `integration/`, `setup/`                                                                                                                       |
| `docs/`              | Architecture docs, runbooks, audits | `docs/architecture/`, `docs/prompts/`, `docs/audits/`, `docs/runbooks/`                                                                                |

## Implementation Status

### Implemented Features

All features from the Mattermost comparative audit (July 4, 2026) have been implemented. Key areas:

- **Auth**: Magic link auth, per-request Supabase client, workspace creation RLS, user profiles auto-creation
- **Messages**: Optimistic locking, pinning, flagging, edit history, threaded conversations, permalinks, search with pagination and filters, forwarding, mention notifications, reaction tooltips
- **Channels**: DM/GM channels, read-only channels, channel mute, channel bookmarks, channel info sidebar, member count
- **Sidebar**: Categories, drag-and-drop reorder, unread filter, type icons (public/private/DM/GM), status pills on DMs
- **UI/UX**: CSS Grid workspace layout, adaptive bottom nav, viewport height recalc, inline media preview, user profile popover, floating timestamps, syntax-highlighted code blocks, rich text editor, emoji picker (600+), slash commands with autocomplete, markdown formatting toolbar, paste image from clipboard, context menus, action buttons always visible on mobile
- **Real-time**: Socket.io with Redis adapter (dev remote/prod), user presence (online/away/dnd), per-event auth
- **Worker**: 4 BullMQ processors (webhook-delivery with HMAC/SSRF/circuit breaker/DLQ, notifications, search-indexer, cleanup)
- **Infra**: RBAC (18 permissions × 3 roles), audit API, store abstraction layer, BFF layer, LiveKit WebRTC, per-channel notification preferences, custom user status, settings page
- **CI/CD**: 19 GitHub Actions workflows, E2E tests, diff coverage, pre-commit hook, dependabot, SBOM generation, image vulnerability scanning
- **Security**: All CSP/HSTS/metrics auth/SECURITY DEFINER/CSRF/rate limiter/query timeout/resilience hardening items resolved

All P0/P1/P2/P3 findings from the audit pipeline have been resolved (0 pending across all severities as of July 6, 2026).

### Audits Completed

- **Comparative repo audit** — `docs/audits/compare/`
- **Frontend UI/UX audit** — `docs/audits/frontend/`
- **Security/AuthZ/Tenancy audit** — `docs/audits/security_authz_tenancy_audit_summary.md`
- **API/Worker/Integrations audit** — `docs/audits/api_worker_integrations_audit_summary.md`
- **Database/Schema/Data Lifecycle audit** — `docs/audits/database_schema_data_lifecycle_audit_summary.md`
- **Infra/Deployment/Resilience audit** — `docs/audits/infra_deployment_resilience_audit_summary.md`
- **Testing/QA/CI-CD audit** — `docs/audits/testing_qa_cicd_audit_summary.md`
- **Docs/DevEx/Operations audit** — `docs/audits/docs_devex_operations_audit_summary.md`
- **Frontend UX Release Gate audit** — `docs/audits/frontend_ux_release_gate_audit_summary.md`

### Audits Executed (July 1-6, 2026)

Full audit pipeline executed across 8 batches (58 prompts, 624 initial findings). All findings resolved — final pipeline result: **0 P0, 0 P1, 0 P2, 0 P3 — ALL CLEAN**.

### Known Issues

- **Cloudflare 521**: Cloudflare can't reach the origin server. Terraform firewall rules applied but 521 persists. May need Cloudflare SSL/TLS set to Full (Strict) + origin certificate.
- **`hardening/` data store**: Still disconnected from `engine/full_engine.ps1` which reads stale `docs/audits/latest/findings.json`.

## Comparative Audit Implementation (July 4, 2026)

Full 8-phase Mattermost comparative audit (`C:\temp\mattermost-master` vs `C:\temp\chat`) executed and implemented:

| Area                               | Implementation                                                                                                                                                                                                              | Key Files                                                                                                               |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **Quick Wins**                     | Dependabot expanded (npm+docker+GHA ecosystems + cooldown), CI concurrency (cancel-in-progress), repo metadata (.nvmrc, .gitattributes, CODEOWNERS)                                                                         | `.github/dependabot.yml`, `ci.yml`, `validate.yml`, `.nvmrc`, `.gitattributes`, `.github/CODEOWNERS`                    |
| **Worker Implementation**          | 4 BullMQ processors: webhook-delivery (HMAC + SSRF + circuit breaker + DLQ), notification (in-app + push VAPID + email Nodemailer), search-indexer (async tsvector), cleanup (old deliveries + dead letters + consent logs) | `apps/worker/src/processors/*.ts`                                                                                       |
| **Message Features**               | Pinning (is_pinned column + API + SDK), flagging (message_flags table + API + SDK), edit history (message_edit_history table + API + SDK)                                                                                   | Migration `20260703000001_add_message_features.sql`, `messages/routes.ts`, `messages/service.ts`, `sdk/src/messages.ts` |
| **Store Abstraction**              | `IMessageStore` + `SupabaseMessageStore`, `IChannelStore` + `SupabaseChannelStore` — exported from `@chat/db`                                                                                                               | `packages/db/src/stores/`                                                                                               |
| **RBAC Expansion**                 | 18 granular permissions × 3 roles (owner/admin/member), `requirePermission()` middleware                                                                                                                                    | `packages/db/src/permissions.ts`, `apps/api/src/middleware/require-permission.ts`                                       |
| **Audit API**                      | `GET /v1/audit/logs` with filters (workspace, actor, action, entity, date range), `GET /v1/audit/logs/:id`                                                                                                                  | `apps/api/src/modules/audit/routes.ts`                                                                                  |
| **DM/GM Channels**                 | channel_type column, dm_channels table, DM creation API and listing, sidebar DM section with user picker                                                                                                                    | Migration `20260704000001_add_dm_presence_categories.sql`, `channels/service.ts`, `app-sidebar.tsx`                     |
| **User Presence**                  | Socket.io presence (online/away/dnd), user_presence table, auto-set online on connect, offline on disconnect                                                                                                                | `socket.ts`, migration above                                                                                            |
| **Channel Bookmarks**              | channel_bookmarks CRUD API                                                                                                                                                                                                  | `channels/routes.ts`, migration above                                                                                   |
| **Sidebar Categories**             | sidebar_categories + sidebar_channel_assignments tables with default seed data                                                                                                                                              | migration above                                                                                                         |
| **Per-Channel Notifications**      | channel_notification_preferences table (notify + sound toggles per channel)                                                                                                                                                 | migration above                                                                                                         |
| **UI/UX Polish**                   | Floating timestamp overlay, searchable emoji picker (600+ emojis), context menu copy-link, channel topic display, system messages, file preview (image viewer + file links)                                                 | `floating-timestamp.tsx`, `emoji-data.json`, `file-preview.tsx`                                                         |
| **Slash Commands**                 | /me, /code, /shrug, /poll, /gif, /joke, /help with autocomplete popup, keyboard navigation                                                                                                                                  | `lib/slash-commands.ts`, `message-input.tsx`                                                                            |
| **User Status**                    | Status picker popup in sidebar (Online/Away/DND), status API + socket broadcast, colored indicators                                                                                                                         | `app-sidebar.tsx`, `auth/routes.ts`                                                                                     |
| **Custom User Status**             | Modal with emoji + text + duration presets (30m/1h/4h/today/week), suggestions, set/clear                                                                                                                                   | `status-modal.tsx`, `status/routes.ts`, migration `20260627000011_custom_status.sql`                                    |
| **Markdown Formatting Toolbar**    | Bold/Italic/Strikethrough/Code/Link/Quote/List buttons, wraps selected text                                                                                                                                                 | `formatting-bar.tsx`, `message-input.tsx`                                                                               |
| **Syntax-Highlighted Code Blocks** | highlight.js github-dark theme, language badge, copy button with confirmation, auto-detection                                                                                                                               | `code-block.tsx`                                                                                                        |
| **Paste Image from Clipboard**     | Paste event creates File from DataTransferItem, calls upload handler                                                                                                                                                        | `message-input.tsx`                                                                                                     |
| **Search Autocomplete**            | User profiles + channel suggestions as you type in search bar                                                                                                                                                               | `search-bar.tsx`                                                                                                        |
| **Channel Member Count**           | Member count display in chat header                                                                                                                                                                                         | `chat-view.tsx`                                                                                                         |
| **Message Forwarding**             | API endpoint + context menu for quoting messages to other channels                                                                                                                                                          | `messages/routes.ts`                                                                                                    |
| **Inline Media Preview**           | ReactMarkdown + FilePreview component, auto-detects image/video/audio URLs, fullscreen overlay                                                                                                                              | `file-preview.tsx`, `message-list.tsx`                                                                                  |
| **User Profile Popover**           | Click avatar → positioned popover with name, email, join date, close on click-outside/Escape                                                                                                                                | `profile-popover.tsx`                                                                                                   |
| **Channel Info Sidebar**           | RHS panel with Members/Pinned tabs, scrollable lists                                                                                                                                                                        | `channel-info.tsx`                                                                                                      |
| **Channel Mute**                   | Bell icon toggle in channel header, upserts `channel_notification_preferences` table                                                                                                                                        | `chat-view.tsx`, `notifications/routes.ts`                                                                              |
| **Read-Only Channels**             | `is_read_only` boolean on channels, `prevent_read_only_message()` trigger on INSERT, creation option                                                                                                                        | Migration `20260627000012_read_only_channels.sql`                                                                       |
| **Settings Page**                  | Theme + notification preferences, settings link in sidebar                                                                                                                                                                  | `app-sidebar.tsx`, `settings/page.tsx`                                                                                  |
| **In-Channel Filter**              | Filter/search messages within current channel view                                                                                                                                                                          | `chat-view.tsx`                                                                                                         |
| **Reaction Tooltips**              | Hover tooltip showing "You and X others" on reactions                                                                                                                                                                       | `message-list.tsx`                                                                                                      |

## Mattermost Comparison — Remaining Features (July 5, 2026)

### Medium Effort (2-4 days each)

| Area          | Feature                                            | Reference                                                           |
| ------------- | -------------------------------------------------- | ------------------------------------------------------------------- |
| Sidebar       | Category management (create/rename/delete/reorder) | `sidebar_category/` (466 lines, draggable)                          |
| Sidebar       | Channel context menu (right-click)                 | `sidebar_channel_menu/` (favorite, mute, move, copy, leave, delete) |
| Sidebar       | Sidebar header team menu                           | `sidebar_header/` (team switch, browse channels, create, invite)    |
| Sidebar       | Resizable sidebar (drag handle)                    | `resizable_sidebar/`                                                |
| Emoji         | Category tabs (11 categories)                      | `emoji_picker_tabs.tsx`                                             |
| Emoji         | Skin tone selector (5 tones)                       | `emoji_picker_skin.tsx`                                             |
| Emoji         | Hover preview + name                               | `emoji_picker_preview.tsx`                                          |
| Emoji         | `:` colon autocomplete                             | `use_editor_emoji_picker.tsx`                                       |
| Emoji         | 3000+ emojis + recent tracking                     | `emoji.json` (3301 system emojis)                                   |
| Search        | Messages/Files type toggle                         | `search_box_type_selector.tsx`                                      |
| Search        | Operator hints (`from:`, `in:`, etc.)              | `search_box_hints.tsx`                                              |
| Search        | File extension suggestions                         | `extension_suggestions_provider.tsx`                                |
| Files         | Multi-file navigation (prev/next)                  | `file_preview_modal_main_nav/`                                      |
| Files         | Zoom in/out/100%/fit-to-window                     | `image_preview.tsx` with pan/drag                                   |
| Files         | File metadata panel (name, size, uploader)         | `file_preview_modal_info/`                                          |
| Notifications | Global notification settings page                  | `user_settings_notifications.tsx` (1300 lines)                      |
| Notifications | Desktop notification sounds (9 sounds)             | `desktop_notification_sounds_setting/`                              |
| Notifications | Trigger words + auto-responder                     | `user_settings_notifications.tsx`                                   |
| Keyboard      | Ctrl+K quick switcher (full)                       | `keyboard_shortcuts_modal.tsx` (35+ shortcuts)                      |
| Keyboard      | Full shortcut modal with categories                | `keyboard_shortcuts_modal.tsx`                                      |

### High Effort (1-2 weeks each)

| Area       | Feature                                       | Reference                                               |
| ---------- | --------------------------------------------- | ------------------------------------------------------- |
| Composer   | WYSIWYG editor (TipTap) replacing textarea    | `advanced_text_editor/` (30+ files, 3000+ lines)        |
| Composer   | Send scheduling (later today/tomorrow/custom) | `send_button/` + `scheduled_post_indicator/`            |
| Composer   | AI rewrite actions                            | `use_rewrite.tsx` + `ai_actions_menu.tsx`               |
| Onboarding | Task list popover with checkmarks             | `onboarding_tasklist/` (8 files)                        |
| Onboarding | Tour tips (5-step guided tour)                | `tours/` (15+ files)                                    |
| Drafts     | Auto-save + drafts page + scheduled posts     | `drafts/` (20+ files)                                   |
| Sidebar    | Multi-team sidebar (65px rail)                | `team_sidebar/`                                         |
| Sidebar    | User groups CRUD (6 modals)                   | `user_groups_modal/`, `create_user_groups_modal/`, etc. |
| Sidebar    | DM creation modal with multi-select           | `more_direct_channels/` (5 files)                       |

## Hardening Analysis Summary

Full hardening prompt pack executed (10 prompts, 176 unique findings across 8 domains). Global risk score was 0/100 CRITICAL. **All findings resolved as of July 6, 2026.**

| Priority | Count | Summary                                                                                                                                                                                                                                                               |
| -------- | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **P0**   | 20    | consent routes, webhook secret leak, reaction access control, /metrics auth, SECURITY DEFINER search_path, request/query timeout, graceful shutdown, socket re-auth, rate limiter, slug dedup, anon client usage, GDPR violations, trivy @master pins                 |
| **P1**   | 39    | webhook secret plaintext, SSRF gaps, CSP nonces, email enumeration, test creds, admin client abuse, audit_logs orgId, CI/CD secret exposure, GITHUB_TOKEN persistence, concurrency, PostCSS XSS, PII in logs, GDPR delete, missing RLS, resilience/observability gaps |
| **P2**   | 79    | rate limiter, request ID, CSRF, notification links, role auth, soft-delete cascade, 404/loading states, error boundaries, pnpm audit, API versioning, BFF layer, migration rollback, chaos testing, domain templating, deprecation policy, TypeScript `any`, and more |
| **P3**   | 38    | nonce CSP, wget in Docker, avatar URL validation, feature flag hash, health endpoint CSRF, channel member error handling, thread textarea auto-resize, and more                                                                                                       |

### Hardening Findings Tracker Reference

Detailed per-item tables for all hardening findings (P0-P3, Round 1 and Round 2) with IDs, status, and file changes are tracked in the git history. Key items of note:

- **Manual setup needed**: `pg_cron` for data retention (`docs/runbooks/pg_cron_setup.md`)
- **BFF layer**: Added as Next.js route handler (`apps/web/app/api/v1/[...path]/route.ts`)
- **Migration rollback**: 49 `_down.sql` scripts in `supabase/rollback/` + runbook (`docs/runbooks/migration-rollback.md`)

### Remaining Work

**Frontend Release Gate Findings** — 9 P3 items remain: raw opacity values, "Loading..." text instead of skeletons, unused CSS classes.

**Database/Schema Improvements:**

- Unify migration directory structure

**Infra/Deployment:**

- Implement rollback strategy (preserve compose, use SHA tags)
- Add DO monitoring alerts (CPU > 80%, memory > 80%)
- Add fallback `docker pull` in dev deploy

**Testing/QA:**

- Add messaging E2E flow (WebSocket connect → send → receive → edit → delete)
- Add file upload E2E flow
- Test remaining API route files (auth, workspaces, channels, messages)
- Test remaining middleware (error-handler, rate-limit, security-headers, request-id)
- Test remaining UI components (dialog, sidebar-group, skeleton)
- Increase coverage thresholds after Phase 2

## Root Cause Clusters

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

## GitHub Actions Workflows

| Workflow                          | Trigger                                    | Purpose                                                                   |
| --------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------- |
| `ci.yml`                          | push main/develop, PR, schedule (weekdays) | Calls reusable validate.yml (test, lint, typecheck, build, E2E)           |
| `validate.yml`                    | workflow_call                              | Reusable: test, lint, typecheck, build jobs with Node 22 + pnpm cache     |
| `build-push.yml`                  | push develop                               | Build Docker images → push to GHCR `:dev` tag (path-filtered)             |
| `deploy-development.yml`          | push develop                               | SSH to droplet, transfer files, pipe images, compose up, health check     |
| `infra-development.yml`           | push infra/\*\* changes                    | Terraform provision droplet + DNS + firewall + SSH key registration       |
| `deploy-production.yml`           | push main, manual                          | Build + push `:latest` images, deploy to production droplet, health check |
| `supabase-migrations.yml`         | push develop, infra/\*\*                   | Supabase link + db push (runs before deploy)                              |
| `e2e-daily.yml` (removed)         | schedule (consolidated into ci.yml)        | E2E health check now part of ci.yml schedule trigger                      |
| `load-test.yml`                   | schedule, manual                           | Weekly k6 smoke test against production                                   |
| `audit-ci.yml`                    | workflow_dispatch                          | CI audit badge generation                                                 |
| `audit-ci-autocommit.yml`         | workflow_dispatch                          | Auto-commit audit CI results                                              |
| `audit-badges-autocommit.yml`     | workflow_dispatch                          | Auto-commit audit badge updates                                           |
| `audit-pr-gate.yml`               | PR                                         | Audit-based PR gate checks                                                |
| `audit-release-certification.yml` | release                                    | Release certification audit                                               |
| `environment-promotion-audit.yml` | workflow_dispatch                          | Environment promotion audit                                               |
| `executive-stakeholder-pack.yml`  | workflow_dispatch                          | Generate executive/stakeholder report pack                                |
| `feature-rollout-checkpoint.yml`  | workflow_dispatch                          | Feature rollout checkpoint audit                                          |
| `governance.yml`                  | workflow_dispatch                          | Governance policy enforcement                                             |
| `hardening-automation-runner.yml` | workflow_dispatch                          | Automated hardening analysis runner                                       |
| `hardening.yml`                   | workflow_dispatch                          | Runs hardening pipeline via `run_hardening_pipeline.py`                   |
| `platform.yml`                    | workflow_dispatch                          | Platform-level CI/CD orchestration                                        |

## Environments

| Environment | Frontend                | API (same-domain via Caddy) | GitHub  |
| ----------- | ----------------------- | --------------------------- | ------- |
| Development | chat.mainecybertech.us  | chat.mainecybertech.us      | develop |
| Production  | chat.mainecybertech.com | chat.mainecybertech.com     | main    |
| Local       | localhost:3000          | localhost:4000              | N/A     |

## Documentation

Architecture docs in `docs/architecture/`: bootstrap-foundation.md, repo-structure.md, portal-comparison-audit.md.

Full audit suite in `docs/audits/` (9 reports covering security, API, database, infra, testing, docs, frontend, UX release gate, comparative).

## Full Comparative Repo Audit (July 7, 2026)

An exhaustive 8-phase comparative audit of `C:\temp\mattermost-master` (Mattermost v11.9.0) vs current repo was completed. Full report: `docs/audits/compare/full_comparative_repo_audit.md`.

### High-Level Verdict

**Do not mirror Mattermost's architecture.** The current repo's modern stack (Next.js 15, Supabase, Turborepo, pnpm, Tailwind, Socket.io, BullMQ) is architecturally superior for a greenfield project. Mattermost's advantages are in feature breadth (plugin system, enterprise auth, 67 locales, 47 job types) and maturity, not architectural patterns.

### Key Wins for Current Repo

| Area               | Current Repo Advantage                                  |
| ------------------ | ------------------------------------------------------- |
| **Auth model**     | Supabase Auth — less custom code, built-in RLS          |
| **Build system**   | Turborepo + pnpm — fast, cacheable, parallel            |
| **Styling**        | Tailwind + design tokens — consistent, maintainable     |
| **Database**       | Supabase + RLS — declarative tenant isolation           |
| **Migrations**     | Forward + rollback scripts (Mattermost lacks rollbacks) |
| **Infrastructure** | Terraform IaC (Mattermost has none)                     |
| **CI/CD audit**    | 19 audit workflows (Mattermost has none)                |
| **PWA**            | Service worker + push (no native app needed)            |

### Alignment Strategy

| Phase                   | Focus               | Items                                                                                                        |
| ----------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------ |
| **Phase 0-1** (Week 1)  | No-risk cleanup     | Down migration scripts, store interfaces, CI/CD consolidation, error codes, test coverage, docs              |
| **Phase 2** (Week 2)    | Low-risk similarity | Centralized route registry, background job expansion, link previews, admin endpoints, webhook UI             |
| **Phase 3** (Week 3-4)  | Medium convergence  | Data retention enforcement, compliance export, i18n expansion, channel member history, error standardization |
| **Phase 4-5** (Week 5+) | Strategic optional  | Multi-factor auth, advanced text editor, GIF picker, plugin evaluation                                       |

### Do-Not-Break Guardrails

```
CRITICAL:
  1. Authentication — all sessions, all flows
  2. Message delivery — no loss, no duplication
  3. RLS policies — never less restrictive
  4. Real-time connections — no silent disconnects
  5. Database migrations — always reversible

HIGH:
  6. API contracts — SDK consumers
  7. UI layout — responsive design
  8. Search functionality — tsvector queries
  9. File upload/download
  10. Notification delivery
```

### Things to Keep As-Is

Supabase Auth, Next.js App Router, Tailwind CSS + Design Tokens, Turborepo + pnpm, Socket.io + Redis, RLS Authorization, BullMQ Workers, Down Migration Scripts, PWA Approach, BFF Layer, Storybook, Optimistic UI Hook.

### Things to Skip Porting

Plugin system (unjustified), boards/kanban (out of scope), desktop app (PWA sufficient), Redux patterns (Supabase better), SASS (Tailwind better), Cypress (Playwright sufficient).

## Local Development

```powershell
.\scripts\setup-dev.ps1   # One-time setup
pnpm dev                   # Start dev servers
.\scripts\teardown-dev.ps1 # Cleanup
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

## Completed Work Archive

Detailed change logs for all completed work can be found in the git history:

- **Security & P0/P1 Fixes Applied (July 1)** — SECURITY DEFINER search_path, reaction membership check, anon client fixes, socket per-event auth, webhook secret masking, admin role checks, PII removal, slug dedup guard
- **Additional Fixes (July 1-2, Sessions 2-6)** — /metrics auth, CSP hardening, rate limiter composite key, trivy pinning, audit threshold, dependabot, CSRF origin check, loading/error pages, TypeScript types, DB indexes, webhook PATCH leak, thread auto-resize, Next.js Image, search highlighting, query timeout, data retention, worker health, keyboard shortcuts, virtual list, search filters, optimistic UI, threaded conversations, mentions, RBAC overrides, rich text editor, responsive layout, LiveKit
- **UX/UI Pack Re-execution (July 3)** — CSS var consistency, silent catch blocks, DOMPurify, keyboard shortcuts, React.memo, tablet breakpoint, Unicode→SVG icons, mobile fixes (dvh, scroll, touch targets, focus traps, reaction picker, notification bell)
- **Immediate Work Quick Wins (July 6)** — 12 Mattermost comparison quick wins verified as already implemented
- **All 7 Remaining Findings Fixed (July 6)** — BFF layer, migration rollback scripts, diff coverage enforcement, Playwright visual snapshots, keyboard shortcuts discoverability, E2E scaffolds, reduced-motion check
- **Prompt Pipeline Buildout (July 1)** — 58 prompts executed across 8 batches, 68 stage summaries, 624 findings aggregated, all resolved
- **Round 2 Hardening Fixes (June 30-July 1)** — CSP removal of unsafe-inline/eval, test creds removal, query length guard, console.error→logger, rate limit logging, socket auth logging, config throw, pnpm audit threshold, --force-recreate, consent routes TS fix

Run `git log --oneline --since="2026-06-20"` for the full commit history or see `CHANGELOG.md`.
