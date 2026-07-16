# AGENTS.md — Architecture & Implementation Status

## Current State (July 9, 2026)

- **All P0/P1 findings resolved** — 0 P0, 0 P1 across all audit/hardening pipelines
- **P2/P3 findings**: ~130 total (original), all resolved
- **Phases 6-8 of Mattermost comparative audit**: Complete — Change Plan (Phase 6) revised, Patch Sets (Phase 7) redesigned, Final Reconciliation (Phase 8) updated with current SSOT
- **All Mattermost-aligned features verified present**: Full 8-phase comparative audit confirmed all 35+ features implemented. See `docs/audits/compare/full_comparative_repo_audit.md`.
- **UI/UX Deep Audit (July 9, 2026)**: Full principal-level audit completed — 1 P0, 16 P1 findings identified and fixed. See `docs/audits/ux-audit/20260709/` for full report. All P0/P1 items resolved.
- **Full 8-phase Comparative Audit Re-execution (July 9, 2026)**: Complete re-execution of all 8 phases against Mattermost v11.9.0. See `docs/audits/compare/full_comparative_repo_audit_july9.md`. Key findings: 5 immediate quick wins identified, 20 prioritized recommendations, CSS variable consolidation and message-input.tsx decomposition flagged as top refactoring priorities. All 50 UI/UX deep audit findings resolved since last audit, narrowing the UX gap with Mattermost.
- **Full 8-phase Frontend UI/UX Comparative Audit (July 9, 2026)**: Complete frontend UI/UX audit comparing chat vs Mattermost across all 8 phases. 42+ findings documented covering accessibility, visual system, responsiveness, and component consistency. See `docs/audits/ux-audit/new/20260709-032614/`. Key verdict: current frontend is architecturally superior; gaps are in breadth (not quality). 3-phase roadmap produced with 6 immediate quick wins identified.
- **Phase 2 Component Standardization (July 9, 2026)**: All 7 items completed — ScreenReaderOnly, StatusBadge, EmptyState components created; DeleteDialog refactored to use Button danger variant; 14 inline style backdrops standardized to `bg-black/50`; silent catch blocks replaced with toasts in 3 components; CSS variables consolidated (duplicate `--color-*` vars removed, architecture comments added).
- **Phase 3 Layout/Workflow Refinement (July 9, 2026)**: All 5 items completed — Global announcement banner (migration + API + component + dismiss persistence); Channel header action menu (dropdown with Copy link + Mute/Unmute); Tablet sidebar auto-collapse (768-1024px, 60px mini-rail, smooth transition); Channel intro (topic shown in header + empty state); Thread typing indicator (textarea emits events, display names used).
- **Full 8-phase Frontend UI/UX Re-execution (July 9, 2026)**: Second full re-execution capturing all Phase 2/3 changes. See `docs/audits/ux-audit/new/20260709-041505/`. Remaining gaps documented as Phase 4 items: empty state adoption (15+ locations), opacity consolidation, focus ring standardization, post-delete undo toast, high-contrast mode, channel inline topic editing.
- **Phase 4 Strategic UX Modernization (July 9, 2026)**: All 6 items completed — EmptyState adopted in 16 files/20 locations; Post-delete undo toast with 5s action window; High-contrast mode via `prefers-contrast: high`; Focus ring standardization across all interactive elements; Opacity consolidation (264 replacements in 61 files); Channel inline topic editing (click to edit, Enter saves, Escape cancels); Drag-and-drop file upload overlay.
- **Full 8-phase Frontend UI/UX Final Reconciliation (July 9, 2026)**: Third and final re-execution confirming all 24 items across 4 phases complete. See `docs/audits/ux-audit/new/20260709-190625/`. No remaining UX gaps — all accessibility, consistency, responsiveness, and polish items resolved. Frontend declared production-ready.

### UI/UX Audit P0/P1 Fixes Applied (July 9, 2026)

| ID     | Severity | Finding                                                                                        | Fix Location                                             |
| ------ | -------- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| UX-009 | P0       | iOS keyboard hides message input — added VisualViewport API                                    | `apps/web/app/layout.tsx`                                |
| UX-001 | P1       | Dark mode CSS variables not defined — added .dark section with all Mattermost vars             | `apps/web/app/globals.css`                               |
| UX-002 | P1       | Theme toggle uses .dark class but dark theme used media query — switched to html.dark selector | `packages/ui/src/styles.css`                             |
| UX-006 | P1       | Bottom nav lacks safe area bottom — added env(safe-area-inset-bottom)                          | `apps/web/app/(workspace)/layout.tsx`                    |
| UX-007 | P1       | Mobile header lacks safe area top — added env(safe-area-inset-top)                             | `apps/web/app/(workspace)/layout.tsx`                    |
| UX-008 | P1       | Landscape nav height 40px below 44px — increased to 2.75rem                                    | `apps/web/app/globals.css`                               |
| UX-010 | P1       | Quick Switcher no focus trap — added Tab cycle handler                                         | `apps/web/components/chat/quick-switcher.tsx`            |
| UX-011 | P1       | Emoji Picker no focus trap — added Tab cycle useEffect                                         | `apps/web/components/chat/emoji-picker.tsx`              |
| UX-012 | P1       | Hover-reveal not keyboard accessible — added :focus-within support                             | `apps/web/app/globals.css`                               |
| UX-013 | P1       | Formatting toolbar no aria-pressed — added isActive check + aria-pressed                       | `apps/web/components/chat/formatting-bar.tsx`            |
| UX-014 | P1       | ProfilePopover no focus management — added auto-focus, focus trap, focus return                | `apps/web/components/shared/profile-popover.tsx`         |
| UX-015 | P1       | ContextMenu no focus management — added auto-focus, arrow-key nav, focus trap                  | `apps/web/components/chat/message-list/context-menu.tsx` |
| UX-016 | P1       | foreground.muted (#a3a3a3) fails WCAG AA 2.7:1 — changed to neutral[500] (#737373)             | `packages/ui/src/tokens/semantic-colors.ts`              |
| UX-017 | P1       | rgba(..., 0.56) low contrast — added --text-secondary-alpha: 0.72 CSS variable                 | `apps/web/app/globals.css`                               |
| UX-018 | P1       | i18n t() function unused — adopted in LoginForm (15+ keys)                                     | `apps/web/components/auth/login-form.tsx`                |
| UX-049 | P1       | Raw Supabase errors displayed — added userSafeError mapping function                           | `apps/web/components/auth/login-form.tsx`                |

Full report: `docs/audits/ux-audit/20260709/`

### UI/UX Audit P2 Fixes Applied (July 9, 2026)

| ID     | Severity | Finding                                                                          | Fix Location                                                                                                                                                                                                                                                   |
| ------ | -------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UX-003 | P2       | Triple-defined radius values — kept globals.css values as source of truth        | `apps/web/app/globals.css`                                                                                                                                                                                                                                     |
| UX-004 | P2       | No centralized z-index system — added --z-\* layer variables                     | `apps/web/app/globals.css`                                                                                                                                                                                                                                     |
| UX-005 | P2       | Hardcoded #fff in 14+ files — replaced with var(--button-color)                  | `search/page.tsx`, `admin/page.tsx`, `login-form.tsx`, `onboarding-tour.tsx`, `app-sidebar.tsx`, `group-modal.tsx`, `chat-view.tsx`, `notification-preferences-modal.tsx`, `search-bar.tsx`, `message-input.tsx`, `delete-dialog.tsx`, `user-picker-modal.tsx` |
| UX-022 | P2       | window.prompt() for URLs — replaced with inline URL input form                   | `apps/web/components/chat/formatting-bar.tsx`                                                                                                                                                                                                                  |
| UX-026 | P2       | DeleteDialog duplicated shared Dialog — refactored to use @chat/ui Dialog        | `apps/web/components/chat/message-list/delete-dialog.tsx`                                                                                                                                                                                                      |
| UX-027 | P2       | Double backdrop overlay on mobile sidebar — removed AppSidebar internal backdrop | `apps/web/components/workspace/app-sidebar.tsx`                                                                                                                                                                                                                |
| UX-042 | P2       | overflow:hidden clips children — changed to overflow:clip                        | `apps/web/app/(workspace)/layout.tsx`                                                                                                                                                                                                                          |
| UX-043 | P2       | Hardcoded black shadow not theme-aware — replaced with elevation variable        | `apps/web/components/chat/floating-timestamp.tsx`                                                                                                                                                                                                              |
| UX-044 | P2       | Thread panel hardcoded shadow — replaced with var(--elevation-4)                 | `apps/web/components/chat/chat-view.tsx`                                                                                                                                                                                                                       |
| UX-045 | P2       | Avatar no onError handler — added imgError fallback state                        | `packages/ui/src/components/avatar.tsx`                                                                                                                                                                                                                        |
| UX-046 | P2       | Jump-to div as button — replaced with <button> element                           | `apps/web/components/workspace/app-sidebar.tsx`                                                                                                                                                                                                                |
| UX-048 | P2       | Category delete hover-only visible — added focus-visible + focus-within          | `apps/web/components/workspace/app-sidebar.tsx`                                                                                                                                                                                                                |
| UX-025 | P2       | Sidebar resize mouse-only — added ArrowLeft/ArrowRight keyboard handler          | `apps/web/app/(workspace)/layout.tsx`                                                                                                                                                                                                                          |
| UX-036 | P2       | Forward action missing from context menu — added Share2 option                   | `apps/web/components/chat/message-list/context-menu.tsx`                                                                                                                                                                                                       |
| UX-037 | P2       | Pin action missing from context menu — added Pin option                          | `apps/web/components/chat/message-list/context-menu.tsx`                                                                                                                                                                                                       |
| UX-039 | P2       | Channel sidebar 32px below touch target — increased to 36px (44px on mobile)     | `apps/web/app/globals.css`                                                                                                                                                                                                                                     |
| UX-041 | P2       | Context menu overflows viewport — added viewport boundary clamping               | `apps/web/components/chat/message-list.tsx`                                                                                                                                                                                                                    |
| UX-028 | P2       | Per-message reaction fetch for batches — always uses batch endpoint with chunks  | `apps/web/components/chat/message-list.tsx`                                                                                                                                                                                                                    |
| UX-029 | P2       | Inconsistent date formatting — message-item uses i18n formatDate                 | `apps/web/components/chat/message-list/message-item.tsx`                                                                                                                                                                                                       |
| UX-030 | P3       | No "Mark all read" — added button in notification dropdown header                | `apps/web/components/notifications/notification-bell.tsx`                                                                                                                                                                                                      |
| UX-031 | P3       | Silent notification save failure — added toast error feedback                    | `apps/web/components/chat/notification-preferences-modal.tsx`                                                                                                                                                                                                  |
| UX-032 | P3       | Status emoji "??" never selectable — added preset emoji selector row             | `apps/web/components/shared/status-modal.tsx`                                                                                                                                                                                                                  |
| UX-038 | P3       | No character count indicator — added char count near send button                 | `apps/web/components/chat/message-input.tsx`                                                                                                                                                                                                                   |
| UX-040 | P2       | Icon buttons below 44px — added global mobile touch target CSS rules             | `apps/web/app/globals.css`                                                                                                                                                                                                                                     |
| UX-047 | P2       | Category rename only via double-click — added inline rename button on focus      | `apps/web/components/workspace/app-sidebar.tsx`                                                                                                                                                                                                                |
| UX-050 | P3       | Empty states lack actionable microcopy — improved channel-info empty states      | `apps/web/components/chat/channel-info.tsx`                                                                                                                                                                                                                    |

### UI/UX Audit P2/P3 Fixes Applied — Round 2 (July 9, 2026)

| ID     | Severity | Finding                                                                             | Fix Location                                              |
| ------ | -------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------- |
| UX-023 | P2       | Category drag-and-drop no keyboard alternative — added Move Up/Down buttons         | `apps/web/components/workspace/app-sidebar.tsx`           |
| UX-024 | P2       | Channel drag-and-drop no keyboard alternative — added move up/down category buttons | `apps/web/components/workspace/app-sidebar.tsx`           |
| UX-033 | P3       | Onboarding progress not synced — added API sync call                                | `apps/web/components/workspace/onboarding-tour.tsx`       |
| UX-034 | P2       | Thread reply uses textarea not TipTap — documented as strategic item                | —                                                         |
| UX-035 | P2       | No reactions on thread replies — added full reaction UI                             | `apps/web/components/chat/thread-panel.tsx`               |
| UX-019 | P2       | No user role editing in admin panel — added role dropdown per user                  | `apps/web/app/(workspace)/[workspaceSlug]/admin/page.tsx` |
| UX-020 | P2       | No CSV validation before import — added client-side CSV preview                     | `apps/web/app/(workspace)/[workspaceSlug]/admin/page.tsx` |

### UI/UX Audit P2/P3 Fixes Applied — Round 3 (July 9, 2026)

| ID     | Severity | Finding                                                        | Fix Location                                |
| ------ | -------- | -------------------------------------------------------------- | ------------------------------------------- |
| UX-021 | P2       | No message list virtualization — added @tanstack/react-virtual | `apps/web/components/chat/message-list.tsx` |

- **All 50 findings from UI/UX deep audit resolved** (1 P0, 16 P1, 22 P2, 11 P3)
- **Strategic items gated**: full TipTap expansion, desktop app — require post-launch analytics to justify
- **Deployment**: Development at chat.mainecybertech.us, Production at chat.mainecybertech.com — both healthy
- **Recent major changes**: Full comparative audit, 105+ P2/P3 fixes, security hardening, test expansion, production readiness, API performance optimization, Phase 6-8 reconciliation, full Mattermost feature comparison documented

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
- **Sidebar**: Categories, drag-and-drop reorder, unread filter, type icons (public/private/DM/GM), status pills on DMs, **workspace collapse toggle** (localStorage-persisted `sidebar:ws-expanded` key)
- **UI/UX**: Flexbox workspace layout, adaptive bottom nav, viewport height recalc, inline media preview, user profile popover, floating timestamps, syntax-highlighted code blocks, rich text editor, emoji picker (600+), slash commands with autocomplete, markdown formatting toolbar, paste image from clipboard, context menus, action buttons always visible on mobile
- **Real-time**: Socket.io with Redis adapter (dev remote/prod), user presence (online/away/dnd), per-event auth
- **Worker**: 6 BullMQ processors — webhook-delivery (HMAC + SSRF + circuit breaker + DLQ), notification (in-app + push VAPID + email Nodemailer), search-indexer (async tsvector), cleanup (old deliveries + dead letters + consent logs), data-retention (messages/audit/consent logs/channels/workspaces), reminder (due reminders polling)
- **Infra**: RBAC (18 permissions × 3 roles), audit API, store abstraction layer, BFF layer, LiveKit WebRTC, per-channel notification preferences, custom user status, settings page
- **CI/CD**: 19 GitHub Actions workflows, E2E tests, diff coverage, pre-commit hook, dependabot, SBOM generation, image vulnerability scanning
- **Security**: All CSP/HSTS/metrics auth/SECURITY DEFINER/CSRF/rate limiter/query timeout/resilience hardening items resolved

All P0/P1/P2/P3 findings from the audit pipeline have been resolved (0 pending across all severities as of July 6, 2026).

## Feature Verification Status (July 8, 2026)

| Feature                                | Status      | Details                                                                                          |
| -------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------ |
| Multi-team sidebar (65px rail)         | ✅ Done     | TeamSidebar component with workspace icons, desktop only                                         |
| Advanced WYSIWYG editor                | ✅ Done     | TipTap with underline, highlight, task lists, image, text align, 15 formatting buttons           |
| Onboarding tour / task list            | ✅ Done     | 5-step task list implemented                                                                     |
| Drafts auto-save                       | ✅ Done     | localStorage auto-save + restore                                                                 |
| Multi-factor authentication            | ❌ Not done | No MFA/2FA support                                                                               |
| OAuth providers                        | ✅ Done     | Google + GitHub sign-in implemented                                                              |
| Full i18n for all UI strings           | ✅ Done     | Comprehensive en.json with 250+ keys across 16 categories, pluralization, date/number formatting |
| In-app notification sounds (9 options) | ✅ Done     | chime, bell, ding, pop, tri-tone added (total 9)                                                 |
| Auto-responder / away message          | ✅ Done     | API + UI + migration + auto-reply on DM receipt                                                  |
| Data retention scheduling              | ✅ Done     | BullMQ scheduler with 24h retention + 6h cleanup cycles                                          |
| E2E messaging flow test                | ✅ Done     | Playwright: login, create workspace/channel, send/edit/delete messages, WebSocket real-time      |
| Email verification flow                | ✅ Done     | Verification page with resend                                                                    |

| Bulk import/export | ✅ Done | CSV utility + 4 export endpoints + 2 import endpoints + admin UI |
| Migration rollback in CI | ✅ Done | CI verifies all migrations have matching rollbacks |
| pnpm audit in pre-commit | ✅ Done | Added to .husky/pre-commit |
| GitHub discussion template | ✅ Done | Created .github/DISCUSSION_TEMPLATE/general.yml |
| Worker .env.example | ✅ Done | Created apps/worker/.env.example |
| turbo.json documentation | ✅ Done | Added description fields to all tasks |
| Dependabot grouping | ✅ Done | All ecosystems grouped properly |

### Audits Completed

- **Comparative repo audit (July 7)** — `docs/audits/compare/full_comparative_repo_audit.md`
- **Comparative repo audit re-execution (July 9)** — `docs/audits/compare/full_comparative_repo_audit_july9.md`
- **Frontend UI/UX audit** — `docs/audits/frontend/`
- **Security/AuthZ/Tenancy audit** — `docs/audits/security_authz_tenancy_audit_summary.md`
- **API/Worker/Integrations audit** — `docs/audits/api_worker_integrations_audit_summary.md`
- **Database/Schema/Data Lifecycle audit** — `docs/audits/database_schema_data_lifecycle_audit_summary.md`
- **Infra/Deployment/Resilience audit** — `docs/audits/infra_deployment_resilience_audit_summary.md`
- **Testing/QA/CI-CD audit** — `docs/audits/testing_qa_cicd_audit_summary.md`
- **Docs/DevEx/Operations audit** — `docs/audits/docs_devex_operations_audit_summary.md`
- **Frontend UX Release Gate audit** — `docs/audits/frontend_ux_release_gate_audit_summary.md`
- **Frontend UI/UX Re-execution (July 9)** — `docs/audits/ux-audit/new/20260709-041505/`
- **Frontend UI/UX Final Reconciliation (July 9)** — `docs/audits/ux-audit/new/20260709-190625/`

### Audits Executed (July 1-6, 2026)

Full audit pipeline executed across 8 batches (58 prompts, 624 initial findings). All findings resolved — final pipeline result: **0 P0, 0 P1, 0 P2, 0 P3 — ALL CLEAN**.

### Known Issues

- **Cloudflare 521**: Cloudflare can't reach the origin server. Terraform firewall rules applied but 521 persists. May need Cloudflare SSL/TLS set to Full (Strict) + origin certificate.
- **`hardening/` data store**: Still disconnected from `engine/full_engine.ps1` which reads stale `docs/audits/latest/findings.json`.

### Message List Scroll Architecture (July 9, 2026)

Critical layout architecture for `@tanstack/react-virtual` message list. All future edits to `message-list.tsx` and `chat-view.tsx` must preserve these constraints.

#### Flex Height Chain (must resolve from body → scroll container)

```
body                    height: calc(var(--vh, 1vh) * 100)          ← root height anchor
main                    flex: 1; min-height: 0; flex-col
  .app__body            flex: 1; min-height: 0; display: flex        ← NOT CSS Grid (grid broke layout)
    .app__row           display: flex; overflow: clip; min-height: 0; flex: 1
      .app__content     flex: 1; min-height: 0; display: flex; flex-col; overflow: hidden
        #channel_view    flex min-h-0 flex-1                          ← LOADING state: flex h-full; MAIN: flex min-h-0 flex-1
          chat column   flex min-w-0 flex-1 flex-col
            message area flex min-h-0 flex-1 flex-col overflow: hidden
              #post-list  overflow: auto; flex: 1; min-height: 0; position: relative; padding: 14px 0 7px
                AutoSizer   height passed as prop to inner div
                  inner div  position: relative; min-height: 100%
                    virtual rows  position: absolute; top: Xpx; transform: none; measured via measureElement
```

**Every element** in this chain needs `flex: 1` AND `min-height: 0`. Removing either one or using CSS Grid anywhere in the chain breaks the scroll container's ability to calculate its available height. The scroll container (`#post-list`) must NOT have a fixed height — it gets its height from `flex: 1` resolving against the bounded parent.

#### Critical Anti-Patterns (learned the hard way)

| Anti-Pattern | Why It Breaks | Reference |
|---|---|---|
| **Swapped className on `#channel_view`** | Loading state must be `flex h-full`, main state must be `flex min-h-0 flex-1`. Swapping these collapses the message area or causes infinite growth. | `chat-view.tsx` |
| **CSS Grid for message area** | `display: grid; gridTemplateRows: "1fr auto"` breaks both scrolling and message display. Grid creates implicit row constraints that fight `flex: 1`. | `chat-view.tsx` |
| **`.app__body` as CSS Grid** | `display: grid; gridTemplateRows: "1fr"` prevents sidebar from having a constrained height. Must be `display: flex; flex-direction: column`. | `layout.tsx` |
| **`overflow: hidden` on `[role="log"]`** | Kills scroll on mobile. Only `overflow: auto` or `overflow: clip` works on the scroll container. | `globals.css` mobile media query |
| **`el.scrollTop = el.scrollHeight` for initial scroll** | Only scrolls to top of last message, not bottom. Use `virtualizer.scrollToIndex(lastIdx, { align: "end" })` which accounts for measured item heights. | `message-list.tsx` |
| **Fixed `height` on `.mm-post`** | Prevents `measureElement` from reading true content height. Message items must NOT have a fixed height — use `min-height` only. | `message-item.tsx` |
| **`height: virtualRow.size` on measured rows** | Overwrites the measured height with the estimated height. For `measureElement` mode, do NOT set height on the virtual row div. | `message-list.tsx` |

#### Virtual List Configuration

```typescript
const virtualizer = useVirtualizer({
  count: messagesWithMeta.length,
  getScrollElement: () => listRef.current,
  estimateSize: () => estimatedItemHeight,  // dynamic based on message metadata
  overscan: 8,
  getItemKey: (i) => messagesWithMeta[i].id,  // stable keys for prepend
  measureElement,  // reads true DOM height after render
});
```

#### Initial Scroll Strategy

```typescript
// scrollToIndex with align: "end" handles measured heights correctly
const lastIdx = messagesWithMeta.length - 1;
requestAnimationFrame(() => {
  virtualizer.scrollToIndex(lastIdx, { align: "end" });
});
```

Do NOT use `el.scrollTop = el.scrollHeight` — it only reaches the top of the last message, not the bottom.

#### Scroll Restore Strategy (for prepend / pagination)

```typescript
scrollRestoreRef.current = {
  prevScrollTop: el.scrollTop,
  prevScrollHeight: el.scrollHeight,
};
// After prepend, restore relative position:
el.scrollTop = prevScrollTop + (newScrollHeight - prevScrollHeight);
```

#### Key Files

| File | Role |
|---|---|
| `apps/web/components/chat/message-list.tsx` | Virtualizer config, scroll management, `#post-list` scroll container |
| `apps/web/components/chat/chat-view.tsx` | `#channel_view` class management (loading vs main states) |
| `apps/web/app/(workspace)/layout.tsx` | `.app__body` (flex column), flex row, `.app__content` |
| `apps/web/app/layout.tsx` | Root `body` height, AppHeader `shrink-0`, main `flex:1; min-height:0` |
| `apps/web/components/chat/message-list/message-item.tsx` | Individual message — must NOT have fixed height |
| `apps/web/app/globals.css` | `.app__content` layer, `.mm-channel-header` flex-shrink, `--vh` custom property |

## Comparative Audit Implementation (July 4, 2026)

Full 8-phase Mattermost comparative audit (`C:\temp\mattermost-master` vs `C:\temp\chat`) executed and implemented:

| Area                               | Implementation                                                                                                                                                                                                                                                                                                                  | Key Files                                                                                                               |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **Quick Wins**                     | Dependabot expanded (npm+docker+GHA ecosystems + cooldown), CI concurrency (cancel-in-progress), repo metadata (.nvmrc, .gitattributes, CODEOWNERS)                                                                                                                                                                             | `.github/dependabot.yml`, `ci.yml`, `validate.yml`, `.nvmrc`, `.gitattributes`, `.github/CODEOWNERS`                    |
| **Worker Implementation**          | 6 BullMQ processors: webhook-delivery (HMAC + SSRF + circuit breaker + DLQ), notification (in-app + push VAPID + email Nodemailer), search-indexer (async tsvector), cleanup (old deliveries + dead letters + consent logs), data-retention (messages/audit/consent logs/channels/workspaces), reminder (due reminders polling) | `apps/worker/src/processors/*.ts`, `apps/worker/src/scheduler.ts`                                                       |
| **Message Features**               | Pinning (is_pinned column + API + SDK), flagging (message_flags table + API + SDK), edit history (message_edit_history table + API + SDK)                                                                                                                                                                                       | Migration `20260703000001_add_message_features.sql`, `messages/routes.ts`, `messages/service.ts`, `sdk/src/messages.ts` |
| **Store Abstraction**              | `IMessageStore` + `SupabaseMessageStore`, `IChannelStore` + `SupabaseChannelStore` — exported from `@chat/db`                                                                                                                                                                                                                   | `packages/db/src/stores/`                                                                                               |
| **RBAC Expansion**                 | 18 granular permissions × 3 roles (owner/admin/member), `requirePermission()` middleware                                                                                                                                                                                                                                        | `packages/db/src/permissions.ts`, `apps/api/src/middleware/require-permission.ts`                                       |
| **Audit API**                      | `GET /v1/audit/logs` with filters (workspace, actor, action, entity, date range), `GET /v1/audit/logs/:id`                                                                                                                                                                                                                      | `apps/api/src/modules/audit/routes.ts`                                                                                  |
| **DM/GM Channels**                 | channel_type column, dm_channels table, DM creation API and listing, sidebar DM section with user picker                                                                                                                                                                                                                        | Migration `20260704000001_add_dm_presence_categories.sql`, `channels/service.ts`, `app-sidebar.tsx`                     |
| **User Presence**                  | Socket.io presence (online/away/dnd), user_presence table, auto-set online on connect, offline on disconnect                                                                                                                                                                                                                    | `socket.ts`, migration above                                                                                            |
| **Channel Bookmarks**              | channel_bookmarks CRUD API                                                                                                                                                                                                                                                                                                      | `channels/routes.ts`, migration above                                                                                   |
| **Sidebar Categories**             | sidebar_categories + sidebar_channel_assignments tables with default seed data                                                                                                                                                                                                                                                  | migration above                                                                                                         |
| **Per-Channel Notifications**      | channel_notification_preferences table (notify + sound toggles per channel)                                                                                                                                                                                                                                                     | migration above                                                                                                         |
| **UI/UX Polish**                   | Floating timestamp overlay, searchable emoji picker (600+ emojis), context menu copy-link, channel topic display, system messages, file preview (image viewer + file links)                                                                                                                                                     | `floating-timestamp.tsx`, `emoji-data.json`, `file-preview.tsx`                                                         |
| **Slash Commands**                 | /me, /code, /shrug, /poll, /gif, /joke, /help with autocomplete popup, keyboard navigation                                                                                                                                                                                                                                      | `lib/slash-commands.ts`, `message-input.tsx`                                                                            |
| **Data Retention**                 | In-worker BullMQ scheduler for messages (365d), audit logs (90d), consent logs (730d), soft-deleted channels/workspaces (30d); cleanup for deliveries, dead letters, stale sessions, expired uploads                                                                                                                            | `apps/worker/src/scheduler.ts`, `processors/data-retention.ts`, `processors/cleanup.ts`                                 |
| **E2E Messaging Test**             | Playwright: login, create workspace/channel, send/edit/delete messages, WebSocket real-time verification between 2 browser contexts                                                                                                                                                                                             | `tests/e2e/messaging.spec.ts`                                                                                           |
| **Auto-Responder**                 | auto_responders table + GET/PUT API + DM auto-reply on message create + settings UI                                                                                                                                                                                                                                             | `messages/service.ts`, `status/routes.ts`, `settings/page.tsx`, migration `20260709000001_add_auto_responder.sql`       |
| **User Status**                    | Status picker popup in sidebar (Online/Away/DND), status API + socket broadcast, colored indicators                                                                                                                                                                                                                             | `app-sidebar.tsx`, `auth/routes.ts`                                                                                     |
| **Custom User Status**             | Modal with emoji + text + duration presets (30m/1h/4h/today/week), suggestions, set/clear                                                                                                                                                                                                                                       | `status-modal.tsx`, `status/routes.ts`, migration `20260627000011_custom_status.sql`                                    |
| **Markdown Formatting Toolbar**    | Bold/Italic/Strikethrough/Code/Link/Quote/List buttons, wraps selected text                                                                                                                                                                                                                                                     | `formatting-bar.tsx`, `message-input.tsx`                                                                               |
| **Syntax-Highlighted Code Blocks** | highlight.js github-dark theme, language badge, copy button with confirmation, auto-detection                                                                                                                                                                                                                                   | `code-block.tsx`                                                                                                        |
| **Paste Image from Clipboard**     | Paste event creates File from DataTransferItem, calls upload handler                                                                                                                                                                                                                                                            | `message-input.tsx`                                                                                                     |
| **Search Autocomplete**            | User profiles + channel suggestions as you type in search bar                                                                                                                                                                                                                                                                   | `search-bar.tsx`                                                                                                        |
| **Channel Member Count**           | Member count display in chat header                                                                                                                                                                                                                                                                                             | `chat-view.tsx`                                                                                                         |
| **Message Forwarding**             | API endpoint + context menu for quoting messages to other channels                                                                                                                                                                                                                                                              | `messages/routes.ts`                                                                                                    |
| **Inline Media Preview**           | ReactMarkdown + FilePreview component, auto-detects image/video/audio URLs, fullscreen overlay                                                                                                                                                                                                                                  | `file-preview.tsx`, `message-list.tsx`                                                                                  |
| **User Profile Popover**           | Click avatar → positioned popover with name, email, join date, close on click-outside/Escape                                                                                                                                                                                                                                    | `profile-popover.tsx`                                                                                                   |
| **Channel Info Sidebar**           | RHS panel with Members/Pinned tabs, scrollable lists                                                                                                                                                                                                                                                                            | `channel-info.tsx`                                                                                                      |
| **Channel Mute**                   | Bell icon toggle in channel header, upserts `channel_notification_preferences` table                                                                                                                                                                                                                                            | `chat-view.tsx`, `notifications/routes.ts`                                                                              |
| **Read-Only Channels**             | `is_read_only` boolean on channels, `prevent_read_only_message()` trigger on INSERT, creation option                                                                                                                                                                                                                            | Migration `20260627000012_read_only_channels.sql`                                                                       |
| **Settings Page**                  | Theme + notification preferences, settings link in sidebar                                                                                                                                                                                                                                                                      | `app-sidebar.tsx`, `settings/page.tsx`                                                                                  |
| **In-Channel Filter**              | Filter/search messages within current channel view                                                                                                                                                                                                                                                                              | `chat-view.tsx`                                                                                                         |
| **Reaction Tooltips**              | Hover tooltip showing "You and X others" on reactions                                                                                                                                                                                                                                                                           | `message-list.tsx`                                                                                                      |

## Mattermost Comparison — Features (July 9, 2026)

Full comparative audit executed (8 phases). All 35+ features verified present. See complete inventory below.

## Mattermost Comparison — Complete Feature Inventory

Full comparative audit executed (8 phases). All 35+ features verified present. Source: `docs/audits/compare/`.

### Already Implemented

| Area          | Feature                                            | Status                                                                                   |
| ------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Emoji         | Category tabs (11 categories)                      | ✅ Implemented in `emoji-picker.tsx`                                                     |
| Emoji         | Skin tone selector (5 tones)                       | ✅ Implemented in `emoji-picker.tsx`                                                     |
| Emoji         | Hover preview + name                               | ✅ Implemented (setPreview state)                                                        |
| Emoji         | `:` colon autocomplete                             | ✅ Implemented in `message-input.tsx`                                                    |
| Emoji         | 3000+ emojis + recent tracking                     | ✅ `emoji-data.ts` (3357 emojis)                                                         |
| Search        | Messages/Files type toggle                         | ✅ Added to search page                                                                  |
| Files         | Multi-file navigation (prev/next)                  | ✅ Implemented in `file-preview.tsx`                                                     |
| Files         | Zoom in/out/100%/fit-to-window                     | ✅ Implemented in `file-preview.tsx`                                                     |
| Files         | File metadata panel (name, size, uploader)         | ✅ Implemented in `file-preview.tsx`                                                     |
| Keyboard      | Ctrl+K quick switcher (full)                       | ✅ Implemented in `quick-switcher.tsx`                                                   |
| Keyboard      | Full shortcut modal with categories                | ✅ Implemented in `keyboard-shortcuts.tsx`                                               |
| Composer      | WYSIWYG editor (TipTap)                            | ✅ Implemented (underline, highlight, task lists, image, text align, 15 buttons)         |
| Onboarding    | Task list popover with checkmarks                  | ✅ Implemented in `onboarding-tour.tsx`                                                  |
| Onboarding    | Tour tips (5-step guided tour)                     | ✅ Implemented in `onboarding-tour.tsx`                                                  |
| Drafts        | Auto-save + restore                                | ✅ Implemented in `message-input.tsx`                                                    |
| Sidebar       | Multi-team sidebar (65px rail)                     | ✅ Implemented in `team-sidebar.tsx`                                                     |
| Sidebar       | Category management (create/rename/delete/reorder) | ✅ Implemented in `app-sidebar.tsx`                                                      |
| Sidebar       | Channel context menu (right-click)                 | ✅ Implemented in `channel-list.tsx` (10 actions)                                        |
| Sidebar       | Sidebar header team menu                           | ✅ Implemented in `app-sidebar.tsx`                                                      |
| Sidebar       | Resizable sidebar (drag handle)                    | ✅ Implemented in `layout.tsx`                                                           |
| Sidebar       | User groups CRUD (6 modals)                        | ✅ Implemented in `groups/page.tsx`                                                      |
| Sidebar       | DM multi-select modal                              | ✅ Implemented in `app-sidebar.tsx`                                                      |
| Search        | Operator hints (`from:`, `in:`, etc.)              | ✅ Implemented in `search-bar.tsx`                                                       |
| Search        | File extension suggestions                         | ✅ Implemented in `search-bar.tsx`                                                       |
| Notifications | Global notification settings page                  | ✅ Implemented in `settings/page.tsx`                                                    |
| Notifications | Desktop notification sounds (9 sounds)             | ✅ Implemented in `notification-sound.ts`                                                |
| Notifications | Trigger words + auto-responder                     | ✅ Implemented in `settings/page.tsx` + `status/routes.ts`                               |
| Auth          | Magic link auth                                    | ✅ Implemented (Supabase)                                                                |
| Auth          | OAuth providers (Google + GitHub)                  | ✅ Implemented in `auth-context.tsx`                                                     |
| Auth          | Email verification flow                            | ✅ Verification page with resend                                                         |
| i18n          | Full i18n infrastructure                           | ✅ 250+ keys, 16 categories, pluralization, `t()`/`tn()`/`formatDate()`/`formatNumber()` |
| Sounds        | Notification sounds (9 options)                    | ✅ chime, bell, ding, pop, tri-tone added                                                |
| Composer      | Send scheduling                                    | ✅ `message-input.tsx` — presets + custom date/time                                      |
| Composer      | AI rewrite actions                                 | ✅ `ai/routes.ts` + Sparkles button (5 actions)                                          |
| Import/Export | Bulk import/export (CSV/JSON)                      | ✅ 4 export endpoints + 2 import endpoints + admin UI                                    |

### Enterprise / Strategic (Not Yet Scoped)

| Area           | Feature                           | Reference                                    |
| -------------- | --------------------------------- | -------------------------------------------- |
| Auth           | Multi-factor authentication (MFA) | TOTP + backup codes + enforce config         |
| Auth           | SAML/OIDC SSO                     | SAML SP metadata, IdP-initiated login, SCIM  |
| Auth           | LDAP directory sync               | LDAP bind, user/group import, scheduled sync |
| Auth           | Bot accounts                      | Bot API + plugin API                         |
| Infrastructure | Plugin system                     | Plugin registration API, hook interfaces     |
| Search         | Elasticsearch integration         | Full-text search engine plugin               |
| Compliance     | Compliance export                 | Message export, audit export                 |
| Enterprise     | Boards/kanban                     | Project management integration               |
| Enterprise     | Desktop app (Electron/Tauri)      | Native desktop wrapper                       |

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

- **Data retention**: Implemented as in-worker BullMQ scheduler (`apps/worker/src/scheduler.ts`) — 24h retention cycle, 6h cleanup cycle, no pg_cron dependency
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
- **Full Comparative Audit Quick Wins (July 7)** — 8 quick wins applied: down migration script for performance indexes, AGENTS.md updated with audit findings, CI/CD consolidation (e2e-daily merged into ci.yml), structured error subclasses (BadRequestError, UnauthorizedError, etc.), test coverage for AppError + OpenAPI routes, centralized route registry (route-registry.ts), data retention enforcement job processor, LinkPreview component for URL unfurling
- **Phase 2 Alignment Work (July 7)** — Deploy fix (removed hard API dependency from web container, added container log capture on startup failure), admin health/system endpoint (GET /admin/system with version/uptime/DB status), i18n infrastructure expansion (extraction script, pluralization support, locale metadata, formatDate/formatNumber utilities), TypeScript build error fixes (logger arg order), prettier formatting fixes
- **P2/P3 Finding Fixes (July 7)** — Workspace list pagination with limit/offset (P2), magic link rate limiting at 3/min/IP (P2), channel slug validation (P3), workspace creation limit unit test (P3), file content search documentation comment (P3), worker `/healthz` endpoint confirmed existing (P3)
- **Quick Wins Implementation (July 8)** — AGENTS.md Current State + Feature Verification Status updated, pnpm audit added to pre-commit hook, GitHub discussion template created, worker .env.example created, turbo.json task descriptions added
- **Phases 6-8 Comparative Audit Revised (July 8)** — Phase 6 (Change Plan) rewritten to reflect current repo state with 7 remaining patch groups identified. Phase 7 (Patch Sets) redesigned from 12 to 8 groups based on implemented items. Phase 8 (Final Reconciliation) updated as true SSOT with current state, remaining gaps, 20 guardrails, and go/no-go gates. Stale `07_PATCH_SETS_v2.md` removed. `COMPARE_AUDIT_SUMMARY.md` and `MERGED_REPO_AUDIT_SUMMARY.md` updated to reflect current audit state.
- **Full 8-phase Comparative Audit Re-execution (July 9)** — All 8 phases re-executed against Mattermost v11.9.0. 20 prioritized recommendations, 5 quick wins identified. CSS variable consolidation and message-input.tsx decomposition flagged as top refactoring priorities. Full report: `docs/audits/compare/full_comparative_repo_audit_july9.md`. Validated all 35+ features still present, assessed remaining gaps as strategic (MFA, SAML, plugins, 64-locale i18n), not architectural.
- **Full 8-phase Frontend UI/UX Comparative Audit (July 9)** — Complete frontend UI/UX audit comparing chat vs Mattermost across all 8 phases. 42+ findings documented covering accessibility, visual system, responsiveness, and component consistency. See `docs/audits/ux-audit/new/20260709-032614/`. Key verdict: current frontend is architecturally superior; gaps are in breadth (not quality). 3-phase roadmap produced with 6 immediate quick wins identified.
- **Phase 2 Component Standardization (July 9)** — All 7 items: ScreenReaderOnly, StatusBadge, EmptyState components; DeleteDialog → Button danger variant; 14 inline backdrops → `bg-black/50`; 7 elevation inlines → `shadow-[var(...)]`; toast for silent catches in context-menu, quick-switcher, thread-panel; CSS var consolidation (removed 11 duplicate `--color-*` vars from globals.css, added architecture comments).
- **Phase 3 Layout/Workflow Refinement (July 9)** — All 5 items: Global announcement banner (migration + API + component + localStorage dismiss); Channel header action menu (Copy link + Mute/Unmute + click-outside); Tablet sidebar auto-collapse (768-1024px, 60px, smooth transition); Channel intro (topic in header + MessageList empty state); Thread typing indicator (wired textarea to socket events, display names via authorName()).
- **Full 8-phase Frontend UI/UX Re-execution (July 9)** — Second full re-execution capturing all Phase 2/3 changes. See `docs/audits/ux-audit/new/20260709-041505/`. Remaining gaps documented as Phase 4 items: empty state adoption (15+ locations), opacity consolidation, focus ring standardization, post-delete undo toast, high-contrast mode, channel inline topic editing.
- **Phase 4 UX Modernization (July 9)** — All 7 items: EmptyState adopted in 16 files/20 locations; Post-delete undo toast with 5s action window; High-contrast mode via `prefers-contrast: high`; Focus ring standardization; Opacity consolidation (264 replacements in 61 files); Channel inline topic editing (click to edit, Enter saves, Escape cancels); Drag-and-drop file upload overlay.
- **Full 8-phase Frontend UI/UX Final Reconciliation (July 9)** — Third and final re-execution confirming all 24 items across 4 phases complete. No remaining UX gaps. Frontend declared production-ready.

### Frontend UI/UX Audit — Quick Wins Identified (July 9, 2026)

| ID     | Area          | Finding                                                         | Fix                                                              |
| ------ | ------------- | --------------------------------------------------------------- | ---------------------------------------------------------------- |
| FUX-01 | Accessibility | Missing `aria-live="polite"` on message list                    | Add ARIA attribute to virtual list container                     |
| FUX-02 | Accessibility | Missing `role="alert"` on Toast component                       | Add ARIA attribute                                               |
| FUX-03 | Accessibility | Status indicators color-only — no accessible labels             | Add `aria-label` to status pills                                 |
| FUX-04 | Polish        | 14+ files use hardcoded `#fff` instead of `var(--button-color)` | Search and replace                                               |
| FUX-05 | Polish        | Raw opacity values `0.56`/`0.72` instead of CSS variables       | Use `var(--text-secondary-alpha)` / `var(--text-tertiary-alpha)` |
| FUX-06 | Component     | Button missing `danger` variant                                 | Add variant class + styling                                      |

All quick wins implemented. See `docs/audits/ux-audit/new/20260709-032614/` for full report.

Run `git log --oneline --since="2026-06-20"` for the full commit history or see `CHANGELOG.md`.

 
 
