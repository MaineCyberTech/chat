# Phase 5 — Safe Phased Alignment Roadmap (Mattermost Reference)

**Reference**: Mattermost (Go backend, React/Redux frontend, PostgreSQL, 15,031 files)
**Current**: Chat (Express/TypeScript API, Next.js 15, Supabase PostgreSQL, BullMQ worker, 48 migrations)
**Date**: July 6, 2026

---

## 0. Executive Summary

This roadmap converts the Mattermost comparative audit findings into a staged engineering plan with clear gates, rollback procedures, and risk assessments at each phase.

**Current state**: All 12 quick wins from the initial Mattermost comparison are already implemented (channel drag-and-drop, unread indicators, channel type icons, status pills, action bar polish, floating timestamps, editing highlights, iOS zoom fix, body scroll prevention, desktop sounds, per-channel notifications, channel filter toggle). The frontend UX release gate is at 90.3% readiness (0 P0, 0 P1, 0 P2, 9 P3). All 20 P0 and 39 P1 hardening findings are resolved.

**Remaining gap areas**:
- Message list monolith (1117 lines) needs decomposition
- 48 up-only migrations vs Mattermost's 200 up+down pairs
- No i18n (Mattermost has 60+ languages)
- 8 keyboard shortcuts vs Mattermost's 35+
- Store layer is thin (no contract tests, no store interfaces)
- Component decomposition gap (273 Mattermost component dirs vs current monoliths)
- Emoji picker needs 3000+ emojis, category tabs, skin tones, colon autocomplete
- Search lacks type toggle, operator hints
- File preview lacks multi-file nav, zoom, metadata
- Medium-effort items: category management, channel context menu, sidebar header, resizable sidebar
- High-effort items: WYSIWYG editor, drafts, onboarding, multi-team sidebar

**Goal**: Selective adoption of Mattermost patterns that are beneficial, while preserving Chat's superior architecture (BFF pattern, design tokens, Zod validation, optimistic UI, idempotency, circuit breaker, Redis adapter, Socket.io).

---

## 1. Phase 0: Observation Only / No Changes

These areas need further study before any action. Document current behavior, gather metrics, and make an informed decision later.

| Area | What to Observe | Success Criteria for Decision | Max Study Duration |
|---|---|---|---|
| **TipTap WYSIWYG editor** | Mattermost spent 30+ files / 3000+ lines on this. Measure how many users actually use rich text vs plain markdown. If <30% use formatting toolbar, don't invest. | User analytics on formatting toolbar usage | 2 weeks post-launch |
| **Drafts auto-save** | Mattermost has 20+ files for drafts. Measure message abandonment rate (user types >50 chars but doesn't send). If <5%, skip. | Message abandonment analytics | 2 weeks post-launch |
| **Multi-team sidebar** | Chat has single-workspace model. Mattermost's 65px team rail is for multi-instance. No decision until multi-workspace support is requested. | User feedback / feature requests | Indefinite |
| **User groups CRUD** | Mattermost has 6 modals for this. Chat has no groups concept. Observe if users manually @-mention groups of 3+ people frequently. | @mention patterns in message data | 1 month post-launch |
| **Send scheduling** | Mattermost allows scheduling messages for later. Low priority — observe if users express this need. | Feature requests | Indefinite |
| **Onboarding tour** | Mattermost has 15+ files for onboarding tours. Track new-user retention (signup → first message within 24h). If >60%, skip. | New-user activation metrics | 2 weeks post-launch |
| **AI rewrite actions** | Mattermost has `use_rewrite.tsx` + AI menu. Not applicable until Chat has AI integration. | — | Indefinite |

**Gate**: No code changes. All existing tests continue to pass unchanged.

---

## 2. Phase 1: No-Risk or Near-No-Risk Wins

Changes that are safe, clearly beneficial, and cannot break anything. Each item can be done independently.

### 2.1 Add down migrations for all 48 existing migrations

| Field | Detail |
|---|---|
| **What** | Create `supabase/rollback/` directory with `_down.sql` files for all 48 migrations. Each file reverses its corresponding up migration. |
| **Why it matters** | Enables safe rollback without manual SQL reconstruction. Mattermost has 200 migration pairs — this is the single biggest operational gap. |
| **Reference pattern** | Mattermost `migrations/` with `up_` and `down_` pairs |
| **What to preserve** | All existing `supabase/migrations/` files unchanged |
| **Prerequisites** | None |
| **Test requirements** | Run each down migration against a local Supabase instance, verify schema reverts, run up migration again |
| **Rollback** | Delete `supabase/rollback/` directory |
| **Adoption style** | Adapt — write manually, don't generate from Mattermost patterns |
| **Effort** | ~3-4 hours (48 files, ~5 min each) |

### 2.2 Decompose message-list.tsx monolith (1117 lines)

| Field | Detail |
|---|---|
| **What** | Split message-list.tsx into focused sub-components: `MessageItem.tsx`, `MessageActions.tsx`, `MessageReactions.tsx`, `MessageTimestamp.tsx`, `MessageEditor.tsx`, `MessageListContainer.tsx`, `JumpToPresent.tsx` |
| **Why it matters** | Mattermost distributes equivalent code across 20+ component directories. Decomposition improves maintainability, enables independent testing, and reduces merge conflicts. |
| **Reference pattern** | Mattermost `components/post_view/` with 30+ focused components |
| **What to preserve** | All existing behavior, event handlers, keyboard shortcuts, and rendering logic. Pure extraction — no logic changes. |
| **Prerequisites** | None |
| **Test requirements** | Visual smoke test of every message state (own message, others' message, thread reply, editing, deleted, with reactions, with file attachments). E2E test for send → edit → delete flow. |
| **Rollback** | Restore original message-list.tsx from git |
| **Adoption style** | Adapt — extract existing code, don't rewrite from Mattermost patterns |
| **Effort** | ~1 day |

### 2.3 Add i18n infrastructure

| Field | Detail |
|---|---|
| **What** | Install `next-intl` (or `react-i18next`), create `messages/en.json` with all user-facing strings extracted from the app, set up locale routing for `(workspace)` and `(auth)` route groups |
| **Why it matters** | Mattermost supports 60+ languages. i18n is a prerequisite for non-English users and accessibility compliance. Starting early prevents costly string-hunting later. |
| **Reference pattern** | Mattermost `i18n/` with 60+ JSON translation files |
| **What to preserve** | All current English strings verbatim as the source of truth |
| **Prerequisites** | None |
| **Test requirements** | All pages render correctly with `en` locale. No visible `message.id` fallback strings. Typecheck passes. |
| **Rollback** | Revert package.json changes, delete i18n config |
| **Adoption style** | Adapt — use modern tooling (next-intl), not Mattermost's custom i18n system |
| **Effort** | ~2 days for infrastructure, ~3-4 days for string extraction |

### 2.4 Add Ctrl+K quick switcher

| Field | Detail |
|---|---|
| **What** | Implement command palette (Ctrl+K / Cmd+K) that searches channels, workspaces, and recent messages. Modal overlay with keyboard-navigable results. |
| **Why it matters** | Mattermost's Ctrl+K is the most-used keyboard shortcut. Current Chat has no equivalent — users must click through sidebar to navigate. |
| **Reference pattern** | Mattermost `components/quick_switch/` modal |
| **What to preserve** | Existing channel list sidebar navigation |
| **Prerequisites** | Keyboard shortcuts system (already exists in `keyboard-shortcuts.tsx`) |
| **Test requirements** | E2E: press Ctrl+K → type channel name → select → navigates to channel. Keyboard navigation (arrow keys, Enter, Escape) works. |
| **Rollback** | Remove component, remove shortcut registration |
| **Adoption style** | Adapt — implement as a Next.js client component, not Mattermost's Redux-connected approach |
| **Effort** | ~1 day |

### 2.5 Add emoji picker improvements

| Field | Detail |
|---|---|
| **What** | Expand emoji picker from current minimal set to 3000+ emojis, add category tabs (11 categories: Smileys, People, Animals, Food, Travel, Activities, Objects, Symbols, Flags, Recent, Search), add skin tone selector (5 tones), add hover preview with emoji name |
| **Why it matters** | Mattermost ships 3301 system emojis with full picker UX. Current emoji picker covers basic use but lacks discovery and customization. |
| **Reference pattern** | Mattermost `emoji_picker_tabs.tsx`, `emoji_picker_skin.tsx`, `emoji_picker_preview.tsx`, `emoji.json` (3301 emojis) |
| **What to preserve** | Existing emoji data file and rendering logic. Add to it, don't replace. |
| **Prerequisites** | None |
| **Test requirements** | Emoji renders on message, reactions show in picker, skin tones persist per session |
| **Rollback** | Revert emoji component changes |
| **Adoption style** | Adapt — use standard emoji dataset (not Mattermost's proprietary set) |
| **Effort** | ~1 day for 3000+ set + tabs, ~4h for skin tones + preview |

### 2.6 Add keyboard shortcut modal

| Field | Detail |
|---|---|
| **What** | Create a searchable keyboard shortcut reference modal (triggered by `?` or Ctrl+/). Document all 8+ current shortcuts + new ones from this phase. |
| **Why it matters** | Mattermost has 35+ documented shortcuts with a dedicated modal. Current Chat has no discoverability mechanism. |
| **Reference pattern** | Mattermost `keyboard_shortcuts_modal.tsx` with categorized shortcut list |
| **What to preserve** | Existing keyboard-shortcuts.tsx registry and handler pattern |
| **Prerequisites** | Phase 1.4 (Ctrl+K) — the modal should include it |
| **Test requirements** | All listed shortcuts actually work. Modal opens/closes correctly. Search filters shortcuts. |
| **Rollback** | Remove component |
| **Adoption style** | Adapt — build from current shortcut registry, don't port Mattermost's 35+ irrelevant shortcuts |
| **Effort** | ~4 hours |

### 2.7 Add colon autocomplete for emoji

| Field | Detail |
|---|---|
| **What** | When user types `:` in the message input, show an emoji autocomplete popup. Filter by typed characters. Select with Enter or click. Insert `:emoji_name:` into the input. |
| **Why it matters** | Mattermost's `:` autocomplete is the primary emoji entry method for power users. |
| **Reference pattern** | Mattermost `use_editor_emoji_picker.tsx` |
| **What to preserve** | Existing emoji picker button in the formatting toolbar |
| **Prerequisites** | Phase 1.5 (3000+ emoji dataset) |
| **Test requirements** | `:` triggers popup, typing filters, Enter inserts correct emoji, Escape closes, `::` doesn't trigger |
| **Rollback** | Remove autocomplete handler from message input |
| **Adoption style** | Adapt — implement as a simple dropdown, not Mattermost's complex editor integration |
| **Effort** | ~4 hours |

**Phase 1 Gate**:
- All existing tests pass (54 unit + E2E)
- All new down migrations validated against local Supabase
- MessageList decomposition: all states render identically in visual smoke test
- i18n: all pages render with `en` locale, no raw key fallout
- Ctrl+K: E2E passes for navigation
- Emoji picker: all categories render, emojis insert correctly
- Shortcut modal: all listed shortcuts functional
- `pnpm typecheck` passes, `pnpm lint` passes

---

## 3. Phase 2: Low-Risk Alignment Work

Small risk, clear benefit. Each item builds on Phase 1 foundations.

### 3.1 Search improvements (type toggle, operator hints, file extension suggestions)

| Field | Detail |
|---|---|
| **What** | Add Messages/Files toggle to search results. Show operator hints (`from:`, `in:`, `after:`, `before:`) when typing in search. Suggest file extensions when toggled to Files mode. |
| **Why it matters** | Mattermost's search has 3 specialized components for this. Current search is basic text-only. |
| **Reference pattern** | Mattermost `search_box_type_selector.tsx`, `search_box_hints.tsx`, `extension_suggestions_provider.tsx` |
| **What to preserve** | Existing search API, RPC, and result rendering. All additive. |
| **Prerequisites** | None |
| **Test requirements** | Toggle between Messages/Files shows correct results. Operator hints appear. Extension suggestions filter correctly. |
| **Rollback** | Revert search-bar.tsx changes |
| **Adoption style** | Adapt — simpler implementation than Mattermost's Redux-connected approach |
| **Effort** | ~1.5 days |

### 3.2 File preview improvements (multi-file nav, zoom, metadata panel)

| Field | Detail |
|---|---|
| **What** | When viewing a file attachment, add prev/next navigation for multi-file messages. Add zoom in/out/100%/fit-to-window controls with pan-and-drag. Show metadata panel (filename, file size, uploader name, upload date). |
| **Why it matters** | Mattermost has 3 dedicated file preview components. Current file preview opens in a basic overlay with no navigation or zoom. |
| **Reference pattern** | Mattermost `file_preview_modal_main_nav/`, `image_preview.tsx`, `file_preview_modal_info/` |
| **What to preserve** | Existing file-preview.tsx component structure and overlay pattern |
| **Prerequisites** | None |
| **Test requirements** | Multi-file messages show prev/next. Zoom controls work. Metadata panel shows correct data. Touch-drag pans zoomed image. |
| **Rollback** | Revert file-preview.tsx |
| **Adoption style** | Adapt — use simpler zoom/pan than Mattermost's custom implementation |
| **Effort** | ~2 days |

### 3.3 Channel context menu (right-click)

| Field | Detail |
|---|---|
| **What** | Right-click on any channel in the sidebar shows a context menu with: Favorite, Mute, Mark as Read, Copy Link, Move to Category, Leave Channel, Delete Channel (if admin). |
| **Why it matters** | Mattermost's `sidebar_channel_menu/` is the primary channel interaction surface. Current Chat has channel actions scattered across the header and hover icons. |
| **Reference pattern** | Mattermost `sidebar_channel_menu/` (favorite, mute, move, copy, leave, delete) |
| **What to preserve** | Existing channel-list.tsx rendering and channel actions. Right-click menu should call same handlers. |
| **Prerequisites** | None |
| **Test requirements** | Right-click on public, private, DM, and GM channels shows correct menu. Each action works. Touch long-press (already implemented at 500ms) shows same menu. |
| **Rollback** | Remove context menu handler from channel-list.tsx |
| **Adoption style** | Adapt — use existing context-menu infrastructure (already implemented for messages) |
| **Effort** | ~1 day |

### 3.4 Sidebar category management

| Field | Detail |
|---|---|
| **What** | Allow users to create, rename, reorder, and delete sidebar categories. Drag channels between categories. Default categories: Channels, Direct Messages, Favorites. Preserve via sidebar_categories + sidebar_channel_assignments tables (already exist from July 4 migration). |
| **Why it matters** | Mattermost's `sidebar_category/` (466 lines, draggable) is the primary sidebar organization mechanism. Current Chat has categories but no management UI. |
| **Reference pattern** | Mattermost `sidebar_category/` with drag-and-drop create/rename/delete/reorder |
| **What to preserve** | Existing category seed data and database schema. All additive. |
| **Prerequisites** | Database tables already exist (migration `20260704000001_add_dm_presence_categories.sql`) |
| **Test requirements** | Create category → appears in sidebar. Rename → updates. Reorder (drag) → persists. Delete → channels move to default. Delete non-empty → confirmation. |
| **Rollback** | Revert sidebar components to pre-category-management state |
| **Adoption style** | Adapt — use existing HTML5 DnD (already proven in channel-list.tsx, line 91-131) |
| **Effort** | ~2 days |

### 3.5 Global notification settings page

| Field | Detail |
|---|---|
| **What** | Create a Settings page with Notifications tab (currently exists as skeleton). Add: default notification preference (All messages / Only mentions / Nothing), push notification toggle, email notification toggle, desktop notification sound selector (9 sounds from Mattermost), quiet hours (start/end time), trigger words (list-based). |
| **Why it matters** | Mattermost's `user_settings_notifications.tsx` (1300 lines) is the most-used settings page. Current notification settings are per-channel only — no global defaults. |
| **Reference pattern** | Mattermost `user_settings_notifications.tsx` |
| **What to preserve** | Existing per-channel notification preferences (channel_notification_preferences table, notification-preferences-modal.tsx). Global settings should act as defaults, overridden by per-channel. |
| **Prerequisites** | Desktop sound notification system (already implemented in notification-sound.ts) |
| **Test requirements** | Global default applies to new channels. Per-channel override beats global. Push toggle actually stops/delivers push notifications. Sound selector plays correct sound on preview. Quiet hours suppress notifications. Trigger words trigger notification for non-mention messages. |
| **Rollback** | Revert settings/page.tsx |
| **Adoption style** | Adapt — simpler settings form than Mattermost's complex multi-tab system |
| **Effort** | ~2 days |

### 3.6 Search file extension suggestions

| Field | Detail |
|---|---|
| **What** | When search is in Files mode and user types `.`, suggest common file extensions (`.pdf`, `.docx`, `.xlsx`, `.png`, `.jpg`, `.svg`, `.zip`, `.txt`). Filter by typed characters. |
| **Why it matters** | Mattermost has `extension_suggestions_provider.tsx`. This is a power-user feature for finding files by type. |
| **Reference pattern** | Mattermost `extension_suggestions_provider.tsx` |
| **What to preserve** | Existing search filter architecture |
| **Prerequisites** | Phase 2.1 (search type toggle) |
| **Test requirements** | `.` in Files mode shows extension list. Typing `.p` filters to `.pdf`, `.png`. Selection inserts extension. |
| **Rollback** | Revert search-bar.tsx suggestion logic |
| **Adoption style** | Copy — this is a self-contained data provider |
| **Effort** | ~2 hours |

**Phase 2 Gate**:
- Phase 1 complete
- Search improvements: Messages/Files toggle returns correct results
- File preview: multi-file nav works, zoom controls functional
- Channel context menu: right-click on each channel type shows correct options
- Category management: create/rename/reorder/delete all persist to DB
- Notification settings: global defaults respected, per-channel overrides work
- All E2E tests pass
- Manual smoke test: full workspace → channel → message → file → search flow

---

## 4. Phase 3: Medium-Risk Internal Convergence

Structural changes with higher risk but proportionally higher value. These require careful testing and staged rollout.

### 4.1 Store abstraction layer

| Field | Detail |
|---|---|
| **What** | Define interface contracts for data access (IMessageStore, IChannelStore, IWorkspaceStore, IUserStore). Implement Supabase-backed stores. Migrate service layer to depend on interfaces, not direct Supabase client calls. Add contract tests per interface. |
| **Why it matters** | Mattermost has 40+ store interfaces with contract tests and code-generated layers. Current Chat mixes DB access throughout service layer with no abstraction, making testing and swapping implementations difficult. |
| **Reference pattern** | Mattermost `store/` interfaces, `testlib/` contract tests, code generation |
| **What to preserve** | Existing service layer behavior. All logic stays the same — only data access is abstracted. |
| **Prerequisites** | Phase 1.2 (MessageList decomposition) — less code churn if monolith is already split |
| **Test requirements** | Contract tests for each store interface pass against real Supabase. All existing service tests pass unchanged. 100% API route behavior preserved. |
| **Rollback** | Revert to direct Supabase calls (keep store files, stop using them) |
| **Adoption style** | Adapt — define Chat-specific interfaces, don't copy Mattermost's 40+ interfaces. Start with 4 interfaces (messages, channels, workspaces, users). |
| **Effort** | ~3 days |

### 4.2 Sidebar header with team/workspace menu

| Field | Detail |
|---|---|
| **What** | Add a sidebar header area showing current workspace name with dropdown menu: Browse Channels, Create Channel, Invite People, Workspace Settings, Switch Workspace. |
| **Why it matters** | Mattermost's `sidebar_header/` is the primary navigation hub. Current Chat has no workspace-level actions in the sidebar — users must click the workspace name in the top-left to access settings. |
| **Reference pattern** | Mattermost `sidebar_header/` (team switch, browse channels, create, invite) |
| **What to preserve** | Existing workspace-switching logic in app-header.tsx |
| **Prerequisites** | None |
| **Test requirements** | Sidebar header shows correct workspace name. Dropdown actions work. Browse channels opens channel browser. Invite opens invite dialog. Switch workspace navigates correctly. |
| **Rollback** | Revert sidebar header changes |
| **Adoption style** | Adapt — simpler dropdown than Mattermost's full header component suite |
| **Effort** | ~1.5 days |

### 4.3 Resizable sidebar

| Field | Detail |
|---|---|
| **What** | Add a drag handle on the right edge of the sidebar. Allow resizing from 200px to 400px. Persist width preference in localStorage or user_preferences table. Clamp content to min/max. |
| **Why it matters** | Mattermost's `resizable_sidebar/` lets users control their workspace layout. Fixed-width sidebar forces long channel names to truncate. |
| **Reference pattern** | Mattermost `resizable_sidebar/` |
| **What to preserve** | Default sidebar width (280px), sidebar layout at all breakpoints |
| **Prerequisites** | None |
| **Test requirements** | Drag handle appears on hover. Dragging resizes sidebar smoothly. Width persists across page reloads. Responsive breakpoints still work. |
| **Rollback** | Remove drag handle, reset to fixed width |
| **Adoption style** | Adapt — simpler implementation than Mattermost's 5-file module |
| **Effort** | ~1 day |

### 4.4 DM creation modal with multi-select

| Field | Detail |
|---|---|
| **What** | Replace current basic DM creation with a modal showing user search + multi-select. Support group DM creation (3+ users). Show user presence status and display name. Create GM channel on submit. |
| **Why it matters** | Mattermost's `more_direct_channels/` (5 files) supports multi-select DM/GM creation. Current DM creation is single-select only. |
| **Reference pattern** | Mattermost `more_direct_channels/` |
| **What to preserve** | Existing DM channel creation API and dm_channels table |
| **Prerequisites** | User presence system (already implemented in socket.ts) |
| **Test requirements** | Search filters users by name. Multi-select adds users to list. Group DM (3+ users) creates GM channel. Channel appears in sidebar under Direct Messages. Existing DM with same set redirects to existing channel. |
| **Rollback** | Revert DM creation modal |
| **Adoption style** | Adapt — use existing user search API (already exists in auth/routes.ts) |
| **Effort** | ~1 day |

**Phase 3 Gate**:
- Phases 1-2 complete
- Store abstraction: contract tests pass, all service tests pass, no behavior change
- Sidebar header: all dropdown actions work end-to-end
- Resizable sidebar: drag works, width persists, breakpoints intact
- DM creation: single DM and group DM both work correctly
- Full regression suite passes (unit + E2E + integration)
- Performance benchmarks show no regression
- Rollback plan documented for each item

---

## 5. Phase 4: Optional Strategic Improvements

Higher-risk but high-value. Each item should be independently evaluated for go/no-go before starting.

### 5.1 TipTap WYSIWYG editor (conditional on Phase 0 analytics)

| Field | Detail |
|---|---|
| **What** | Replace message textarea with TipTap-based rich text editor. Support: bold, italic, strikethrough, code, headings, block quotes, lists, tables, @mentions, :emoji: autocomplete, slash commands, markdown shortcuts (Ctrl+B, Ctrl+I, etc.). |
| **Why it matters** | Mattermost has 30+ files / 3000+ lines for the Advanced Text Editor. This is the single biggest gap in Chat's feature completeness vs Mattermost. |
| **Reference pattern** | Mattermost `advanced_text_editor/` (30+ files) |
| **What to preserve** | Existing markdown rendering pipeline (code-block.tsx, formatting-bar.tsx, message-input.tsx handlers for paste/upload). Editor output must produce same markdown as current textarea. |
| **Prerequisites** | Phase 0 analytics showing >30% formatting toolbar usage. Phase 1.7 (colon autocomplete) already done. |
| **Test requirements** | Every formatting option produces correct markdown. All existing keyboard shortcuts still work. Paste from Word/Google Docs converts to markdown. @mention picker works. Emoji autocomplete works. Slash commands work. Mobile keyboard handling preserved. |
| **Rollback** | Revert to textarea component |
| **Adoption style** | Adapt — use @tiptap/react with extensions, not Mattermost's custom editor |
| **Effort** | ~2 weeks |

### 5.2 Drafts auto-save (conditional on Phase 0 analytics)

| Field | Detail |
|---|---|
| **What** | Auto-save message drafts to IndexedDB (or Supabase) when user types >50 chars and pauses >2 seconds. Show draft indicator in sidebar for channels with unsaved drafts. Restore draft on channel navigation. "Drafts" page showing all saved drafts. Scheduled posts (later today, tomorrow, custom time). |
| **Why it matters** | Mattermost's `drafts/` (20+ files) is a major productivity feature. Prevents message loss, enables scheduled communication. |
| **Reference pattern** | Mattermost `drafts/` (20+ files) |
| **What to preserve** | Existing message sending flow. Drafts must not interfere with normal send. |
| **Prerequisites** | Phase 0 analytics showing >5% message abandonment rate |
| **Test requirements** | Draft auto-saves after 2s pause. Draft restores on channel re-entry. Draft indicator shows correct channel. Drafts page lists all drafts. Scheduled message sends at correct time. |
| **Rollback** | Disable draft auto-save, remove draft indicators |
| **Adoption style** | Adapt — use localStorage/IndexedDB, not Mattermost's server-backed approach |
| **Effort** | ~1 week |

### 5.3 Full i18n expansion (60+ languages)

| Field | Detail |
|---|---|
| **What** | After Phase 1.3 infrastructure is in place, engage community or translation service to produce translations for target languages. Priority: Spanish, French, German, Japanese, Korean, Portuguese, Chinese (Simplified), Russian, Arabic, Hindi. |
| **Why it matters** | Mattermost ships 60+ languages. i18n is a hard gate for enterprise adoption outside English-speaking markets. |
| **Reference pattern** | Mattermost `i18n/` |
| **What to preserve** | English as source of truth. All translation files are additive. |
| **Prerequisites** | Phase 1.3 (i18n infrastructure + string extraction) |
| **Test requirements** | Each language renders without visible key names. RTL languages (Arabic) flow correctly. Date/number formatting follows locale. |
| **Rollback** | Remove translation files, default to English |
| **Adoption style** | Adapt — use standard next-intl locale pattern, not Mattermost's custom system |
| **Effort** | ~1-2 days per language (automated translation) + ~1 week per language (professional review) |

**Phase 4 Gate**:
- Phases 0-3 complete
- Phase 0 analytics support the investment (formatting usage >30%, abandonment >5%)
- TipTap: all existing markdown features work identically before/after
- Drafts: E2E test for auto-save → restore → send flow
- i18n: target languages render correctly, no key fallout
- Performance: editor initialization does not block message input
- Full regression suite passes

---

## 6. Phase 5: Future-State Cleanup

Long-term items to revisit after the product matures and user patterns are better understood.

| Item | Why Deferred | Trigger to Revisit |
|---|---|---|
| **Plugin ecosystem** | Premature — Chat has no third-party developer community yet. Mattermost's plugin system exists because of enterprise marketplace requirements. | Third-party developer requests or 10,000+ MAU |
| **Multi-team sidebar (65px rail)** | Single-workspace model doesn't need it. Chat has no multi-workspace navigation pattern. | User requests for multi-workspace support or enterprise deployment with >5 workspaces |
| **User groups CRUD** | No groups concept in current product. Would require new DB schema, 6+ modals, RLS policies. | Users regularly @-mention groups of 4+ people in messages |
| **Onboarding tour (15+ files)** | Current onboarding is minimal but functional. Custom tour system is high-effort for unknown retention gain. | New-user 24h activation rate <40% |
| **AI rewrite / generation** | No AI integration exists yet. Would require LLM API integration, new settings, usage tracking. | AI feature roadmap is defined |
| **DM multi-team** | Chat has global user search, not per-workspace user directories. | Cross-workspace messaging requirement |
| **Advanced file preview** | Phase 2.2 covers basic zoom/nav/metadata. True advanced features (annotations, PDF text selection, video frame capture) require significant investment. | User feedback requesting specific advanced features |
| **Calendar integration / availability** | Chat has no calendar system. Would require new DB schema and Calendar API integration. | Integration with external calendar systems (Google, Outlook) |
| **Compliance exports** | Mattermost has compliance export (email archives, audit logs). Chat has audit logs but no export pipeline. | Enterprise deployment with compliance requirements (SOC2, HIPAA) |
| **LDAP/SAML/SSO** | Magic link auth works for current scale. Enterprise SSO requires Supabase Auth enterprise plan. | Enterprise deployment with corporate identity provider requirements |

---

## 7. What Must Stay As-Is

These are areas where Chat is objectively better than Mattermost. Never change these to match Mattermost patterns.

| Chat Implementation | Why It's Better | Mattermost Equivalent |
|---|---|---|
| **BFF pattern (server-side auth tokens)** | Tokens never exposed to browser JS — critical for XSS mitigation | Tokens exposed to browser in Redux store |
| **Design tokens (CSS custom properties)** | Enables systematic theming, dark mode, accessibility compliance | Hardcoded SCSS variables, theme changes require recompilation |
| **Zod validation** | Runtime type checking + TypeScript types from single source | Go structs + TypeScript types — two sources of truth, drift possible |
| **Optimistic UI (useOptimistic hook)** | Instant UI updates, no waiting for server round-trip | Redux dispatch → API call → reducer — slower UX |
| **Idempotency keys** | Prevents duplicate message sends on retry — critical for real-time | No built-in idempotency — duplicate sends possible |
| **Circuit breaker pattern** | Prevents cascading failures on external service degradation | No circuit breaker — external failures propagate |
| **Redis adapter for Socket.io** | Enables horizontal scaling of real-time connections | No Socket.io — uses raw WebSocket without pub/sub |
| **Socket.io (rooms, typing, presence)** | Full real-time feature set with room management | Raw WebSocket — every feature built from scratch |
| **Same-domain Caddy routing** | No CORS issues, single TLS certificate, simpler cookie management | Subdomain split (app.mattermost.com vs api.mattermost.com) |
| **Feature-based module organization** | Co-located routes, services, tests — easier to navigate | Flat routes/ directory — 293+ files in one list |
| **Vitest** | Faster, native ESM, less configuration | Jest — slower, requires more configuration |
| **Docker HEALTHCHECK** | Orchestration-aware, auto-restart on failure | No HEALTHCHECK — orchestrator sees "running" when app is hung |
| **Graceful shutdown (SIGTERM drain)** | Zero-downtime deploys, in-flight requests complete | No graceful shutdown — connections dropped on restart |
| **Consolidated CI (workflow_call)** | Less boilerplate, DRY workflow configuration | 19 independent workflows with duplicated logic |
| **Shared UI component library** | Design system consistency across all surfaces | Duplicated UI patterns across webapp/, channels/, etc. |
| **tailwindcss v4** | Modern, faster build times, CSS-first configuration | tailwindcss v3 — older, slower |
| **pnpm workspace** | Disk-efficient, fast installs, strict dependency isolation | npm workspaces — slower, less strict |
| **Next.js App Router** | React Server Components, streaming, nested layouts | Pages Router — older pattern, no RSC support |
| **Message search with workspace membership check (SECURITY INVOKER)** | Cross-tenant leak prevented by design | Potential cross-team data exposure in shared search index |
| **DOMPurify markdown preview sanitization** | Prevents XSS in rendered markdown | Relies on backend output sanitization only |

---

## 8. Recommended Execution Order

```
Phase 1: No-Risk Wins (~8-10 days total)
  ├── 1.1 Down migrations (48 files)               [3-4h]  — operational safety
  ├── 1.2 Decompose message-list.tsx               [1d]    — maintainability
  ├── 1.3 i18n infrastructure + string extraction  [5-6d]  — internationalization
  ├── 1.4 Ctrl+K quick switcher                    [1d]    — power user productivity
  ├── 1.5 Emoji picker (3000+, tabs, skin tones)   [1.5d]  — feature completeness
  ├── 1.6 Keyboard shortcut modal                  [4h]    — discoverability
  └── 1.7 Colon autocomplete                       [4h]    — emoji power user flow
  │
  Gate: all tests pass, visual smoke tests, typecheck, lint

Phase 2: Low-Risk Alignment (~10-12 days total)
  ├── 2.1 Search improvements (toggle + hints)     [1.5d]  — search UX
  ├── 2.2 File preview (multi-nav, zoom, metadata) [2d]    — file UX
  ├── 2.3 Channel context menu (right-click)       [1d]    — navigation UX
  ├── 2.4 Sidebar category management              [2d]    — organization UX
  ├── 2.5 Global notification settings             [2d]    — user control
  └── 2.6 File extension suggestions               [2h]    — search power user
  │
  Gate: Phase 1 complete, E2E suite, manual smoke test

Phase 3: Medium-Risk Convergence (~7 days total)
  ├── 3.1 Store abstraction (4 interfaces)         [3d]    — architecture
  ├── 3.2 Sidebar header workspace menu            [1.5d]  — navigation
  ├── 3.3 Resizable sidebar                        [1d]    — layout control
  └── 3.4 DM multi-select creation modal           [1.5d]  — messaging UX
  │
  Gate: Phases 1-2 complete, contract tests, full regression, rollback docs

Phase 4: Strategic Improvements (~3-4 weeks total, independent items)
  ├── 4.1 TipTap WYSIWYG editor                    [~2w]   — conditional on analytics
  ├── 4.2 Drafts auto-save + scheduled posts       [~1w]   — conditional on analytics
  └── 4.3 Full i18n expansion                      [var.]  — conditional on demand
  │
  Gate: Phase 0 analytics support, Phases 1-3 complete
```

**Estimated total**: Phases 1-3: ~25-29 engineering days. Phase 4: 3-4 weeks (conditional).

---

## 9. Minimum Validation Gate Before Each Phase

| Gate | Checks Required | Failure Response |
|---|---|---|
| **Before Phase 1** | `pnpm test` (54+ tests pass), `pnpm typecheck` (0 errors), `pnpm lint` (0 warnings on changed files), `pnpm dev` starts without errors, `supabase start` loads all migrations | Block all Phase 1 changes until resolved |
| **Before Phase 2** | Phase 1 complete and validated. All down migrations verified against local Supabase. MessageList decomposition passes visual smoke test. i18n renders all pages in English without key fallout. Ctrl+K E2E passes. Emoji picker renders all categories. | Fix Phase 1 regressions before proceeding |
| **Before Phase 3** | Phases 1-2 complete and validated. Search toggle/hints pass E2E. File preview multi-nav and zoom functional. Channel context menu works on all channel types. Category CRUD persists to database. Notification settings apply correctly. E2E regression suite passes at 100%. | Deploy Phase 2 fixes or revert if regressions found |
| **Before Phase 4** | Phases 0-3 complete. Phase 0 analytics collected and evaluated. Store abstraction contract tests pass. Sidebar header dropdown functional. Resizable sidebar drag persists. DM multi-select creates correct channels. Full regression suite passes. Performance benchmarks stable. Rollback plan documented for each Phase 4 item. | Phase 4 items are optional — defer any that fail gates |

---

## 10. Do-Not-Break Guardrails

| # | Guardrail | Rationale | Enforcement |
|---|---|---|---|
| 1 | **Never change Socket.io event names or signatures** | Every event is a contract consumed by the frontend. Renaming or removing events will break real-time messaging silently. | Additive events only. Use `git grep` on event names before any change. |
| 2 | **Never change message sending flow** | Message persistence is the core data integrity path. Changes risk message loss, duplicates, or ordering corruption. | Comprehensive E2E test must pass before and after any message flow change. |
| 3 | **Never expose auth tokens to the browser** | The BFF pattern (server-side tokens) is Chat's best security feature. Breaking this for Mattermost-style browser tokens would be a regression. | Review any change that touches authenticate.ts or supabase client initialization. |
| 4 | **Never replace Vitest with Jest** | Vitest is faster, ESM-native, and requires less configuration. There is zero benefit to matching Mattermost's Jest usage. | Block any PR that adds Jest dependency or replaces Vitest config. |
| 5 | **Never replace Socket.io with raw WebSocket** | Socket.io provides rooms, typing indicators, presence, automatic reconnection, and Redis adapter. Rewriting these from scratch is wasted effort. | Block any PR that removes socket.io dependency. |
| 6 | **Never flatten modules/ into routes/** | Feature-based module organization is superior to Mattermost's flat 293-file routes/ directory. Co-located tests and services are easier to maintain. | Block any PR that restructures modules/ directory. |
| 7 | **Never remove Docker HEALTHCHECK** | HEALTHCHECK enables auto-recovery on failure. Mattermost lacks this. Removing it would reduce operational reliability. | Block any PR that removes HEALTHCHECK from Dockerfile or compose files. |
| 8 | **Never remove graceful shutdown handlers** | 10-second SIGTERM drain prevents dropped connections during deploys. Mattermost lacks this. | Block any PR that removes SIGTERM/SIGINT handlers from server.ts. |
| 9 | **Never downgrade from tailwindcss v4 to v3** | v4 has faster build times and CSS-first configuration. Matching Mattermost's v3 would be a regression. | Block any PR that changes tailwindcss dependency version to <4. |
| 10 | **Database migrations must be additive-only** | Never DROP, ALTER COLUMN, or RENAME after a migration has been applied to any environment. Use new columns + backfill instead. | Migration review checklist before any DB change. |
| 11 | **Never remove idempotency keys** | They prevent duplicate message sends on network retry — critical for real-time chat reliability. | Block any PR that removes idempotency key check from message creation. |
| 12 | **Never remove DOMPurify from markdown preview** | XSS prevention in rendered markdown is non-negotiable. | Block any PR that removes or bypasses DOMPurify sanitization. |

---

## 11. Risk Register

| Risk ID | Description | Phase | Likelihood | Impact | Mitigation |
|---|---|---|---|---|---|---|
| R-001 | Down migration contains incorrect SQL that drops the wrong table/index | 1 | Low | Critical | Review each down migration against the corresponding up migration. Test against local Supabase. Never run in production. |
| R-002 | MessageList decomposition introduces a rendering regression (missing props, wrong event handler) | 1 | Medium | High | Visual smoke test covering all message states. Compare rendered DOM structure before/after. E2E for send → edit → delete. |
| R-003 | i18n string extraction misses a user-facing string, leaving raw key visible | 1 | Medium | Medium | E2E test that visits every page and checks for `message.`-prefixed visible text. |
| R-004 | Ctrl+K search returns stale data or doesn't navigate correctly | 1 | Low | Medium | E2E test for search → select → navigation. Works with keyboard arrows and mouse. |
| R-005 | Store abstraction introduces N+1 queries or different transaction semantics | 3 | Medium | High | Contract tests verify exact DB operations. Load test before and after to measure query count. |
| R-006 | Resizable sidebar breaks at responsive breakpoints (tablet/mobile) | 3 | Low | Medium | Test at 768px, 1024px, 1280px, and 1440px breakpoints. Verify sidebar collapses correctly. |
| R-007 | DM multi-select creates duplicate channels for same user set | 3 | Low | Medium | API-level dedup check (already exists in dm_channels migration). E2E verifies redirect to existing. |
| R-008 | TipTap editor produces different markdown than current textarea | 4 | Medium | High | Automated markdown comparison test: same input text → compare editor output vs textarea output. |
| R-009 | Drafts auto-save conflicts with normal message send (sends draft instead of current text) | 4 | Low | Critical | Drafts must be cleared on successful send. Race condition test for rapid type → send → type sequence. |
| R-010 | Category migration for existing users is missing — categories don't appear | 2 | Medium | Medium | Seed categories for all existing users on deploy. Backfill script for users created before migration. |

---

## 12. Validation Checklist

### Before Merging Any Phase 1 Changes

- [ ] `pnpm test` passes (all 54+ existing tests)
- [ ] `pnpm typecheck` passes (0 errors)
- [ ] `pnpm lint` passes (0 warnings on changed files)
- [ ] `pnpm dev` starts without errors
- [ ] `supabase start` loads and applies all migrations + new down migrations verified
- [ ] MessageList: visual smoke test shows all message states identical before/after
- [ ] i18n: all pages render in English without visible key names
- [ ] Ctrl+K: E2E passes for search → select → navigate
- [ ] Emoji picker: all 11 category tabs render, emojis insert correctly
- [ ] Colon autocomplete: `:` triggers popup, Enter inserts emoji
- [ ] Shortcut modal: opens with `?`, all listed shortcuts work

### Before Merging Any Phase 2 Changes

- [ ] Phase 1 items complete and validated
- [ ] Search toggle returns correct Messages/Files results
- [ ] Operator hints appear when typing in search
- [ ] File preview: multi-file nav, zoom in/out, metadata panel all functional
- [ ] Channel context menu: right-click on public/private/DM/GM shows correct options
- [ ] Category management: create/rename/reorder/delete persist to DB
- [ ] Notification settings: global defaults respected, per-channel overrides work
- [ ] E2E regression suite passes at 100%

### Before Merging Any Phase 3 Changes

- [ ] Phases 1-2 complete and validated
- [ ] Store abstraction: contract tests pass for all 4 interfaces
- [ ] All existing service tests pass unchanged
- [ ] Sidebar header: all dropdown actions work
- [ ] Resizable sidebar: drag persists across reload, responsive breakpoints intact
- [ ] DM creation: single DM and group DM both create correct channels
- [ ] Performance benchmarks show no regression
- [ ] Rollback plan documented for each Phase 3 item

### Before Merging Any Phase 4 Changes

- [ ] Phases 0-3 complete and validated
- [ ] Phase 0 analytics support the investment (formatting >30%, abandonment >5%)
- [ ] TipTap: markdown comparison test passes (editor output == textarea output)
- [ ] Drafts: E2E for auto-save → restore → send passes
- [ ] i18n: target languages render without key fallout
- [ ] Full regression suite passes
- [ ] Go/no-go decision documented for each Phase 4 item
