# Phase 7 — Patch Set Design / Execution Plan (Revised July 8, 2026)

> **Status**: This document replaces the original 07_PATCH_SETS.md and 07_PATCH_SETS_v2.md. It reflects the current repo state after the July 1–6 implementation wave. Many items from those earlier plans (seeds, rollbacks, shared config, store abstraction, i18n, onboarding, TipTap, keyboard categories, sidebar menu, file metadata, drafts, partial MessageList split, E2E expansion) are now **complete**. This document covers the **true remaining gaps**.

---

## Patch Set 1: Emoji Expansion (Quick Win)

| Field | Value |
|---|---|
| **Objective** | Replace the current ~600-entry emoji set with a full 3300+ Unicode set from Mattermost reference, leveraging existing infrastructure (categories, skin tones, recent tracking, hover preview, search, colon autocomplete). |
| **Areas touched** | `apps/web/lib/emoji/emoji-data.json` (replace dataset), `apps/web/components/chat/emoji-picker.tsx` (virtualize grid for larger set) |
| **Why together** | Single data swap + picker tuning. All infrastructure already wired. |
| **Benefit** | Parity with Mattermost emoji UX; users expect full Unicode emoji coverage |
| **Risk** | Low — data-only change with existing abstraction. Performance risk mitigated by virtualizing the emoji grid render. |
| **Prerequisites** | None |
| **Validation** | Open emoji picker, verify all 9 category tabs populate, search returns results, skin tone selector works, recent tab shows recently used |
| **Rollback** | Revert emoji-data.json to previous version |
| **Visual QA** | Yes — verify no layout shift with 5x more data, category tabs still fit in container |
| **Integration tests** | No (UI-only change) |

### Files

```
apps/web/lib/emoji/emoji-data.json         [REPLACE — full 3300-emoji dataset from Mattermost]
apps/web/components/chat/emoji-picker.tsx  [MODIFY — virtualize grid for larger dataset]
```

---

## Patch Set 2: DM Multi-Select Creation Modal (Medium Priority)

| Field | Value |
|---|---|
| **Objective** | Create a dedicated modal for creating DM channels with multi-user search/select, replacing inline/basic DM creation. |
| **Areas touched** | `apps/web/components/chat/create-dm-modal.tsx` (CREATE), `apps/web/components/workspace/app-sidebar.tsx` (MODIFY — add DM creation button), `apps/api/src/modules/channels/service.ts` (MODIFY — ensure bulk DM creation) |
| **Why together** | End-to-end feature: frontend modal + API support for multi-member DM channel creation. |
| **Benefit** | Users can create group DMs without workarounds; parity with Mattermost DM creation UX |
| **Risk** | Low-Medium — new UI surface, API endpoint already exists for single DM creation |
| **Prerequisites** | None |
| **Validation** | Open DM creation modal, search for users, select 3 users, create DM — verify channel appears in sidebar with correct member list |
| **Rollback** | Revert create-dm-modal.tsx and app-sidebar.tsx changes; keep API enhancement |
| **Visual QA** | Yes — modal layout, multi-select UX, search behavior |
| **Integration tests** | Yes — E2E test for DM creation flow |

### Files

```
apps/web/components/chat/create-dm-modal.tsx          [CREATE]
apps/web/components/workspace/app-sidebar.tsx          [MODIFY — "DM" button in sidebar header]
apps/api/src/modules/channels/service.ts               [MODIFY — bulk member add on DM creation]
tests/e2e/dm-creation.spec.ts                          [CREATE — E2E test]
```

---

## Patch Set 3: Sidebar Channel Context Menu (Quick Win)

| Field | Value |
|---|---|
| **Objective** | Add right-click context menu on sidebar channel items with actions: Mark as Read, Mute, Copy Link, Favorites, Leave Channel, Delete Channel. |
| **Areas touched** | `apps/web/components/workspace/channel-context-menu.tsx` (CREATE), `apps/web/components/workspace/app-sidebar.tsx` (MODIFY — right-click handler) |
| **Why together** | Single feature: context menu component + trigger integration. |
| **Benefit** | Users can manage channels from sidebar without navigating to channel settings; parity with Mattermost, Slack |
| **Risk** | Low — message context menu infrastructure already exists (same pattern); channel API handlers exist |
| **Prerequisites** | None |
| **Validation** | Right-click on public/private/DM/GM channel → menu appears with correct options → each action works |
| **Rollback** | Revert app-sidebar.tsx changes, delete channel-context-menu.tsx |
| **Visual QA** | Yes — menu positioning, right-click vs long-press on mobile |
| **Integration tests** | Yes — E2E test for channel context menu actions |

### Files

```
apps/web/components/workspace/channel-context-menu.tsx [CREATE]
apps/web/components/workspace/app-sidebar.tsx          [MODIFY — right-click handler on channel items]
```

---

## Patch Set 4: Sidebar Category Management UI (Medium Priority)

| Field | Value |
|---|---|
| **Objective** | Build the management UI for sidebar categories: create new category, rename existing, drag-and-drop reorder, delete (with channel reassignment). Database tables (`sidebar_categories` + `sidebar_channel_assignments`) already exist. |
| **Areas touched** | `apps/web/components/workspace/sidebar-category-manager.tsx` (CREATE), `apps/web/components/workspace/app-sidebar.tsx` (MODIFY — integrate manager) |
| **Why together** | Single feature: manager component + sidebar integration. |
| **Benefit** | Users can organize channels into custom categories; parity with Mattermost sidebar UX |
| **Risk** | Low — database tables and API already exist; DnD infrastructure proven in channel-list.tsx |
| **Prerequisites** | None |
| **Validation** | Create category → appears in sidebar. Rename → updates immediately. Drag channel between categories → persists. Delete → channels move to default category. |
| **Rollback** | Revert app-sidebar.tsx changes, delete category-manager |
| **Visual QA** | Yes — drag animation, rename inline editing, delete confirmation |
| **Integration tests** | Yes — API tests for category CRUD |

### Files

```
apps/web/components/workspace/sidebar-category-manager.tsx [CREATE]
apps/web/components/workspace/app-sidebar.tsx              [MODIFY — integrate category manager]
```

---

## Patch Set 5: MessageList Decomposition Completion (Medium Priority)

| Field | Value |
|---|---|
| **Objective** | Complete the extraction of message-list.tsx (1181 lines) into focused sub-modules. Three components already extracted (message-item.tsx, context-menu.tsx, delete-dialog.tsx). Remaining ~600 lines to extract: reactions, message-editing, timestamp, system-message. |
| **Areas touched** | `apps/web/components/chat/message-list/` (4 new files), `apps/web/components/chat/message-list/index.ts` (update exports) |
| **Why together** | Single file decomposition — one cut, all extracted components remain co-located under one directory. |
| **Benefit** | 1181→~200 lines per file; isolated testable units; easier future modifications |
| **Risk** | Medium — extraction must preserve all refs, event handlers, CSS classes. Risk mitigated by keeping barrel export identical. |
| **Prerequisites** | None |
| **Validation** | `pnpm build` passes; manual smoke test: render message list, verify reactions, editing, timestamps, system messages all function identically |
| **Rollback** | Restore single message-list.tsx from git |
| **Visual QA** | Yes — pixel-perfect comparison required |
| **Integration tests** | Yes — existing comprehensive.spec.ts covers message rendering |

### Files

```
apps/web/components/chat/message-list/reactions.tsx      [EXTRACT from message-list.tsx]
apps/web/components/chat/message-list/message-editing.tsx [EXTRACT from message-list.tsx]
apps/web/components/chat/message-list/timestamp.tsx      [EXTRACT from message-list.tsx]
apps/web/components/chat/message-list/system-message.tsx [EXTRACT from message-list.tsx]
apps/web/components/chat/message-list/index.ts           [MODIFY — barrel exports]
```

---

## Patch Set 6: Resizable Sidebar Drag Handle (Medium Priority)

| Field | Value |
|---|---|
| **Objective** | Add a draggable divider to the workspace layout sidebar, enabling users to resize sidebar width (stored in localStorage). |
| **Areas touched** | `apps/web/components/workspace/app-sidebar.tsx` (MODIFY — wrap in resizable container), `apps/web/app/(workspace)/layout.tsx` (MODIFY — CSS var for sidebar width) |
| **Why together** | Single coherent UX change: drag handle + persisted width + layout wiring. |
| **Benefit** | Users can customize sidebar width to see longer channel names; parity with Mattermost, Slack |
| **Risk** | Medium — layout changes can cause overflow/scroll issues on narrow screens. Mitigated by min/max width clamping (240-400px) and CSS var approach. |
| **Prerequisites** | None |
| **Validation** | Drag sidebar divider → sidebar resizes smoothly → width persists across page reload → narrow viewport (768px) auto-collapses without drag handle |
| **Rollback** | Revert layout.tsx and app-sidebar.tsx changes |
| **Visual QA** | Yes — resize behavior, collision with bottom nav, mobile (768px) responsiveness |
| **Integration tests** | No |

### Files

```
apps/web/components/workspace/app-sidebar.tsx  [MODIFY — add ResizableDivider component]
apps/web/app/(workspace)/layout.tsx            [MODIFY — CSS var for sidebar width]
```

---

## Patch Set 7: Global Notification Settings Page (Medium Priority)

| Field | Value |
|---|---|
| **Objective** | Add a global notification settings tab to the settings page with: default notification preference (All/Mentions/Nothing), push/email toggles, desktop sound selector (9 sounds), quiet hours. Per-channel preferences (already exist) override global defaults. |
| **Areas touched** | `apps/web/app/(workspace)/[workspaceSlug]/settings/page.tsx` (MODIFY — add Notifications tab), `apps/api/src/modules/preferences/routes.ts` (MODIFY — global preferences CRUD) |
| **Why together** | Backend + frontend must ship as one unit. |
| **Benefit** | Users can set notification defaults without per-channel configuration; parity with Mattermost notification settings |
| **Risk** | Low-Medium — settings page already exists with theme tab; preferences API already exists; notification sounds already implemented |
| **Prerequisites** | None |
| **Validation** | Set global default → new channels use it → per-channel override works → quiet hours suppress → sound selector plays preview |
| **Rollback** | Revert settings page and preferences routes |
| **Visual QA** | Yes — settings form layout, quiet hours time picker |
| **Integration tests** | Yes — API tests for global preference CRUD |

### Files

```
apps/web/app/(workspace)/[workspaceSlug]/settings/page.tsx [MODIFY — add Notifications tab]
apps/api/src/modules/preferences/routes.ts                  [MODIFY — global preferences CRUD]
```

---

## Patch Set 8: Multi-Team Sidebar (Strategic — GATED)

| Field | Value |
|---|---|
| **Objective** | Add a 65px left rail for workspace/team switching, enabling users to belong to multiple workspaces and switch between them via icon buttons. |
| **Areas touched** | `apps/web/components/workspace/team-rail.tsx` (CREATE), `apps/web/app/(workspace)/layout.tsx` (MODIFY — add rail), `apps/web/components/workspace/app-sidebar.tsx` (MODIFY — shift right by 65px), `apps/api/src/modules/workspaces/service.ts` (MODIFY — multi-workspace membership queries) |
| **Why together** | Full architectural change — layout shift + new component + API support. |
| **Benefit** | Users who belong to multiple workspaces can switch instantly without workspace menu |
| **Risk** | High — layout change affects all pages; 65px rail reduces content width on small viewports |
| **Prerequisites** | Patch Set 6 (resizable sidebar) — resizing and rail must be tested together |
| **Gating criteria** | Analytics showing >20% of users belong to >1 workspace. Currently single-workspace by design. |
| **Validation** | Two workspaces → rail shows workspace icons → click switches workspace |
| **Rollback** | Revert layout.tsx, app-sidebar.tsx, remove team-rail.tsx |
| **Visual QA** | Yes — critical layout change |
| **Integration tests** | Yes — multi-workspace E2E flow |

### Files

```
apps/web/components/workspace/team-rail.tsx                [CREATE]
apps/web/app/(workspace)/layout.tsx                        [MODIFY]
apps/web/components/workspace/app-sidebar.tsx              [MODIFY]
apps/api/src/modules/workspaces/service.ts                 [MODIFY]
tests/e2e/multi-workspace.spec.ts                          [CREATE — E2E test]
```

---

## Top N Prioritized Recommendations (Current State)

| # | Recommendation | Patch Set | Value | Risk | Effort | Status |
|---|---|---|---|---|---|---|
| 1 | Expand emoji picker to 3000+ emojis | PS1 | High | Low | 1 day | PENDING |
| 2 | DM multi-select creation modal | PS2 | High | Low-Med | 2 days | PENDING |
| 3 | Sidebar channel context menu | PS3 | Medium | Low | 1 day | PENDING |
| 4 | Sidebar category management UI | PS4 | Medium | Low | 2 days | PENDING |
| 5 | Complete MessageList decomposition | PS5 | High | Medium | 1 day | PENDING |
| 6 | Resizable sidebar drag handle | PS6 | Medium | Medium | 1 day | PENDING |
| 7 | Global notification settings page | PS7 | Medium | Low | 2 days | PENDING |
| 8 | Multi-team sidebar (GATED) | PS8 | Medium | High | 5 days | GATED |
| 9 | Store abstraction contract tests | — | Medium | Low | 1 day | PENDING |
| 10 | Auth/E2E test expansion | — | High | None | 2 days | PENDING |
| 11 | Bundle analysis + code-splitting | — | Medium | Low | 1 day | PENDING |
| 12 | File upload progress indicators | — | Medium | Low | 1 day | PENDING |
| 13 | Full Ctrl+K result list polish | — | Medium | Low | 1 day | PENDING |
| 14 | Thread reply count in message footer | — | Medium | Low | 0.5 day | PENDING |
| 15 | Message search date range presets | — | Low | Low | 0.5 day | PENDING |

---

## Copy-from-Reference List

| Item | Source (Mattermost) | Destination | Notes |
|---|---|---|---|
| **Emoji dataset** | `webapp/channels/src/utils/emoji.json` (57,799 lines, ~3300 emojis) | `apps/web/lib/emoji/emoji-data.json` | Same format — JSON array of emoji objects |
| **DM multi-select pattern** | `more_direct_channels/more_direct_channels.tsx` | `apps/web/components/chat/create-dm-modal.tsx` | UX pattern, not code |
| **Channel context menu** | `sidebar_channel_menu/` | `apps/web/components/workspace/channel-context-menu.tsx` | Menu item list + keyboard navigation |
| **Category management** | `sidebar_category/` (466 lines, draggable) | `apps/web/components/workspace/sidebar-category-manager.tsx` | DnD with HTML5 drag API |
| **Resizable divider** | `resizable_sidebar/resizable_divider.tsx` — 4px handle, mouse tracking | `apps/web/components/workspace/app-sidebar.tsx` | Implementation pattern |
| **Team sidebar rail** | `team_sidebar/team_sidebar.tsx` — 65px rail with icons + tooltips | `apps/web/components/workspace/team-rail.tsx` | Fixed-width rail pattern |

---

## Adapt-Don't-Copy List

| Reference Pattern | Adaptation Needed | Reason |
|---|---|---|
| **Mattermost emoji picker** (8 files, Redux) | Use existing 1-file picker with new data | Current infrastructure already covers categories, recent, skin tones, search, preview |
| **Mattermost channel menu** (Redux + SCSS) | Create new component with Tailwind + hooks | No Redux in current app; use existing context-menu patterns |
| **Mattermost category manager** (Redux) | React Context + HTML5 DnD | Simpler state management; DnD already proven in channel-list.tsx |
| **Mattermost resizable_sidebar** (SCSS module) | CSS custom properties + Tailwind | No SCSS modules in current codebase |
| **Mattermost team sidebar** (Redux + SCSS) | React Context + Tailwind | Different styling and state architecture |
| **Mattermost notification settings** (1300 lines, Redux) | Adapt as simpler settings tab | Current settings page already exists; extend with notifications tab |

---

## Leave-Alone List (Already Superior or Unnecessary)

| Area | Reason |
|---|---|
| **Current emoji infrastructure** | Already matches Mattermost parity; only needs data expansion |
| **Current keyboard shortcuts** | Categorized modal with 10+ shortcuts — already matches Mattermost scope |
| **Current file preview** | Metadata panel, zoom, multi-file nav — already implemented |
| **Current sidebar workspace menu** | Workspace switcher with icons + active indicator — already matches Mattermost |
| **Current onboarding tour** | 5-step task list — already implemented |
| **Current i18n system** | Locale infrastructure with en.json — already scaffolded |
| **Current TipTap editor** | TaskList, Link, Placeholder — already implemented |
| **Current drafts auto-save** | localStorage-based — matches scope for current needs |
| **Module-based API structure** | Superior to Mattermost's flat `routes/` pattern |
| **Same-domain Caddy proxy** | Simpler than Mattermost's subdomain split |
| **Vitest** (not Jest) | Modern, faster, ESM-native |
| **Tailwind v4** (not v3 like Mattermost) | Already on v4; CSS custom properties approach is better |
| **No Redux** (React Context + hooks) | Appropriate for current complexity |
| **Current RBAC model** | 18 granular permissions × 3 roles — already more sophisticated |
| **Socket.io** (not Mattermost's WebSocket) | Full real-time feature set with Redis adapter |

---

## Best Order of Execution

### Week 1 (~3 days with 2 devs)
```
Day 1:
  🟢 PS1 — Emoji expansion (Dev A)
  🟢 PS3 — Channel context menu (Dev B)
  ─────────────────── Validate: pnpm build, manual smoke test

Day 2-3:
  🟢 PS2 — DM multi-select modal (Dev A)
  🟢 PS4 — Sidebar category management (Dev B)
  ─────────────────── Validate: pnpm check, E2E dm-creation.spec.ts, category CRUD
```

### Week 2 (~2 days with 2 devs)
```
Day 1:
  🟡 PS5 — MessageList decomposition (Dev A, needs DM merged for hygiene)
  🟡 PS6 — Resizable sidebar (Dev B, parallel with PS5)
  ─────────────────── Validate: pnpm build, E2E comprehensive.spec.ts, visual QA

Day 2:
  🟡 PS7 — Global notification settings (Dev A, after PS5)
  ─────────────────── Validate: pnpm check, API tests for preferences
```

### Strategic (Gated)
```
PS8 — Multi-team sidebar (requires >20% multi-workspace user analytics)
  ─────────────────── Validate: E2E multi-workspace.spec.ts, visual QA 3 breakpoints
```

### Cumulative Timeline

| Phase | Patch Sets | Effort | Devs | Calendar Time |
|---|---|---|---|---|
| Week 1 | PS1, PS3, PS2, PS4 | 6 days | 2 | ~3 days |
| Week 2 | PS5, PS6, PS7 | 4 days | 2 | ~2 days |
| Strategic | PS8 (GATED) | 5 days | 2 | ~3 days |
| **Total** | **8 patch sets** | **~15 days** | **2** | **~1.5 weeks** |
