# Phase 4 — Accessibility, Responsiveness, Feedback States, and Perceived Performance

**Run**: 2026-07-09
**Auditor**: Principal UX / Frontend Architecture

---

## 1. Accessibility Strengths

### Current Repo

| Strength | Detail | Evidence |
|---|---|---|
| **Skip-to-main link** | `layout.tsx` has "Skip to main content" link that appears on focus | Line: `<a href="#main-content">` with `sr-only focus:not-sr-only` |
| **Focus traps** | Quick Switcher (UX-010), Emoji Picker (UX-011), ProfilePopover (UX-014), ContextMenu (UX-015) all have focus traps | Tab cycle handlers added in recent fixes |
| **Focus return** | ProfilePopover returns focus to trigger element on close | `useEffect` cleanup saves and restores `document.activeElement` |
| **Focus-within support** | Global hover-reveal patterns also trigger on `:focus-within` (UX-012) | `globals.css` line: `.group:focus-within .action-overlay` |
| **Reduced motion** | `@media (prefers-reduced-motion: reduce)` block in globals.css | Reduces all animation/transition durations to 0.01ms |
| **Reduced motion script** | `data-reduced-motion` attribute set on `<html>` before render | Inline script in `layout.tsx` |
| **Keyboard shortcut shortcuts** | Centralized registry + modal display | `keyboard-shortcuts.tsx`, `keyboard-shortcut-registry.ts` |
| **Sidebar keyboard nav** | ArrowLeft/ArrowRight for resize (UX-025), Move Up/Down for categories (UX-023) | `app-sidebar.tsx` |
| **Channel keyboard nav** | Alt+Up/Down for channel switching | `(workspace)/layout.tsx` |
| **aria-pressed on formatting buttons** | Formatting toolbar buttons have `aria-pressed` based on active state (UX-013) | `formatting-bar.tsx` |
| **Error boundaries** | Root + workspace + auth + channel-level error boundaries | Separate `error.tsx` files per route group |
| **viewport fit** | `VisualViewport` API script for iOS keyboard (UX-009) | `layout.tsx` inline script |
| **Safe area handling** | `env(safe-area-inset-bottom)` on bottom nav (UX-006), `env(safe-area-inset-top)` on mobile header (UX-007) | `(workspace)/layout.tsx` |
| **Touch targets** | Global min 36px on buttons, 44px on sidebar channels (mobile) | `globals.css` media queries |
| **Form label association** | `Input` component uses `htmlFor` linking label to input id | `input.tsx` |
| **Status text for screen readers** | Status pills use appropriate aria labels (assumed from `status-pill` class pattern) | Inferred from class naming |

### Reference Repo (Mattermost)

| Strength | Detail |
|---|---|
| **Focus trap hooks** | `useFocusTrap` hook in `@mattermost/components` — reusable across all modals |
| **Stacked modal hook** | `useStackedModal` — handles modal z-index stacking and focus management |
| **Comprehensive form error handling** | `form_error.tsx`, `input_error.tsx`, `message_submit_error.tsx` — dedicated error display components |
| **DeferredComponentRender** | HOC for lazy rendering — reduces initial load for offscreen components |
| **`root_portal.tsx`** | Centralized portal for modals — ensures modals render at correct DOM position |
| **Screen reader support** | `aria-label`, `role` attributes throughout (inferred from testing library usage) |
| **1,565 test files** | Comprehensive test coverage means accessibility regressions are more likely caught |

---

## 2. Accessibility Risks

### Current Repo

| Risk | Detail | Severity | Existing Fix? |
|---|---|---|---|
| **Focus management gap** | Some modal-like components (NotificationPreferencesModal, GroupModal, UserPickerModal, CreateWorkspaceDialog, InviteMembersModal, RemindModal, OnboardingTour, MediaRoom) may lack focus traps | Medium | Not yet audited for focus trap completeness |
| **Color contrast unknowns** | Only foreground.muted (UX-016) and text-secondary-alpha (UX-017) were addressed. Other color combinations not verified. | Medium | Partial — specific fix applied but no systematic audit |
| **Image alt text** | Avatar component handles `alt` prop but `MessageItem` may not have alt text on user-uploaded images | Low-Medium | Unknown — depends on implementation |
| **aria-live regions** | Message list may not have `aria-live="polite"` for new messages | Medium | Unknown — not evident from file inventory |
| **Empty state screen reader** | Empty states ("No messages", "No results") may not be announced to screen readers | Low | Unknown |
| **Loading state announcements** | Loading skeletons/spinners may not have `aria-busy` or `aria-label` | Low | Unknown |
| **Touch target verification** | Global min-size CSS applied but some custom interactive elements may be missed | Low | Partially — touch targets added in globals.css |
| **Channel type icon aria** | `.channel-type-icon` may lack `aria-hidden="true"` or descriptive text | Low | Unknown |
| **Context menu role** | Context menu needs `role="menu"` with `menuitem` children | Medium | UX-015 added focus management but role/aria attributes not confirmed |
| **Thread panel focus** | Thread panel opening may not trap focus or announce "Thread opened" | Medium | UX-035 added reactions but focus management not confirmed |

### Reference Repo

| Risk | Detail |
|---|---|
| **Bootstrap dependency** | Bootstrap 3.4.1 has known accessibility limitations (older ARIA patterns) |
| **No CSS module isolation** | Globally scoped Sass can cause unintended cascade — an accessibility fix may break unrelated areas |
| **No reduced-motion preference** | No `@media (prefers-reduced-motion)` found in the Sass files reviewed |

---

## 3. Responsive Design Findings

### Current Repo — Desktop (>1024px)

| Element | Behavior |
|---|---|
| **Layout** | CSS Grid: TeamSidebar (65px) + AppSidebar (resizable 200-500px) + Content (flex) + RHS (optional) |
| **Sidebar** | Full sidebar with categories, channel list, unread badges, drag-and-drop |
| **Message list** | Full-width with floating timestamps on hover, action overlays on hover |
| **Channel header** | 56px with channel name, member count, mute/bookmark buttons |
| **RHS** | Thread panel or channel info panel slides in from right |

### Current Repo — Tablet (768-1024px)

| Element | Behavior | Issues |
|---|---|---|
| **Layout** | Sidebar remains visible (no collapse) | Content area narrows but functional |
| **Message list** | Full width within available space | May feel cramped at 768px with sidebar open |
| **Channel header** | May truncate name or wrap | Acceptable |
| **Touch targets** | 36px+ minimum enforced | Good |

### Current Repo — Mobile (<768px)

| Element | Behavior | Issues |
|---|---|---|
| **Layout** | Full-width content with overlay sidebar on demand | Bottom nav looks good |
| **Sidebar** | Overlay panel at 80vw width, backdrop | Animation performance unknown |
| **Bottom nav** | Fixed: Back/Menu/Channels/Settings, safe-area bottom | 3.5rem height (2.75rem in landscape) |
| **Message list** | Full-width, action overlays always visible | Per UX design for mobile |
| **Channel header** | Condensed, may show back button | OK |
| **Thread panel** | Full-screen overlay on mobile | OK — standard pattern |
| **Message input** | Full-width with formatting bar above or collapsible | Keyboard may overlap (UX-009 fix mitigates) |
| **iOS prevention** | `font-size: 16px` on inputs prevents zoom | Important fix |
| **Landscape** | Smaller bottom nav (2.75rem) for more content space | Smart |

### Reference Repo — Responsive Approach

| Breakpoint | Behavior |
|---|---|
| Desktop | Full 3-panel layout (sidebar + center + RHS) |
| Tablet | Sidebar collapses to icons, RHS overlays |
| Mobile | Full-width with hamburger menu, bottom tabs |
| Responsive CSS | `sass/responsive/` contains 4 files (desktop, tablet, mobile with 2026 lines) |

---

## 4. Feedback State Findings

### Current Repo

| State | Implementation | Rating | Notes |
|---|---|---|---|
| **Loading (page)** | `loading.tsx` per route group + `Skeleton` component | Good | Centered spinners with context text ("Loading workspace...") |
| **Loading (list)** | Skeleton component available but not consistently used | Needs improvement | Some lists may show spinner instead of skeleton |
| **Loading (action)** | Button has `disabled:opacity-50` + `pointer-events-none` | Good | Visual disabled state for async actions |
| **Empty** | Inconsistent — "No messages" in channel, "No results" in search | Needs improvement | UX-050 improved channel-info empty states but others may lack |
| **Error (form)** | Input has `error` prop with styled error text | Good | Error text below input, red border |
| **Error (page)** | Error boundaries per route group with fallback UI | Good | Separate `error.tsx` files |
| **Error (API)** | `userSafeError` mapping (UX-049) in login form | Good | Raw errors no longer displayed |
| **Error (toast)** | Toast system for notification feedback | Good | UX-031 added toast for notification save failure |
| **Success** | Toast confirmations for saves, inline confirmations | Adequate | Not all actions have success feedback |
| **Optimistic UI** | `optimistic/` utilities for message send/edit/delete | Good | Immediate feedback, rollback on error |
| **Typing indicator** | Socket.io-based typing indicators | Presumed working | Not confirmed from file inventory |
| **Scheduled send** | RemindModal with date/time picker | Good | Presets + custom date/time |

### Reference Repo

| State | Pattern |
|---|---|
| Loading | `loading_screen.tsx` (full-screen), `loading_image_preview.tsx`, `spinner_button.tsx` |
| Empty | Various patterns — `SearchableChannelList` handles empty as "no results" |
| Error | `form_error.tsx`, `message_submit_error.tsx`, `post_deleted_modal.tsx` |
| Success | Toast system with multiple toast types |
| Deferred render | `deferComponentRender.tsx` HOC — defers offscreen rendering |

---

## 5. Perceived Performance Findings

### Current Repo

| Pattern | Implementation | Impact |
|---|---|---|
| **Route-level code splitting** | Next.js App Router automatically code-splits per route | Fast initial load — only current route JS loads |
| **Skeleton loading** | Reusable `Skeleton` component | Reduces perceived wait time vs spinner |
| **Optimistic UI** | Message send/edit/delete updates UI before API confirms | Messages appear instantly. Rollback on error. |
| **Inline scripts** | Theme, VP-height, reduced-motion set before React hydrates | Prevents flash of wrong theme/layout |
| **Socket.io real-time** | No polling — WebSocket for live updates | Instant message delivery, presence changes |
| **PWA service worker** | Cached assets for repeat visits | Near-instant load on return visits |
| **CSS-driven theme** | No JS blocking for initial theme application | No FOUT for theme switching |
| **Virtual message list** | `@tanstack/react-virtual` (UX-021) | Smooth scrolling with thousands of messages |
| **Thin scrollbar** | 6px scrollbar always visible | Less layout shift when scrollbar appears |
| **Tailwind v4** | JIT compilation, small CSS bundle | Minimal CSS payload per page |

### Reference Repo

| Pattern | Impact |
|---|---|
| **Webpack bundle** | Larger initial bundle than Next.js code splitting |
| **Sass global styles** | Single large CSS bundle — no per-route scoping |
| **Font loading** | 8+ woff/woff2 files block rendering — FOUT/FOIT risk |
| **Bootstrap + Font Awesome** | Additional CSS/icon payload (Bootstrap 3.4, FA 4.7) |
| **No PWA** | No service worker for offline/cached loading |
| **DeferredComponentRender** | Reduced initial render cost for offscreen components |
| **Redux** | Single global store — potentially larger than necessary state |

---

## 6. High-Priority UX Safety Fixes

| ID | Fix | Location | Risk | Priority |
|---|---|---|---|---|
| **A11Y-1** | Audit all modal-like components for focus trap completeness | NotificationPreferencesModal, GroupModal, UserPickerModal, CreateWorkspaceDialog, InviteMembersModal, RemindModal, OnboardingTour, MediaRoom | Low — additive guard | P2 |
| **A11Y-2** | Add `aria-live="polite"` to message list region for new message announcements | `message-list.tsx` or wrapper | Low — additive attribute | P3 |
| **A11Y-3** | Ensure all empty states include `role="status"` or similar screen reader announcement | All empty state renders | Low — additive attribute | P3 |
| **A11Y-4** | Verify all loading skeletons have `aria-busy="true"` | Skeleton component usage | Low — additive attribute | P3 |
| **A11Y-5** | Add `role="menu"` + `aria-orientation` to context menus | `context-menu.tsx` | Low — additive attributes | P2 |
| **A11Y-6** | Systematic color contrast audit — verify all text/background combinations meet WCAG AA | All component styles | Medium — may require color adjustments | P2 |
| **FEED-1** | Standardize empty state component — consistent messaging, icon, action button | All empty state locations | Low — new component + adoption | P2 |
| **FEED-2** | Add loading skeleton to search results, threads list, saved/scheduled pages | `search/page.tsx`, `threads/page.tsx`, `saved/page.tsx`, `scheduled/page.tsx` | Low — additive | P3 |
| **FEED-3** | Add success toast for message pin, flag, bookmark actions | `message-list.tsx`, context-menu actions | Low — additive | P3 |
| **RESP-1** | Verify tablet sidebar layout at 768-900px — ensure content area is wide enough for message reading | `(workspace)/layout.tsx` | Low — testing only | P3 |
| **RESP-2** | Test landscape mobile with keyboard open — verify message input is fully visible | `(workspace)/layout.tsx`, `message-input.tsx` | Low — VisualViewport fix exists (UX-009), verify | P2 |

---

## 7. Items Requiring Manual/Visual QA Before Change

| Item | Reason | Suggested QA |
|---|---|---|
| **Dark mode elevation shadows** | Shadows may be invisible on dark backgrounds | Visual inspection on actual dark display |
| **Sidebar text contrast (dark mode)** | `#e0e0e0` on `#0d2b66` — borderline AA | Contrast measurement tool |
| **Mobile sidebar animation** | 80vw overlay with backdrop — stutter on low-end devices? | Profile on mid-range Android |
| **Thread panel on mobile** | Full-screen overlay — check safe area, scroll behavior | Test on iOS Safari |
| **Context menu viewport clamping** | UX-041 fix — verify it works near all 4 screen edges | Manual test on mobile + desktop |
| **Quick Switcher modal** | Focus trap + keyboard nav — verify Tab cycles correctly | Keyboard-only test |
| **Emoji picker performance** | 3357 emojis — verify search is snappy, no scroll jank | Profile render time + scroll |
| **Landscape keyboard interaction** | Small viewport + keyboard = challenging UX | Test on iOS + Android |
| **Reduced motion** | Verify all animations respect the preference | System setting + visual inspection |
| **Visual regression tests** | 3 existing E2E snapshot tests — expand coverage | Add snapshots for key pages |
