# UI/UX Phase 7 — File-by-File Frontend Change Plan

**Run**: 2026-07-09 04:15 UTC

---

## 1. Highest-Priority Frontend Targets

### Remaining Phase 4 Items

| File                                                          | Change                                                        | Effort   | Risk |
| ------------------------------------------------------------- | ------------------------------------------------------------- | -------- | ---- |
| `apps/web/components/chat/search-bar.tsx`                     | Replace empty state ad-hoc `<p>` with EmptyState (line 827)   | 0.1 day  | Low  |
| `apps/web/components/workspace/workspace-list.tsx`            | Replace empty state `<p>` with EmptyState (line 52)           | 0.05 day | Low  |
| `apps/web/components/workspace/team-sidebar.tsx`              | Replace empty state div with EmptyState (line 53)             | 0.05 day | Low  |
| `apps/web/components/chat/emoji-picker.tsx`                   | Replace empty state `<p>` with EmptyState (line 315)          | 0.05 day | Low  |
| `apps/web/components/chat/thread-panel.tsx`                   | Replace empty state `<p>` with EmptyState (line 322)          | 0.05 day | Low  |
| `apps/web/components/notifications/notification-bell.tsx`     | Replace empty state `<p>` with EmptyState (line 189)          | 0.05 day | Low  |
| `apps/web/components/channel/channel-list.tsx`                | Replace empty state `<p>` with EmptyState (lines 242, 250)    | 0.05 day | Low  |
| `apps/web/app/(workspace)/[workspaceSlug]/search/page.tsx`    | Replace empty state with EmptyState (line 217)                | 0.05 day | Low  |
| `apps/web/app/(workspace)/[workspaceSlug]/saved/page.tsx`     | Replace empty state with EmptyState (line 79)                 | 0.05 day | Low  |
| `apps/web/app/(workspace)/[workspaceSlug]/settings/page.tsx`  | Replace 3 empty states with EmptyState (lines 551, 662)       | 0.1 day  | Low  |
| `apps/web/app/(workspace)/[workspaceSlug]/threads/page.tsx`   | Replace empty state with EmptyState (line 109)                | 0.05 day | Low  |
| `apps/web/app/(workspace)/[workspaceSlug]/groups/page.tsx`    | Replace empty state with EmptyState (line 181)                | 0.05 day | Low  |
| `apps/web/app/(workspace)/[workspaceSlug]/admin/page.tsx`     | Replace 3 empty states with EmptyState (lines 570, 813, 1021) | 0.1 day  | Low  |
| `apps/web/components/groups/user-picker-modal.tsx`            | Replace empty state with EmptyState (line 133)                | 0.05 day | Low  |
| `apps/web/components/workspace/invite-members-modal.tsx`      | Replace empty state with EmptyState (line 143)                | 0.05 day | Low  |
| `apps/web/components/shared/keyboard-shortcuts.tsx`           | Replace empty state with EmptyState (line 213)                | 0.05 day | Low  |
| `apps/web/components/chat/channel-bookmarks.tsx`              | Replace empty state with EmptyState (line 250)                | 0.05 day | Low  |
| `apps/web/app/(workspace)/[workspaceSlug]/scheduled/page.tsx` | Replace empty state with EmptyState (line 93)                 | 0.05 day | Low  |
| `apps/web/components/groups/group-modal.tsx`                  | Replace 2 empty states with EmptyState (lines 279, 393)       | 0.1 day  | Low  |

---

## 2. Safest Files/Areas to Touch First

| File                         | Reason                                           | Prerequisites             |
| ---------------------------- | ------------------------------------------------ | ------------------------- |
| Empty state files (above)    | Self-contained JSX changes, no behavioral impact | EmptyState already exists |
| `apps/web/app/globals.css`   | CSS variable additions only                      | Variable registry review  |
| `packages/ui/src/styles.css` | Design token additions only                      | Token architecture review |
| Story files (`.stories.tsx`) | No production impact                             | Component exists          |

---

## 3. Fragile Frontend Areas to Avoid Early

| File                             | Why                                                                           | Recommended Approach                               |
| -------------------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------- |
| `message-input.tsx` (1026 lines) | TipTap + format bar + emoji + slash + scheduling + priorities + AI + drafts   | Wait for E2E coverage, refactor in dedicated phase |
| `app-sidebar.tsx` (1191 lines)   | Categories, channels, DMs, drag-and-drop, resize, status, user picker         | Incremental additions only, no restructuring       |
| `chat-view.tsx` (905 lines)      | Core orchestration: messages, thread, search, channel info, connection, media | Add features via hooks/components, do not rewrite  |

---

## 4. Component Standardization Candidates

| Candidate            | Current Pattern                                   | Target                                  | Benefit                                                 |
| -------------------- | ------------------------------------------------- | --------------------------------------- | ------------------------------------------------------- |
| **Empty states**     | 20+ ad-hoc `<p>` + inline styles                  | `<EmptyState>` component                | Visual consistency, reduced code, accessible by default |
| **Focus rings**      | Missing on some interactive elements              | Consistent `:focus-visible` via CSS var | Accessibility + consistency                             |
| **Semantic opacity** | Raw `rgba(var(--center-channel-color-rgb), 0.56)` | `var(--text-tertiary)`                  | DRY, theme-aware                                        |

---

## 5. Layout/Shell Refinement Candidates

| Candidate                      | Current              | Target                                     | Status          |
| ------------------------------ | -------------------- | ------------------------------------------ | --------------- |
| **Global announcement banner** | Not present          | `<AnnouncementBanner>` in workspace layout | ✓ Done          |
| **Tablet sidebar**             | Full sidebar at 768+ | Auto-collapse to 60px mini-rail            | ✓ Done          |
| **Channel header menu**        | Empty ChevronDown    | Rich dropdown with actions                 | ✓ Baseline done |

---

## 6. Form/Table/Search UX Candidates

| Candidate                        | Current                         | Target                                 |
| -------------------------------- | ------------------------------- | -------------------------------------- |
| **Search empty state**           | Ad-hoc inline `<p>`             | `<EmptyState>` with icon + description |
| **Search operator hints**        | Already implemented as dropdown | —                                      |
| **Channel inline topic editing** | Not present                     | Click-to-edit topic in channel header  |

---

## 7. Theme/Styling Cleanup Candidates

| Candidate                                                          | Status                     |
| ------------------------------------------------------------------ | -------------------------- |
| Remove duplicate `--color-*` vars from globals.css dark mode       | ✓ Done (Phase 2)           |
| Add architecture comments to both CSS layers                       | ✓ Done (Phase 2)           |
| Replace modal backdrops with `bg-black/50`                         | ✓ Done (Phase 2, 14 files) |
| Replace elevation inline styles with `shadow-[var(--elevation-5)]` | ✓ Done (Phase 2, 7 files)  |
| Consolidate remaining raw opacity values                           | Phase 4                    |

---

## 8. Test and Visual QA Requirements

### Before Phase 4

- [ ] All 12 component test files pass
- [ ] All 7 shared UI test files pass
- [ ] Playwright E2E: auth-workspace-chat flow passes
- [ ] Storybook renders all 14 stories without errors
- [ ] Visual diff review for any layout changes

### After Phase 4 changes

- [ ] Manual QA on login, messaging, search, settings flows
- [ ] Dark mode visual inspection on all 5+ affected pages
- [ ] Keyboard navigation audit on modified components
- [ ] Screen reader test on empty states

---

## 9. Safe Patch Grouping Proposal

| Group  | Items                          | Files                             | Risk     |
| ------ | ------------------------------ | --------------------------------- | -------- |
| **P1** | EmptyState adoption (16 files) | All listed in section 1           | Very low |
| **P2** | Focus ring standardization     | Multiple interactive elements     | Low      |
| **P3** | Opacity var consolidation      | Files using raw `rgba(..., 0.56)` | Low      |
| **P4** | Channel topic inline editing   | chat-view.tsx + API               | Low      |
| **P5** | Post-delete undo toast         | message-list + toast              | Low      |

---

## 10. Rollback-Sensitive Areas

| Area                                       | Rollback Complexity                           | Mitigation            |
| ------------------------------------------ | --------------------------------------------- | --------------------- |
| `globals.css` CSS var changes              | Low — CSS is additive, no behavioral breakage | Git revert            |
| `packages/ui/src/styles.css` token changes | Low — CSS is additive                         | Git revert            |
| Empty state replacements                   | Very low — reverting to `<p>` is safe         | Git revert            |
| Channel header menu                        | Low — dropdown can be disabled                | Conditional rendering |
| Announcement banner                        | Low — component can be removed from layout    | Remove JSX            |
| Tablet sidebar changes                     | Medium — affects layout width                 | Git revert            |
