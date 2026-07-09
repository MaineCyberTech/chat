# UI/UX Phase 6 — Safe Redesign and Refinement Roadmap

**Run**: 2026-07-09 04:15 UTC

---

## 1. Roadmap Summary

A conservative, 4-phase roadmap for UI/UX refinement that prioritizes accessibility, consistency, and polish over disruptive redesign.

```
Phase 0: Validation & constraints (1-2 days)     ← COMPLETED (audit + quick wins)
Phase 1: Accessibility + polish (1 week)          ← COMPLETED (FUX-01 through FUX-06)
Phase 2: Component standardization (1-2 weeks)    ← COMPLETED (7 items)
Phase 3: Layout/workflow refinement (2-3 weeks)   ← COMPLETED (5 items)
Phase 4: Strategic UX modernization (post-launch) → NEXT
```

---

## 2. Completed Work

### Phase 0-1 (Accessibility + Polish) — Done
| Item | Effort | Risk | Status |
|------|--------|------|--------|
| `aria-live="polite"` on message list | 0.1 day | None | Done |
| `role="alert"` on Toast | 0.1 day | None | Done (was already present) |
| Accessible labels on status pills | 0.2 day | None | Done |
| Replace hardcoded `#fff` with `var(--button-color)` | 0.5 day | Very low | Done (remaining 3 are intentional) |
| Replace raw opacity values with CSS variables | 0.5 day | Very low | Deferred (Phase 4) |
| Add `danger` variant to Button | 0.25 day | Very low | Done |
| Standardize focus ring | 0.5 day | Low | Deferred (Phase 4) |

### Phase 2 (Component Standardization) — Done
| Item | Effort | Risk | Status |
|------|--------|------|--------|
| Consolidate CSS variables | 2-3 days | Medium | Done (duplicate vars removed, architecture comments) |
| Create shared `<EmptyState>` component | 0.5 day | Very low | Done |
| Create shared `<StatusBadge>` component | 0.5 day | Very low | Done |
| Refactor DeleteDialog to use shared Dialog | 0.5 day | Low | Done |
| Standardize inline style vs Tailwind usage | 1-2 days | Low | Done (backdrops + elevations in 14 files) |
| Extract `<ScreenReaderOnly>` utility | 0.1 day | None | Done |
| Add toast for silent error paths | 1 day | Low | Done (context-menu, quick-switcher, thread-panel) |

### Phase 3 (Layout/Workflow Refinement) — Done
| Item | Effort | Risk | Status |
|------|--------|------|--------|
| Global announcement banner | 0.5 day | Low | Done (migration, API, component, dismiss persistence) |
| Channel header action menu | 1 day | Medium | Done (Copy link, Mute/Unmute with click-outside) |
| Tablet-optimized sidebar | 2 days | Medium | Done (auto-collapse 768-1024px, smooth transition) |
| Channel intro for empty channels | 0.5 day | Low | Done (topic in header + empty state) |
| Typing indicator in thread panel | 0.5 day | Low | Done (textarea emits events, display names used) |
| Message priority indicators | — | — | Already implemented |
| Search operator hints | — | — | Already implemented |
| DM discovery | — | — | Already implemented |

---

## 3. Remaining Items for Phase 4 (Strategic UX Modernization)

| Item | Effort | Risk | Notes |
|------|--------|------|-------|
| Replace remaining ad-hoc empty states with EmptyState component | 0.5 day | Low | 15+ locations using inline `<p>` patterns |
| Consolidate opacity to semantic CSS variables | 0.5 day | Low | `rgba(var(--center-channel-color-rgb), 0.56)` → `var(--text-tertiary)` |
| Standardize focus ring pattern | 0.5 day | Low | Audit all interactive elements for consistent `:focus-visible` |
| Add channel inline topic editing | 1 day | Low-medium | Click topic to edit, PATCH endpoint exists |
| Add post-delete undo toast | 0.5 day | Low | Ephemeral toast with undo action |
| Add `:focus-visible` ring to all interactive elements | 0.5 day | Medium | Accessibility audit |
| Drag-and-drop file upload overlay | 1 day | Low | Visual drop zone indicator |
| High-contrast mode support | 0.5 day | Low | `prefers-contrast: high` media query adjustments |

---

## 4. Accessibility and Responsiveness Priorities

| Priority | Item | Phase |
|----------|------|-------|
| **Critical** | ARIA live region on message list | Phase 1 ✓ |
| **Critical** | Toast screen reader announcements | Phase 1 ✓ |
| **High** | Status indicator accessible labels | Phase 1 ✓ |
| **High** | Silent catch block replacement | Phase 2 ✓ |
| **Medium** | Dialog title consistency | Phase 2 ✓ |
| **Medium** | Focus indicator audit | Phase 4 |
| **Low** | Keyboard shortcut documentation | Phase 4 |
| **Medium** | Tablet sidebar optimization | Phase 3 ✓ |
| **Low** | High-contrast mode | Phase 4 |

---

## 5. What Must Stay As-Is

- **`message-input.tsx`** — 1026 lines, highest complexity, do not refactor until Phase 4
- **`chat-view.tsx`** — 905 lines, core orchestration, change only with full E2E coverage
- **Route structure** — `/[workspaceSlug]/[channelId]` — do not restructure
- **Auth flow** — Magic link + OAuth — working and secure
- **Three-panel layout** — sidebar + content + RHS — industry standard
- **Optimistic messaging** — do not remove or change fundamentally
- **Bottom nav on mobile** — users depend on this for navigation
- **Socket.io real-time model** — replacing would be high-risk and unnecessary
- **TipTap editor** — highest-complexity component, defer extraction

---

## 6. Validation Gates

### Before Phase 4
- [ ] All current E2E tests pass
- [ ] Visual regression snapshots taken
- [ ] Accessibility baseline established (manual screen reader test)
- [ ] Phase 3 changes verified in production-like environment
- [ ] Performance metrics collected for message-input.tsx
- [ ] Analytics on feature usage to prioritize Phase 4 items
