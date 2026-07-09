# Phase 6 — Safe Redesign and Refinement Roadmap

**Run**: 2026-07-09
**Auditor**: Principal UX / Frontend Architecture

---

## 1. Roadmap Summary

**4-phase program** spanning low-risk visual cleanup through medium-risk interaction refinements. No architectural changes. No redesigns. All improvements are incremental and independently revertible.

| Phase | Focus | Items | Effort | Risk |
|---|---|---|---|---|
| **P0** | Observation + validation | Audit UX-identified focus trap gaps, contrast spot-check, establish baseline | 1 engineer-day | None |
| **P1** | No-risk visual consistency | Button/Input adoption, dark mode alignment, empty states, spacing tokens | 3-4 engineer-days | Very Low |
| **P2** | Low-risk component consistency | Dialog adoption, settings sub-nav, channel filter, mark all read, search breadcrumb | 3-5 engineer-days | Low |
| **P3** | Medium-risk refinements | Post priority labels, reaction tooltip wording, modal portal, expanded Storybook | 4-6 engineer-days | Low-Medium |

---

## 2. Immediate Low-Risk Visual Wins (Phase 1)

These changes are visual-only, additive, or replacements of existing elements with equivalent-looking shared components.

### P1.1 — Dark Mode Color Alignment

- **Problem**: `globals.css` dark mode RGB values (e.g., `--semantic-color-danger: 248, 113, 113`) differ from `darkSemanticColors` (e.g., `red[300] = 252, 165, 165`)
- **Fix**: Copy RGB values from `darkSemanticColors` to `globals.css` dark mode block
- **Files**: `apps/web/app/globals.css`
- **Validation**: Visual diff on dark mode pages

### P1.2 — Button Component Adoption

- **Problem**: 15-20 ad-hoc `<button>` elements with manual class strings instead of `<Button variant="...">`
- **Fix**: Audit and replace with `<Button>` component from `@chat/ui`
- **Files**: `login-form.tsx`, `message-input.tsx`, `channel-info.tsx`, `chat-view.tsx`, `app-sidebar.tsx`, `search/page.tsx`, `admin/page.tsx`, `notification-preferences-modal.tsx`, `onboarding-tour.tsx`, `group-modal.tsx`, `delete-dialog.tsx`, `user-picker-modal.tsx`
- **Validation**: Visual comparison per button, ensure variant mapping is correct

### P1.3 — Input Component Adoption

- **Problem**: Raw `<input>` elements in forms without standardized `label`, `error`, `id` linking
- **Fix**: Replace with `<Input label="..." error={...}>` component
- **Files**: `login-form.tsx`, `create-channel-dialog.tsx`, `create-workspace-dialog.tsx`, `admin/page.tsx`, `settings/page.tsx`, `search-bar.tsx`, `group-modal.tsx`, `invite-members-modal.tsx`
- **Validation**: Form labels visible, error states styled correctly

### P1.4 — Empty State Standardization

- **Problem**: Inconsistent empty states across search, saved, scheduled, threads, groups
- **Fix**: Create `<EmptyState>` component (icon, title, description, optional action button) + adopt everywhere
- **Files**: Create `components/shared/empty-state.tsx`, update `search/page.tsx`, `saved/page.tsx`, `scheduled/page.tsx`, `threads/page.tsx`, `groups/page.tsx`, `channel-info.tsx`
- **Validation**: Each empty state renders correctly

### P1.5 — Sidebar "Mark All Read"

- **Problem**: Button exists in notification bell dropdown but not in sidebar
- **Fix**: Add "Mark all read" button to sidebar header or filter bar area
- **Files**: `app-sidebar.tsx`
- **Validation**: Click clears all unread indicators

---

## 3. Low-Risk Component Consistency Improvements (Phase 2)

### P2.1 — Dialog Component Adoption

- **Problem**: Multiple modal-like components use ad-hoc overlay+panel patterns instead of shared `<Dialog>`
- **Fix**: Audit and wrap modal content in `<Dialog>` component (open/close state, overlay, focus trap)
- **Files**: `group-modal.tsx`, `user-picker-modal.tsx`, `create-workspace-dialog.tsx`, `invite-members-modal.tsx`, `remind-modal.tsx`, `notification-preferences-modal.tsx`, `create-channel-dialog.tsx`
- **Validation**: Each modal opens/closes with focus trap, overlay click closes, Escape closes

### P2.2 — Settings Page Sub-Navigation

- **Problem**: All settings on single scrollable page
- **Fix**: Add left-nav or tab navigation: Profile, Notifications, Theme, Auto-Responder, Status
- **Files**: `apps/web/app/(workspace)/[workspaceSlug]/settings/page.tsx`
- **Validation**: Each section renders correctly, navigation scrolls to section

### P2.3 — Sidebar Channel Filter

- **Problem**: No way to filter/search channels in sidebar for large workspaces
- **Fix**: Add filter input at top of sidebar — filters channel list in-place as user types
- **Files**: `app-sidebar.tsx`
- **Validation**: Typing narrows channel list, clears restores full list

### P2.4 — Search Page Breadcrumb

- **Problem**: Search is a full-page replacement — no way to navigate back to channel
- **Fix**: Add "Back to [channel name]" breadcrumb/link at top of search results
- **Files**: `apps/web/app/(workspace)/[workspaceSlug]/search/page.tsx`
- **Validation**: Link navigates back to channel context

### P2.5 — Keyboard Shortcut for Mark All Read

- **Problem**: No keyboard shortcut for mark all read
- **Fix**: Register shortcut (e.g., Shift+Esc) in keyboard-shortcut-registry.ts
- **Files**: `lib/keyboard-shortcut-registry.ts`, `components/shared/keyboard-shortcuts.tsx`
- **Validation**: Shortcut works, shows in shortcuts modal

---

## 4. Medium-Risk Layout or Workflow Refinements (Phase 3)

### P3.1 — Post Priority Labels

- **Problem**: No way to mark messages as urgent/important (Mattermost has this)
- **Fix**: Add priority selector to TipTap editor + priority badge on message items
- **Files**: `components/chat/tiptap-editor.tsx`, `components/chat/message-list/message-item.tsx`
- **Risk**: Medium — changes core message composition and rendering flow
- **Validation**: Priority badge renders, filtering/search by priority works

### P3.2 — Reaction Tooltip Enhancement

- **Problem**: Tooltip should show "You and X others" when current user has reacted
- **Fix**: Update reaction hover tooltip text
- **Files**: `components/chat/message-list.tsx` (reaction rendering)
- **Risk**: Low — copy/conditional logic change

### P3.3 — Focus Trap Audit for All Modals

- **Problem**: Remaining modal-like components may lack focus traps
- **Fix**: Audit and add focus trap to any modal missing it
- **Files**: All components identified as modal-like (see A11Y-1)
- **Risk**: Low — additive guard, testing required for each modal
- **Validation**: Tab cycles through modal content only, Escape closes

### P3.4 — Modal Portal (Optional)

- **Problem**: Modals render inline where used — potential z-index conflicts
- **Fix**: Add `<ModalPortal>` component that renders modals at document root
- **Files**: Create `components/shared/modal-portal.tsx`, refactor Dialog to use portal
- **Risk**: Medium — structural change to modal rendering. Requires testing all modals for correct behavior.
- **Validation**: All modals render at correct z-order, overlay covers content

### P3.5 — Storybook Expansion

- **Problem**: Only 11 stories for 49 components + 10 UI package components
- **Fix**: Add stories for remaining shared components, key page states (loading, empty, error)
- **Files**: `*.stories.tsx` per component
- **Risk**: Low — additive, no production impact
- **Validation**: Stories render without errors

---

## 5. Accessibility and Responsiveness Priorities

Ordered by user impact:

| Priority | Item | Phase | Justification |
|---|---|---|---|
| 1 | Modal focus trap audit | P3 | Screen reader users trapped in modal without focus management |
| 2 | `aria-live` on message list | P3 | New messages should be announced |
| 3 | `role="menu"` on context menus | P2 | Proper semantics for menu interaction |
| 4 | Empty state screen reader text | P1 | Empty states should announce status |
| 5 | Color contrast systematic audit | P2 | Ensure WCAG AA compliance across all text |
| 6 | Loading skeleton `aria-busy` | P3 | Screen reader should know content is loading |
| 7 | Tablet layout verification | P2 | Ensure 768-1024px layouts are usable |
| 8 | Landscape mobile keyboard test | P2 | Verify UX-009 fix works end-to-end |

---

## 6. What Must Stay As-Is

| Element | Reason to Keep Frozen |
|---|---|
| **Auth flows** | Any auth change has maximum blast radius. Login, OAuth, magic link, verify flows must not be modified. |
| **Message send pipeline** | Optimistic UI + Socket.io delivery is the most critical user flow. No changes to composition or delivery chain. |
| **Workspace layout CSS Grid** | The app__body grid (TeamSidebar + AppSidebar + Content) is load-bearing layout. No structural changes. |
| **Globals.css variable names** | The `--center-channel-bg`, `--sidebar-bg`, etc. naming is used everywhere. Renaming would be a large-blast-radius refactor. |
| **Supabase RLS-driven auth** | Auth gating via Supabase RLS is the security model. UI changes must not bypass or simplify auth checks. |
| **Socket.io event contracts** | Any change to socket event names or payloads breaks real-time. Must remain stable. |
| **API route contracts** | `/api/v1/*` endpoints consumed by the frontend must remain stable unless changed in coordination with API. |

---

## 7. Recommended Sequence

```
Week 1: Phase 0 (Observation)
  ├── Audit existing focus traps across all modals → list gaps
  ├── Spot-check color contrast (3-5 key text/background pairs)
  ├── Record baseline visual regression snapshots
  └── Review AGENTS.md for any pre-existing UI/UX constraints

Week 2: Phase 1 (No-risk visual consistency)
  ├── P1.1 Dark mode color alignment (1h)
  ├── P1.2 Button component adoption (1-2 days with review)
  ├── P1.3 Input component adoption (1 day)
  ├── P1.4 EmptyState component + adoption (1 day)
  └── P1.5 Sidebar "Mark all read" (0.5 day)

Week 3: Phase 2 (Low-risk component consistency)
  ├── P2.1 Dialog component adoption (1-2 days)
  ├── P2.2 Settings sub-navigation (1 day)
  ├── P2.3 Sidebar channel filter (1 day)
  ├── P2.4 Search breadcrumb (0.5 day)
  └── P2.5 Keyboard shortcut (0.5 day)

Week 4: Phase 3 (Medium-risk refinements)
  ├── P3.1 Post priority labels (2-3 days — largest item)
  ├── P3.2 Reaction tooltip wording (0.5 day)
  ├── P3.3 Focus trap audit fixes (1 day)
  ├── P3.4 Modal portal (optional, 1-2 days)
  └── P3.5 Storybook expansion (1-2 days, ongoing)
```

---

## 8. Validation Gates Before Each Phase

### Before Phase 1

- [ ] Current visual regression tests pass (E2E snapshots)
- [ ] Unit tests pass (`pnpm test`)
- [ ] TypeScript build passes (`pnpm typecheck`)
- [ ] E2E tests pass (`pnpm test:e2e`)
- [ ] CHANGELOG.md notes the audit findings

### Before Phase 2

- [ ] Phase 1 changes deployed and smoke-tested (dev environment)
- [ ] No visual regression complaints from Phase 1
- [ ] All Phase 1 components have Storybook stories updated

### Before Phase 3

- [ ] Phase 2 changes deployed and smoke-tested
- [ ] Dialog migration validated — all modals work before-and-after
- [ ] Accessibility audit of Phase 2 changes (focus, contrast, semantics)

### Before Production Release

- [ ] Full E2E test suite passes
- [ ] Visual regression snapshots compared against baseline
- [ ] Manual QA on desktop + mobile + tablet
- [ ] Accessibility audit (automated + manual keyboard navigation)
- [ ] Dark mode visual inspection on all changed pages
- [ ] Performance profile on critical user flows (no regression)
