# UI/UX Phase 6 — Safe Redesign and Refinement Roadmap

## 1. Roadmap Summary

This roadmap focuses on **UI polish, accessibility, and feedback patterns** — not visual redesign. The current frontend architecture is sound for a real-time chat app. The gaps are in a11y compliance, visual consistency, and user feedback.

**Total effort**: ~2-3 days for Phases 1-2; Phase 3 is optional (~1 day).

---

## 2. Immediate Low-Risk Visual Wins (Phase 1)

| #   | Item                                                  | Effort | Impact                               | Risk |
| --- | ----------------------------------------------------- | ------ | ------------------------------------ | ---- |
| 1.1 | Replace Unicode icons with lucide-react + aria-labels | 1h     | **High** — a11y + visual consistency | None |
| 1.2 | Add favicon/app icon                                  | 5m     | Low — professional polish            | None |
| 1.3 | Standardize all loading states to Skeleton            | 15m    | Medium — consistent UX               | None |
| 1.4 | Add hover transitions to all sidebar links            | 10m    | Low — visual polish                  | None |
| 1.5 | Add footer to landing shell                           | 5m     | Low                                  | None |
| 1.6 | Add close button to Dialog component                  | 10m    | Medium — discoverability             | None |

**Verification Gate**: `pnpm lint` + `pnpm typecheck` + visual check of all changed components

---

## 3. Low-Risk Component Consistency Improvements (Phase 2)

| #   | Item                                                       | Effort | Impact                     | Risk | Prerequisites |
| --- | ---------------------------------------------------------- | ------ | -------------------------- | ---- | ------------- |
| 2.1 | Add aria-labels to all icon-only buttons (message actions) | 15m    | **High** — a11y            | None | Phase 1.1     |
| 2.2 | Add skip-to-content link in root layout                    | 5m     | **High** — keyboard nav    | None | —             |
| 2.3 | Add focus trap hook to Dialog component                    | 30m    | **High** — keyboard a11y   | Low  | —             |
| 2.4 | Show message actions on `focus-within` (not just hover)    | 5m     | **High** — keyboard access | None | —             |
| 2.5 | Add aria-live region for new messages in ChatView          | 10m    | **High** — screen reader   | None | —             |
| 2.6 | Fix channel name display (show name instead of ID)         | 15m    | Medium — UX clarity        | None | —             |
| 2.7 | Add error boundary wrapper to workspace layouts            | 30m    | Medium — crash resilience  | None | —             |
| 2.8 | Add toast notifications for create/send actions            | 1h     | Medium — feedback loop     | Low  | —             |

**Verification Gate**: `pnpm test` + `pnpm typecheck` + `pnpm test:e2e` + manual keyboard-only navigation test

---

## 4. Medium-Risk Layout or Workflow Refinements (Phase 3)

| #   | Item                                                 | Effort | Impact                      | Risk   | Prerequisites      |
| --- | ---------------------------------------------------- | ------ | --------------------------- | ------ | ------------------ |
| 3.1 | Add responsive sidebar (hamburger toggle at <768px)  | 2h     | **High** — mobile usability | Medium | Phase 1-2 complete |
| 3.2 | Add breadcrumbs to workspace layout                  | 30m    | Medium — navigation clarity | Low    | —                  |
| 3.3 | Upgrade message input from `<input>` to `<textarea>` | 15m    | Low — multi-line messages   | Low    | —                  |
| 3.4 | Add manual dark mode toggle in AppHeader             | 30m    | Medium — user choice        | Low    | —                  |
| 3.5 | Add file upload progress indicator                   | 1h     | Medium — upload UX          | Low    | —                  |

**Verification Gate**: All Phase 1-2 items complete + manual QA on mobile viewports + `pnpm check` passes

---

## 5. Accessibility and Responsiveness Priorities

### P0 (do before deployment)

- ✅ aria-labels on icon buttons (Phase 2.1)
- ✅ focus trap on Dialog (Phase 2.3)
- ✅ keyboard access to message actions (Phase 2.4)
- ✅ aria-live region for new messages (Phase 2.5)

### P1 (next release)

- ✅ skip-to-content link (Phase 2.2)
- ✅ error boundaries (Phase 2.7)
- ✅ toast notifications (Phase 2.8)

### P2 (future)

- ✅ responsive sidebar (Phase 3.1)
- ✅ manual dark mode toggle (Phase 3.4)
- ✅ file upload progress (Phase 3.5)

---

## 6. What Must Stay As-Is

| Feature                                           | Reason                                                            |
| ------------------------------------------------- | ----------------------------------------------------------------- |
| Sidebar layout (w-60, flex-1 main)                | Appropriate chat app model — users expect this                    |
| System-ui font stack                              | Fast loading, no external requests                                |
| Dark mode via prefers-color-scheme                | User preference — do not force dark-only                          |
| Inline message editing                            | Direct manipulation — industry standard                           |
| Hover-reveal actions pattern                      | Clean default state (but add focus-within)                        |
| Auth context + client-side sessions               | Works reliably — no server component migration needed             |
| Socket.io real-time architecture                  | Robust — no need to change the event model                        |
| Current route structure (workspaceSlug/channelId) | Clean URL pattern — changing would break existing links           |
| All client components                             | Server component migration would break real-time and auth context |

---

## 7. Recommended Sequence

```
Phase 0: No changes — audit baseline (current status)
    ↓
Phase 1: Visual polish (~1.5 hours)
    ├── 1.1 Replace Unicode icons with lucide-react
    ├── 1.2 Add favicon
    ├── 1.3 Standardize loading states to Skeleton
    ├── 1.4 Add hover transitions to sidebar links
    ├── 1.5 Add landing footer
    └── 1.6 Add close button to Dialog
    ↓
Phase 2: Accessibility + feedback (~3 hours)
    ├── 2.1 Aria-labels on icon buttons
    ├── 2.2 Skip-to-content link
    ├── 2.3 Dialog focus trap
    ├── 2.4 Focus-within for message actions
    ├── 2.5 Aria-live for new messages
    ├── 2.6 Fix channel name display
    ├── 2.7 Error boundaries
    └── 2.8 Toast notifications
    ↓
Phase 3: Layout refinements (optional, ~4 hours)
    ├── 3.1 Responsive sidebar
    ├── 3.2 Breadcrumbs
    ├── 3.3 Multi-line message input
    ├── 3.4 Dark mode toggle
    └── 3.5 File upload progress
```

---

## 8. Validation Gates Before Each Phase

| Phase                        | Gate                                                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------------------- |
| **Before Phase 1**           | `pnpm test` passes, `pnpm lint` passes, `pnpm typecheck` passes, `pnpm dev` starts without errors |
| **Before Phase 2**           | Phase 1 complete, all icons render correctly, Dialog close button visible                         |
| **Before Phase 3**           | Phases 1-2 complete, `pnpm test:e2e` passes, manual keyboard navigation test passes               |
| **Before merge (any phase)** | All tests pass, visual review of changed components, keyboard-only flow verification              |
