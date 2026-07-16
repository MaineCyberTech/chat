# Full UI/UX Deep Dive Audit Report

## 1. Product Understanding

| Attribute            | Assessment                                                                          |
| -------------------- | ----------------------------------------------------------------------------------- |
| Product category     | B2B team collaboration platform (Mattermost/Slack/Teams competitor)                 |
| Target users         | Engineering teams, enterprise organizations, remote teams                           |
| Primary workflows    | Channel-based messaging, threaded conversations, file sharing, search               |
| Secondary workflows  | Workspace management, user groups, channel bookmarks, scheduling                    |
| Admin workflows      | User management, role configuration, CSV import/export, audit logs, system settings |
| Critical UX surfaces | Channel view (message list + composer), sidebar navigation, search, notifications   |
| UX risk areas        | Mobile admin panel, i18n coverage, test depth, dual theming systems                 |

## 2. Repository UI Architecture

| Area             | Observed Structure                                          | Strengths                                          | Risks                                                        | Recommendations                               |
| ---------------- | ----------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------ | --------------------------------------------- |
| Framework        | Next.js 15 App Router                                       | Modern, fast Turbopack, server components          | CSP with `unsafe-inline` required for Next.js inline scripts | Add nonce generation                          |
| Styling          | Tailwind v4 + CSS variables + design tokens                 | Layered, flexible                                  | Two parallel var systems (Mattermost + design token)         | Consolidate to single var layer               |
| Components       | `packages/ui/` (12) + `apps/web/components/` (~45)          | Reusable base, app-specific above                  | 33% test coverage; 1018-line message-input.tsx               | Decompose message-input, raise coverage       |
| Routing          | 3 route groups, 15 pages, 3 layouts, 10 loading/error files | Good coverage, error boundaries at multiple levels | Admin has no dedicated loading for most tabs                 | Add per-tab loading states                    |
| State management | Supabase + optimistic UI via `useOptimistic`                | Simple, predictable                                | Socket import uses dynamic import                            | Resolve circular dependency for static import |
| Accessibility    | Focus traps, ARIA roles, keyboard nav, skip-to-content      | Strong foundations                                 | No automated a11y tests, missing `aria-activedescendant`     | Add axe-core to CI, fix regression gaps       |

## 3. Route and Surface Inventory

| Route / Surface                | Purpose            | User Role      | Main CTA          | UX Risk | Notes                            |
| ------------------------------ | ------------------ | -------------- | ----------------- | ------- | -------------------------------- |
| `/`                            | Landing/login      | Anonymous      | Sign in / Sign up | Low     | Clean, i18n-ready                |
| `/login`                       | Auth form          | Anonymous      | Sign in           | Low     | Best i18n example                |
| `/auth/verify`                 | Email verification | Authenticating | Verify            | Low     | No validation                    |
| `/auth/callback`               | OAuth callback     | Anonymous      | (redirect)        | Low     |                                  |
| `/[workspaceSlug]`             | Workspace home     | Member         | Select channel    | Low     | Loading state good               |
| `/[workspaceSlug]/[channelId]` | Channel view       | Member         | Type message      | Medium  | Core surface, well-tested        |
| `/[workspaceSlug]/admin`       | Admin panel        | Admin          | Manage            | HIGH    | Mobile navigation broken, 0 i18n |
| `/[workspaceSlug]/settings`    | User settings      | Member         | Save              | Medium  | Dual save mechanism confusing    |
| `/[workspaceSlug]/search`      | Global search      | Member         | Search            | Medium  | No result count, 0 i18n          |
| `/[workspaceSlug]/threads`     | Thread list        | Member         | View thread       | Low     |                                  |
| `/[workspaceSlug]/saved`       | Saved messages     | Member         | View              | Low     |                                  |
| `/[workspaceSlug]/scheduled`   | Scheduled messages | Member         | Edit              | Low     |                                  |
| `/[workspaceSlug]/groups`      | User groups        | Member         | Manage            | Low     |                                  |

## 4. UX Scorecard

| Category                   | Score | Rationale                                                                                                            | Priority |
| -------------------------- | ----- | -------------------------------------------------------------------------------------------------------------------- | -------- |
| Visual Design              | 7.5   | Consistent color system, good use of elevation, but dual var conventions                                             | P2       |
| Layout Consistency         | 8.0   | Flexbox height chain documented, but 30+ layout fixes needed                                                         | P2       |
| Mobile UX                  | 6.5   | Three-tier responsive, bottom nav, but formatting toolbar 28px, admin mobile broken                                  | P1       |
| Tablet UX                  | 7.0   | Auto-collapse mini-rail, but admin sidebar hidden, thread panel no fixed width                                       | P2       |
| Desktop UX                 | 8.5   | Full sidebar + team rail, resizable, keyboard navigable                                                              | P2       |
| Navigation                 | 7.5   | Workspace-aware, category management, Ctrl+K, but admin tab switching broken on mobile                               | P1       |
| Forms                      | 7.0   | Login form excellent, but admin/settings no i18n, dual save confusing, no password strength                          | P2       |
| Interaction Design         | 7.5   | Rich composer, formatting toolbar, but 28px touch targets, no arrow-key toolbar nav                                  | P2       |
| Accessibility              | 6.5   | Good foundations but missing `aria-activedescendant`, `aria-busy`, `role="alert"` on errors, no automated a11y tests | P1       |
| Customization              | 7.0   | Dark/light/system, high-contrast, reduced-motion, but density controls unused, theme toggle no i18n                  | P3       |
| Theme Support              | 7.5   | Full dark mode, system detection, but dark mode `--text-secondary` hardcoded rgba instead of alpha var               | P2       |
| Data Display               | 7.0   | Virtualized message list, file preview, code highlighting, but no result count in search                             | P2       |
| Admin UX                   | 5.0   | Feature-complete but mobile-broken, 0 i18n, no focus traps on confirm dialogs, duplicated pagination                 | P1       |
| Search and Discovery       | 7.0   | Operator hints, autocomplete, file extension suggestions, but no `aria-activedescendant`, no result count            | P2       |
| Onboarding                 | 7.0   | 5-step task list, progress bar, dismissible, but no focus trap, no dialog role                                       | P2       |
| Error/Empty/Loading States | 6.5   | Good empty states, but silent catch blocks, no `aria-busy`, spinners instead of skeletons in 2 places                | P2       |
| Performance UX             | 7.5   | Virtual list, optimistic updates, but 30-frame RAF scroll loop may jank on low-end                                   | P2       |
| Design System Maturity     | 7.0   | 8 token files, Storybook for 14 components, but dual var systems, density modes unused                               | P2       |
| Enterprise Readiness       | 6.5   | RBAC, audit logs, import/export, but mobile admin broken, i18n gap, test coverage shallow                            | P1       |
| Overall UX Maturity        | 7.1   | Solid production app with polish gaps                                                                                | —        |

## 5. Critical P0 Findings

> No P0 findings identified in this audit. All previous P0 items (UX-009 iOS keyboard hiding input, UX-001 dark mode not defined) remain fixed.

## 6. High Priority P1 Findings

| ID     | Category      | Location           | Finding                                                         | Impact                                                  | Fix                                                             |
| ------ | ------------- | ------------------ | --------------------------------------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------- |
| UX-101 | Admin UX      | admin/page.tsx     | Mobile tab navigation broken — sidebar `hidden md:block`        | Admins on phones cannot switch tabs                     | Add `<select>` dropdown or horizontal scroll tabs on mobile     |
| UX-102 | Accessibility | search-bar.tsx     | Missing `aria-activedescendant` on autocomplete input           | Screen reader users can't follow keyboard navigation    | Add `aria-activedescendant` pointing to highlighted option `id` |
| UX-103 | Mobile UX     | formatting-bar.tsx | Touch targets 28px (h-7 w-7) fail 44px WCAG minimum             | Mobile users with motor impairments struggle            | Increase to min 36px (44px on mobile via media query)           |
| UX-104 | i18n          | admin/page.tsx     | 150+ hardcoded strings, zero i18n                               | Blocks international admin users                        | Migrate all strings to `t()` with admin.\* keys in en.json      |
| UX-105 | i18n          | settings/page.tsx  | 80+ hardcoded strings, zero i18n                                | Blocks international users                              | Migrate to `t()` with settings.\* keys                          |
| UX-106 | i18n          | search-bar.tsx     | 50+ hardcoded strings, zero i18n                                | Search is a primary workflow                            | Migrate to `t()` using existing search.\* keys                  |
| UX-107 | Accessibility | settings/page.tsx  | Reset/Delete confirmation dialogs lack focus traps              | Users can Tab behind backdrop, breaking modal isolation | Add full focus trap cycling first/last focusable                |
| UX-108 | State Design  | channel-info.tsx   | Silent catch returns `{messages:[], members:[]}` on API failure | Users see empty state instead of error                  | Add error state with retry button                               |

## 7. Medium Priority P2 Findings

| ID     | Category       | Location                            | Finding                                                                      | Fix                                                                      |
| ------ | -------------- | ----------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| UX-201 | Forms          | settings/page.tsx                   | Dual save mechanism — auto-save AND "Save Preferences" button confuses users | Choose auto-save (remove button) with debounce                           |
| UX-202 | Forms          | settings/page.tsx                   | Language change triggers `window.location.reload()`                          | Use router refresh or locale context update                              |
| UX-203 | Search         | search/page.tsx                     | No result count shown                                                        | Add "Showing {count} of {total} results"                                 |
| UX-204 | Accessibility  | search-bar.tsx                      | Type dropdown and autocomplete lack `role="listbox"`                         | Add `role="listbox"` with `role="option"` on items                       |
| UX-205 | Accessibility  | search/page.tsx                     | Results container has no `role="listbox"` or `aria-live="polite"`            | Add proper roles and live region                                         |
| UX-206 | Interaction    | formatting-bar.tsx                  | No arrow-key navigation between toolbar buttons                              | Implement WAI-ARIA toolbar pattern with Left/Right arrows                |
| UX-207 | Accessibility  | formatting-bar.tsx                  | No visible focus ring on toolbar buttons                                     | Add `focus-visible:ring-2`                                               |
| UX-208 | Accessibility  | formatting-bar.tsx                  | Link/image buttons have `aria-pressed: undefined`                            | Use `aria-haspopup="dialog"` instead                                     |
| UX-209 | i18n           | formatting-bar.tsx                  | 20+ hardcoded strings                                                        | Migrate to `t()`                                                         |
| UX-210 | i18n           | notification-preferences-modal.tsx  | 20+ hardcoded strings                                                        | Migrate to `t()`                                                         |
| UX-211 | i18n           | keyboard-shortcuts.tsx              | 25+ hardcoded strings                                                        | Migrate to `t()` using existing keyboardShortcuts.\* keys                |
| UX-212 | Accessibility  | keyboard-shortcuts.tsx              | No Mac modifier detection — shows "Ctrl+K" on macOS                          | Detect platform and swap Ctrl→⌘                                          |
| UX-213 | Accessibility  | keyboard-shortcuts.tsx              | No `aria-live` on filtered results                                           | Add `aria-live="polite"` for count announcement                          |
| UX-214 | State Design   | All error boundaries                | No `role="alert"` on error states                                            | Add `role="alert"` + `aria-live="assertive"`                             |
| UX-215 | State Design   | All loading states                  | No `aria-busy="true"` on any skeleton/spinner container                      | Add `aria-busy="true"` + `role="status"`                                 |
| UX-216 | State Design   | app/loading.tsx, (auth)/loading.tsx | Bare spinner instead of layout-aware skeleton                                | Replace with lightweight skeleton matching page layout                   |
| UX-217 | State Design   | (workspace)/loading.tsx             | Sidebar shown unconditionally — appears on mobile                            | Add `hidden md:flex` to sidebar skeleton                                 |
| UX-218 | Accessibility  | onboarding-tour.tsx                 | No `role="dialog"`, no focus trap                                            | Add dialog role, aria-modal, focus trap                                  |
| UX-219 | Accessibility  | cookie-banner.tsx                   | No focus trap, no `aria-modal="true"`                                        | Add focus trap + aria-modal                                              |
| UX-220 | Accessibility  | channel-info.tsx                    | Tab bar missing `role="tablist"`, `aria-selected`                            | Add proper tab ARIA patterns                                             |
| UX-221 | State Design   | channel-info.tsx                    | Empty states lack actionable buttons                                         | Add "Invite members", "Pin a message" actions                            |
| UX-222 | Data Display   | search-bar.tsx                      | `highlightText` function duplicated in 2 files with different styling        | Extract to shared utility                                                |
| UX-223 | Data Display   | admin/page.tsx                      | Pagination duplicated across 3 tabs                                          | Extract to shared Pagination component                                   |
| UX-224 | Mobile UX      | admin/page.tsx                      | Stat grid uses `grid-cols-2` on mobile — narrow cells                        | Use `grid-cols-1 sm:grid-cols-2`                                         |
| UX-225 | Performance    | message-list.tsx                    | 30-frame RAF loop for initial scroll                                         | Use single `scrollToIndex` with `align: "end"` after measurements settle |
| UX-226 | Design System  | globals.css                         | Two parallel CSS var systems (Mattermost + design tokens) in use             | Consolidate to single layer, document migration                          |
| UX-227 | Error Handling | chat-view.tsx                       | `console.warn` used instead of user-facing toast in 5+ catch blocks          | Replace with toast.error()                                               |
| UX-228 | Theme          | globals.css                         | Dark mode `--text-secondary` hardcoded rgba instead of alpha var             | Derive from `--text-secondary-alpha`                                     |

## 8. Low Priority P3 Findings

| ID     | Category    | Location                           | Finding                                                         | Fix                                         |
| ------ | ----------- | ---------------------------------- | --------------------------------------------------------------- | ------------------------------------------- |
| UX-301 | Forms       | settings/page.tsx                  | "Loading..." text instead of Skeleton component                 | Replace with `<Skeleton />`                 |
| UX-302 | Forms       | settings/page.tsx                  | Auto-responder textarea lacks character counter                 | Add "42/500" counter                        |
| UX-303 | Forms       | settings/page.tsx                  | No debounce on preference saves — rapid toggles hammer API      | Add 300ms debounce                          |
| UX-304 | Forms       | login-form.tsx                     | No password strength indicator on sign-up                       | Add min length/complexity hints             |
| UX-305 | Forms       | login-form.tsx                     | No "Forgot password?" link                                      | Add password reset flow trigger             |
| UX-306 | Forms       | login-form.tsx                     | No `aria-live` on status container                              | Add `aria-live="polite"`                    |
| UX-307 | Forms       | notification-preferences-modal.tsx | No unsaved-changes detection on Escape                          | Warn before closing with dirty state        |
| UX-308 | Search      | search/page.tsx                    | No validation that `dateFrom <= dateTo`                         | Disable/clear invalid range                 |
| UX-309 | Search      | search-bar.tsx                     | Hardcoded year "2025" in operator hint                          | Use `new Date().getFullYear()`              |
| UX-310 | Search      | search-bar.tsx                     | "Clear all" recent searches has no confirmation                 | Add confirm dialog for bulk clear           |
| UX-311 | Admin       | admin/page.tsx                     | Export buttons lack loading spinner                             | Add disabled + spinner state during fetch   |
| UX-312 | Admin       | admin/page.tsx                     | No error boundary per tab                                       | Add React error boundary around tab content |
| UX-313 | Admin       | admin/page.tsx                     | `document.title` hardcoded                                      | Use i18n `t()`                              |
| UX-314 | Admin       | admin/page.tsx                     | Inline `StatusBadge`, `Card` duplicated                         | Use shared components                       |
| UX-315 | Admin       | admin/page.tsx                     | `ToggleRow` inline component not shared                         | Extract to shared component                 |
| UX-316 | Admin       | admin/page.tsx                     | CSV parser uses `line.split(",")` — breaks on quoted fields     | Use proper CSV parser                       |
| UX-317 | Interaction | message-list.tsx                   | 30-frame RAF loop in `useEffect` for scroll                     | Replace with single `scrollToIndex`         |
| UX-318 | Interaction | message-list.tsx                   | Inline styles on pull-to-refresh indicator                      | Convert to Tailwind utility classes         |
| UX-319 | Interaction | app-sidebar.tsx                    | `gridArea: "team-sidebar"` dead CSS — no grid parent            | Remove dead property                        |
| UX-320 | Interaction | app-sidebar.tsx                    | `âœ“` encoding artifact on line 581                             | Fix to proper checkmark character           |
| UX-321 | Theme       | globals.css                        | `--border-default` includes `solid 1px` — not composable        | Split into width/style/color tokens         |
| UX-322 | Theme       | packages/ui/src/tokens/            | Density modes (comfortable/compact/spacious) defined but unused | Remove or implement                         |

## 9. Visual Design Audit

**Strengths:**

- Cohesive color system with Mattermost-compatible CSS variables
- Consistent elevation system (3 shadow levels)
- Good typography scale with font-size/weight/line-height tokens
- Status indicators (online/away/dnd) use semantic colors

**Deficits:**

- Two parallel CSS variable systems (Mattermost `--button-bg` vs design token `--color-button-primary-bg`) creates confusion
- Dark mode `--text-secondary` uses hardcoded rgba instead of alpha variable
- `--border-default` includes `solid 1px` preventing composability with `border-top` etc.

## 10. Layout and Formatting Audit

**Strengths:**

- Flexbox height chain documented in AGENTS.md — critical maintainability asset
- Safe-area insets for modern mobile devices
- Tablet sidebar auto-collapse (768-1024px) at 60px mini-rail

**Deficits:**

- Thread panel has no explicit width — uses `hidden md:block` with border
- Workspace skeleton shows sidebar unconditionally on mobile
- Admin stat grid `grid-cols-2` on mobile creates very narrow cells

## 11. Responsive Design Audit

| Viewport | Issues                                                                         |
| -------- | ------------------------------------------------------------------------------ |
| 320px    | Onboarding tour `w-80` (320px) may overflow; formatting bar 28px buttons       |
| 375px    | Bottom nav OK; message input OK; admin panel sidebar hidden — no tab selection |
| 768px    | Tablet mini-rail works; thread panel behavior untested                         |
| 1024px   | Desktop sidebar full; no issues identified                                     |
| 1440px+  | All layouts perform as expected                                                |

## 12. Mobile UX Audit

**Strengths:**

- Three breakpoints with distinct layouts (mobile/tablet/desktop)
- Bottom nav with safe-area support
- Dynamic viewport height via VisualViewport API
- Pull-to-refresh in message list

**Deficits:**

- Formatting toolbar 28px buttons fail 44px touch target minimum
- Admin panel completely broken on mobile (no tab switching)
- Settings toggle switches at 24px fail touch target
- Keyboard shortcuts dialog rows at 32px fail touch target

## 13. Tablet UX Audit

**Strengths:**

- Auto-collapse sidebar to 60px mini-rail at 768-1024px
- Smooth transition animation

**Deficits:**

- Thread panel width not fixed — uses `hidden md:block` only
- Admin sidebar hidden — no tablet-friendly alternative
- Channel info sidebar at fixed 320px may be wide on 768px portrait

## 14. Navigation and Information Architecture

| Navigation Area   | Issue                                | Recommendation                              |
| ----------------- | ------------------------------------ | ------------------------------------------- |
| Admin sidebar     | Hidden <768px; no mobile alternative | Add tab selector dropdown                   |
| Thread panel      | No consistent width                  | Set `width: 400px` with responsive override |
| Settings sidebar  | OK, collapsible sections             | OK                                          |
| Mobile bottom nav | "Back" button causes layout shift    | Keep persistent or use icon-only            |

## 15. User Journey Assessment

| Journey               | Step Count | Friction Points                                        | Abandonment Risk | Recommendations                            |
| --------------------- | ---------- | ------------------------------------------------------ | ---------------- | ------------------------------------------ |
| New user sign-up      | 4          | No password strength, no forgot password               | Low              | Add strength indicator + reset flow        |
| Create workspace      | 3          | Smooth                                                 | Low              | None                                       |
| Send message          | 2          | None                                                   | Low              | None                                       |
| Search messages       | 3          | No result count, no i18n                               | Medium           | Add count + i18n                           |
| Admin user management | 5+         | Broken on mobile, no i18n, no role change confirmation | High             | Fix mobile nav, add i18n, add confirmation |
| Settings change       | 3          | Dual save confusing                                    | Medium           | Pick one save paradigm                     |

## 16. Interaction Design Audit

| Pattern            | States Covered                        | Missing States                    | UX Risk | Fix                             |
| ------------------ | ------------------------------------- | --------------------------------- | ------- | ------------------------------- |
| Buttons            | Default/hover/active/disabled/loading | Focus-visible in formatting bar   | Medium  | Add focus ring                  |
| Search input       | Default/focus/typing/results          | `aria-activedescendant`           | High    | Add to autocomplete             |
| Formatting toolbar | Default/hover/active                  | Arrow-key nav, focus ring         | Medium  | Add toolbar pattern             |
| Toggle switches    | On/off                                | Proper `role="switch"` everywhere | Low     | Already mostly correct          |
| Modals             | Open/close/overlay-click/Escape       | Focus trap in settings            | High    | Add to all confirmation dialogs |

## 17. Forms and Input UX Audit

| Form           | Issues                                                   | Severity |
| -------------- | -------------------------------------------------------- | -------- |
| Login          | No password strength, no forgot password, no `aria-live` | P3       |
| Settings       | Dual save, language reload, no debounce                  | P2       |
| Admin          | No i18n, no role change confirmation                     | P1       |
| Auto-responder | No character counter                                     | P3       |
| Search         | No date range validation                                 | P3       |

## 18. Accessibility Audit

| Rule                    | Location                                      | Issue                           | WCAG  | Fix                                          |
| ----------------------- | --------------------------------------------- | ------------------------------- | ----- | -------------------------------------------- |
| `aria-activedescendant` | search-bar.tsx                                | Missing on autocomplete         | 4.1.2 | Add attribute pointing to highlighted option |
| `role="alert"`          | All error boundaries                          | Missing                         | 4.1.3 | Add to error containers                      |
| `aria-busy`             | All loading states                            | Missing                         | 4.1.1 | Add to skeleton/spinner containers           |
| Focus trap              | settings confirm dialogs                      | Missing                         | 2.4.3 | Add focus cycling                            |
| `role="listbox"`        | search-bar, search page                       | Missing on autocomplete/results | 4.1.2 | Add proper roles                             |
| Focus ring              | formatting-bar                                | Missing                         | 2.4.7 | Add `focus-visible:ring`                     |
| Touch target            | formatting-bar, settings toggles              | 28px/24px < 44px                | 2.5.8 | Increase sizing                              |
| `aria-modal`            | onboarding-tour, cookie-banner                | Missing                         | 4.1.2 | Add aria-modal="true"                        |
| Mac modifier            | keyboard-shortcuts                            | Shows Ctrl on macOS             | —     | Detect platform                              |
| `aria-live`             | search results, login status, keyboard filter | Missing                         | 4.1.3 | Add to dynamic content                       |

## 19. Customization and Theme Audit

| Feature            | Supported?        | Quality                                   |
| ------------------ | ----------------- | ----------------------------------------- |
| Dark mode          | Yes               | Good (dark vars complete)                 |
| Light mode         | Yes               | Good                                      |
| System theme       | Yes               | Good (prefers-color-scheme listener)      |
| High contrast      | Yes               | Good (prefers-contrast: high media query) |
| Reduced motion     | Yes               | Good (data-reduced-motion attribute)      |
| Sidebar collapse   | Yes               | Good (localStorage persistence)           |
| Density controls   | Defined in tokens | Not implemented                           |
| Custom status      | Yes               | Modal with emoji + duration presets       |
| Notification prefs | Yes               | Per-channel + global                      |
| Workspace themes   | No                | Not yet                                   |

## 20. Data Display Audit

| Component      | Strengths                                        | Problems                                          |
| -------------- | ------------------------------------------------ | ------------------------------------------------- |
| Message list   | Virtualized, measured heights, scroll restore    | 30-frame RAF initial scroll                       |
| File preview   | Zoom, multi-file nav, metadata panel             | No tests                                          |
| Code blocks    | Syntax highlighting, copy button, language badge | No tests                                          |
| Search results | Operator hints, autocomplete                     | No `role="listbox"`, no result count              |
| Admin tables   | Pagination, search, export                       | Duplicated pagination, no i18n                    |
| Channel info   | Members + Pinned tabs                            | Silent error handling, no actionable empty states |

## 21. Admin and Settings UX Audit

**Admin Panel:**

- Feature-complete (11 tabs: overview, users, channels, workspaces, integrations, import-export, security, audit-log, system, site-config, logs)
- **Critical**: Mobile navigation broken — sidebar `hidden md:block` makes tabs inaccessible
- **Critical**: Zero i18n (~150 strings)
- Duplicated pagination, inline helper components, naive CSV parser

**Settings Page:**

- Collapsible sections, toggle rows, per-channel prefs
- Confusing dual-save mechanism
- Language change forces full reload
- "Loading..." text instead of Skeleton

## 22. Search and Discovery Audit

| Area                       | Issue                      | Fix                  |
| -------------------------- | -------------------------- | -------------------- |
| Search results             | No count                   | Add pagination count |
| Autocomplete               | No `aria-activedescendant` | Add to input         |
| Operator hints             | Hardcoded year             | Use dynamic year     |
| Empty results              | Good, contextual           | OK                   |
| Recent searches            | Clear all no confirmation  | Add confirm          |
| File extension suggestions | Good                       | OK                   |

## 23. Onboarding and Feature Discoverability

| Stage                   | Current                 | Problem                       | Fix                    |
| ----------------------- | ----------------------- | ----------------------------- | ---------------------- |
| First run               | 5-step task list        | No focus trap, no dialog role | Add ARIA + focus mgmt  |
| Empty workspace         | Channel list empty      | No "Create channel" action    | Add action button      |
| Feature discoverability | Quick switcher (Ctrl+K) | Not discoverable              | Add hint on first load |
| Keyboard shortcuts      | Shortcut modal          | Ctrl shown on Mac             | Detect platform        |

## 24. Loading, Empty, Error, and Offline States

| State Type | Location                 | Current Behavior       | Fix                     |
| ---------- | ------------------------ | ---------------------- | ----------------------- |
| Loading    | app/loading.tsx          | Bare spinner           | Replace with skeleton   |
| Loading    | (auth)/loading.tsx       | Bare spinner           | Replace with skeleton   |
| Loading    | (workspace)/loading.tsx  | Sidebar on mobile      | Hide on mobile          |
| Empty      | Channel list             | "No channels yet" text | Use EmptyState + action |
| Error      | channel-info.tsx         | Silent empty arrays    | Add error + retry       |
| Error      | search-bar.tsx           | `console.warn`         | Add user-facing error   |
| Error      | Root/Worskpace error.tsx | No `role="alert"`      | Add alert role          |

## 25. Performance UX Audit

| Area               | Issue                         | Fix                      |
| ------------------ | ----------------------------- | ------------------------ |
| Initial scroll     | 30-frame RAF loop             | Single `scrollToIndex`   |
| Layout shift       | None observed                 | Monitor                  |
| Skeleton quality   | Mixed (spinners vs skeletons) | Standardize on skeletons |
| Debounced search   | Good (300ms)                  | OK                       |
| Optimistic updates | Good                          | OK                       |

## 26. Design System Audit

| Component  | State                                    | Consistency Risk                 |
| ---------- | ---------------------------------------- | -------------------------------- |
| Button     | 4 variants, 3 sizes, styled via CSS vars | Low                              |
| Dialog     | Focus trap, animation, overlay           | Low                              |
| Toast      | 5 variants, auto-dismiss, actions        | Low                              |
| Avatar     | 3 sizes, imgError fallback               | Low                              |
| Input      | Standard, error state                    | Low                              |
| Badge      | 4 color variants                         | Low                              |
| EmptyState | Icon + title + description + action      | New in Phase 2, used in 16 files |
| Skeleton   | 3 variants                               | Low                              |

**Consolidation needed:**

- `StatusBadge` in admin is inline — should use shared `StatusBadge`
- `Card` in admin is inline — should use shared component or remove
- `ToggleRow` in settings is inline — could be shared
- `highlightText` duplicated in 2 files — extract to utility
- Pagination duplicated in admin — extract to component

## 27. Content and Microcopy Audit

| Location       | Current Copy                                                                           | Problem          | Suggested Copy                                                |
| -------------- | -------------------------------------------------------------------------------------- | ---------------- | ------------------------------------------------------------- |
| Root error     | "Something went wrong"                                                                 | Vague, unhelpful | "Something went wrong. Please try again. Reference: {digest}" |
| Workspace 404  | "Workspace not found. This workspace does not exist or you may not have access to it." | Good             | OK                                                            |
| Empty channels | "No channels yet"                                                                      | No action        | "No channels yet. Create your first channel to get started."  |
| No members     | "No members yet"                                                                       | No action        | "No members yet. Invite your team to collaborate."            |
| No messages    | "No messages yet. Start the conversation!"                                             | Good             | OK                                                            |

## 28. Localization Readiness Audit

| Area                       | Issue                                                         | Risk                                          |
| -------------------------- | ------------------------------------------------------------- | --------------------------------------------- |
| i18n function usage        | Only login-form.tsx uses `t()`                                | 7/8 key surfaces are English-only             |
| Date formatting            | `formatDate()` utility exists, not used everywhere            | Inconsistent dates                            |
| Pluralization              | `tn()` exists in i18n provider, unused                        | Missing plural support                        |
| RTL layout                 | No RTL support tested                                         | Future enterprise gap                         |
| Text expansion             | No expansion testing                                          | Buttons could overflow with long translations |
| Translation file `en.json` | Has keys for search, settings, keyboard shortcuts — not wired | Quick win                                     |

## 29. Trust, Security, and Privacy UX Audit

| Area               | UX Risk                                       | Fix              |
| ------------------ | --------------------------------------------- | ---------------- |
| Login              | Low — `userSafeError()` prevents info leaking | OK               |
| Admin role change  | Medium — no confirmation dialog               | Add confirmation |
| Data deletion      | Low — delete confirmation present             | OK               |
| Session expiration | Low — handled by Supabase                     | OK               |
| API key visibility | Low — masked in UI                            | OK               |

## 30. Enterprise Readiness Assessment

| Dimension             | Score | Why                                                  |
| --------------------- | ----- | ---------------------------------------------------- |
| Professional polish   | 7     | Consistent UI, good typography, but dual var systems |
| Predictable layouts   | 8     | Flexbox height chain established                     |
| Mature navigation     | 7     | Workspace/channel/category, but admin mobile broken  |
| Admin control quality | 5     | Feature complete but mobile-broken and no i18n       |
| Accessibility posture | 6     | Good foundations, regression gaps                    |
| Mobile maturity       | 7     | Three-tier responsive, but admin broken              |
| Error recovery        | 6     | Silent catches in several places                     |
| Customization         | 7     | Many options, density modes unused                   |
| Test coverage         | 5     | 33% component coverage, no a11y tests                |

**Enterprise verdict:** Close but not yet enterprise-ready. The admin mobile gap and i18n deficit are blocking. Estimated 4-6 weeks of targeted work to reach enterprise-grade.

## 31. UI/UX Test Coverage Review

| Test Area                | Coverage                     | Gap                               |
| ------------------------ | ---------------------------- | --------------------------------- |
| Unit/component           | 19 files (33% of components) | 38 untested components            |
| E2E functional           | 9 files                      | 80% of comprehensive spec skipped |
| Visual regression        | 6 snapshots, 3 pages         | No chat view snapshots            |
| Accessibility (axe-core) | 0 tests                      | Complete gap                      |
| Responsive               | 2 viewports tested           | No interactive responsive tests   |
| Mobile touch             | 0 tests                      | Complete gap                      |
| Focus trap               | 0 tests                      | Complete gap                      |
| Keyboard nav             | 0 tests                      | Complete gap                      |

## 32. Quick Wins

| Quick Win                                        | Impact                     | Effort                       | Files                           |
| ------------------------------------------------ | -------------------------- | ---------------------------- | ------------------------------- |
| Add `aria-activedescendant` to search-bar        | High (a11y P1 fix)         | XS (~15 lines)               | search-bar.tsx                  |
| Add mobile tab selector to admin                 | High (admin mobile P1 fix) | S (~30 lines)                | admin/page.tsx                  |
| Add `role="alert"` to 6 error boundaries         | Medium (a11y P2 fix)       | XS (~6 files, 10 lines each) | error.tsx files                 |
| Increase formatting-bar touch targets to 36px    | Medium (mobile P2 fix)     | XS (CSS change)              | formatting-bar.tsx, globals.css |
| Replace root/auth spinners with skeletons        | Medium (perception P2 fix) | S (2 files)                  | loading.tsx, (auth)/loading.tsx |
| Add `aria-busy="true"` to all loading states     | Medium (a11y P2 fix)       | XS (5 files)                 | All loading.tsx                 |
| Fix workspace loading sidebar on mobile          | Low (mobile P2 fix)        | XS (1 class)                 | (workspace)/loading.tsx         |
| Extract `highlightText` to shared utility        | Low (maintainability P2)   | S                            | 2 files + new utility           |
| Add Mac modifier detection to keyboard shortcuts | Low (UX P2 fix)            | XS (~5 lines)                | keyboard-shortcuts.tsx          |

## 33. Recommended 30/60/90 Day Roadmap

### First 30 Days (P0-P1 fixes + i18n)

1. Fix admin mobile navigation — add tab selector dropdown
2. Add `aria-activedescendant` to search-bar
3. Add role="alert" to all error boundaries
4. Increase formatting-bar touch targets
5. Add `aria-busy="true"` + `role="status"` to all loading states
6. Add focus traps to settings confirmation dialogs
7. Fix silent catch blocks in channel-info, search-bar, formatting-bar

### Days 31-60 (i18n + design system)

1. Add i18n to admin page (150+ strings)
2. Add i18n to settings page (80+ strings)
3. Add i18n to search-bar (50+ strings)
4. Add i18n to formatting-bar, notification modal, keyboard shortcuts
5. Extract Pagination, ToggleRow, highlightText to shared utilities
6. Consolidate CSS variable systems (Mattermost vars + design token vars)
7. Add `role="listbox"` to all autocomplete/results containers

### Days 61-90 (testing + enterprise polish)

1. Add axe-core to Playwright tests — automated a11y regression
2. Add visual snapshot for main workspace/chat view
3. Add focus trap tests for all modals
4. Add responsive/interactive layout tests
5. Add `message-input.tsx` decomposition plan — 1018 lines → 3-4 focused components
6. Implement density controls (compact/comfortable/spacious)
7. Add character counters to remaining textareas

## 34. Recommended Implementation Plan

### Components to Refactor

- `message-input.tsx` — split into editor, autocomplete, file-upload, and scheduler concerns
- `search-bar.tsx` — remove module-level channel cache, add `aria-activedescendant`
- `admin/page.tsx` — add mobile nav, extract pagination, add i18n
- `settings/page.tsx` — pick single save paradigm, add debounce

### Tokens to Introduce

- `--border-width-default`, `--border-style-default` — separate from `--border-default`
- Deprecate `--button-bg` etc. in favor of design token vars

### Tests to Add

- axe-core accessibility audit in Playwright setup
- Virtual list scroll behavior tests
- Focus trap tests for all 10+ interactive surfaces
- Mobile viewport interaction tests
- Visual snapshot for channel view (light + dark + mobile)

### Automated Checks to Recommend

- `@axe-core/playwright` in E2E pipeline — catches ARIA/busy/contrast regressions
- Playwright viewport matrix (320, 375, 768, 1024, 1440)
- Dialog focus-trap assertion in component tests
- Reduced-motion preference toggle test
- Dark mode contrast regression test

## 35. Final Verdict

**Production Ready With Minor Issues**

The platform is functionally complete and usable for production deployment. Core workflows (messaging, search, notifications, file sharing) work well across desktop and mobile devices. The virtualized message list and rich composer rival mature collaboration tools.

The application is NOT yet Enterprise Ready due to:

1. Admin panel inaccessible on mobile
2. 7/8 critical surfaces lack i18n
3. No automated accessibility regression testing
4. Shallow test coverage (33% of components)

Estimated 6-8 weeks of targeted work across mobile admin, i18n migration, and test infrastructure to reach "Enterprise Ready" status. The architectural foundations are solid — the gaps are in breadth and polish, not quality.
