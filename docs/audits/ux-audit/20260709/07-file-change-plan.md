# Phase 7 — File-by-File Frontend Change Plan

**Run**: 2026-07-09
**Auditor**: Principal UX / Frontend Architecture

---

## 1. Highest-Priority Frontend Targets

| Rank | File                                                          | Component/Page   | Why                                                                      | Change                                                             |
| ---- | ------------------------------------------------------------- | ---------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| 1    | `apps/web/app/globals.css`                                    | Global styles    | Dark mode RGB drift from semantic-colors.ts                              | Align dark mode RGB values with `darkSemanticColors`               |
| 2    | `apps/web/components/workspace/app-sidebar.tsx`               | Sidebar          | Multiple P2 fixes already applied, channel filter + mark all read remain | Add channel filter input, add "Mark all read" button               |
| 3    | `apps/web/components/auth/login-form.tsx`                     | Login form       | Uses `<Input>` partially, may have ad-hoc buttons                        | Audit button usage, ensure consistent                              |
| 4    | `apps/web/components/chat/message-input.tsx`                  | Message composer | Complex component, formatting bar, emoji picker                          | Post-priority integration (Phase 3)                                |
| 5    | `apps/web/components/chat/message-list.tsx`                   | Message list     | Core UX — reactions, context menu, virtual list                          | Reaction tooltip wording, `aria-live` region                       |
| 6    | `packages/ui/src/components/button.tsx`                       | Shared button    | Core component — needs to be adopted everywhere                          | No change needed to the component itself; adoption is in consumers |
| 7    | `packages/ui/src/components/input.tsx`                        | Shared input     | Core component                                                           | No change needed; adoption is in consumers                         |
| 8    | `apps/web/components/chat/notification-preferences-modal.tsx` | Modal            | May use ad-hoc modal pattern                                             | Refactor to use `<Dialog>`                                         |
| 9    | `apps/web/components/groups/group-modal.tsx`                  | Modal            | Ad-hoc modal                                                             | Refactor to use `<Dialog>`                                         |
| 10   | `apps/web/components/groups/user-picker-modal.tsx`            | Modal            | Ad-hoc modal                                                             | Refactor to use `<Dialog>`                                         |

---

## 2. Safest Files/Areas to Touch First

### Phase 1 — Visual Consistency (Lowest Risk)

| File                                                          | Change                  | Risk Level | Rollback                 |
| ------------------------------------------------------------- | ----------------------- | ---------- | ------------------------ |
| `apps/web/app/globals.css`                                    | Dark mode RGB alignment | Very Low   | Revert CSS values        |
| `apps/web/components/auth/login-form.tsx`                     | Button/Input adoption   | Low        | Revert component imports |
| `apps/web/components/chat/notification-preferences-modal.tsx` | Button adoption only    | Low        | Revert button tags       |
| `apps/web/components/workspace/app-sidebar.tsx`               | "Mark all read" button  | Low        | Remove button element    |
| `apps/web/components/home/landing-shell.tsx`                  | Button adoption         | Low        | Revert imports           |
| `apps/web/components/channel/create-channel-dialog.tsx`       | Input + Button adoption | Low        | Revert component usage   |
| `apps/web/components/workspace/create-workspace-dialog.tsx`   | Input adoption          | Low        | Revert                   |

### Phase 2 — Component Standardization (Low Risk)

| File                                                          | Change                  | Risk Level | Rollback    |
| ------------------------------------------------------------- | ----------------------- | ---------- | ----------- |
| `apps/web/components/groups/group-modal.tsx`                  | Wrap in `<Dialog>`      | Low-Medium | Unwrap      |
| `apps/web/components/groups/user-picker-modal.tsx`            | Wrap in `<Dialog>`      | Low-Medium | Unwrap      |
| `apps/web/components/workspace/invite-members-modal.tsx`      | Wrap in `<Dialog>`      | Low-Medium | Unwrap      |
| `apps/web/components/chat/remind-modal.tsx`                   | Wrap in `<Dialog>`      | Low-Medium | Unwrap      |
| `apps/web/components/chat/notification-preferences-modal.tsx` | Wrap in `<Dialog>`      | Low-Medium | Unwrap      |
| `apps/web/components/channel/create-channel-dialog.tsx`       | Wrap in `<Dialog>`      | Low-Medium | Unwrap      |
| `apps/web/app/(workspace)/[workspaceSlug]/settings/page.tsx`  | Add sub-navigation tabs | Low        | Remove tabs |
| `apps/web/app/(workspace)/[workspaceSlug]/search/page.tsx`    | Add breadcrumb          | Low        | Remove link |

---

## 3. Fragile Frontend Areas to Avoid Early

| Area                                         | Reason                                                                              | Don't Touch Until                   |
| -------------------------------------------- | ----------------------------------------------------------------------------------- | ----------------------------------- |
| `apps/web/components/chat/message-list.tsx`  | Core UX — virtual list, optimistic UI, reactions, socket events. High blast radius. | Phase 3 (only for reaction tooltip) |
| `apps/web/components/chat/chat-view.tsx`     | Orchestrates message list, input, thread panel, channel info                        | No changes planned                  |
| `apps/web/components/chat/tiptap-editor.tsx` | Complex TipTap integration                                                          | Phase 3 (only for priority labels)  |
| `apps/web/app/(workspace)/layout.tsx`        | CSS Grid workspace layout                                                           | No changes planned                  |
| `apps/web/app/layout.tsx`                    | Root layout — providers, CSP, inline scripts                                        | No changes planned                  |
| `apps/web/components/chat/message-input.tsx` | Composer with slash commands, emoji, paste                                          | Phase 3                             |
| `packages/ui/src/styles.css`                 | Design system CSS — changes cascade everywhere                                      | No changes planned                  |
| `apps/web/app/api/v1/[...path]/route.ts`     | BFF layer — API contract                                                            | No changes planned                  |
| `apps/web/lib/socket.ts`                     | Socket.io client contract                                                           | No changes planned                  |
| `apps/web/lib/supabase/`                     | Supabase client — auth foundation                                                   | No changes planned                  |

---

## 4. Component Standardization Candidates

Ordered by adoption priority:

| Candidate          | Current Pattern            | Target Pattern                        | Components Affected           |
| ------------------ | -------------------------- | ------------------------------------- | ----------------------------- |
| **Button**         | `<button className="...">` | `<Button variant="...">`              | ~15-20 instances across app   |
| **Input**          | `<input className="...">`  | `<Input label error>`                 | ~10-15 instances              |
| **Dialog**         | Ad-hoc overlay + panel     | `<Dialog>` wrapper                    | ~6-7 modals                   |
| **EmptyState**     | Inline text / nothing      | `<EmptyState icon title description>` | ~8 empty states               |
| **Spacing tokens** | `p-4`, `px-3 py-2`         | Token-aware classes                   | All components (low priority) |
| **Error display**  | Raw error / console        | `<FormError>` + `<Input error>`       | ~5 forms                      |

---

## 5. Layout/Shell Refinement Candidates

| Area                 | Current                | Target                               | Phase |
| -------------------- | ---------------------- | ------------------------------------ | ----- |
| **Settings page**    | Single scrollable page | Left-nav + section content           | P2    |
| **Search page**      | Full-page search       | Breadcrumb link to current channel   | P2    |
| **Sidebar**          | Channel list only      | Channel filter input at top          | P2    |
| **Sidebar header**   | Workspace name         | "Mark all read" button               | P1    |
| **Channel info RHS** | Members + Pinned tabs  | Empty state for tabs with no content | P1    |

---

## 6. Form/Table/Search UX Candidates

| Area                      | Issue                         | Fix                           | Phase |
| ------------------------- | ----------------------------- | ----------------------------- | ----- |
| **Login form**            | Some ad-hoc styling           | Full Button/Input adoption    | P1    |
| **Create channel form**   | Raw inputs                    | Input component adoption      | P1    |
| **Create workspace form** | Raw inputs                    | Input component adoption      | P1    |
| **Admin: user list**      | Raw errors possible           | Error display standardization | P1    |
| **Search bar**            | Input styling not token-aware | Input component adoption      | P1    |
| **Group modal**           | Ad-hoc modal                  | Dialog adoption               | P2    |
| **User picker modal**     | Ad-hoc modal                  | Dialog adoption               | P2    |
| **Invite members modal**  | Ad-hoc modal                  | Dialog adoption               | P2    |
| **Settings forms**        | Raw inputs                    | Input component adoption      | P1    |

---

## 7. Theme/Styling Cleanup Candidates

| File                           | Issue                                                                   | Fix                                      | Phase         |
| ------------------------------ | ----------------------------------------------------------------------- | ---------------------------------------- | ------------- |
| `apps/web/app/globals.css`     | Dark mode RGB values differ from TS tokens                              | Align with `darkSemanticColors`          | P1            |
| `apps/web/app/globals.css`     | Some values are hand-picked, not derived from token system              | Consider generating from tokens          | P2 (optional) |
| `apps/web/components/**/*.tsx` | Ad-hoc `text-*`, `bg-*`, `p-*` classes mixed with `var(--*)` references | Gradual migration to token-aware classes | Ongoing       |

---

## 8. Test and Visual QA Requirements Before Refactor

### Per-Phase Validation

| Phase  | Required Tests                                                                                                 | Visual QA                                                                                      |
| ------ | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| **P1** | Run existing test suite. No new tests required for visual-only changes.                                        | Spot-check dark mode on all changed pages. Compare button/input before/after screenshots.      |
| **P2** | Add Storybook stories for new EmptyState component. Test each Dialog-wrapped modal opens and closes correctly. | Visual check every modal, settings tab, channel filter behavior.                               |
| **P3** | Unit tests for priority label rendering. Reaction tooltip test. Focus trap test for each audited modal.        | Full visual regression run. Compare priority label rendering. Comprehensive keyboard nav test. |

### Storybook Stories to Add

| Component        | Priority | Current |
| ---------------- | -------- | ------- |
| EmptyState       | High     | None    |
| AppSidebar       | Medium   | None    |
| ChatView         | Medium   | None    |
| ThreadPanel      | Medium   | None    |
| ChannelInfo      | Medium   | None    |
| MessageInput     | Medium   | None    |
| LoginForm        | Low      | None    |
| OnboardingTour   | Low      | None    |
| SearchBar        | Low      | None    |
| NotificationBell | Low      | None    |

---

## 9. Safe Patch Grouping Proposal

### Patch Group A (Phase 1 — One PR)

```
globals.css              — Dark mode RGB alignment
login-form.tsx           — Button/Input adoption
create-channel-dialog.tsx — Button/Input adoption
create-workspace-dialog.tsx — Input adoption
landing-shell.tsx         — Button adoption
notification-preferences-modal.tsx — Button adoption
settings/page.tsx         — Input adoption
admin/page.tsx            — Input adoption
search-bar.tsx            — Input adoption
```

**Rationale**: All visual-only, independent changes. Low blast radius. Easy to review and revert individually.

### Patch Group B (Phase 1 — Second PR)

```
app-sidebar.tsx          — "Mark all read" button
shared/empty-state.tsx   — New component
search/page.tsx          — EmptyState adoption
saved/page.tsx           — EmptyState adoption
scheduled/page.tsx       — EmptyState adoption
threads/page.tsx         — EmptyState adoption
groups/page.tsx          — EmptyState adoption
channel-info.tsx         — EmptyState adoption
```

**Rationale**: New EmptyState component + adoption + sidebar button. All additive.

### Patch Group C (Phase 2 — Third PR)

```
group-modal.tsx           — Dialog adoption
user-picker-modal.tsx     — Dialog adoption
invite-members-modal.tsx  — Dialog adoption
remind-modal.tsx          — Dialog adoption
create-channel-dialog.tsx — Dialog adoption (if not done in P1)
notification-preferences-modal.tsx — Dialog adoption
create-workspace-dialog.tsx — Dialog adoption
settings/page.tsx         — Sub-navigation
```

**Rationale**: Modal refactors + settings nav. Medium risk — each modal needs independent testing.

### Patch Group D (Phase 2 — Fourth PR)

```
app-sidebar.tsx           — Channel filter input
search/page.tsx           — Breadcrumb
keyboard-shortcut-registry.ts — Mark all read shortcut
keyboard-shortcuts.tsx    — Shortcut modal update
```

**Rationale**: Independent additive features. Low blast radius.

### Patch Group E (Phase 3 — Fifth PR)

```
message-list.tsx          — Reaction tooltip wording
message-item.tsx          — Priority label rendering
tiptap-editor.tsx         — Priority selector
message-input.tsx         — Priority selector integration
```

**Rationale**: Largest change — touches core composition + rendering. Needs thorough testing.

### Patch Group F (Phase 3 — Sixth PR)

```
All modal components       — Focus trap audit fixes
shared/modal-portal.tsx    — New component (optional)
*/.stories.tsx             — Storybook expansion
```

**Rationale**: Accessibility + documentation. Low production risk but wide file count.

---

## 10. Rollback-Sensitive Areas

| Change Type                                 | Rollback Strategy                                    | Time to Revert           |
| ------------------------------------------- | ---------------------------------------------------- | ------------------------ |
| **CSS variable change**                     | `git revert` on globals.css                          | 5 min                    |
| **Component replacement (Button/Input)**    | `git revert` on each file                            | 15 min per file          |
| **Dialog wrapper**                          | Unwrap content from `<Dialog>`, restore original DOM | 30 min per modal         |
| **New component (EmptyState, ModalPortal)** | Remove imports, restore old rendering                | 30 min across all files  |
| **Channel filter input**                    | Remove JSX + state                                   | 15 min                   |
| **Settings sub-navigation**                 | Restore flat page                                    | 30 min                   |
| **Post priority labels**                    | Remove TipTap extension + message rendering changes  | 1-2 hours (largest item) |
| **Reaction tooltip wording**                | Revert conditional logic                             | 15 min                   |
| **Focus trap addition**                     | Remove `useEffect` + refs                            | 15 min per modal         |
| **Storybook stories**                       | Revert story files                                   | 5 min per file           |

All Phase 1 and Phase 2 changes are revertible within 30 minutes individually. Phase 3 changes (priority labels, modal portal) may require up to 2 hours to fully revert due to cross-file dependencies.
