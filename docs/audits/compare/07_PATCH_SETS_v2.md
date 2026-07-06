# Phase 7 — Patch-Oriented Execution Plan (July 6, 2026)

> **Status note**: The original Phase 6/7 plan (`07_PATCH_SETS.md`) was written before the July 1–6 implementation wave. Many items listed there (seeds, policies extraction, shared config, Traefik cleanup, E2E tests, local stack script, down migration scripts, store abstraction, user groups, sidebar categories, Audit API, RBAC, DM channels, presence, worker app, TipTap editor, colon autocomplete, slash commands, formatting toolbar, code blocks, paste image, notification system, channel context menu, search filters, file preview zoom/nav, emoji skin tones, Ctrl+K switcher, keyboard shortcuts, etc.) are now **complete**. This document reflects the **actual remaining gaps**.

---

## Patch Set 1: Emoji Expansion (Quick Win)

| Field | Value |
|---|---|
| **Objective** | Replace the current ~600-entry emoji set with a full 3000+ set from the Mattermost reference, leveraging existing infrastructure (categories, skin tones, recent tracking, hover preview, search). |
| **Areas touched** | `apps/web/lib/emoji/emoji-data.ts` (replace dataset), `apps/web/lib/emoji/emoji-data.json` (replace), `apps/web/components/chat/emoji-picker.tsx` (tune rendering for larger set — virtualize grid, fix category tab ordering) |
| **Why together** | Single data swap + picker tuning. All infrastructure (recent tracking, skin tones, categories, preview, search) already wired. |
| **Benefit** | Parity with Mattermost emoji UX; users expect full Unicode emoji coverage |
| **Risk** | Low — data-only change with existing abstraction. Performance risk mitigated by virtualizing the emoji grid render. |
| **Prerequisites** | None |
| **Validation** | Open emoji picker, verify all 11 category tabs populate, search "clown" returns result, skin tone selector works, recent tab shows recently used |
| **Rollback** | Revert emoji-data.ts + emoji-data.json to previous versions |
| **Visual QA** | Yes — verify no layout shift with 5× more data, category tabs still fit in container |
| **Integration tests** | No (UI-only change) |

### Copy from reference
- Use Mattermost `emoji.json` (57,799 lines, ~3300 system emojis) as data source
- Adopt Mattermost's category constants (11 categories) to match tab structure
- Current category/filter/search/recent/skin infrastructure maps 1:1

### Files

```
apps/web/lib/emoji/emoji-data.json         [REPLACE — full 3300-emoji dataset]
apps/web/lib/emoji/emoji-data.ts           [MODIFY — category constants, export array]
apps/web/components/chat/emoji-picker.tsx  [MODIFY — virtualize grid, category ordering]
```

---

## Patch Set 2: message-list.tsx Decomposition (Quick Win)

| Field | Value |
|---|---|
| **Objective** | Split the 1117-line `message-list.tsx` into a directory of focused sub-modules to improve maintainability and testability. |
| **Areas touched** | `apps/web/components/chat/message-list/` (new directory with index.ts, message-item.tsx, reactions.tsx, message-editing.tsx, context-menu.tsx, timestamp.tsx, system-message.tsx) |
| **Why together** | Single file decomposition — one cut, all extracted components remain co-located under one directory. |
| **Benefit** | 1117→~150 lines per file; isolated testable units; easier future modifications |
| **Risk** | Medium — extraction must preserve all refs, event handlers, CSS classes. Risk mitigated by keeping a `message-list/index.ts` barrel export identical to current `message-list.tsx` exports. |
| **Prerequisites** | None |
| **Validation** | `pnpm build` passes; manual smoke test: render message list, verify reactions, editing, context menu, timestamps, system messages all function identically |
| **Rollback** | Restore single `message-list.tsx` from git |
| **Visual QA** | Yes — pixel-perfect comparison required |
| **Integration tests** | Yes — existing Playwright comprehensive.spec.ts covers message rendering; verify no regression |

### Adapt-don't-copy
- Mattermost splits posts into `post_view`, `post_body`, `post_attachment`, `post_emoji`, `post_edit_history`, `post_recent_posts`, `post_reminder`, `post_time` — too granular for current codebase. Target 5-6 sub-modules (not 8+).

### Files

```
apps/web/components/chat/message-list/          [CREATE — directory]
apps/web/components/chat/message-list/index.ts  [CREATE — barrel re-export]
apps/web/components/chat/message-list/message-item.tsx [EXTRACT — single message rendering]
apps/web/components/chat/message-list/reactions.tsx [EXTRACT — reaction buttons + tooltips]
apps/web/components/chat/message-list/message-editing.tsx [EXTRACT — edit form + save/cancel]
apps/web/components/chat/message-list/context-menu.tsx [EXTRACT — right-click/long-press menu]
apps/web/components/chat/message-list/timestamp.tsx [EXTRACT — permalink + floating overlay]
apps/web/components/chat/message-list/system-message.tsx [EXTRACT — join/leave/pin messages]
apps/web/components/chat/message-list.tsx       [REMOVE — replaced by directory]
```

---

## Patch Set 3: Keyboard Shortcut Modal Categorization (Quick Win)

| Field | Value |
|---|---|
| **Objective** | Add category/section headers to the keyboard shortcuts modal, organizing ~20 shortcuts into groups (Navigation, Messages, Search, Composer). |
| **Areas touched** | `apps/web/components/shared/keyboard-shortcuts.tsx` |
| **Why together** | Single-file UI restructuring. No new shortcuts, just visual organization. |
| **Benefit** | Discoverability — users can find relevant shortcuts by domain instead of scanning a flat list |
| **Risk** | Low — presentation-only change |
| **Prerequisites** | None |
| **Validation** | Open `?` button or `Ctrl+/` — verify categories are visible and shortcuts grouped correctly |
| **Rollback** | Revert keyboard-shortcuts.tsx |
| **Visual QA** | Yes — verify modal layout with section headers |
| **Integration tests** | No |

### Copy from reference
- Match Mattermost's category structure (Messages, Files, Browser, Composer) but adapt to actual chat.app shortcuts
- Use Mattermost's section header styling pattern (bold uppercase label with bottom border)

### Files

```
apps/web/components/shared/keyboard-shortcuts.tsx [MODIFY — add section grouping]
```

---

## Patch Set 4: DM Multi-Select Creation Modal (Medium)

| Field | Value |
|---|---|
| **Objective** | Create a dedicated modal for creating DM channels with multi-user search/select, replacing any inline/incomplete DM creation flow. |
| **Areas touched** | `apps/web/components/chat/create-dm-modal.tsx` (CREATE), `apps/web/components/workspace/app-sidebar.tsx` (MODIFY — add DM creation button), `apps/api/src/modules/channels/service.ts` (MODIFY — ensure bulk DM creation) |
| **Why together** | End-to-end feature: frontend modal + API support for multi-member DM channel creation. |
| **Benefit** | Users can create group DMs without workarounds; parity with Mattermost DM creation UX |
| **Risk** | Low-medium — new UI surface, API endpoint already exists for single DM creation |
| **Prerequisites** | Patch Set 2 (message-list split) recommended but not required |
| **Validation** | Open DM creation modal, search for users, select 3 users, create DM — verify channel appears in sidebar with correct member list |
| **Rollback** | Revert create-dm-modal.tsx and app-sidebar.tsx changes; keep API enhancement |
| **Visual QA** | Yes — modal layout, multi-select UX, search behavior |
| **Integration tests** | Yes — E2E test for DM creation flow |

### Copy from reference
- Mattermost `more_direct_channels/more_direct_channels.tsx` — multi-select user search with checkboxes, "Go" button creates DM/GM channel
- Use Mattermost's multi-select pattern: typeahead search → checkable list → confirm button

### Files

```
apps/web/components/chat/create-dm-modal.tsx  [CREATE]
apps/web/components/workspace/app-sidebar.tsx [MODIFY — "DM" button in sidebar header]
apps/api/src/modules/channels/service.ts      [MODIFY — bulk member add on DM creation]
```

---

## Patch Set 5: Resizable Sidebar Drag Handle (Medium)

| Field | Value |
|---|---|
| **Objective** | Add a draggable divider to the workspace layout sidebar, enabling users to resize sidebar width (stored in localStorage). |
| **Areas touched** | `apps/web/components/workspace/app-sidebar.tsx` (MODIFY — wrap in resizable container), `apps/web/app/(workspace)/layout.tsx` (MODIFY — sidebar width CSS var) |
| **Why together** | Single coherent UX change: drag handle + persisted width + layout wiring. |
| **Benefit** | Users can customize sidebar width to see longer channel names; parity with Mattermost, Slack |
| **Risk** | Medium — layout changes can cause overflow/scroll issues on narrow screens. Mitigated by min/max width clamping and CSS var approach (no JS-driven layout shifting). |
| **Prerequisites** | None |
| **Validation** | Drag sidebar divider — verify sidebar resizes smoothly, width persists across page reload, narrow viewport (768px) auto-collapses without drag handle |
| **Rollback** | Revert layout.tsx and app-sidebar.tsx changes |
| **Visual QA** | Yes — resize behavior, collision with bottom nav, mobile responsiveness |
| **Integration tests** | No |

### Copy from reference
- Mattermost `resizable_sidebar/resizable_divider.tsx` — thin (4px) drag handle on the right edge of sidebar, cursor: col-resize, onMouseDown tracking
- Mattermost `resizable_sidebar/constants.ts` — MIN_SIDEBAR_WIDTH=240, MAX_SIDEBAR_WIDTH=400

### Files

```
apps/web/components/workspace/app-sidebar.tsx  [MODIFY — add ResizableDivider component inline]
apps/web/app/(workspace)/layout.tsx            [MODIFY — CSS var for sidebar width]
```

---

## Patch Set 6: i18n Infrastructure Scaffolding (Medium)

| Field | Value |
|---|---|
| **Objective** | Set up internationalization infrastructure: next-intl (or react-intl) package, locale detection, string extraction pattern, English locale file. No UI migration — just scaffold. |
| **Areas touched** | `apps/web/package.json` (add `next-intl`), `apps/web/i18n/` (CREATE — request.ts, routing.ts, messages/en.json), `apps/web/app/layout.tsx` (wrap with IntlProvider), `apps/web/middleware.ts` (locale routing) |
| **Why together** | Infrastructure must be consistent — adding packages + provider + middleware in one coherent change. |
| **Benefit** | Foundation for eventual localization; current all-English codebase needs i18n foundation before strings proliferate further |
| **Risk** | Low — no existing strings touched, purely additive infrastructure. Risk: potential Next.js middleware conflict with existing auth middleware — mitigated by testing route resolution. |
| **Prerequisites** | None |
| **Validation** | App renders in English as before; locale cookie is set; EN messages file is loadable; no middleware errors in console |
| **Rollback** | Remove next-intl package, revert layout.tsx and middleware.ts |
| **Visual QA** | No |
| **Integration tests** | No |

### Adapt-don't-copy
- Mattermost uses `react-intl` with Redux-based locale state. Current codebase uses Next.js App Router — use `next-intl` for native RSC/App Router compatibility.
- Do NOT extract all strings in this patch set. Just scaffold. String extraction is a separate cross-cutting effort.

### Files

```
apps/web/package.json                          [MODIFY — add next-intl dependency]
apps/web/i18n/request.ts                       [CREATE — locale detection]
apps/web/i18n/routing.ts                       [CREATE — routing config]
apps/web/i18n/messages/en.json                 [CREATE — English locale (minimal)]
apps/web/app/layout.tsx                        [MODIFY — wrap with NextIntlClientProvider]
apps/web/middleware.ts                         [MODIFY — locale routing middleware]

apparently at least: 6
```

---

## Patch Set 7: Sidebar Header Workspace Menu Enhancement (Quick Win)

| Field | Value |
|---|---|
| **Objective** | Enhance the existing sidebar header (team menu) with workspace switcher, "Browse workspaces", "Create workspace" actions. |
| **Areas touched** | `apps/web/components/workspace/app-sidebar.tsx` |
| **Why together** | Single component enhancement. The `showTeamMenu` state already exists — enrich the menu content. |
| **Benefit** | Users can switch/manage workspaces from the sidebar header, matching Mattermost team menu behavior |
| **Risk** | Low — extending existing menu UI |
| **Prerequisites** | None |
| **Validation** | Click workspace name in sidebar header — menu shows workspace list, browse action, create action |
| **Rollback** | Revert app-sidebar.tsx changes |
| **Visual QA** | Yes — menu positioning, overflow behavior |
| **Integration tests** | No |

### Copy from reference
- Mattermost `sidebar_header/sidebar_header.tsx` — team name button opens dropdown with team list + "Join another team" + "Create a team"

### Files

```
apps/web/components/workspace/app-sidebar.tsx [MODIFY — enrich team menu content]
```

---

## Patch Set 8: File Preview Metadata Panel (Quick Win)

| Field | Value |
|---|---|
| **Objective** | Add metadata panel (file name, size, uploader, upload date) to the expanded file preview overlay. |
| **Areas touched** | `apps/web/components/chat/file-preview.tsx` |
| **Why together** | Single component enhancement. |
| **Benefit** | Users can see file details without downloading; parity with Mattermost file preview |
| **Risk** | Low — additive UI only |
| **Prerequisites** | None |
| **Validation** | Click image → expanded view shows metadata panel below/beside image with name, size, uploader |
| **Rollback** | Revert file-preview.tsx |
| **Visual QA** | Yes — metadata panel layout, truncation, mobile responsiveness |
| **Integration tests** | No |

### Adapt-don't-copy
- Mattermost `file_preview_modal_info/` has a full right-side panel — adapt as a bottom bar for smaller screens

### Files

```
apps/web/components/chat/file-preview.tsx [MODIFY — add metadata section]
```

---

## Patch Set 9: Drafts Auto-Save (High Effort — Gated)

| Field | Value |
|---|---|
| **Objective** | Auto-save unsent message drafts to localStorage, restore on channel re-entry, provide drafts page UI for reviewing saved drafts. |
| **Areas touched** | `apps/web/hooks/use-drafts.ts` (CREATE), `apps/web/components/chat/message-input.tsx` (MODIFY — integrate hook), `apps/web/components/chat/drafts-page.tsx` (CREATE), `apps/web/app/(workspace)/[workspaceSlug]/drafts/page.tsx` (CREATE) |
| **Why together** | End-to-end feature: hook + input integration + draft page UI + route. |
| **Benefit** | Prevents message loss on accidental navigation/refresh |
| **Risk** | Medium — storage format decisions, edge cases with attachments. Mitigated by localStorage-only approach (no server sync). |
| **Prerequisites** | Patch Set 2 (message-list split) recommended for code review bandwidth |
| **Gating criteria** | Must have: analytics showing >5% of users experience message loss (detectable via `beforeunload` events). If not met, defer. |
| **Validation** | Type a partial message → navigate away → return to channel → draft restored. Drafts page lists all saved drafts grouped by channel. |
| **Rollback** | Revert all files |
| **Visual QA** | Yes — drafts page layout, draft indicators in sidebar |
| **Integration tests** | Yes — E2E test for draft persistence |

### Adapt-don't-copy
- Mattermost drafts system has server-side persistence, scheduled posts, and 20+ files. Adapt as a lightweight localStorage-only solution (1 hook + 2 components).

### Files

```
apps/web/hooks/use-drafts.ts                    [CREATE]
apps/web/components/chat/message-input.tsx      [MODIFY]
apps/web/components/chat/drafts-page.tsx        [CREATE]
apps/web/app/(workspace)/[workspaceSlug]/drafts/page.tsx [CREATE]
```

---

## Patch Set 10: Notification Trigger Words + Auto-Responder (Medium)

| Field | Value |
|---|---|
| **Objective** | Add per-user notification trigger words and auto-responder settings to the notification preferences page. |
| **Areas touched** | `apps/web/app/(workspace)/[workspaceSlug]/settings/page.tsx` (MODIFY — add trigger words section), `apps/api/src/modules/notifications/service.ts` (MODIFY — evaluate trigger words on message send), `apps/api/src/modules/preferences/routes.ts` (MODIFY — trigger words CRUD), new migration for `user_trigger_words` table |
| **Why together** | Backend + frontend + schema must ship as one unit. |
| **Benefit** | Users get notified for keywords beyond @mentions; auto-responder for OOO/vacation |
| **Risk** | Medium — notification evaluation latency on message send. Mitigated by indexed lookup. |
| **Prerequisites** | Patch Set 6 (i18n scaffold) recommended but not required |
| **Validation** | Set trigger word "urgent" → send message containing "urgent" → user receives notification. Set auto-responder → DM triggers auto-reply. |
| **Rollback** | Revert all files; drop migration |
| **Visual QA** | Yes — settings page form layout |
| **Integration tests** | Yes — API tests for trigger word matching |

### Files

```
supabase/migrations/20260706000001_trigger_words.sql [CREATE]
apps/api/src/modules/notifications/service.ts          [MODIFY]
apps/api/src/modules/preferences/routes.ts             [MODIFY]
apps/web/app/(workspace)/[workspaceSlug]/settings/page.tsx [MODIFY]
```

---

## Patch Set 11: Onboarding Task List + Tour Tips (High Effort — Strategic)

| Field | Value |
|---|---|
| **Objective** | First-run experience with task list popover (complete profile, create channel, invite member, send first message) and 5-step guided tour overlay. |
| **Areas touched** | `apps/web/components/onboarding/` (CREATE — directory with 4-5 components), `apps/web/app/(workspace)/layout.tsx` (MODIFY — mount OnboardingProvider) |
| **Why together** | Coherent UX — task list and tour are two views of the same onboarding state machine. |
| **Benefit** | Faster user activation; reduced support questions; parity with Mattermost on-boarding |
| **Risk** | Medium-high — overlay/tour can conflict with other UI elements. Mitigated by focus-trap pattern and dismissible state. |
| **Prerequisites** | Patch Set 6 (i18n) recommended — onboarding strings need localization |
| **Gating criteria** | Must have: measurable activation rate <60% (new users who send message within 7 days). If activation >60%, defer. |
| **Validation** | Fresh login → task list popover appears → complete each task → popover disappears. Tour tips appear on first visit to key pages. |
| **Rollback** | Remove OnboardingProvider from layout, delete onboarding/ directory |
| **Visual QA** | Yes — critical for first impression |
| **Integration tests** | Yes — E2E test for onboarding flow |

### Adapt-don't-copy
- Mattermost `onboarding_tasklist/` has 8 files with Redux state. Adapt as simpler React Context + localStorage for state persistence.
- Mattermost `tours/` has 15+ files — adapt as 2-3 focused tip components.

### Files

```
apps/web/components/onboarding/onboarding-provider.tsx [CREATE]
apps/web/components/onboarding/task-list-popover.tsx   [CREATE]
apps/web/components/onboarding/tour-tip.tsx            [CREATE]
apps/web/components/onboarding/tour-step.tsx           [CREATE]
apps/web/app/(workspace)/layout.tsx                    [MODIFY]
```

---

## Patch Set 12: Multi-Team Sidebar (Strategic — Deferred)

| Field | Value |
|---|---|
| **Objective** | Add a 65px left rail for workspace/team switching, enabling users to belong to multiple workspaces and switch between them via icon buttons. |
| **Areas touched** | `apps/web/components/workspace/team-rail.tsx` (CREATE), `apps/web/app/(workspace)/layout.tsx` (MODIFY — add rail), `apps/web/components/workspace/app-sidebar.tsx` (MODIFY — shift right by 65px), `apps/api/src/modules/workspaces/service.ts` (MODIFY — multi-workspace membership queries) |
| **Why together** | Full architectural change — layout shift + new component + API support. |
| **Benefit** | Users who belong to multiple workspaces can switch instantly without workspace menu |
| **Risk** | High — layout change affects all pages; 65px rail reduces content width on small viewports |
| **Prerequisites** | Patch Set 5 (resizable sidebar) — resizing and rail must be tested together |
| **Gating criteria** | Must have: analytics showing >20% of users belong to >1 workspace. Currently single-workspace by design. |
| **Validation** | Two workspaces → rail shows workspace icons → click switches workspace |
| **Rollback** | Revert layout.tsx, app-sidebar.tsx, remove team-rail.tsx |
| **Visual QA** | Yes — critical layout change |
| **Integration tests** | Yes — multi-workspace E2E flow |

### Adapt-don't-copy
- Mattermost `team_sidebar/` uses fixed 65px rail with tooltip labels. Adapt with collapsible option for mobile.

### Files

```
apps/web/components/workspace/team-rail.tsx                [CREATE]
apps/web/app/(workspace)/layout.tsx                        [MODIFY]
apps/web/components/workspace/app-sidebar.tsx              [MODIFY]
apps/api/src/modules/workspaces/service.ts                 [MODIFY]
```

---

## Top 25 Prioritized Recommendations (Current State)

| # | Recommendation | Patch Set | Value | Risk | Effort | Status |
|---|---|---|---|---|---|---|
| 1 | Expand emoji picker to 3000+ emojis | PS1 | High | Low | 1 day | PENDING |
| 2 | Split message-list.tsx (1117→ sub-modules) | PS2 | High | Medium | 1 day | PENDING |
| 3 | Keyboard shortcut modal with categories | PS3 | Medium | Low | 0.5 day | PENDING |
| 4 | DM multi-select creation modal | PS4 | High | Low-Med | 2 days | PENDING |
| 5 | Resizable sidebar drag handle | PS5 | Medium | Medium | 2 days | PENDING |
| 6 | i18n infrastructure scaffolding | PS6 | Medium | Low | 2 days | PENDING |
| 7 | Sidebar header workspace menu enrichment | PS7 | Medium | Low | 0.5 day | PENDING |
| 8 | File preview metadata panel | PS8 | Medium | Low | 0.5 day | PENDING |
| 9 | Drafts auto-save (GATED) | PS9 | High | Medium | 3 days | GATED |
| 10 | Trigger words + auto-responder | PS10 | Medium | Medium | 3 days | PENDING |
| 11 | Onboarding task list + tour (GATED) | PS11 | High | Med-High | 4 days | GATED |
| 12 | Multi-team sidebar (GATED/DEFERRED) | PS12 | Medium | High | 5 days | GATED |
| 13 | Notification preference refactor (unify per-channel + global) | — | Medium | Low | 1 day | PENDING |
| 14 | Package-level bundle analysis + code-splitting | — | Medium | Low | 1 day | PENDING |
| 15 | Add file upload progress indicators | — | Medium | Low | 1 day | PENDING |
| 16 | Add typing indicator throttling (debounce) | — | Low | Low | 0.5 day | PENDING |
| 17 | Add `/shrug` and `/me` as UI buttons | — | Low | Low | 0.5 day | PENDING |
| 18 | Full Ctrl+K result list (show N results, keyboard nav) | — | Medium | Low | 1 day | PENDING |
| 19 | Add channel bookmark edit/delete UI | — | Medium | Low | 1 day | PENDING |
| 20 | Thread reply count in message footer | — | Medium | Low | 0.5 day | PENDING |
| 21 | Add `/poll` results visualization | — | Medium | Low | 1 day | PENDING |
| 22 | Message search date range presets (today, this week) | — | Low | Low | 0.5 day | PENDING |
| 23 | Add reaction tooltip "You + N others" refinement | — | Low | Low | 0.5 day | PENDING |
| 24 | Notification bell badge for unread mentions | — | Medium | Low | 1 day | PENDING |
| 25 | Copy message link as permalink from context menu | — | Medium | Low | 0.5 day | PENDING |

---

## Quick Wins (Can do in < 2 days each)

| # | Item | Est. | Risk | Patches |
|---|---|---|---|---|
| 1 | Expand emoji picker to 3000+ emojis | 1d | Low | PS1 |
| 2 | Split message-list.tsx into sub-modules | 1d | Med | PS2 |
| 3 | Keyboard shortcut modal with category sections | 0.5d | Low | PS3 |
| 4 | Sidebar header workspace menu enrichment | 0.5d | Low | PS7 |
| 5 | File preview metadata panel | 0.5d | Low | PS8 |
| 6 | Ctrl+K result list polish (show more, keyboard nav) | 1d | Low | (standalone) |
| 7 | Thread reply count display in message footer | 0.5d | Low | (standalone) |
| 8 | `/poll` results visualization | 1d | Low | (standalone) |
| 9 | Add reaction tooltip "You + N others" refinement | 0.5d | Low | (standalone) |
| 10 | Copy message permalink from context menu | 0.5d | Low | (standalone) |

**Estimated total**: ~7 days for all 10 quick wins (can parallelize 3-4 devs)

---

## Needs-Tests-First List

Items that require comprehensive test coverage before implementation:

| Item | Existing Tests | Needed Before |
|---|---|---|
| **message-list.tsx split** (PS2) | `comprehensive.spec.ts` covers message rendering | Add unit tests for each extracted sub-component |
| **DM multi-select modal** (PS4) | No DM-specific E2E test | Add `dm-creation.spec.ts` before implementation |
| **Resizable sidebar** (PS5) | No sidebar resize test | Add `sidebar-resize.spec.ts` verifying width persistence |
| **Drafts auto-save** (PS9) | No drafts test | Add `drafts.spec.ts` before implementation |
| **Trigger words** (PS10) | No trigger word API test | Add `trigger-words.service.test.ts` before backend changes |
| **Onboarding tour** (PS11) | No onboarding test | Add `onboarding.spec.ts` before implementation |
| **Multi-team sidebar** (PS12) | No multi-workspace E2E test | Add `multi-workspace.spec.ts` before implementation |

---

## Copy-from-Reference List

Items where Mattermost pattern should be directly adopted:

| Item | Source (Mattermost) | Destination | Notes |
|---|---|---|---|
| **Emoji dataset** | `webapp/channels/src/utils/emoji.json` (57,799 lines, ~3300 emojis) | `apps/web/lib/emoji/emoji-data.json` | Same format — JSON array of emoji objects |
| **Emoji category constants** | `webapp/channels/src/utils/emoji.js` category arrays | `apps/web/lib/emoji/emoji-data.ts` | All 11 categories, names, ordering |
| **Keyboard shortcut categories** | `keyboard_shortcuts/keyboard_shortcuts_sequence/keyboard_shortcuts.ts` (SHORTCUTS grouped by domain) | `apps/web/components/shared/keyboard-shortcuts.tsx` | Section grouping pattern |
| **DM multi-select pattern** | `more_direct_channels/more_direct_channels.tsx` — typeahead + checkable list + confirm | `apps/web/components/chat/create-dm-modal.tsx` | UX pattern, not code |
| **Resizable divider** | `resizable_sidebar/resizable_divider.tsx` — 4px handle, onMouseDown tracking, CSS vars | `apps/web/components/workspace/app-sidebar.tsx` | Implementation pattern |
| **Sidebar team menu** | `sidebar_header/sidebar_header.tsx` — dropdown with team list + actions | `apps/web/components/workspace/app-sidebar.tsx` | Menu structure |
| **Team sidebar rail** | `team_sidebar/team_sidebar.tsx` — 65px left rail with workspace icons + tooltips | `apps/web/components/workspace/team-rail.tsx` | Fixed-width rail pattern |

---

## Adapt-Don't-Copy List

Items needing modification for the current repo's architecture:

| Reference Pattern | Adaptation Needed | Reason |
|---|---|---|
| **Mattermost emoji picker** (8 files, Redux) | Use existing 1-file picker with new data | Current infrastructure already covers categories, recent, skin tones, search, preview — no need to adopt Redux |
| **Mattermost keyboard shortcuts** (6 files, Redux) | Single-file rewrite with section grouping | No Redux in current app; use existing React Context |
| **Mattermost more_direct_channels** (Redux + SCSS) | Create new component with Tailwind + SWR | Styling system differs; API contract already exists |
| **Mattermost resizable_sidebar** (SCSS module) | Use CSS custom properties + Tailwind | No SCSS modules in current codebase |
| **Mattermost drafts** (20+ files, server-side) | Lightweight localStorage hook | Don't need server-side draft persistence yet |
| **Mattermost onboarding** (15+ files, Redux) | React Context + localStorage | Simpler state persistence; no Redux dependency |
| **Mattermost i18n** (react-intl + Redux) | next-intl (App Router native) | Different framework; next-intl is the standard Next.js 15 i18n solution |
| **Mattermost team sidebar** (Redux + SCSS) | React Context + Tailwind | Different styling and state architecture |

---

## Leave-Alone List

Items where the current implementation is better or unnecessary to change:

| Area | Reason |
|---|---|
| **Current emoji infrastructure** (categories, recent, skin tones, search, preview) | Already matches Mattermost parity; only needs data expansion |
| **Flat message list** (not virtual after removal) | Virtual list was tried and removed (fixed row-height assumption caused overlap). Current cursor-pagination is correct for variable-height messages. |
| **Module-based API structure** | Superior to Mattermost's flat `routes/` pattern |
| **Same-domain Caddy proxy** | Simpler than Mattermost's subdomain split; avoids cookie issues |
| **Vitest** (not Jest) | Modern, faster, ESM-native; no reason to downgrade |
| **Tailwind v4** (not v3 like Mattermost) | Already on v4; CSS custom properties approach is better |
| **pnpm workspaces** (not npm workspaces like Mattermost) | Faster, disk-efficient |
| **No Redux** (React Context + hooks) | Appropriate for current complexity; Mattermost uses Redux due to scale |
| **Current permission model** (18 granular permissions) | Already more sophisticated than Mattermost's basic role system |
| **Current location input** (no TipTap replacement needed) | TipTap editor already exists alongside textarea; both work |
| **Current search implementation** (file type toggle + operator hints + file ext suggestions) | Already matches Mattermost search UX scope |
| **Socket.io** (not Mattermost's WebSocket) | Sockets work correctly; no reason to change transport layer |
| **Current soft-delete model** | Already handles all entity types (workspaces, channels, messages, members) |
| **Current audit log system** | Already structured with workspace-level queries, filters, pagination |

---

## Best Order of Execution

### Parallelization Key
- 🟢 Independent — can start any time
- 🟡 Depends on prior patch set
- 🔴 Blocked by multiple prior sets

### Phase 1 — Low Risk (~3 days with 2 devs)

```
Week 1, Days 1-2:
  🟢 PS1 — Emoji expansion (Dev A)
  🟢 PS3 — Keyboard shortcut categories (Dev B)
  🟢 PS7 — Sidebar header menu (Dev A, after PS1)
  🟢 PS8 — File preview metadata (Dev B, after PS3)
  ─────────────────────────────────────
  Validate: pnpm build, manual smoke test emoji picker + keyboard modal + sidebar + file preview

Week 1, Day 3:
  🟢 PS4 — DM multi-select modal (Dev A)
  🟢 PS6 — i18n scaffolding (Dev B)
  ─────────────────────────────────────
  Validate: pnpm check, E2E: dm-creation.spec.ts, verify i18n doesn't break existing render
```

### Phase 2 — Medium Risk (~4 days with 2 devs)

```
Week 2, Days 1-2:
  🟡 PS2 — Split message-list.tsx (Dev A, needs PS4 DM to land first for branch hygiene)
  🟡 PS5 — Resizable sidebar (Dev B, can parallel with PS2 if branches are clean)
  ─────────────────────────────────────
  Validate: pnpm build, E2E comprehensive.spec.ts, visual QA on message rendering + sidebar resize

Week 2, Days 3-4:
  🟡 PS10 — Trigger words + auto-responder (Dev A, after PS2)
  🟡 PS9 — Drafts auto-save (Dev B, GATED — only if analytics justify)
  ─────────────────────────────────────
  Validate: pnpm check, E2E trigger-words.spec.ts, manual draft persistence test
```

### Phase 3 — Strategic (1-2 weeks, gated)

```
Week 3-4:
  🟡 PS11 — Onboarding task list + tour (GATED on activation metrics)
  🟡 PS12 — Multi-team sidebar (GATED on multi-workspace adoption)

  ─────────────────────────────────────
  Validate: pnpm check, E2E onboarding.spec.ts, multi-workspace E2E
  Gate decision: Review activation/multi-ws analytics before starting
```

### Dependency Graph (simplified)

```
PS1 (emoji) ─────────────────────────────────────────── 🟢
PS3 (kbd shortcuts) ─────────────────────────────────── 🟢
PS7 (sidebar header) ────────────────────────────────── 🟢
PS8 (file metadata) ─────────────────────────────────── 🟢
PS6 (i18n scaffold) ─────────────────────────────────── 🟢
  │
PS4 (DM modal) ──────────────────────────────────────── 🟢
  │
  ├──→ PS2 (message-list split) ─────────────────────── 🟡 (needs PS4 merged for branch hygiene)
  │       │
  │       └──→ PS10 (trigger words) ─────────────────── 🟡 (needs PS2 for maintainability)
  │
PS5 (resizable sidebar) ─────────────────────────────── 🟡 (parallel with PS2)
  │
PS9 (drafts) [GATED] ────────────────────────────────── 🟡 (after PS2)
PS11 (onboarding) [GATED] ───────────────────────────── 🟡 (after PS6 i18n)
PS12 (multi-team) [GATED] ───────────────────────────── 🟡 (after PS5 resizable)
```

### Cumulative Timeline

| Phase | Patch Sets | Effort | Devs | Calendar Time |
|---|---|---|---|---|
| Phase 1 | PS1, PS3, PS7, PS8, PS4, PS6 | 6.5 days | 2 | ~3 days |
| Phase 2 | PS2, PS5, PS10, (PS9 gated) | 8 days | 2 | ~4 days |
| Phase 3 | PS11, PS12 (gated/strategic) | 9 days | 2 | ~1 week |
| **Total** | **12 patch sets** | **~23.5 days** | **2** | **~2.5 weeks** |
