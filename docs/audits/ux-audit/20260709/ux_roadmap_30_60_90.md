# UX Remediation Roadmap — 30/60/90 Day Plan

## First 30 Days: Critical Usability, Responsive & Accessibility Fixes

Focus: P0/P1 items that block core workflows or violate WCAG AA.

| Priority | Workstream            | Tasks                                                                                           | Acceptance Criteria                                                        | Owner Skillset                 |
| :------: | --------------------- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------ |
|    P0    | Mobile keyboard       | Add VisualViewport API listener for keyboard detection + scroll input into view                 | Messages can be composed on iOS Safari without keyboard covering input     | Frontend engineer (mobile web) |
|    P1    | Dark mode             | Add `.dark` CSS section in globals.css redefining all Mattermost-style vars                     | Dark mode toggle works end-to-end; no white interior areas                 | Frontend engineer              |
|    P1    | Safe areas            | Add `env(safe-area-inset-bottom)` to bottom nav; `env(safe-area-inset-top)` to mobile header    | Nav buttons and header not overlapped by notch/home indicator on iPhone X+ | Frontend engineer              |
|    P1    | Landscape nav         | Increase `--bottom-nav-height` to 2.75rem in landscape                                          | Landscape nav buttons meet 44px minimum touch target                       | Frontend engineer              |
|    P1    | Focus traps           | Add Tab focus traps to Quick Switcher, Emoji Picker, Profile Popover, Context Menu              | Tab key cycles within all modals/dialogs/popovers                          | Frontend engineer (a11y)       |
|    P1    | Hover-reveal          | Switch from `display:none` to `visibility:opacity` with `focus-within` for message actions      | Keyboard users can access all message actions (react, flag, edit, delete)  | Frontend engineer (a11y)       |
|    P1    | Contrast              | Increase `foreground.muted` from neutral[400] to neutral[500]; increase alpha from 0.56 to 0.72 | Secondary text passes WCAG AA (4.5:1) in light mode                        | Design + frontend engineer     |
|    P1    | Focus management      | Add auto-focus, focus trap, and focus return to ProfilePopover and ContextMenu                  | Screen reader users can access and navigate popover/menu content           | Frontend engineer (a11y)       |
|    P1    | i18n pilot            | Replace hardcoded strings in auth flow (login, verify, callback) with `t()` calls               | Auth flow is fully i18n-ready; validates the infrastructure                | Frontend engineer              |
|    P1    | Error messages        | Create error message mapping layer for Supabase errors                                          | User-safe messages displayed instead of raw Supabase errors                | Backend engineer               |
|    P2    | Double backdrop       | Remove redundant AppSidebar backdrop; keep layout-level backdrop only                           | Single overlay on mobile sidebar                                           | Frontend engineer              |
|    P2    | Context menu boundary | Add viewport boundary clamping for context menu position                                        | Long-press context menus on mobile stay within viewport                    | Frontend engineer              |
|    P2    | Formatting toolbar    | Replace `window.prompt()` with inline URL input popover with validation                         | No native browser prompts; URL validation prevents XSS                     | Frontend engineer              |

## Days 31-60: Design System Consolidation, Interaction & Admin Improvements

Focus: P2 items for consistency, maintainability, and admin UX.

| Priority | Workstream                   | Tasks                                                                                    | Acceptance Criteria                                                | Owner Skillset      |
| :------: | ---------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------- |
|    P2    | Message list virtualization  | Implement `@tanstack/react-virtual` for windowed message rendering                       | Only visible messages + buffer rendered; 10000 messages performant | Frontend engineer   |
|    P2    | CSS variable consolidation   | Migrate 100+ inline `rgba(...)` patterns to CSS variables; add `--color-*` mapping layer | Components reference CSS variables instead of inline alpha values  | Frontend engineer   |
|    P2    | Z-index system               | Create centralized `--z-*` layer map; replace all inline z-index values                  | All overlays use consistent z-index layers                         | Frontend engineer   |
|    P2    | Radius consolidation         | Remove duplicate radius definitions from globals.css; standardize on tailwind-theme.css  | Single source of truth for all radius values                       | Frontend engineer   |
|    P2    | DeleteDialog refactor        | Replace custom dialog with shared `@chat/ui` Dialog component                            | Single dialog implementation used everywhere                       | Frontend engineer   |
|    P2    | Admin panel                  | Add user role editing, disable action, CSV client-side validation with preview           | Admin can manage users and imports effectively                     | Full-stack engineer |
|    P2    | Thread editor                | Replace textarea reply input with TipTap editor; add reactions to thread replies         | Thread replies have same rich editing as main composer             | Frontend engineer   |
|    P2    | Message actions              | Add Forward and Pin to context menu                                                      | Users can forward/pin messages from context menu                   | Frontend engineer   |
|    P2    | Touch targets                | Increase channel sidebar items to min 40px; audit all icon buttons <44px                 | All interactive controls meet minimum touch target                 | Frontend engineer   |
|    P2    | Drag-and-drop accessibility  | Add "Move up/down" keyboard alternatives for category and channel reorder                | Keyboard and mobile users can reorder sidebar items                | Frontend engineer   |
|    P2    | Sidebar resize accessibility | Add ArrowLeft/ArrowRight keyboard handler to resize handle                               | Keyboard users can resize sidebar                                  | Frontend engineer   |
|    P2    | Avatar error handling        | Add onError handler to Avatar for broken image fallback                                  | Broken avatars show initials gracefully                            | Frontend engineer   |

## Days 61-90: Advanced Customization, Enterprise Polish, Performance UX

Focus: P3 items, i18n completion, performance, and enterprise readiness.

| Priority | Workstream                  | Tasks                                                                             | Acceptance Criteria                                           | Owner Skillset              |
| :------: | --------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------- | --------------------------- |
|    P3    | Full i18n rollout           | Replace all hardcoded strings across all 16 i18n categories                       | All UI strings use `t()` function; second locale can be added | Frontend engineer           |
|    P3    | Empty states                | Add actionable microcopy to all empty states ("No members" → "Invite members...") | Every empty state guides user to next action                  | Frontend engineer           |
|    P3    | Notification enhancements   | Add "Mark all read"; make notifications clickable to navigate                     | Notification management on par with Mattermost/Slack          | Frontend engineer           |
|    P3    | Profile popover             | Fetch join date; add status display; add DM/call action buttons                   | Profile popover shows user status and actions                 | Frontend engineer           |
|    P3    | Quick switcher              | Add recent channels; implement fuzzy search; add `@`/`#` prefix filtering         | Quick switcher matches Mattermost capability                  | Frontend engineer           |
|    P3    | Link previews               | Implement server-side OG metadata fetch + cache for rich link previews            | Links show rich cards with og:image, og:title                 | Backend + frontend engineer |
|    P3    | File preview                | Add image rotation; add keyboard shortcuts for zoom (+/-); add scroll-wheel zoom  | File preview matches Slack/Mattermost                         | Frontend engineer           |
|    P3    | Per-message read indicators | Add subtle left-border or opacity change for unread messages                      | Users can see which messages they've read                     | Frontend engineer           |
|    P3    | Push notifications          | Implement service worker push notifications for mobile PWA                        | Mobile users receive notifications when browser is closed     | Full-stack engineer         |
|    P3    | Notification sounds         | Add notification grouping and scheduled "Do Not Disturb"                          | 9 notification sounds fully functional; quiet hours available | Frontend engineer           |
|    P3    | Character counter           | Add compact character count near send button                                      | Users can see message length and approaching limits           | Frontend engineer           |
|    P3    | Date formatting             | Centralize all date formatting through i18n `formatDate()` utility                | Consistent date formats across all components                 | Frontend engineer           |
|    P3    | Reduced motion              | Fix `data-reduced-motion` dead code or remove unused script                       | Clean, maintainable reduced motion implementation             | Frontend engineer           |
|    P3    | Dialog animation            | Add CSS transitions for dialog open/close                                         | Dialogs animate smoothly in/out                               | Frontend engineer           |
|    P3    | Button loading state        | Add `loading` prop to Button component                                            | Buttons show spinner while loading                            | Frontend engineer           |
|    P3    | Toast stacking              | Add toast stacking limit; add Undo/Retry action support                           | Toast notifications are robust and actionable                 | Frontend engineer           |
|    P3    | Onboarding sync             | Sync onboarding progress to server preferences API                                | Progress persists across devices and browser clears           | Frontend engineer           |
|    P3    | Settings                    | Add floating save bar on unsaved changes; add channel search in per-channel prefs | Settings page UX improved                                     | Frontend engineer           |
|    P3    | Tablet sidebar              | Add tablet-optimized layout; honor user sidebar toggle across breakpoints         | Tablet UX improved                                            | Frontend engineer           |
|    P3    | Admin nav                   | Convert admin sidebar to horizontal tabs on mobile                                | Admin panel usable on phones                                  | Frontend engineer           |
