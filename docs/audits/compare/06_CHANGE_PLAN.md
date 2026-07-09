# Phase 6 — File-by-File / Area-by-Area Change Plan (Revised July 8, 2026)

> **Status**: This document reflects the current repo state after the July 1–6 implementation wave. Many Phase 1-2 items from the original plan are now complete. This revision identifies the **true remaining gaps**.

---

## 1. Highest-Priority Target Areas (Current Gaps)

Based on the current staging analysis, the highest-priority remaining targets are:

1. **Emoji dataset expansion** — swap ~600 emoji set with full 3300+ Unicode set (infrastructure already wired)
2. **MessageList decomposition completion** — message-list.tsx (1181 lines) still contains ~600 lines that should be in message-list/ sub-modules
3. **DM multi-select creation modal** — DM API and table exist; creation UI is inline/basic
4. **Sidebar category management UI** — `sidebar_categories` + `sidebar_channel_assignments` tables exist; no management UI
5. **Sidebar channel context menu** — message context menu exists; channel sidebar right-click missing
6. **Resizable sidebar drag handle** — sidebar width is fixed; no user resizing
7. **Multi-team sidebar (65px rail)** — workspace switcher exists in dropdown; no persistent rail

---

## 2. Files to Touch (Current Gaps)

### Patch Group A: Emoji Expansion

| File | Action | Details | Risk |
|---|---|---|---|
| `apps/web/lib/emoji/emoji-data.json` | REPLACE | Swap ~600 emoji dataset with 3300+ from Mattermost `emoji.json` | Low |
| `apps/web/components/chat/emoji-picker.tsx` | MODIFY | Virtualize grid for 5x data, verify category ordering | Low |

### Patch Group B: MessageList Decomposition Completion

| File | Action | Details | Risk |
|---|---|---|---|
| `apps/web/components/chat/message-list/reactions.tsx` | EXTRACT | Reaction buttons + tooltips from message-list.tsx | Medium |
| `apps/web/components/chat/message-list/message-editing.tsx` | EXTRACT | Edit form + save/cancel from message-list.tsx | Medium |
| `apps/web/components/chat/message-list/timestamp.tsx` | EXTRACT | Permalink + floating overlay from message-list.tsx | Medium |
| `apps/web/components/chat/message-list/system-message.tsx` | EXTRACT | Join/leave/pin messages from message-list.tsx | Medium |
| `apps/web/components/chat/message-list/index.ts` | MODIFY | Update barrel exports | Low |

### Patch Group C: DM Multi-Select Creation Modal

| File | Action | Details | Risk |
|---|---|---|---|
| `apps/web/components/chat/create-dm-modal.tsx` | CREATE | Typeahead + checkable list + confirm button | Low-Med |
| `apps/web/components/workspace/app-sidebar.tsx` | MODIFY | Add DM creation button | Low |
| `apps/api/src/modules/channels/service.ts` | MODIFY | Ensure bulk member add on DM creation | Low |

### Patch Group D: Sidebar Category Management UI

| File | Action | Details | Risk |
|---|---|---|---|
| `apps/web/components/workspace/sidebar-category-manager.tsx` | CREATE | Create/rename/reorder/delete categories with DnD | Low |
| `apps/web/components/workspace/app-sidebar.tsx` | MODIFY | Integrate category manager | Low |

### Patch Group E: Channel Context Menu (Sidebar)

| File | Action | Details | Risk |
|---|---|---|---|
| `apps/web/components/workspace/channel-context-menu.tsx` | CREATE | Favorites, Mute, Mark Read, Copy Link, Leave, Delete | Low |
| `apps/web/components/workspace/app-sidebar.tsx` | MODIFY | Add right-click handler on channel items | Low |

### Patch Group F: Resizable Sidebar

| File | Action | Details | Risk |
|---|---|---|---|
| `apps/web/components/workspace/app-sidebar.tsx` | MODIFY | Add draggable divider (4px handle, onMouseDown) | Medium |
| `apps/web/app/(workspace)/layout.tsx` | MODIFY | CSS var for sidebar width, MIN/MAX clamping | Medium |

### Patch Group G: Multi-Team Sidebar (Strategic)

| File | Action | Details | Risk |
|---|---|---|---|
| `apps/web/components/workspace/team-rail.tsx` | CREATE | Fixed 65px left rail with workspace icons + tooltips | High |
| `apps/web/app/(workspace)/layout.tsx` | MODIFY | Add rail + shift sidebar right by 65px | High |
| `apps/web/components/workspace/app-sidebar.tsx` | MODIFY | Reduce width by 65px | High |
| `apps/api/src/modules/workspaces/service.ts` | MODIFY | Multi-workspace membership queries | Low |

---

## 3. Files/Folders to Avoid Touching

| File/Folder | Reason |
|---|---|
| `apps/api/src/modules/auth/` | Auth is critical path. No changes without comprehensive test coverage. |
| `apps/api/src/middleware/authenticate.ts` | Auth gate for every operation. See guardrail #1. |
| `apps/web/components/auth/auth-context.tsx` | Auth context is the client-side auth boundary. |
| `apps/web/app/api/v1/[...path]/route.ts` (BFF) | The BFF proxy is Chat's best security feature. |
| `apps/api/src/lib/socket.ts` | Socket.io event contracts must be additive only. |
| `infra/docker/Caddyfile` + `Caddyfile.prod` | Route mappings are production contracts. |
| `apps/api/server.ts` | Entry point with graceful shutdown (SIGTERM/SIGINT 10s drain). |
| `.github/workflows/deploy-development.yml` | Fragile SSH-based deployment pipeline. |
| `.github/workflows/deploy-production.yml` | Production deploy workflow. |
| `packages/ui/src/components/` (existing) | Shared UI library is Chat's design system foundation. |

---

## 4. Already Implemented (No Action Needed)

These items from the original change plan are now complete and require no further action:

| Area | Files Created/Modified | Status |
|---|---|---|
| **Supabase seeds** | 9 seed files in `supabase/seeds/` | ✅ Complete |
| **Supabase rollback scripts** | 52 `_down.sql` files in `supabase/rollback/` | ✅ Complete |
| **Shared config package** | `packages/config/` with eslint, tsconfig, logger, errors, env-schema, date, vitest | ✅ Complete |
| **Store abstraction** | 5 store interfaces in `packages/db/src/stores/` (message, channel, workspace, reaction, notification) | ✅ Complete |
| **i18n infrastructure** | `apps/web/lib/i18n/` with `en.json` + `index.ts` locale system | ✅ Complete |
| **Onboarding tour** | `apps/web/components/workspace/onboarding-tour.tsx` (5-step task list) | ✅ Complete |
| **Drafts auto-save** | `message-input.tsx` with `DRAFT_KEY_PREFIX` + localStorage | ✅ Complete |
| **TipTap WYSIWYG editor** | `apps/web/components/chat/tiptap-editor.tsx` with TaskList, Link, Placeholder extensions | ✅ Complete |
| **Keyboard shortcut categories** | `keyboard-shortcuts.tsx` with Navigation/Messaging/Formatting/General groups | ✅ Complete |
| **Sidebar workspace menu** | `app-sidebar.tsx` with workspace switcher dropdown, active indicator | ✅ Complete |
| **File preview metadata** | `file-preview.tsx` with formatSize, name, fileSize fields | ✅ Complete |
| **MessageList partial decomposition** | `message-list/` directory with context-menu.tsx, message-item.tsx, delete-dialog.tsx | ✅ Partial |
| **Colon autocomplete** | In `message-input.tsx` | ✅ Complete |
| **Markdown formatting toolbar** | In `message-input.tsx` | ✅ Complete |
| **Slash commands** | With autocomplete popup | ✅ Complete |
| **E2E tests** | 9+ spec files (auth, file-upload, home, messaging, navigation, search, comprehensive, visual-snapshot, auth-workspace-chat) | ✅ Complete |
| **Caddy/Traefik cleanup** | Traefik directory removed | ✅ Complete |
| **Migration count** | 53 migrations (up from original 48) | ✅ Complete |

---

## 5. UI/UX Alignment Candidates (Current State)

| Current Component | Status vs Mattermost | Action | Notes |
|---|---|---|---|
| Emoji picker | 600 emojis vs 3300+ | Expand dataset | Infrastructure already wired |
| Keyboard shortcuts | Categories exist, 10+ shortcuts | Already matched | No action needed |
| File preview | Metadata panel exists | Already matched | No action needed |
| Sidebar header menu | Workspace switcher exists | Already matched | No action needed |
| Sidebar categories | Tables exist, no management UI | Build category manager | ~2 days effort |
| Channel context menu | Message Cx exists, channel missing | Build channel Cx | ~1 day effort |
| Resizable sidebar | Not implemented | Build drag handle | ~1 day effort |
| DM creation | Inline/basic | Build multi-select modal | ~2 days effort |
| Multi-team sidebar | Not implemented | Build 65px rail (gated) | ~5 days effort |

---

## 6. API/Service Alignment Candidates

| Module | Current State | Mattermost Reference | Action | Notes |
|---|---|---|---|---|
| `modules/channels/` | DM, GM, read-only channels | Similar | Already aligned | DM tables exist |
| `modules/notifications/` | Per-channel prefs exist | Global settings + trigger words | Add global settings page | ~2 days |
| `modules/messages/` | Pinning, flagging, edit history | Similar | Already aligned | All features implemented |
| Store abstraction | 5 interfaces (message, channel, workspace, reaction, notification) | 40+ interfaces | Already adequate | No further expansion needed yet |
| Store contract tests | Some exist | Testlib/ patterns | Add contract tests | ~1 day |

---

## 7. Test Coverage Needed

| Area | Current Tests | Needed Before Changes |
|---|---|---|
| **Store abstraction** | Existing service tests | Contract tests for each store interface against real Supabase |
| **DM multi-select** | No DM-specific E2E test | `dm-creation.spec.ts` before implementation |
| **Resizable sidebar** | No sidebar resize test | `sidebar-resize.spec.ts` verifying width persistence |
| **Multi-team sidebar** | No multi-workspace E2E test | `multi-workspace.spec.ts` before implementation |
| **Sidebar categories** | No category management test | `category-management.spec.ts` |

---

## 8. Documentation / Runbook Improvements

| Doc | Current State | Improvement Needed |
|---|---|---|
| `AGENTS.md` | Good — comprehensive | Update after each patch group |
| `apps/api/.env.example` | Has key vars | Verify all vars documented |
| `apps/web/.env.example` | Has key vars | Verify all vars documented |
| `supabase/README.md` | None | Add migration workflow, seed loading instructions |
| `tests/README.md` | Skeleton | Add test run instructions, test data setup |

---

## 9. Safe Patch Grouping (Revised)

### Immediate (Week 1)
```
Group A: Emoji expansion
  apps/web/lib/emoji/emoji-data.json       [REPLACE — 3300+ dataset]
  apps/web/components/chat/emoji-picker.tsx [MODIFY — virtualize grid]

Group C: DM multi-select modal
  apps/web/components/chat/create-dm-modal.tsx          [CREATE]
  apps/web/components/workspace/app-sidebar.tsx          [MODIFY]
  apps/api/src/modules/channels/service.ts               [MODIFY]

Group E: Channel context menu
  apps/web/components/workspace/channel-context-menu.tsx [CREATE]
  apps/web/components/workspace/app-sidebar.tsx          [MODIFY]
```

### Week 2
```
Group D: Sidebar category management
  apps/web/components/workspace/sidebar-category-manager.tsx [CREATE]
  apps/web/components/workspace/app-sidebar.tsx              [MODIFY]

Group B: MessageList decomposition
  apps/web/components/chat/message-list/reactions.tsx       [EXTRACT]
  apps/web/components/chat/message-list/message-editing.tsx [EXTRACT]
  apps/web/components/chat/message-list/timestamp.tsx       [EXTRACT]
  apps/web/components/chat/message-list/system-message.tsx  [EXTRACT]
  apps/web/components/chat/message-list/index.ts            [MODIFY]
```

### Week 3 (Medium Risk)
```
Group F: Resizable sidebar
  apps/web/components/workspace/app-sidebar.tsx [MODIFY — drag handle]
  apps/web/app/(workspace)/layout.tsx           [MODIFY — CSS var]

Global notification settings
  apps/web/app/(workspace)/[workspaceSlug]/settings/page.tsx [MODIFY]
```

### Strategic (Gated)
```
Group G: Multi-team sidebar
  apps/web/components/workspace/team-rail.tsx     [CREATE]
  apps/web/app/(workspace)/layout.tsx             [MODIFY]
  apps/web/components/workspace/app-sidebar.tsx   [MODIFY]
  apps/api/src/modules/workspaces/service.ts      [MODIFY]
```

**Execution order**: A → C → E → D → B → F → G. Each group can be validated independently.
