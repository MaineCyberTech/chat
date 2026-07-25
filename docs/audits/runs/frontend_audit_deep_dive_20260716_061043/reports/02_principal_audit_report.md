# Principal Audit Report

- Prompt: **frontend_audit_deep_dive**
- Domain: **frontend**
- Run ID: **frontend_audit_deep_dive_20260716_061043**
- Generated: **2026-07-16T14:00:00Z**
- Decision: **GO WITH RISKS**
- P0: **0**, P1: **4**
- P2: **17**, P3: **15**
- Readiness: **71.00**

## Findings

### P1 — Admin tab navigation broken on mobile — sidebar hidden md:block

- **File:** `apps/web/app/(workspace)/[workspaceSlug]/admin/page.tsx`
- **Category:** Layout & Navigation
- **Impact:** Admin users on mobile cannot navigate between tabs
- **Fix:** Add mobile tab bar or dropdown selector for admin sub-pages on screens <768px

### P1 — Formatting bar buttons 28px on mobile fail WCAG 44px touch target minimum

- **File:** `apps/web/components/chat/formatting-bar.tsx`
- **Category:** Chat UX
- **Impact:** Users on mobile have difficulty tapping formatting buttons
- **Fix:** Increase button size to min 36px (44px preferred) on mobile via media query or responsive classes

### P1 — Search-bar missing aria-activedescendant on autocomplete input

- **File:** `apps/web/components/chat/search-bar.tsx`
- **Category:** Accessibility
- **Impact:** Screen reader users cannot effectively use search autocomplete
- **Fix:** Add role=combobox, aria-expanded, aria-activedescendant to input; role=listbox to results container

### P1 — Settings reset/delete dialogs lack focus traps — Tab escapes backdrop

- **File:** `apps/web/app/(workspace)/[workspaceSlug]/settings/page.tsx`
- **Category:** Interaction Quality
- **Impact:** Keyboard users can interact with page content behind confirmation dialogs
- **Fix:** Use shared Dialog component (packages/ui) which has built-in focus trap support

### P2 — Search-bar type dropdown/autocomplete lack role=listbox

- **File:** `apps/web/components/chat/search-bar.tsx`
- **Category:** Accessibility
- **Impact:** Screen readers may not announce list navigation properly
- **Fix:** Add role=listbox to container and role=option to each item

### P2 — Search results container lacks aria-live=polite

- **File:** `apps/web/app/(workspace)/[workspaceSlug]/search/page.tsx`
- **Category:** Accessibility
- **Impact:** Screen reader users get no feedback when search results update
- **Fix:** Add aria-live=polite to the search results container

### P2 — Formatting toolbar no arrow-key keyboard navigation (Tab-only through 15 buttons)

- **File:** `apps/web/components/chat/formatting-bar.tsx`
- **Category:** Accessibility
- **Impact:** Keyboard users must Tab 15 times to reach end of toolbar
- **Fix:** Add arrow-key navigation within toolbar with visual focus indicator

### P2 — Formatting toolbar no visible focus ring on buttons

- **File:** `apps/web/components/chat/formatting-bar.tsx`
- **Category:** Accessibility
- **Impact:** Keyboard users cannot see which button is focused
- **Fix:** Add focus-visible:outline-2 or ring classes to all formatting bar buttons

### P2 — Link/image buttons have aria-pressed: undefined for toggle states

- **File:** `apps/web/components/chat/formatting-bar.tsx`
- **Category:** Accessibility
- **Impact:** Screen reader users don't know if formatting is active
- **Fix:** Add aria-pressed={isActive} for toggle buttons like bold, italic

### P2 — Keyboard shortcuts shows Ctrl+K on macOS — no Mac modifier detection

- **File:** `apps/web/components/shared/keyboard-shortcuts.tsx`
- **Category:** Accessibility
- **Impact:** Mac users see incorrect modifier keys
- **Fix:** Detect platform via navigator.platform and show Cmd on macOS, Ctrl on Windows/Linux

### P2 — Keyboard shortcuts filter has no aria-live for result count

- **File:** `apps/web/components/shared/keyboard-shortcuts.tsx`
- **Category:** Accessibility
- **Impact:** Screen reader users get no feedback when filtering shortcuts
- **Fix:** Add aria-live=polite region showing filtered result count

### P2 — All error boundaries (5+ files) lack role=alert

- **File:** `apps/web/app/error.tsx, apps/web/app/(workspace)/error.tsx, apps/web/app/(auth)/error.tsx`
- **Category:** Accessibility
- **Impact:** Screen readers may not announce error state changes
- **Fix:** Add role=alert to the error message container in each error.tsx

### P2 — All loading states (5+ files) lack aria-busy=true / role=status

- **File:** `apps/web/app/loading.tsx, apps/web/app/(auth)/loading.tsx, apps/web/app/(workspace)/loading.tsx`
- **Category:** Accessibility
- **Impact:** Screen reader users don't know content is loading
- **Fix:** Add aria-busy=true on loading containers and role=status with aria-live=polite

### P2 — Root and auth loading show bare spinner instead of layout skeleton

- **File:** `apps/web/app/loading.tsx, apps/web/app/(auth)/loading.tsx`
- **Category:** Accessibility
- **Impact:** Poor perceived performance; layout shift on content paint
- **Fix:** Match the loading layout to actual page structure (AppHeader + main skeleton for root)

### P2 — Onboarding tour no role=dialog, no focus trap

- **File:** `apps/web/components/workspace/onboarding-tour.tsx`
- **Category:** Accessibility
- **Impact:** Keyboard/screen reader users can Tab behind the tour dialog
- **Fix:** Add role=dialog, aria-modal=true, and implement focus trap

### P2 — Cookie banner no focus trap, no aria-modal=true

- **File:** `apps/web/components/cookie-banner.tsx`
- **Category:** Accessibility
- **Impact:** Users can interact with page content behind the consent dialog
- **Fix:** Add aria-modal=true and focus trap when banner is visible

### P2 — Channel-info tab bar missing role=tablist, aria-selected

- **File:** `apps/web/components/chat/channel-info.tsx`
- **Category:** Accessibility
- **Impact:** Screen readers don't announce tab semantics
- **Fix:** Add role=tablist on container, role=tab on buttons, aria-selected on active tab

### P2 — Channel-info empty states lack actionable buttons or CTAs

- **File:** `apps/web/components/chat/channel-info.tsx`
- **Category:** State Design
- **Impact:** Users see empty state but don't know how to populate it
- **Fix:** Add contextual action buttons to empty states (Pin a message, Invite members)

### P2 — Settings dual save mechanism — auto-save AND Save button confusing

- **File:** `apps/web/app/(workspace)/[workspaceSlug]/settings/page.tsx`
- **Category:** Interaction Quality
- **Impact:** Users may be confused about whether changes persist
- **Fix:** Standardize on one pattern: auto-save with visual indicator, or manual save without auto-save

### P2 — Language change triggers window.location.reload()

- **File:** `apps/web/app/(workspace)/[workspaceSlug]/settings/page.tsx`
- **Category:** Interaction Quality
- **Impact:** Poor UX — full page flash on locale change
- **Fix:** Use router.refresh() or i18n provider locale switch without full browser reload

### P2 — Message list 30-frame RAF loop for initial scroll may jank on low-end devices

- **File:** `apps/web/components/chat/message-list.tsx:456-468`
- **Category:** Performance
- **Impact:** Potential jank on low-end mobile devices
- **Fix:** Use virtualizer.scrollToIndex with align:'end' once after short delay rather than RAF loop

### P2 — Pull-to-refresh indicator uses inline style objects instead of Tailwind utility classes

- **File:** `apps/web/components/chat/message-list.tsx:502-521`
- **Category:** Performance
- **Impact:** Slightly larger CSS-in-JS bundle; skips JIT compilation
- **Fix:** Convert to Tailwind utility classes where possible

### P2 — highlightText function duplicated in 2 files

- **File:** `apps/web/components/chat/search-bar.tsx:37, apps/web/app/(workspace)/[workspaceSlug]/search/page.tsx:39`
- **Category:** Data Display
- **Impact:** DRY violation; fix in one place will miss the other
- **Fix:** Extract to shared lib/highlight-text.ts or lib/search.ts

### P2 — Pagination logic duplicated across 3 admin tabs (users, channels, workspaces)

- **File:** `apps/web/app/(workspace)/[workspaceSlug]/admin/page.tsx`
- **Category:** Data Display
- **Impact:** Maintenance burden; bug fixes must be applied 3 times
- **Fix:** Extract a shared Pagination component or hook

### P2 — Admin stat grid uses grid-cols-2 on mobile — narrow cells

- **File:** `apps/web/app/(workspace)/[workspaceSlug]/admin/page.tsx`
- **Category:** Mobile UX
- **Impact:** Stat cards feel cramped on small screens
- **Fix:** Use grid-cols-1 on mobile, grid-cols-2 on sm+ breakpoint

### P2 — console.warn used instead of user-facing toast in 50+ catch blocks

- **File:** `apps/web/components/chat/chat-view.tsx, app-sidebar.tsx, emoji-picker.tsx, notification-bell.tsx, cookie-banner.tsx, and 45+ more locations`
- **Category:** Error Handling
- **Impact:** Users don't see error feedback for many failed operations
- **Fix:** Replace console.warn with addToast for user-visible operations; keep console.warn only for background operations

### P2 — Two parallel CSS variable systems active (Mattermost + design tokens) used interchangeably

- **File:** `apps/web/app/globals.css, packages/ui/src/styles.css`
- **Category:** Design System
- **Impact:** Visual inconsistency risk; harder to maintain theming
- **Fix:** Document boundary: shared UI components use --color-\* vars, app components use Mattermost vars; plan consolidation

### P2 — Dark mode --text-secondary hardcoded rgba(..., 0.8) instead of using --text-secondary-alpha variable

- **File:** `apps/web/app/globals.css:342`
- **Category:** Theme
- **Impact:** Dark mode text opacity differs from intended design token consistency
- **Fix:** Use rgba(var(--center-channel-color-rgb), var(--text-secondary-alpha))

### P3 — --border-default includes 'solid 1px' — not composable as border-left/border-top

- **File:** `apps/web/app/globals.css:124`
- **Category:** Design System
- **Impact:** 14+ files use less-than-ideal border declaration patterns
- **Fix:** Split into --border-default-width, --border-default-style, --border-default-color vars

### P3 — No result count shown in search results

- **File:** `apps/web/app/(workspace)/[workspaceSlug]/search/page.tsx`
- **Category:** Search
- **Impact:** Users don't know the size of their result set
- **Fix:** Show 'X results found' counter at top of search results

### P3 — Login form has no password strength indicator

- **File:** `apps/web/components/auth/login-form.tsx`
- **Category:** Forms
- **Impact:** Users don't know if their password meets requirements during signup
- **Fix:** Add visual password strength indicator with requirements checklist

### P3 — Login form no 'Forgot password?' link

- **File:** `apps/web/components/auth/login-form.tsx`
- **Category:** Forms
- **Impact:** Users who forget password have no recovery path on login page
- **Fix:** Add 'Forgot password?' link that triggers password reset flow

### P3 — Login form status container has no aria-live

- **File:** `apps/web/components/auth/login-form.tsx`
- **Category:** Accessibility
- **Impact:** Screen reader users may miss status updates after form submission
- **Fix:** Add aria-live=polite and role=status to the message container

### P3 — Notification preferences modal has no unsaved-changes detection

- **File:** `apps/web/components/chat/notification-preferences-modal.tsx`
- **Category:** Interaction
- **Impact:** Users can close modal and lose changes without warning
- **Fix:** Add dirty-state detection and confirm-before-close dialog

### P3 — Search date range not validated (dateFrom > dateTo allowed)

- **File:** `apps/web/app/(workspace)/[workspaceSlug]/search/page.tsx`
- **Category:** Search
- **Impact:** Users can submit invalid date ranges with no error feedback
- **Fix:** Add client-side validation: dateFrom must be before dateTo

### P3 — Search operator hint has hardcoded year '2025'

- **File:** `apps/web/components/chat/search-bar.tsx`
- **Category:** Search
- **Impact:** Outdated hint text in 2026+
- **Fix:** Use dynamic year from new Date().getFullYear()

### P3 — Settings page shows 'Loading...' text instead of Skeleton component

- **File:** `apps/web/app/(workspace)/[workspaceSlug]/settings/page.tsx`
- **Category:** Forms
- **Impact:** Inconsistent loading UX compared to rest of app
- **Fix:** Replace 'Loading...' with Skeleton component from @chat/ui

### P3 — Auto-responder textarea lacks character counter

- **File:** `apps/web/app/(workspace)/[workspaceSlug]/settings/page.tsx`
- **Category:** Forms
- **Impact:** Users may exceed API limits without warning
- **Fix:** Add character count display near auto-responder textarea

### P3 — 'Clear all' recent searches has no confirmation dialog

- **File:** `apps/web/components/chat/search-bar.tsx`
- **Category:** Interaction
- **Impact:** Accidental tap clears all recent search history with no undo
- **Fix:** Add confirmation dialog before clearing recent searches

### P3 — Admin export buttons lack loading spinner during export

- **File:** `apps/web/app/(workspace)/[workspaceSlug]/admin/page.tsx`
- **Category:** Admin UX
- **Impact:** No visual feedback during export operation
- **Fix:** Add loading state with spinner to export buttons

### P3 — Admin panel has no error boundary per tab — one failure kills all tabs

- **File:** `apps/web/app/(workspace)/[workspaceSlug]/admin/page.tsx`
- **Category:** Admin UX
- **Impact:** Error in one admin tab crashes entire admin panel
- **Fix:** Wrap each admin tab content in its own ErrorBoundary

### P3 — Admin panel document.title hardcoded instead of using i18n

- **File:** `apps/web/app/(workspace)/[workspaceSlug]/admin/page.tsx`
- **Category:** Admin UX
- **Impact:** Cannot localize admin page title
- **Fix:** Use t() for document.title or i18n metadata

### P3 — Inline StatusBadge and Card in admin — duplicates shared components from ui package

- **File:** `apps/web/app/(workspace)/[workspaceSlug]/admin/page.tsx`
- **Category:** Design System
- **Impact:** Duplicate component concerns; harder to maintain consistency
- **Fix:** Use StatusBadge from @chat/ui and extract Card component if needed

### P3 — ToggleRow defined inline in settings page instead of shared component

- **File:** `apps/web/app/(workspace)/[workspaceSlug]/settings/page.tsx`
- **Category:** Design System
- **Impact:** Cannot reuse ToggleRow pattern across the app
- **Fix:** Extract ToggleRow to packages/ui/src/components/

### P3 — CSV parser uses line.split(',') — breaks on quoted fields with commas

- **File:** `apps/web/app/(workspace)/[workspaceSlug]/admin/page.tsx`
- **Category:** Admin UX
- **Impact:** Imported CSV data with commas inside quoted fields will parse incorrectly
- **Fix:** Use a proper CSV parser library (e.g., papaparse) instead of naive split

### P3 — Dead CSS property gridArea: 'team-sidebar' — no CSS Grid parent present

- **File:** `apps/web/components/workspace/app-sidebar.tsx`
- **Category:** Code Quality
- **Impact:** Unused CSS property adds noise with no effect
- **Fix:** Remove orphaned gridArea property

### P3 — Encoding artifact — 'âœ“' should be Unicode checkmark character

- **File:** `apps/web/components/workspace/app-sidebar.tsx:581`
- **Category:** Code Quality
- **Impact:** Character displays incorrectly in some viewers
- **Fix:** Replace 'âœ“' with Unicode '\u2713' (✓) or '\u2714' (✔)

### P3 — Density modes defined in tokens but unused in any component

- **File:** `packages/ui/src/tokens/spacing.ts`
- **Category:** Design System
- **Impact:** Dead code that creates confusion about available design tokens
- **Fix:** Either implement density mode support or remove unused token definitions
