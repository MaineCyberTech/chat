# UI/UX Phase 7 — File-by-File Frontend Change Plan

## 1. Highest-Priority Frontend Targets

| Priority | Area                            | Reason                                              |
| -------- | ------------------------------- | --------------------------------------------------- |
| **P0**   | Icon buttons in message actions | Missing aria-labels — accessibility blocker         |
| **P0**   | Dialog component                | Missing focus trap — keyboard trap risk             |
| **P0**   | Message action visibility       | Keyboard users can't access hover-only actions      |
| **P0**   | ChatView new messages region    | No screen reader announcement for real-time updates |
| **P1**   | Skip-to-content link            | Keyboard navigation efficiency                      |
| **P1**   | Error boundaries                | Full-page crashes from uncaught errors              |
| **P1**   | Channel name display            | Shows raw ID instead of name                        |
| **P1**   | Toast notifications             | No feedback for create/send actions                 |
| **P2**   | Unicode icons → lucide-react    | Visual consistency + a11y                           |
| **P2**   | Loading states standardization  | Mixed skeleton/text patterns                        |

---

## 2. Safest Files/Areas to Touch First

| File                                            | Change                                                          | Risk |
| ----------------------------------------------- | --------------------------------------------------------------- | ---- |
| `packages/ui/src/components/dialog.tsx`         | Add focus trap, add close button                                | Low  |
| `apps/web/components/chat/message-list.tsx`     | Add aria-labels to icon buttons, add focus-within               | None |
| `apps/web/components/chat/message-input.tsx`    | Add aria-labels to file attach button                           | None |
| `apps/web/components/chat/search-bar.tsx`       | No changes needed — clean                                       | —    |
| `apps/web/components/chat/chat-view.tsx`        | Add aria-live region for new messages, fix channel name display | Low  |
| `apps/web/components/workspace/app-sidebar.tsx` | No critical changes — clean                                     | —    |
| `apps/web/app/layout.tsx`                       | Add skip-to-content link, add favicon                           | None |
| `apps/web/app/(workspace)/layout.tsx`           | Add ErrorBoundary wrapper                                       | Low  |
| `apps/web/app/globals.css`                      | No changes needed — clean                                       | —    |

---

## 3. Fragile Frontend Areas to Avoid Early

| File                                                    | Why Fragile                                                                    |
| ------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `apps/web/components/auth/auth-context.tsx`             | Core auth state — any regression breaks the entire app                         |
| `apps/web/lib/socket.ts`                                | Socket.io connection singleton — complex lifecycle                             |
| `apps/web/lib/api.ts`                                   | All API calls go through this — auth header injection, 401 handling            |
| `apps/web/app/page.tsx`                                 | Auth-aware routing — auto-redirect to workspace, conditional rendering         |
| `apps/web/components/chat/chat-view.tsx` (full rewrite) | 223 lines with Socket.io events, profiles, typing — refactor only if necessary |

---

## 4. Component Standardization Candidates

| Component        | Current State                     | Suggested Change                           | File                                    |
| ---------------- | --------------------------------- | ------------------------------------------ | --------------------------------------- |
| **Dialog**       | No focus trap, no close button    | Add `useFocusTrap` hook + visible X button | `packages/ui/src/components/dialog.tsx` |
| **Button**       | 3 variants, good focus styles     | No change needed — already standardized    | —                                       |
| **Input**        | Good — label, error, focus styles | No change needed                           | —                                       |
| **Badge**        | 4 variants, consistent            | No change needed                           | —                                       |
| **Skeleton**     | 3 sub-components                  | No change needed — already standardized    | —                                       |
| **Avatar**       | Initials + image, 3 sizes         | No change needed                           | —                                       |
| **SidebarGroup** | Collapsible toggle                | No change needed                           | —                                       |
| **Icon pattern** | Unicode characters throughout     | Replace with lucide-react icons            | Multiple files                          |

---

## 5. Layout/Shell Refinement Candidates

| File                                                            | Change                                                             | Phase     |
| --------------------------------------------------------------- | ------------------------------------------------------------------ | --------- |
| `apps/web/app/layout.tsx`                                       | Add skip-to-content link (`<a href="#main-content">`), add favicon | Phase 1-2 |
| `apps/web/app/(workspace)/layout.tsx`                           | Add ErrorBoundary wrapper, add optional breadcrumbs                | Phase 2-3 |
| `apps/web/app/(workspace)/[workspaceSlug]/[channelId]/page.tsx` | Pass channel name to ChatView instead of channel ID                | Phase 2   |
| `apps/web/components/app-header.tsx`                            | Optional: add dark mode toggle                                     | Phase 3   |

---

## 6. Form/Search/Feedback UX Candidates

| File                                                            | Change                                                                         | Phase   |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------ | ------- |
| `apps/web/components/chat/chat-view.tsx`                        | Add aria-live polite region above message list for screen reader announcements | Phase 2 |
| `apps/web/components/chat/message-input.tsx`                    | Upgrade `<input>` to `<textarea>`, add aria-label to file button               | Phase 2 |
| `apps/web/components/workspace/create-workspace-dialog.tsx`     | Add success toast after creation                                               | Phase 2 |
| `apps/web/components/channel/create-channel-dialog.tsx`         | Add success toast after creation                                               | Phase 2 |
| `apps/web/app/(workspace)/[workspaceSlug]/[channelId]/page.tsx` | Display channel name (not id) in ChatView header                               | Phase 2 |
| `apps/web/components/chat/search-bar.tsx`                       | Add aria-label to search input                                                 | Phase 2 |

---

## 7. Theme/Styling Cleanup Candidates

| Item             | Current                             | Change                                                                             | Effort |
| ---------------- | ----------------------------------- | ---------------------------------------------------------------------------------- | ------ |
| **Icons**        | Unicode ↩, ✎, ✕, 📎, ▸, +           | Replace with lucide-react (MessageSquare, Edit2, X, Paperclip, ChevronRight, Plus) | 1h     |
| **Favicon**      | None                                | Add `/public/favicon.svg` + `favicon-16x16.png` + manifest                         | 5m     |
| **Loading text** | "Loading..." in multiple components | Replace with Skeleton                                                              | 15m    |
| **CSS**          | 30 lines globals.css                | Clean — no changes needed                                                          | 0      |

---

## 8. Test and Visual QA Requirements Before Refactor

| Change                          | Test Requirements                                                  | Visual QA                                 |
| ------------------------------- | ------------------------------------------------------------------ | ----------------------------------------- |
| Dialog focus trap               | Unit test: focus enters dialog, traps correctly, restores on close | Manual keyboard test                      |
| Icon replacement (lucide-react) | None — purely visual                                               | Visual check of all icon locations        |
| aria-labels on buttons          | None — no visual change                                            | None                                      |
| aria-live region                | None — no visual change                                            | Screen reader test                        |
| Skip-to-content link            | None — no visual change                                            | Keyboard tab test                         |
| Error boundary                  | Unit test: renders children, catches errors, shows fallback        | Visual check of error fallback            |
| Toast notifications             | Unit test: fires on create action                                  | Visual check of toast position + dismiss  |
| Channel name display            | Existing tests should pass                                         | Visual: verify name vs ID                 |
| Responsive sidebar              | E2E test for mobile viewport                                       | Manual: mobile/tablet/desktop breakpoints |

---

## 9. Safe Patch Grouping Proposal

### Patch A: Accessibility essentials (~45 min)

```
packages/ui/src/components/dialog.tsx          [REFINE — focus trap + close button]
apps/web/components/chat/message-list.tsx       [REFINE — aria-labels + focus-within]
apps/web/components/chat/message-input.tsx      [REFINE — aria-label on file button]
apps/web/components/chat/chat-view.tsx          [REFINE — aria-live region]
apps/web/app/layout.tsx                         [REFINE — skip-to-content link]
```

### Patch B: Visual polish (~1.5 hours)

```
apps/web/app/layout.tsx                         [REFINE — add favicon]
apps/web/components/workspace/workspace-list.tsx  [REFINE — consistent hover transitions]
apps/web/components/channel/channel-list.tsx      [REFINE — consistent hover transitions]
apps/web/package.json                            [ADD — lucide-react dependency]
Multiple files                                   [REFINE — replace Unicode icons with lucide-react]
```

### Patch C: Feedback + resilience (~1.5 hours)

```
apps/web/app/(workspace)/layout.tsx             [REFINE — ErrorBoundary wrapper]
apps/web/components/workspace/create-workspace-dialog.tsx [REFINE — success toast]
apps/web/components/channel/create-channel-dialog.tsx     [REFINE — success toast]
apps/web/components/chat/chat-view.tsx          [REFINE — fix channel name display]
apps/web/components/chat/message-input.tsx      [REFINE — upgrade to textarea]
```

### Patch D: Responsiveness (optional, ~2 hours)

```
apps/web/components/workspace/app-sidebar.tsx   [REFINE — responsive collapse]
apps/web/app/(workspace)/layout.tsx             [REFINE — responsive layout]
apps/web/app/(workspace)/[workspaceSlug]/page.tsx [REFINE — breadcrumbs]
```

**Execution order**: A → B → C → D. Each patch independently verifiable.

---

## 10. Rollback-Sensitive Areas

| Change                  | Rollback Method                            | Notes                                       |
| ----------------------- | ------------------------------------------ | ------------------------------------------- |
| Dialog focus trap       | Revert dialog.tsx                          | Simple git revert                           |
| lucide-react dependency | Remove package + revert icon imports       | Check all imports before reverting          |
| Error boundaries        | Revert layout.tsx changes                  | Children won't be affected                  |
| Toast notifications     | Remove toast library + revert dialog calls | Check imports                               |
| Responsive sidebar      | Revert app-sidebar.tsx + layout            | Layout will fall back to full-width sidebar |
| Channel name display    | Revert ChatView + page.tsx props           | Will show ID again — harmless rollback      |
