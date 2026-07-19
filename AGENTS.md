# AGENTS.md — Architecture & Implementation Status

## Current State (July 18, 2026)

- **Seed workflow fixed**: GoTrue auth crash from NULL `confirmation_token` resolved via Management SQL UPDATE. Identities missing after DB reset fixed via `auth.identities` INSERT with `provider_id` column. Wrong bcrypt hash for `password123` corrected to `$2a$10$wsjrPx00aIP/IL6cbV.mM.VYl48iAag810ODhtAonKalkWBCxSf1C`. Missing `public.users` profiles (needed by `users!inner` JOIN for member queries) fixed via INSERT...ON CONFLICT. psql data seeding replaced with Management API chunked approach in all 3 workflow files (psql is unreliable from GitHub Actions — IPv6, pooler auth errors). Bookmarks collapsible added. See [Seed Workflow](#seed-workflow-auth--data-seeding) section below.

- **New UI/UX Deep Audit (July 16, 2026)**: Full principal-level re-audit executed — 8 P1, 24 P2, 14 P3 findings identified (0 P0). See `docs/audits/ux-audit/20260716/` for full 14-file report pack. Overall verdict: **Production Ready With Minor Issues** (7.1/10). Not yet Enterprise Ready — blocked by mobile admin navigation, i18n coverage crater (7/8 surfaces), no automated a11y regression, and 33% component test coverage. 56 findings across 24 audit categories. 17 quick wins identified (~3 dev-days).
- **All P0/P1 findings resolved** — 0 P0, 0 P1 across all audit/hardening pipelines
- **P2/P3 findings**: ~130 total (original), all resolved. 46 new findings from July 16 audit (8 P1, 24 P2, 14 P3)
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

### UI/UX Audit New Findings (July 16, 2026)

| ID     | Severity | Category       | Finding                                                                                                                                                             | Location                                                    |
| ------ | -------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| UX-101 | P1       | Admin UX       | Admin tab navigation broken on mobile — sidebar `hidden md:block`                                                                                                   | `admin/page.tsx`                                            |
| UX-102 | P1       | Accessibility  | Search-bar missing `aria-activedescendant` on autocomplete input                                                                                                    | `search-bar.tsx`                                            |
| UX-103 | P1       | Mobile UX      | Formatting bar buttons 28px — fail WCAG 44px touch target minimum                                                                                                   | `formatting-bar.tsx`                                        |
| UX-104 | P1       | i18n           | Admin page: 150+ hardcoded strings, zero i18n                                                                                                                       | `admin/page.tsx`                                            |
| UX-105 | P1       | i18n           | Settings page: 80+ hardcoded strings, zero i18n                                                                                                                     | `settings/page.tsx`                                         |
| UX-106 | P1       | i18n           | Search-bar: 50+ hardcoded strings, zero i18n                                                                                                                        | `search-bar.tsx`                                            |
| UX-107 | P1       | Accessibility  | Settings reset/delete dialogs lack focus traps — Tab escapes backdrop                                                                                               | `settings/page.tsx`                                         |
| UX-108 | P1       | State Design   | Channel-info silently catches API failures, returns empty arrays                                                                                                    | `channel-info.tsx`                                          |
| UX-201 | P2       | Forms          | Settings dual save mechanism — auto-save AND Save button confusing                                                                                                  | `settings/page.tsx`                                         |
| UX-202 | P2       | Forms          | Language change triggers `window.location.reload()`                                                                                                                 | `settings/page.tsx`                                         |
| UX-203 | P2       | Search         | No result count shown in search results                                                                                                                             | `search/page.tsx`                                           |
| UX-204 | P2       | Accessibility  | Search-bar type dropdown/autocomplete lack `role="listbox"`                                                                                                         | `search-bar.tsx`                                            |
| UX-205 | P2       | Accessibility  | Search results container lacks `aria-live="polite"`                                                                                                                 | `search/page.tsx`                                           |
| UX-206 | P2       | Interaction    | Formatting toolbar no arrow-key navigation (Tab-only through 15 btns)                                                                                               | `formatting-bar.tsx`                                        |
| UX-207 | P2       | Accessibility  | Formatting toolbar no visible focus ring                                                                                                                            | `formatting-bar.tsx`                                        |
| UX-208 | P2       | Accessibility  | Link/image buttons have `aria-pressed: undefined`                                                                                                                   | `formatting-bar.tsx`                                        |
| UX-209 | P2       | i18n           | Formatting bar: 20+ hardcoded strings, zero i18n                                                                                                                    | `formatting-bar.tsx`                                        |
| UX-210 | P2       | i18n           | Notification preferences modal: 20+ hardcoded strings, zero i18n                                                                                                    | `notification-preferences-modal.tsx`                        |
| UX-211 | P2       | i18n           | Keyboard shortcuts modal: 25+ hardcoded strings, zero i18n                                                                                                          | `keyboard-shortcuts.tsx`                                    |
| UX-212 | P2       | Accessibility  | Keyboard shortcuts shows "Ctrl+K" on macOS — no Mac modifier detection                                                                                              | `keyboard-shortcuts.tsx`                                    |
| UX-213 | P2       | Accessibility  | Keyboard shortcuts filter has no `aria-live` for result count                                                                                                       | `keyboard-shortcuts.tsx`                                    |
| UX-214 | P2       | Accessibility  | All error boundaries lack `role="alert"`                                                                                                                            | `error.tsx` ×6 files                                        |
| UX-215 | P2       | Accessibility  | All loading states lack `aria-busy="true"` / `role="status"`                                                                                                        | `loading.tsx` ×5 files                                      |
| UX-216 | P2       | State Design   | Root and auth loading use bare spinner instead of layout skeleton                                                                                                   | `app/loading.tsx`, `(auth)/loading.tsx`                     |
| UX-217 | P2       | Responsive     | Workspace loading skeleton shown on mobile (sidebar unconditional)                                                                                                  | `(workspace)/loading.tsx`                                   |
| UX-218 | P2       | Accessibility  | Onboarding tour no `role="dialog"`, no focus trap                                                                                                                   | `onboarding-tour.tsx`                                       |
| UX-219 | P2       | Accessibility  | Cookie banner no focus trap, no `aria-modal="true"`                                                                                                                 | `cookie-banner.tsx`                                         |
| UX-220 | P2       | Accessibility  | Channel-info tab bar missing `role="tablist"`, `aria-selected`                                                                                                      | `channel-info.tsx`                                          |
| UX-221 | P2       | State Design   | Channel-info empty states lack actionable buttons                                                                                                                   | `channel-info.tsx`                                          |
| UX-222 | P2       | Data Display   | `highlightText` function duplicated in 2 files                                                                                                                      | `search-bar.tsx`, `search/page.tsx`                         |
| UX-223 | P2       | Data Display   | Pagination duplicated across 3 admin tabs                                                                                                                           | `admin/page.tsx`                                            |
| UX-224 | P2       | Mobile UX      | Admin stat grid uses `grid-cols-2` on mobile — narrow cells                                                                                                         | `admin/page.tsx`                                            |
| UX-225 | P2       | Performance    | Message list 30-frame RAF loop for initial scroll may jank — RETAINED: loop required to trigger virtualizer rendering; stability detection stops early when settled | `message-list.tsx`                                          |
| UX-226 | P2       | Design System  | Two parallel CSS var systems (Mattermost + design tokens) active                                                                                                    | `globals.css`, `packages/ui/src/styles.css`                 |
| UX-227 | P2       | Error Handling | `console.warn` used instead of user-facing toast in 5+ catch blocks                                                                                                 | `chat-view.tsx`, `context-menu.tsx`, `quick-switcher.tsx` + |
| UX-228 | P2       | Theme          | Dark mode `--text-secondary` hardcoded rgba, not alpha var                                                                                                          | `globals.css`                                               |
| UX-301 | P3       | Forms          | Settings page "Loading..." text instead of Skeleton                                                                                                                 | `settings/page.tsx`                                         |
| UX-302 | P3       | Forms          | Auto-responder textarea lacks character counter                                                                                                                     | `settings/page.tsx`                                         |
| UX-303 | P3       | Forms          | No debounce on preference saves — rapid toggles hammer API                                                                                                          | `settings/page.tsx`                                         |
| UX-304 | P3       | Forms          | Login form no password strength indicator                                                                                                                           | `login-form.tsx`                                            |
| UX-305 | P3       | Forms          | Login form no "Forgot password?" link                                                                                                                               | `login-form.tsx`                                            |
| UX-306 | P3       | Accessibility  | Login form status container no `aria-live`                                                                                                                          | `login-form.tsx`                                            |
| UX-307 | P3       | Interaction    | Notification preferences modal no unsaved-changes detection                                                                                                         | `notification-preferences-modal.tsx`                        |
| UX-308 | P3       | Search         | Search date range not validated (`dateFrom > dateTo`)                                                                                                               | `search/page.tsx`                                           |
| UX-309 | P3       | Search         | Search operator hint has hardcoded year "2025"                                                                                                                      | `search-bar.tsx`                                            |
| UX-310 | P3       | Interaction    | "Clear all" recent searches has no confirmation                                                                                                                     | `search-bar.tsx`                                            |
| UX-311 | P3       | Interaction    | Admin export buttons lack loading spinner                                                                                                                           | `admin/page.tsx`                                            |
| UX-312 | P3       | Admin UX       | Admin panel no error boundary per tab                                                                                                                               | `admin/page.tsx`                                            |
| UX-313 | P3       | i18n           | Admin panel `document.title` hardcoded                                                                                                                              | `admin/page.tsx`                                            |
| UX-314 | P3       | Design System  | Inline `StatusBadge` and `Card` in admin (duplicates shared comps)                                                                                                  | `admin/page.tsx`                                            |
| UX-315 | P3       | Design System  | `ToggleRow` inline in settings — not shared                                                                                                                         | `settings/page.tsx`                                         |
| UX-316 | P3       | Admin UX       | CSV parser uses `line.split(",")` — breaks on quoted fields                                                                                                         | `admin/page.tsx`                                            |
| UX-317 | P3       | Performance    | Message list 30-frame RAF loop in useEffect (wasteful) — RETAINED: loop is required to render + measure items before scrollToIndex can compute correct position     | `message-list.tsx`                                          |
| UX-318 | P3       | Design System  | Pull-to-refresh indicator uses inline style not Tailwind                                                                                                            | `message-list.tsx`                                          |
| UX-319 | P3       | Code Quality   | Dead CSS `gridArea: "team-sidebar"` — no grid parent                                                                                                                | `app-sidebar.tsx`                                           |
| UX-320 | P3       | Code Quality   | Encoding artifact line 581 — `âœ“` should be checkmark                                                                                                              | `app-sidebar.tsx`                                           |
| UX-321 | P3       | Design System  | `--border-default` includes `solid 1px` — not composable                                                                                                            | `globals.css`                                               |
| UX-322 | P3       | Design System  | Density modes defined in tokens but unused                                                                                                                          | `packages/ui/src/tokens/spacing.ts`                         |

Full report: `docs/audits/ux-audit/20260716/`

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

## Seed Workflow (Auth + Data Seeding)

Two GitHub Actions to seed hosted Supabase with test data:

| Workflow                 | Trigger             | Purpose                                    |
| ------------------------ | ------------------- | ------------------------------------------ |
| `seed-database.yml`      | `workflow_dispatch` | Full seed: auth users + data (files 01-05) |
| `deploy-development.yml` | push develop        | Deploy + seed (includes auth step)         |
| `deploy-production.yml`  | push main           | Deploy + seed (includes auth step)         |

### Architecture — Why Not Admin API

The Supabase Auth Admin API (`POST /auth/v1/admin/users`) is unreliable for seeding because:

- GoTrue v2 crashes on NULL `confirmation_token` (caused by DB reset) — `sql: Scan error on column index 3, name "confirmation token": converting NULL to string is unsupported`
- Admin API DELETE crashes due to `handle_user_deletion()` trigger bugs (wrong column references in `channel_bookmarks` and `sidebar_channel_assignments`)
- Admin API does NOT create `auth.identities` when returning errors — users exist but can't log in
- `psql` direct connection fails from GitHub Actions (IPv6, pooler auth errors)

### Working Solution — Management SQL (Supabase API Gateway)

**Key file**: `.github/workflows/seed-database.yml` (the SSOT; deploy workflows mirror the same approach)

#### Step 0: Fix NULL tokens

```sql
UPDATE auth.users SET
  confirmation_token = COALESCE(confirmation_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  email_change = COALESCE(email_change, ''),
  phone_change = COALESCE(phone_change, ''),
  phone_change_token = COALESCE(phone_change_token, '')
WHERE confirmation_token IS NULL
   OR recovery_token IS NULL
   OR email_change_token_new IS NULL
   OR email_change_token_current IS NULL;
```

Management SQL UPDATE on `auth.users` **does persist** (verified).

#### Step 1: Insert missing identities + set passwords

```sql
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
SELECT gen_random_uuid(), u.id,
  ('{"email":"' || u.email || '","sub":"' || u.id::text || '","email_verified":true}')::jsonb,
  'email',
  ('email:' || u.id::text),
  now(), now(), now()
FROM auth.users u
WHERE u.email LIKE '%@seed.test'
  AND NOT EXISTS (SELECT 1 FROM auth.identities i WHERE i.user_id = u.id AND i.provider = 'email');

UPDATE auth.users SET encrypted_password = '$2a$10$wsjrPx00aIP/IL6cbV.mM.VYl48iAag810ODhtAonKalkWBCxSf1C'
WHERE email LIKE '%@seed.test';

INSERT INTO public.users (id, email, display_name)
SELECT u.id, u.email,
  COALESCE(u.raw_user_meta_data->>'display_name', split_part(u.email, '@', 1))
FROM auth.users u
WHERE u.email LIKE '%@seed.test'
  AND NOT EXISTS (SELECT 1 FROM public.users p WHERE p.id = u.id);
```

**Critical details**:

- `auth.identities` on this GoTrue v2 version requires `provider_id` column (NOT NULL) — set to `'email:' || u.id::text`
- `auth.identities.email` is a **generated column** — do NOT include it in INSERT column list
- `auth.identities.user_id` is `uuid` type, `auth.refresh_tokens.user_id` is `varchar` — use `id::text` or `id` cast appropriately
- Correct bcrypt hash for `password123`: `$2a$10$wsjrPx00aIP/IL6cbV.mM.VYl48iAag810ODhtAonKalkWBCxSf1C`
- The OLD hash `$2a$10$v6eIqtfdO8MPMAg6HEJUU.eHvG1iZ9bIl/apu.boe3WW5wvr2Lr2W` **does NOT match** `password123` — do not reuse
- `public.users` rows are needed by `users!inner` JOIN in workspace/channel member queries — insert if missing

#### Step 2: Seed data tables (files 01-05)

Management API has ~36KB payload limit. Large files are Python-chunked at statement boundaries (~20KB/chunk):

```bash
python3 /tmp/split_seed.py "$f" 20      # split at 20KB boundaries
```

Files must NOT contain `begin;`/`commit;` wrappers (chunking splits across transaction boundaries).
DO `$$ ... END $$;` blocks are NOT supported by Management API — rewrite as plain INSERT...SELECT.

#### Step 2b: Drop-in replacement for psql (unreliable)

The Management API endpoint `POST /v1/projects/{ref}/database/query` with `Authorization: Bearer $SUPABASE_ACCESS_TOKEN` works from GitHub Actions when psql connections fail. psql has been fully replaced with this Management API approach in all 3 workflow files (`seed-database.yml`, `deploy-development.yml`, `deploy-production.yml`) after repeated failures:

- `apt-get install postgresql-client` fails with lock/permission errors on shared runners
- Direct connection fails (IPv6)
- Session pooler (port 5432) fails (auth error)
- Transaction pooler (port 6543) fails (tenant/user not found)

### Data Tables Seeding Order

| File                              | Content                              | Size  | Chunks |
| --------------------------------- | ------------------------------------ | ----- | ------ |
| `01_comprehensive_workspaces.sql` | Workspaces + members + roles         | ~15KB | 1      |
| `02_comprehensive_channels.sql`   | Channels + DMs + members             | ~23KB | 2      |
| `03_comprehensive_messages.sql`   | Messages + replies + reactions       | ~94KB | 4      |
| `04_comprehensive_features.sql`   | Pins, flags, bookmarks, preferences  | ~37KB | 2      |
| `05_comprehensive_expansion.sql`  | User groups, scheduling, ai-rewrites | ~52KB | 3      |

User-group IDs in file 05 use `a0f00006`–`a0f0000a` to avoid PK collision with file 01's `a0f00001`–`a0f00004`.

### Migration Fixes Required for Seed (applied on hosted)

| Migration        | Fix                                                                                                            |
| ---------------- | -------------------------------------------------------------------------------------------------------------- |
| `20260718000001` | `handle_new_channel()` trigger — add `last_viewed_at = now()`                                                  |
| `20260718000002` | Conditionally add missing `notify_everyone` column                                                             |
| `20260718000003` | `handle_thread_reply()` — rename ambiguous `thread_id` variable                                                |
| `20260718000004` | `handle_user_deletion()` — fix `channel_bookmarks.user_id → created_by` and `sidebar_channel_assignments` JOIN |

### Verification

After running seed workflow, verify via Management API:

```sql
SELECT 'auth_users' as tbl, count(*) FROM auth.users WHERE email LIKE '%@seed.test'
UNION ALL SELECT 'identities', count(*) FROM auth.identities WHERE provider = 'email' AND user_id IN (SELECT id FROM auth.users WHERE email LIKE '%@seed.test')
UNION ALL SELECT 'workspaces', count(*) FROM workspaces
UNION ALL SELECT 'channels', count(*) FROM channels
UNION ALL SELECT 'messages', count(*) FROM messages
UNION ALL SELECT 'thread_replies', count(*) FROM messages WHERE parent_id IS NOT NULL
UNION ALL SELECT 'reactions', count(*) FROM reactions;
```

Expected counts: auth_users=21, identities=21, workspaces=15, channels=32, messages=341, thread_replies=49, reactions=153.

Test login via password grant:

```
POST https://{ref}.supabase.co/auth/v1/token?grant_type=password
{"email":"marcus@seed.test","password":"password123"}
```

### Token Columns That Can Be NULL After DB Reset

The following columns in `auth.users` can become NULL after a Supabase project DB reset, causing GoTrue to crash with `sql: Scan error on column index 3, name "confirmation token": converting NULL to string is unsupported`:

- `confirmation_token`
- `recovery_token`
- `email_change_token_new`
- `email_change_token_current`
- `email_change`
- `phone_change`
- `phone_change_token`

Note: `confirmation_token_new` does NOT exist on this GoTrue version (do not include in UPDATE).

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

| Anti-Pattern                                   | Why It Breaks                                                                                                                                                           | Reference                        |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| **Swapped className on `#channel_view`**       | Loading state must be `flex h-full`, main state must be `flex min-h-0 flex-1`. Swapping these collapses the message area or causes infinite growth.                     | `chat-view.tsx`                  |
| **CSS Grid for message area**                  | `display: grid; gridTemplateRows: "1fr auto"` breaks both scrolling and message display. Grid creates implicit row constraints that fight `flex: 1`.                    | `chat-view.tsx`                  |
| **`.app__body` as CSS Grid**                   | `display: grid; gridTemplateRows: "1fr"` prevents sidebar from having a constrained height. Must be `display: flex; flex-direction: column`.                            | `layout.tsx`                     |
| **`overflow: hidden` on `[role="log"]`**       | Kills scroll on mobile. Only `overflow: auto` or `overflow: clip` works on the scroll container.                                                                        | `globals.css` mobile media query |
| **`el.scrollTop = el.scrollHeight` alone**     | One-shot `scrollTop = scrollHeight` only scrolls to top of last message. Must use in a rAF loop until scrollHeight stabilizes, then final `scrollToIndex(align:"end")`. | `message-list.tsx`               |
| **Fixed `height` on `.mm-post`**               | Prevents `measureElement` from reading true content height. Message items must NOT have a fixed height — use `min-height` only.                                         | `message-item.tsx`               |
| **`height: virtualRow.size` on measured rows** | Overwrites the measured height with the estimated height. For `measureElement` mode, do NOT set height on the virtual row div.                                          | `message-list.tsx`               |

#### Virtual List Configuration

```typescript
const virtualizer = useVirtualizer({
  count: messagesWithMeta.length,
  getScrollElement: () => listRef.current,
  estimateSize: () => estimatedItemHeight, // dynamic based on message metadata
  overscan: 8,
  getItemKey: (i) => messagesWithMeta[i].id, // stable keys for prepend
  measureElement, // reads true DOM height after render
});
```

#### Initial Scroll Strategy

`scrollToIndex(align: "end")` alone doesn't work because it uses **estimated** sizes. The virtualizer only renders + measures items after the scroll position moves. The correct approach uses a two-phase strategy:

**Phase 1 — Fill loop**: Repeatedly set `el.scrollTop = el.scrollHeight` in a rAF loop (up to 60 frames). Each iteration triggers the virtualizer to render more items at the new scroll position, and `measureElement` fires for each rendered item, growing the actual scroll height. Track when `scrollHeight` stabilizes (3 consecutive frames with the same value) — this means all items have been rendered and measured.

**Phase 2 — Precision snap**: One final `scrollToIndex(lastIdx, { align: "end" })` using now-accurate measured heights.

```typescript
let frameCount = 0;
let lastHeight = 0;
let stableCount = 0;

const tick = () => {
  const el = listRef.current;
  if (!el) return;
  el.scrollTop = el.scrollHeight;
  frameCount++;

  if (el.scrollHeight === lastHeight) {
    stableCount++;
  } else {
    stableCount = 0;
    lastHeight = el.scrollHeight;
  }

  if (frameCount < 60 && stableCount < 3) {
    requestAnimationFrame(tick);
  } else {
    // Items are rendered and measured — snap to exact bottom
    virtualizer.scrollToIndex(messagesWithMeta.length - 1, { align: "end" });
  }
};
requestAnimationFrame(tick);
```

**Phase 3 — Async catch-up**: A ResizeObserver on the scroll container catches late height changes from async content loads (reactions, profile avatars, image embeds). When the content grows and the user is near the bottom (< 100px), it re-scrolls to keep the view anchored:

```typescript
const observer = new ResizeObserver(() => {
  const { scrollTop, scrollHeight, clientHeight } = el;
  if (scrollHeight - scrollTop - clientHeight < 100) {
    virtualizer.scrollToIndex(messagesWithMeta.length - 1, { align: "end" });
  }
});
observer.observe(el);
```

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

| File                                                     | Role                                                                            |
| -------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `apps/web/components/chat/message-list.tsx`              | Virtualizer config, scroll management, `#post-list` scroll container            |
| `apps/web/components/chat/chat-view.tsx`                 | `#channel_view` class management (loading vs main states)                       |
| `apps/web/app/(workspace)/layout.tsx`                    | `.app__body` (flex column), flex row, `.app__content`                           |
| `apps/web/app/layout.tsx`                                | Root `body` height, AppHeader `shrink-0`, main `flex:1; min-height:0`           |
| `apps/web/components/chat/message-list/message-item.tsx` | Individual message — must NOT have fixed height                                 |
| `apps/web/app/globals.css`                               | `.app__content` layer, `.mm-channel-header` flex-shrink, `--vh` custom property |

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

**Test Users**: 21 seed users with password `password123`. See [`docs/seed-data.md`](docs/seed-data.md) for full login info, user IDs, and workspace assignments.

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
