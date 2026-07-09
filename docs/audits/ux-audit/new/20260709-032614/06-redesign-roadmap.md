# UI/UX Phase 6 — Safe Redesign and Refinement Roadmap

**Run**: 2026-07-09 03:26 UTC

---

## 1. Roadmap Summary

A conservative, 4-phase roadmap for UI/UX refinement that prioritizes accessibility, consistency, and polish over disruptive redesign.

```
Phase 0: Validation & constraints (1-2 days)
Phase 1: Accessibility + polish (1 week)
Phase 2: Component standardization (1-2 weeks)
Phase 3: Layout/workflow refinement (2-3 weeks)
Phase 4: Strategic UX modernization (post-launch / on-demand)
```

---

## 2. Immediate Low-Risk Visual Wins (Phase 0-1)

| Item                                                    | Effort   | Risk     | Details                                                                       |
| ------------------------------------------------------- | -------- | -------- | ----------------------------------------------------------------------------- |
| **Add `aria-live="polite"` to message list**            | 0.1 day  | None     | `<div role="log" aria-live="polite">` on the virtual list container           |
| **Add `role="alert"` to Toast**                         | 0.1 day  | None     | Single attribute on toast root element                                        |
| **Add accessible labels to status pills**               | 0.2 day  | None     | `aria-label="Status: Online"` etc.                                            |
| **Replace hardcoded `#fff` with `var(--button-color)`** | 0.5 day  | Very low | Search-and-replace across 14 files — verify each                              |
| **Replace raw opacity values with CSS variables**       | 0.5 day  | Very low | `0.56` → `var(--text-tertiary-alpha)`, `0.72` → `var(--text-secondary-alpha)` |
| **Add `danger` variant to Button component**            | 0.25 day | Very low | New CSS class string, no behavioral changes                                   |
| **Standardize focus ring**                              | 0.5 day  | Low      | Audit interactive elements, ensure `:focus-visible` ring matches token        |

### Validation Gate for Phase 1

- [ ] All changes pass `pnpm build`
- [ ] Storybook renders all 11 stories without visual changes
- [ ] Playwright visual snapshot tests pass
- [ ] No regressions in dark mode
- [ ] Manual QA on login, messaging, search flows

---

## 3. Low-Risk Component Consistency Improvements (Phase 2)

| Item                                           | Effort   | Risk     | Details                                                                                                                   |
| ---------------------------------------------- | -------- | -------- | ------------------------------------------------------------------------------------------------------------------------- |
| **Consolidate CSS variables**                  | 2-3 days | Medium   | Merge `globals.css` theme vars + `styles.css` vars + `semantic-colors.ts` into single source at `packages/ui/src/tokens/` |
| **Create shared `<EmptyState>` component**     | 0.5 day  | Very low | Icon + message + optional action button — reuse in 6+ locations                                                           |
| **Create shared `<StatusBadge>` component**    | 0.5 day  | Very low | Online/Away/DND/Offline with accessible labels                                                                            |
| **Refactor DeleteDialog to use shared Dialog** | 0.5 day  | Low      | Replace bespoke modal with `@chat/ui` Dialog                                                                              |
| **Standardize inline style vs Tailwind usage** | 1-2 days | Low      | Establish convention, update ~15 components                                                                               |
| **Extract `<ScreenReaderOnly>` utility**       | 0.1 day  | None     | Already have pattern (`sr-only`) — make consistent                                                                        |
| **Add toast for silent error paths**           | 1 day    | Low      | Replace `.catch(() => {})` with user-facing error messages                                                                |

### Validation Gate for Phase 2

- [ ] CSS variable consolidation produces no visual diff in light/dark modes
- [ ] All component tests pass
- [ ] Empty states render correctly in all 6+ locations
- [ ] DeleteDialog behavior identical to before (focus trap, escape, overlay)
- [ ] Storybook stories updated for new/refined components
- [ ] E2E messaging flow test passes

---

## 4. Medium-Risk Layout or Workflow Refinements (Phase 3)

| Item                                          | Effort  | Risk   | Details                                                                        |
| --------------------------------------------- | ------- | ------ | ------------------------------------------------------------------------------ |
| **Add global announcement banner**            | 0.5 day | Low    | Fixed banner above workspace layout, dismissible                               |
| **Add channel header action menu**            | 1 day   | Medium | Dense dropdown on channel header — must not break existing header interactions |
| **Add tablet-optimized sidebar (768-1024px)** | 2 days  | Medium | Mini-rail with icons — must coordinate with existing responsive breakpoints    |
| **Add message priority indicators**           | 1 day   | Low    | Visual badge + colored left border for priority posts                          |
| **Add channel intro for empty channels**      | 0.5 day | Low    | "Start the conversation" with channel purpose                                  |
| **Add search operator hints**                 | 0.5 day | Low    | Dropdown hints for `from:`, `in:` during search typing                         |
| **Improve DM discovery**                      | 1 day   | Medium | Better DM multi-select modal with search + recent contacts                     |
| **Add typing indicator to thread panel**      | 0.5 day | Low    | Socket event → "X is typing..." in thread RHS                                  |

### Validation Gate for Phase 3

- [ ] Manual QA on desktop, tablet (768-1024px), and mobile
- [ ] Keyboard navigation works through all new menu items
- [ ] Announcement banner dismisses correctly and state persists
- [ ] Channel header menu items all function (copy link, invite, mute, etc.)
- [ ] Priority indicators render correctly in light/dark mode
- [ ] E2E tests pass for all affected workflows
- [ ] Visual diff review for message rendering changes

---

## 5. Accessibility and Responsiveness Priorities

### Accessibility (All Phases)

| Priority     | Item                                               | Target Phase |
| ------------ | -------------------------------------------------- | ------------ |
| **Critical** | Message list ARIA live region                      | Phase 1      |
| **Critical** | Toast screen reader announcement                   | Phase 1      |
| **High**     | Status indicator accessible labels                 | Phase 1      |
| **High**     | Silent catch block replacement                     | Phase 2      |
| **Medium**   | Dialog title consistency                           | Phase 2      |
| **Medium**   | Emoji picker search label                          | Phase 2      |
| **Low**      | Keyboard shortcut documentation in app             | Phase 3      |
| **Low**      | Focus indicator audit for all interactive elements | Phase 2      |

### Responsiveness (All Phases)

| Priority   | Item                                              | Target Phase |
| ---------- | ------------------------------------------------- | ------------ |
| **Medium** | Tablet sidebar (768-1024px)                       | Phase 3      |
| **Low**    | Font size scaling on very large screens (2560px+) | Phase 4      |
| **Low**    | Print styles for messages                         | Phase 4      |

---

## 6. What Must Stay As-Is

- **`message-input.tsx`** — 1347 lines, highest complexity, do not refactor until Phase 4 at earliest
- **`chat-view.tsx`** — 893 lines, core orchestration, change only with full E2E coverage
- **Route structure** — `/[workspaceSlug]/[channelId]` — do not restructure
- **Auth flow** — Magic link + OAuth — working and secure
- **Three-panel layout** — sidebar + content + RHS — industry standard
- **Optimistic messaging** — do not remove or change fundamentally
- **Bottom nav on mobile** — users depend on this for navigation
- **Socket.io real-time model** — replacing with something else would be high-risk and unnecessary

---

## 7. Recommended Sequence

```
Week 1: Phase 1 — Accessibility fixes, hardcoded color cleanup, Button danger variant
Week 2: Phase 2 — CSS variable consolidation, shared EmptyState + StatusBadge, DeleteDialog refactor
Week 3: Phase 3a — Global banner, channel header menu, empty channel intro
Week 4: Phase 3b — Tablet sidebar, message priority, search hints
Post-launch: Phase 4 — TipTap extraction (if warranted), advanced editor features
```

---

## 8. Validation Gates Before Each Phase

### Before Phase 1

- [ ] All current E2E tests pass
- [ ] Visual regression snapshots taken
- [ ] Accessibility baseline established (manual screen reader test)

### Before Phase 2

- [ ] Phase 1 verified in production-like environment
- [ ] CSS variable map fully documented
- [ ] Component tree reviewed for reuse opportunities

### Before Phase 3

- [ ] Phase 2 verified in production-like environment
- [ ] Layout change design reviewed on all viewport sizes
- [ ] Keyboard navigation flow documented
- [ ] User research / feedback collected on current pain points

### Before Phase 4

- [ ] Phase 3 verified in production-like environment
- [ ] Performance metrics collected for current message-input.tsx
- [ ] Analytics on feature usage to prioritize Phase 4 items
