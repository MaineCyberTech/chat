# Portal Frontend UI/UX Audit — Final Reconciliation

**Date**: June 21, 2026  
**Reference Repo**: `C:\temp\mainecybertech-portal` (client-portal)  
**Current Repo**: `C:\temp\chat` (chat-platform)  
**Audit Scope**: Portal frontend UI/UX only

---

## 1. Executive Summary

This audit compared the frontend UI/UX of two Next.js 15 applications sharing a common tech stack but serving different domains. The reference repo is an MSP client portal with a strong cyber-aesthetic brand; the current repo is a real-time workspace chat app.

**Key finding**: The current repo has **solid engineering fundamentals** (shared UI component library, focus-visible rings, skeleton loading, consistent dark mode) but needs **UX polish and accessibility fixes** — not visual redesign. The gaps are in a11y compliance (missing aria-labels, no focus trap, hover-only actions), feedback patterns (no toast notifications, no error boundaries), and visual consistency (Unicode icons, channel ID shown instead of name).

**Recommendation**: Three-phase incremental improvement totaling ~2-3 days: accessibility essentials first, then visual polish, then layout refinements. No architecture changes needed.

---

## 2. Frontend Architecture and UX Overview

| Dimension            | Current Repo                             | Reference Repo                                              |
| -------------------- | ---------------------------------------- | ----------------------------------------------------------- |
| **Framework**        | Next.js 15, all client components        | Next.js 15, server components + client islands              |
| **Styling**          | Tailwind v4, 30-line globals.css         | Tailwind v3, 136-line globals.css with 25+ custom utilities |
| **Component system** | 7 shared components in `packages/ui/`    | No shared library — all inline                              |
| **Auth**             | AuthProvider context + Supabase sessions | Server-side auth redirect + client actions                  |
| **Real-time**        | Socket.io with rooms, typing, presence   | Raw `ws` library                                            |
| **Navigation**       | Sidebar (w-60) + main content area       | Header with sub-nav tabs + breadcrumbs                      |
| **Icons**            | Unicode characters (↩, ✎, ✕, 📎)         | lucide-react library                                        |
| **Fonts**            | System-ui stack                          | Inter + Orbitron (Google Fonts)                             |
| **Theme**            | Light/dark via prefers-color-scheme      | Dark-only (#0A1118 base, emerald accent)                    |

---

## 3. Information Architecture Findings

### Strengths

- Clean 3-segment URL pattern: `/[workspaceSlug]/[channelId]`
- Sidebar-as-primary-nav aligns with user expectations for chat apps
- Auto-redirect to first workspace reduces friction for returning users
- Minimal chrome — header only shows when authenticated

### Issues

- Channel ID shown instead of channel name in ChatView header (`# {channelId}`)
- No breadcrumbs — users can't see navigation hierarchy in deep routes
- No workspace/channel count indicators
- No way to switch workspaces without scrolling sidebar
- Workspace list always shows '#' prefix — inconsistent with channel list (also '#' prefix)

---

## 4. Visual System and Component Findings

### Strengths

- 7 shared UI components with tests (Button, Avatar, Input, Badge, Skeleton, Dialog, SidebarGroup)
- Consistent `rounded-lg`, `transition-colors`, `focus-visible:ring-2` across all interactive elements
- Dark mode support in every component via `dark:` variants
- Skeleton components with pulse animation for loading states
- Hover-reveal message actions (reply/edit/delete) keep clean default state

### Issues

| Issue                                  | Severity | Location                                |
| -------------------------------------- | -------- | --------------------------------------- |
| Unicode icons instead of icon library  | Medium   | All chat components                     |
| Dialog lacks visible close button      | Medium   | `packages/ui/src/components/dialog.tsx` |
| No toast/success feedback              | Medium   | All create actions                      |
| Message input is single-line `<input>` | Low      | `message-input.tsx`                     |
| No favicon                             | Low      | `app/layout.tsx`                        |

---

## 5. Accessibility and Responsiveness Findings

### What's Good

- `focus-visible:ring-2` on all interactive elements
- `role="dialog"` and `aria-modal="true"` on Dialog
- `aria-hidden="true"` on Skeleton
- Form labels via `<label htmlFor="...">`
- Semantic HTML (`<header>`, `<main>`, `<aside>`, `<form>`, `<ul>`)
- Error messages rendered inline with inputs

### What's Missing (P0 — must fix)

| Issue                                        | Fix                                        | Effort |
| -------------------------------------------- | ------------------------------------------ | ------ |
| Icon buttons lack aria-labels                | Add `aria-label` to ↩, ✎, ✕, 📎, + buttons | 15m    |
| Dialog has no focus trap                     | Add `useFocusTrap` hook                    | 30m    |
| Message actions are hover-only               | Add `focus-within:` class                  | 5m     |
| New messages not announced to screen readers | Add `aria-live="polite"` region            | 10m    |

### What's Missing (P1 — should fix)

| Issue                            | Fix                            | Effort |
| -------------------------------- | ------------------------------ | ------ |
| No skip-to-content link          | Add `<a href="#main-content">` | 5m     |
| No error boundaries              | Add ErrorBoundary wrapper      | 30m    |
| Channel ID shown instead of name | Pass name prop to ChatView     | 15m    |

### Responsiveness

- Sidebar is fixed 240px — unusable on mobile
- No hamburger menu or mobile navigation
- Message bubbles use `max-w-[70%]` — adequate but no responsive breakpoints
- Dialog is `max-w-sm` (384px) — tight on small phones

---

## 6. Best Patterns Worth Adapting

| Pattern                  | Reference Source                       | Adaptation                           | Effort |
| ------------------------ | -------------------------------------- | ------------------------------------ | ------ |
| lucide-react icons       | Reference uses lucide-react throughout | Replace Unicode icons with lucide    | 1h     |
| Breadcrumbs              | PortalBreadcrumbs component            | Add breadcrumb to workspace layout   | 30m    |
| Error boundaries         | (pattern, not in reference)            | Add ErrorBoundary wrapper            | 30m    |
| Toast notifications      | (pattern, not in reference)            | Add sonner or react-hot-toast        | 1h     |
| Responsive subnav scroll | `cyber-subnav-scroll` utility          | Add to sidebar at mobile breakpoints | 2h     |

---

## 7. Current Frontend Strengths to Preserve

| Strength                                     | Why Preserve                                         |
| -------------------------------------------- | ---------------------------------------------------- |
| Shared component library                     | Reference has no equivalent — keep investing here    |
| Dark mode via prefers-color-scheme           | Respects user choice — reference forces dark         |
| Focus-visible rings                          | Strong keyboard a11y — reference is inconsistent     |
| Skeleton loading components                  | Consistent pattern — reference uses mixed approaches |
| Inline message editing                       | Direct manipulation, industry standard               |
| Hover-reveal actions (with focus-within fix) | Clean default state                                  |
| Sidebar-as-primary-nav                       | Appropriate for chat app                             |
| System-ui font stack                         | Fast loading, no external requests                   |
| Client-side auth context                     | Works reliably for current architecture              |

---

## 8. Risk Register

| Risk                                         | Likelihood | Impact                   | Mitigation                                      |
| -------------------------------------------- | ---------- | ------------------------ | ----------------------------------------------- |
| Dialog focus trap breaks existing behavior   | Low        | Medium (modal unusable)  | Unit test + keyboard E2E                        |
| Toast library conflicts with existing deps   | Low        | Low (build error)        | Use lightweight library (2KB)                   |
| Responsive sidebar breaks desktop layout     | Medium     | Medium (sidebar hidden)  | Test all breakpoints, use CSS-only toggle first |
| Error boundary swallows errors silently      | Low        | Medium (silent failures) | Log errors to Sentry in fallback                |
| lucide-react icon replacement misses buttons | Low        | Low (old icon persists)  | Run grep for Unicode chars after change         |

---

## 9. Safe UI/UX Roadmap

### Phase 1: Accessibility Essentials (~1 hour)

```
1. Aria-labels on all icon-only buttons
2. Focus trap + close button on Dialog
3. Focus-within for message action buttons
4. Aria-live region for real-time messages
5. Skip-to-content link in root layout
```

### Phase 2: Visual Polish + Feedback (~3 hours)

```
6. Replace Unicode icons with lucide-react
7. Add favicon/app icon
8. Add ErrorBoundary wrapper to workspace layouts
9. Add toast notifications for create/send actions
10. Fix channel name display (show name, not ID)
11. Standardize loading states to Skeleton only
12. Add hover transitions to all sidebar links
```

### Phase 3: Layout Refinements (optional, ~4 hours)

```
13. Responsive sidebar (hamburger toggle at <768px)
14. Breadcrumbs in workspace layout
15. Multi-line message input (textarea)
16. Manual dark mode toggle (optional)
17. File upload progress indicator
```

---

## 10. File/Area Change Recommendations

### Files to Modify

```
packages/ui/src/components/dialog.tsx              [REFINE — focus trap + close button]
apps/web/components/chat/message-list.tsx           [REFINE — aria-labels + focus-within]
apps/web/components/chat/message-input.tsx          [REFINE — aria-label, textarea upgrade]
apps/web/components/chat/chat-view.tsx              [REFINE — aria-live region, channel name]
apps/web/components/workspace/create-workspace-dialog.tsx [REFINE — success toast]
apps/web/components/channel/create-channel-dialog.tsx     [REFINE — success toast]
apps/web/app/layout.tsx                             [REFINE — skip-to-content, favicon]
apps/web/app/(workspace)/layout.tsx                 [REFINE — ErrorBoundary]
apps/web/package.json                               [REFINE — add lucide-react]
apps/web/components/workspace/app-sidebar.tsx       [REFINE — responsive collapse — Phase 3]
```

### Files to Create

```
apps/web/public/favicon.svg                         [CREATE]
apps/web/components/shared/error-boundary.tsx       [CREATE]
```

### Files to NOT Touch

```
apps/web/components/auth/auth-context.tsx           [Fragile — auth core]
apps/web/lib/socket.ts                              [Fragile — Socket.io lifecycle]
apps/web/lib/api.ts                                 [Fragile — API routing]
apps/web/app/page.tsx                               [Fragile — auth routing]
apps/web/app/globals.css                            [Clean — no changes needed]
```

---

## 11. Do-Not-Break Guardrails

1. **Auth must never break.** No changes to `auth-context.tsx`, `login-form.tsx`, `lib/supabase/client.ts`, or `lib/api.ts` without comprehensive test coverage.
2. **Socket.io event contracts are additive.** No renaming or removing events. New events only.
3. **Route structure must remain stable.** The `/[workspaceSlug]/[channelId]` pattern is a contract. Any change breaks existing links and browser history.
4. **No destructive component rewrites.** Do not replace `chat-view.tsx` or `message-list.tsx` wholesale — refactor incrementally.
5. **No server component migration.** Current app is fully client-side. Converting would break auth context, Socket.io, and real-time state.

---

## 12. Validation Checklist

### Before Any UI Changes

- [ ] `pnpm test` passes (all unit + component tests)
- [ ] `pnpm typecheck` passes (0 errors)
- [ ] `pnpm lint` passes (0 warnings on changed files)
- [ ] `pnpm dev` starts without errors

### Before Merge (Phase 1)

- [ ] All icon buttons have aria-labels
- [ ] Dialog traps focus correctly (test with Tab key)
- [ ] Message actions accessible via keyboard (Tab → Enter/Space)
- [ ] Screen reader announces new messages
- [ ] Skip-to-content link appears on Tab and navigates correctly

### Before Merge (Phase 2)

- [ ] Phase 1 items complete and validated
- [ ] All Unicode icons replaced with lucide-react equivalents
- [ ] Favicon renders in browser tab
- [ ] Toast notifications appear on create/send and auto-dismiss
- [ ] Error boundary catches simulated error and shows fallback
- [ ] Channel name displays correctly (not raw ID)

### Before Merge (Phase 3)

- [ ] Phases 1-2 complete
- [ ] Sidebar collapses and expands correctly at <768px
- [ ] Breadcrumbs show correct path
- [ ] Message input supports multi-line text
- [ ] File upload shows progress indicator

---

## 13. Final Recommendation

**Proceed with Phases 1 and 2 immediately** — these are safe, high-value, and address real accessibility gaps and UX friction points. Total effort is ~4 hours with zero architectural risk.

**Defer Phase 3** to a separate cycle — responsive sidebar and breadcrumbs add polish but are not blocking. Phase 3 is better scheduled alongside the infrastructure repo audit's Phase 2 (E2E test expansion) so that mobile breakpoints can be tested.

**Do not attempt to copy the reference repo's visual aesthetic** (cyber dark theme, glass cards, Orbitron fonts). The current repo's design language is appropriate for a chat application. Improvements should focus on polish and a11y within the existing visual system, not transformation to a different brand identity.
