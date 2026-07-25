# Frontend Release Gate Report

- Prompt: **chat_ux_specialization**
- Domain: **uxui**
- Run ID: **chat_ux_specialization_20260716_061136**
- Generated: **2026-07-16T14:00:00Z**
- Decision: **GO WITH RISKS**
- P0: **0**, P1: **8**
- P2: **14**, P3: **10**
- Readiness: **71.00**

## Findings

### P1 — Admin tab navigation broken on mobile — sidebar hidden md:block

- **File:** `apps/web/app/(workspace)/[workspaceSlug]/admin/page.tsx`
- **Category:** Admin UX
- **Impact:** Admin users on mobile cannot navigate between tabs at all
- **Fix:** Add mobile tab bar or dropdown selector for admin sub-pages on screens <768px

### P1 — Search-bar missing aria-activedescendant on autocomplete input

- **File:** `apps/web/components/chat/search-bar.tsx`
- **Category:** Accessibility
- **Impact:** Screen reader users cannot effectively use search autocomplete
- **Fix:** Add role=combobox, aria-expanded, aria-activedescendant to input; role=listbox to results

### P1 — Formatting bar buttons 28px on mobile fail WCAG 44px touch target minimum

- **File:** `apps/web/components/chat/formatting-bar.tsx`
- **Category:** Mobile UX
- **Impact:** Mobile users struggle to tap small formatting buttons
- **Fix:** Increase button size to min 36px (44px preferred) on mobile via responsive classes

### P1 — Admin page: 150+ hardcoded strings, zero i18n usage

- **File:** `apps/web/app/(workspace)/[workspaceSlug]/admin/page.tsx`
- **Category:** i18n
- **Impact:** Cannot localize admin interface for non-English users
- **Fix:** Extract all UI strings to en.json and use t() function from @/lib/i18n

### P1 — Settings page: 80+ hardcoded strings, zero i18n usage

- **File:** `apps/web/app/(workspace)/[workspaceSlug]/settings/page.tsx`
- **Category:** i18n
- **Impact:** Cannot localize settings for non-English users
- **Fix:** Extract all UI strings to en.json and use t() function

### P1 — Search-bar: 50+ hardcoded strings, zero i18n usage

- **File:** `apps/web/components/chat/search-bar.tsx`
- **Category:** i18n
- **Impact:** Cannot localize search for non-English users
- **Fix:** Extract all UI strings to en.json and use t() function

### P1 — Settings reset/delete dialogs lack focus traps — Tab escapes backdrop

- **File:** `apps/web/app/(workspace)/[workspaceSlug]/settings/page.tsx`
- **Category:** Accessibility
- **Impact:** Keyboard users can interact with page behind confirmation dialogs
- **Fix:** Use shared Dialog component from @chat/ui which has built-in focus trap

### P1 — Channel-info silently catches API failures, returns empty arrays

- **File:** `apps/web/components/chat/channel-info.tsx:31-34`
- **Category:** State Design
- **Impact:** Silent failure — users see empty data with no indication of error
- **Fix:** Surface error state with retry option instead of .catch(() => ({ messages: [] }))

### P2 — Settings dual save mechanism — auto-save AND Save button confusing

- **File:** `apps/web/app/(workspace)/[workspaceSlug]/settings/page.tsx`
- **Category:** Forms
- **Impact:** Users confused about whether changes persist
- **Fix:** Standardize on one pattern: auto-save with indicator or manual save without auto-save

### P2 — Language change triggers window.location.reload()

- **File:** `apps/web/app/(workspace)/[workspaceSlug]/settings/page.tsx`
- **Category:** Forms
- **Impact:** Full page flash on locale change — poor UX
- **Fix:** Use router.refresh() or i18n provider locale switch without full reload

### P2 — No result count shown in search results

- **File:** `apps/web/app/(workspace)/[workspaceSlug]/search/page.tsx`
- **Category:** Search
- **Impact:** Users don't know result set size
- **Fix:** Add 'X results found' counter at top of results

### P2 — Search-bar type dropdown/autocomplete lack role=listbox

- **File:** `apps/web/components/chat/search-bar.tsx`
- **Category:** Accessibility
- **Impact:** Screen readers don't announce list navigation
- **Fix:** Add role=listbox to container, role=option to items

### P2 — Search results container lacks aria-live=polite

- **File:** `apps/web/app/(workspace)/[workspaceSlug]/search/page.tsx`
- **Category:** Accessibility
- **Impact:** Screen reader users get no feedback when results update
- **Fix:** Add aria-live=polite to results container

### P2 — Formatting toolbar no arrow-key navigation — Tab-only through 15 buttons

- **File:** `apps/web/components/chat/formatting-bar.tsx`
- **Category:** Interaction
- **Impact:** Inefficient keyboard navigation
- **Fix:** Add arrow-key navigation within toolbar

### P2 — Formatting toolbar buttons lack visible focus ring

- **File:** `apps/web/components/chat/formatting-bar.tsx`
- **Category:** Accessibility
- **Impact:** Keyboard users can't see focus position
- **Fix:** Add focus-visible:ring or outline to all buttons

### P2 — Link/image formatting buttons have aria-pressed: undefined

- **File:** `apps/web/components/chat/formatting-bar.tsx`
- **Category:** Accessibility
- **Impact:** Screen reader users don't know if formatting is active
- **Fix:** Add aria-pressed={isActive} to toggle buttons

### P2 — Formatting bar: 20+ hardcoded strings, zero i18n

- **File:** `apps/web/components/chat/formatting-bar.tsx`
- **Category:** i18n
- **Impact:** Cannot localize formatting UI for non-English users
- **Fix:** Use t() for button aria-labels and tooltips

### P2 — Notification preferences modal: 20+ hardcoded strings, zero i18n

- **File:** `apps/web/components/chat/notification-preferences-modal.tsx`
- **Category:** i18n
- **Impact:** Cannot localize notification preferences
- **Fix:** Use t() for all modal UI strings

### P2 — Keyboard shortcuts modal: 25+ hardcoded strings, zero i18n

- **File:** `apps/web/components/shared/keyboard-shortcuts.tsx`
- **Category:** i18n
- **Impact:** Cannot localize keyboard shortcuts
- **Fix:** Use t() for all shortcut labels and categories

### P2 — Keyboard shortcuts show 'Ctrl+K' on macOS — no platform detection

- **File:** `apps/web/components/shared/keyboard-shortcuts.tsx`
- **Category:** Accessibility
- **Impact:** Mac users see incorrect modifier labels
- **Fix:** Detect platform and show Cmd on macOS, Ctrl on Windows/Linux

### P2 — Keyboard shortcuts filter has no aria-live for result count

- **File:** `apps/web/components/shared/keyboard-shortcuts.tsx`
- **Category:** Accessibility
- **Impact:** Screen reader users have no feedback when filtering
- **Fix:** Add aria-live=polite region for filtered count

### P2 — All error boundaries (5+ files) lack role=alert

- **File:** `apps/web/app/error.tsx, apps/web/app/(workspace)/error.tsx, apps/web/app/(auth)/error.tsx`
- **Category:** Accessibility
- **Impact:** Screen readers may not announce errors
- **Fix:** Add role=alert to error message containers in each error.tsx

### P2 — All loading states (5+ files) lack aria-busy=true / role=status

- **File:** `apps/web/app/loading.tsx, apps/web/app/(auth)/loading.tsx, apps/web/app/(workspace)/loading.tsx`
- **Category:** Accessibility
- **Impact:** Screen reader users don't know content is loading
- **Fix:** Add aria-busy=true and role=status with aria-live=polite

### P2 — Root and auth loading show bare spinner instead of layout skeleton

- **File:** `apps/web/app/loading.tsx, apps/web/app/(auth)/loading.tsx`
- **Category:** State Design
- **Impact:** Poor perceived performance; layout shift
- **Fix:** Match loading skeleton to actual page layout

### P2 — Workspace loading skeleton shown on mobile includes sidebar unconditionally

- **File:** `apps/web/app/(workspace)/loading.tsx`
- **Category:** Responsive
- **Impact:** Loading skeleton doesn't match mobile layout
- **Fix:** Show mobile-appropriate skeleton on small screens

### P2 — Onboarding tour has no role=dialog, no focus trap

- **File:** `apps/web/components/workspace/onboarding-tour.tsx`
- **Category:** Accessibility
- **Impact:** Keyboard users can Tab behind the tour
- **Fix:** Add role=dialog, aria-modal=true, focus trap

### P2 — Cookie banner has role=dialog but no focus trap and no aria-modal=true

- **File:** `apps/web/components/cookie-banner.tsx`
- **Category:** Accessibility
- **Impact:** Users can interact behind the consent dialog
- **Fix:** Add aria-modal=true and focus trap when visible

### P2 — Channel-info tab bar missing role=tablist, aria-selected on tabs

- **File:** `apps/web/components/chat/channel-info.tsx`
- **Category:** Accessibility
- **Impact:** Screen readers don't get tab semantics
- **Fix:** Add proper ARIA tab pattern: role=tablist, role=tab, aria-selected

### P2 — Channel-info empty states lack actionable buttons

- **File:** `apps/web/components/chat/channel-info.tsx`
- **Category:** State Design
- **Impact:** Dead-end empty states without guidance
- **Fix:** Add contextual action buttons (Pin a message, Invite members)

### P2 — highlightText function duplicated in 2 files

- **File:** `apps/web/components/chat/search-bar.tsx:37, apps/web/app/(workspace)/[workspaceSlug]/search/page.tsx:39`
- **Category:** Data Display
- **Impact:** DRY violation — maintenance risk
- **Fix:** Extract to shared lib/highlight-text.ts

### P2 — Pagination logic duplicated across 3 admin tabs

- **File:** `apps/web/app/(workspace)/[workspaceSlug]/admin/page.tsx`
- **Category:** Data Display
- **Impact:** Maintenance burden — bugs fixed 3x
- **Fix:** Extract shared Pagination component

### P2 — Admin stat grid uses grid-cols-2 on mobile — narrow cells

- **File:** `apps/web/app/(workspace)/[workspaceSlug]/admin/page.tsx`
- **Category:** Mobile UX
- **Impact:** Cramped mobile stats display
- **Fix:** Use grid-cols-1 on mobile, grid-cols-2 on sm+

### P2 — Message list 30-frame RAF loop for initial scroll may jank

- **File:** `apps/web/components/chat/message-list.tsx:456-468`
- **Category:** Performance
- **Impact:** Potential jank on low-end devices
- **Fix:** Replace with single scrollToIndex call after short delay

### P2 — Two parallel CSS variable systems (Mattermost + design tokens) active interchangeably

- **File:** `apps/web/app/globals.css, packages/ui/src/styles.css`
- **Category:** Design System
- **Impact:** Theming consistency risk
- **Fix:** Document component boundaries for each var system; plan consolidation

### P2 — console.warn used instead of user-facing toast in 50+ catch blocks

- **File:** `apps/web/components/chat/chat-view.tsx, app-sidebar.tsx, emoji-picker.tsx, and 45+ more`
- **Category:** Error Handling
- **Impact:** Silent failures — users don't see errors
- **Fix:** Replace console.warn with addToast for user-visible operations

### P2 — Dark mode --text-secondary hardcoded rgba instead of using --text-secondary-alpha var

- **File:** `apps/web/app/globals.css:342`
- **Category:** Theme
- **Impact:** Dark mode opacity differs from design token
- **Fix:** Use rgba(var(--center-channel-color-rgb), var(--text-secondary-alpha))
