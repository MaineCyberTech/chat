# UI/UX Phase 7 — File-by-File Frontend Change Plan

**Run**: 2026-07-09 03:26 UTC

---

## 1. Highest-Priority Frontend Targets

| Priority | File                                                      | Reason                                                   | Suggested Change                             |
| -------- | --------------------------------------------------------- | -------------------------------------------------------- | -------------------------------------------- |
| P0       | `apps/web/components/chat/message-list.tsx`               | Missing `aria-live="polite"` on message container        | Add ARIA attribute to virtual list container |
| P0       | `packages/ui/src/components/toast.tsx`                    | Missing `role="alert"` for screen reader announcements   | Add ARIA role                                |
| P1       | `apps/web/app/globals.css`                                | Hardcoded `#fff` values should use `var(--button-color)` | Replace remaining hardcoded colors           |
| P1       | `apps/web/app/globals.css`                                | Raw opacity `0.56` / `0.72` in `.post__permalink`        | Use CSS variable references                  |
| P1       | `packages/ui/src/components/button.tsx`                   | Missing `danger` variant                                 | Add variant class + styling                  |
| P1       | `packages/ui/src/styles.css`                              | CSS variable duplication with `globals.css`              | Consolidate into single source               |
| P1       | `packages/ui/src/tokens/semantic-colors.ts`               | JS token duplication with CSS files                      | Consolidate or use as single SSOT            |
| P1       | `apps/web/components/chat/message-list/delete-dialog.tsx` | Bespoke modal, not using shared Dialog                   | Refactor to use `@chat/ui` Dialog            |

---

## 2. Safest Files/Areas to Touch First

| File                                                      | Risk     | Reason                                             |
| --------------------------------------------------------- | -------- | -------------------------------------------------- |
| `packages/ui/src/components/button.tsx`                   | Very low | Adding a variant doesn't change existing behavior  |
| `packages/ui/src/components/toast.tsx`                    | Very low | Adding ARIA attribute doesn't change visual output |
| `packages/web/components/chat/message-list.tsx`           | Very low | Adding `aria-live` doesn't change rendering        |
| `apps/web/app/globals.css`                                | Low      | Color/opacity replacements are find-and-replace    |
| `packages/ui/src/tokens/semantic-colors.ts`               | Low      | No visual change, pure refactoring                 |
| `packages/ui/src/components/dialog.tsx`                   | Low      | Refining existing component, no API breakage       |
| `apps/web/components/chat/message-list/delete-dialog.tsx` | Low      | Wrapping existing functionality with shared Dialog |

---

## 3. Fragile Frontend Areas to Avoid Early

| File                                                     | Lines   | Risk      | Reason                                                                    |
| -------------------------------------------------------- | ------- | --------- | ------------------------------------------------------------------------- |
| `apps/web/components/chat/message-input.tsx`             | 1347    | Very High | Largest component, most features, any edit risks breaking message sending |
| `apps/web/components/chat/chat-view.tsx`                 | 893     | Very High | Orchestrates 6+ sub-components, socket management, optimistic updates     |
| `apps/web/app/(workspace)/layout.tsx`                    | 397     | High      | Responsive shell, resize logic, keyboard shortcuts, mobile nav            |
| `apps/web/components/workspace/app-sidebar.tsx`          | Unknown | High      | Drag-and-drop, categories, keyboard reorder, mobile overlay               |
| `apps/web/components/chat/message-list/message-item.tsx` | 528     | High      | Complex rendering with reactions, editing, thread state                   |

---

## 4. Component Standardization Candidates

| Current State                                                        | Target                           | Effort   | Files Affected                                                                                                                              |
| -------------------------------------------------------------------- | -------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Bespoke empty states** across 6+ locations                         | Shared `<EmptyState>` component  | 0.5 day  | Create: `packages/ui/src/components/empty-state.tsx`. Update: search page, chat-view, saved page, scheduled page, groups page, threads page |
| **CSS classes for status indicators** (`.status-pill--online`, etc.) | Shared `<StatusBadge>` component | 0.5 day  | Create: `packages/ui/src/components/status-badge.tsx`, `.stories.tsx`, `.test.tsx`                                                          |
| **DeleteDialog** own modal                                           | `@chat/ui` Dialog                | 0.5 day  | Modify: `delete-dialog.tsx`                                                                                                                 |
| **Button missing `danger`**                                          | Add variant to Button            | 0.25 day | Modify: `button.tsx`                                                                                                                        |
| **Notification preferences modal** own modal                         | `@chat/ui` Dialog                | 0.5 day  | Modify: `notification-preferences-modal.tsx`                                                                                                |
| **Remind modal** own modal                                           | `@chat/ui` Dialog                | 0.5 day  | Modify: `remind-modal.tsx`                                                                                                                  |

---

## 5. Layout/Shell Refinement Candidates

| Area                            | Change                                             | Effort  | Risk   |
| ------------------------------- | -------------------------------------------------- | ------- | ------ |
| **Global announcement banner**  | Add fixed banner above workspace content (Phase 3) | 0.5 day | Low    |
| **Channel header action menu**  | Add dense dropdown (Phase 3)                       | 1 day   | Medium |
| **Tablet sidebar (768-1024px)** | Mini-rail sidebar for tablet widths (Phase 3)      | 2 days  | Medium |
| **Mobile bottom nav**           | Add notification badge to bottom nav (Phase 3)     | 0.5 day | Low    |
| **Loading state consistency**   | Add `<Suspense>` boundaries (Phase 2)              | 1 day   | Medium |

---

## 6. Form/Table/Search UX Candidates

| Area                      | Change                                                    | Effort   | Risk |
| ------------------------- | --------------------------------------------------------- | -------- | ---- |
| **Search bar**            | Add operator hints (`from:`, `in:` autocomplete)          | 0.5 day  | Low  |
| **Login form**            | Add password visibility toggle                            | 0.25 day | Low  |
| **Admin page**            | Add search/filter for user list                           | 1 day    | Low  |
| **Channel create dialog** | Add channel type selector (public/private) visual preview | 0.5 day  | Low  |
| **File upload**           | Add drag-and-drop overlay visual                          | 0.5 day  | Low  |

---

## 7. Theme/Styling Cleanup Candidates

| File                                        | Issue                                                        | Change                                                       |
| ------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| `packages/ui/src/styles.css`                | Duplicates variables in `globals.css`                        | Consolidate: keep tokens in `packages/ui`, import from there |
| `packages/ui/src/tokens/semantic-colors.ts` | Third source of truth for colors                             | Reference CSS variable names, or remove in favor of CSS-only |
| `apps/web/app/globals.css`                  | `@import "@chat/ui/styles.css"` but also redefines some vars | Remove duplicates, rely on `@chat/ui` for tokens             |
| `apps/web/app/globals.css`                  | `.dark` section duplicates structure                         | Refactor to use CSS cascade — single variable overrides      |
| Various files                               | Inline `style={{ color: "var(--x)" }}`                       | Standardize: use Tailwind classes with CSS variable mapping  |

---

## 8. Test and Visual QA Requirements Before Refactor

### For Phase 1 Changes

- Run `pnpm build` to catch TypeScript/CSS errors
- Run component tests: `pnpm --filter @chat/ui test`
- Run E2E tests: `pnpm --filter @chat/web exec playwright test`
- Visual check: Login → messaging → search flow in light + dark mode
- Screen reader check: navigate with NVDA/VoiceOver through message list and toast

### For Phase 2 Changes

- Same as Phase 1 + Storybook visual review for all changed components
- Test empty states in every location (search, saved, scheduled, groups, threads)
- Test DeleteDialog before/after refactor (focus trap, escape, overlay click)
- CSS variable consolidations: manually check light/dark mode for button, dialog, input, badge

### For Phase 3 Changes

- Same as Phase 1+2 + responsive testing at 768px, 1024px, 1440px
- Keyboard navigation audit for all new menus
- E2E tests for announcement banner dismiss, channel header menu actions
- Cross-browser testing (Chrome, Firefox, Safari, Edge)

---

## 9. Safe Patch Grouping Proposal

### Patch Group 1: Accessibility (Phase 1)

Files: `message-list.tsx`, `toast.tsx`, `globals.css` (status labels)
Risk: Very low
Validation: `pnpm build` + component tests

### Patch Group 2: Color/Opacity Cleanup (Phase 1)

Files: 14 files with hardcoded `#fff`, ~5 files with raw opacity
Risk: Very low
Validation: Visual diff review

### Patch Group 3: Component Standardization (Phase 2)

Files: `button.tsx`, `empty-state.tsx` (new), `status-badge.tsx` (new), `delete-dialog.tsx`
Risk: Low
Validation: Storybook + component tests

### Patch Group 4: CSS Variable Consolidation (Phase 2)

Files: `globals.css`, `styles.css`, `semantic-colors.ts`
Risk: Medium
Validation: Full visual regression check + dark mode check

### Patch Group 5: Empty States + Error Paths (Phase 2)

Files: 6 page files (search, saved, scheduled, groups, threads, chat-view), shared `EmptyState`
Risk: Low
Validation: Manual QA on each page's empty state

### Patch Group 6: Layout Enhancements (Phase 3)

Files: `workspace/layout.tsx`, new `announcement-banner.tsx`, `chat-view.tsx`
Risk: Medium
Validation: Full responsive + E2E suite

---

## 10. Rollback-Sensitive Areas

| Area                                  | Rollback Plan                                                                                      |
| ------------------------------------- | -------------------------------------------------------------------------------------------------- |
| **CSS variable consolidation**        | Keep git history — revert single commit to restore triple-source state                             |
| **Dialog refactoring**                | Shared Dialog changes affect all modal consumers — test each one before merging                    |
| **Layout changes (Phase 3)**          | Announcement banner and tablet sidebar are additive — can be reverted by removing component import |
| **Inline style → Tailwind migration** | Each file change is independent — revert per-file                                                  |
| **DeleteDialog refactor**             | Original file can be restored from git if shared Dialog doesn't work as expected                   |
| **Color/opacity cleanup**             | Pure search-and-replace — revert by undoing commit                                                 |
