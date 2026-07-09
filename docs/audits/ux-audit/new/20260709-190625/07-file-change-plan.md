# UI/UX Phase 7 — File-by-File Frontend Change Plan

**Run**: 2026-07-09 19:06 UTC

---

## 1. All Targeted Changes Complete

Every item from the 4-phase frontend UI/UX roadmap has been implemented and verified. Below is the complete record of files changed per phase.

### Phase 1 — Accessibility + Polish
| File | Change |
|------|--------|
| `apps/web/components/chat/message-list.tsx` | `role="log" aria-live="polite" aria-label="Message list"` |
| `apps/web/components/workspace/app-sidebar.tsx` | `aria-label` + `role="status"` on status pill |
| `packages/ui/src/components/button.tsx` | `danger` variant added |
| `packages/ui/src/components/button.stories.tsx` | Danger story + control option |
| `packages/ui/src/styles.css` | `--color-button-danger-*` CSS vars |

### Phase 2 — Component Standardization
| File | Change |
|------|--------|
| `packages/ui/src/components/screen-reader-only.tsx` | New component |
| `packages/ui/src/components/status-badge.tsx` | New component |
| `packages/ui/src/components/empty-state.tsx` | New component |
| `packages/ui/src/index.ts` | Export new components + ToastVariant |
| `apps/web/components/chat/message-list/delete-dialog.tsx` | `Button variant="danger"` + ScreenReaderOnly |
| `apps/web/components/chat/message-list.tsx` | EmptyState usage |
| `apps/web/components/chat/channel-info.tsx` | EmptyState usage |
| `apps/web/components/chat/message-list/context-menu.tsx` | Toast for silent errors |
| `apps/web/components/chat/quick-switcher.tsx` | Toast for silent errors |
| `apps/web/components/chat/thread-panel.tsx` | Toast for silent errors |
| 14 files with rgba(0,0,0,0.5) backdrops | `bg-black/50` replacement |
| 7 files with boxShadow elevation | `shadow-[var(--elevation-5)]` replacement |
| `apps/web/app/globals.css` | Removed 11 duplicate --color-* vars, architecture comments |
| `packages/ui/src/styles.css` | Architecture comments |

### Phase 3 — Layout/Workflow Refinement
| File | Change |
|------|--------|
| `apps/web/app/(workspace)/[workspaceSlug]/[channelId]/page.tsx` | Pass `channelTopic` prop |
| `apps/web/components/chat/chat-view.tsx` | Topic in header, channel header menu (Copy link + Mute/Unmute) |
| `apps/web/components/chat/message-list.tsx` | Empty state shows channel topic |
| `apps/web/components/chat/thread-panel.tsx` | Typing events from textarea, display names |
| `apps/web/app/(workspace)/layout.tsx` | Tablet sidebar auto-collapse, announcement banner |
| `apps/web/components/announcement-banner.tsx` | New component |
| `apps/api/src/modules/announcements/routes.ts` | New API endpoints |
| `apps/api/src/route-registry.ts` | Register announcement routes |
| `supabase/migrations/20260709000004_add_announcements.sql` | Migration |
| `supabase/rollback/20260709000004_add_announcements_down.sql` | Rollback |

### Phase 4 — Strategic UX Modernization
| File | Change |
|------|--------|
| 16 files with ad-hoc empty states | Replaced with `<EmptyState>` |
| `packages/ui/src/components/toast.tsx` | Added `action` prop for undo buttons |
| `apps/web/components/chat/chat-view.tsx` | Post-delete undo toast, inline topic editing, drag-and-drop overlay |
| `apps/web/components/chat/message-list.tsx` | `onUndoDelete` prop |
| `apps/web/app/globals.css` | `@media (prefers-contrast: high)` block |
| `packages/ui/src/styles.css` | `:focus-visible` standardized with CSS variables |
| 61 files in apps/web/ | `rgba(var(--center-channel-color-rgb), 0.56)` → `var(--text-tertiary)` |
| 61 files in apps/web/ | `rgba(var(--center-channel-color-rgb), 0.72)` → `var(--text-secondary)` |

---

## 2. Stretch Items (Future)

| File | Change | Effort | Risk |
|------|--------|--------|------|
| `apps/web/components/chat/message-input.tsx` | Command menu popup for `/` | 1 day | Low |
| `apps/web/app/(workspace)/layout.tsx` | Global header with search | 2 days | Medium |
| `apps/web/components/chat/chat-view.tsx` | File upload progress indicator | 0.5 day | Low |
| `apps/web/components/chat/thread-panel.tsx` | Participant read status | 1 day | Low |

---

## 3. Fragile Frontend Areas (Do Not Refactor Without Coverage)

| File | Lines | Reason | Recommended Approach |
|------|-------|--------|---------------------|
| `message-input.tsx` | 1026 | TipTap + format bar + emoji + slash + scheduling + priorities + AI + drafts | Wait for E2E coverage, dedicated phase |
| `app-sidebar.tsx` | 1191 | Categories, channels, DMs, drag-and-drop, resize, status, user picker | Incremental additions only |
| `chat-view.tsx` | 1119 | Messages, thread, search, channel info, connection, media, topic, drag-drop | Feature additions via hooks/components |

---

## 4. Rollback-Sensitive Areas

| Area | Rollback Complexity | Mitigation |
|------|---------------------|------------|
| CSS variable changes | Low | Git revert |
| Empty state replacements | Very low | Git revert |
| Channel header menu | Low | Conditional rendering |
| Announcement banner | Low | Remove JSX from layout |
| Tablet sidebar | Medium | Affects layout width |
| Post-delete undo toast | Low | Remove prop from MessageList |
| Drag-and-drop overlay | Low | Remove event handlers |
| Topic editing | Low | Revert to static `<p>` |
