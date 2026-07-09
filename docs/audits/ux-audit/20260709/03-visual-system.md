# Phase 3 — Visual System, Component Consistency, and Design Language

**Run**: 2026-07-09
**Auditor**: Principal UX / Frontend Architecture

---

## 1. Visual Language Comparison

### Typography

| Dimension             | Current Repo                                                          | Reference Repo (Mattermost)                                   |
| --------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------- |
| **Primary font**      | System UI stack (`system-ui, -apple-system, BlinkMacSystemFont, ...`) | Open Sans (custom font load) + Metropolis (headings)          |
| **Mono font**         | System mono stack (`ui-monospace, SFMono-Regular, ...`)               | Not explicitly defined globally (code blocks use own styling) |
| **Type scale**        | 8 sizes (xs 0.75rem → 4xl 2.25rem), 4 weights                         | CSS `font-size` cascade + Metropolis for headings             |
| **Type scale system** | `typeScale` object: display, heading, body, label, code tiers         | Implicit: h1-h3 use Metropolis, body uses Open Sans           |
| **Headings**          | system-ui, 600 weight, tight line-height                              | Metropolis (custom font), 600 weight                          |
| **Labels**            | xs/sm, medium weight, uppercase letter-spacing (wide/wider/widest)    | `.small` class (12px), `.light` (0.73 opacity)                |
| **Font loading**      | System fonts — zero FOUT/FOIT                                         | Open Sans + Metropolis — ~8 woff/woff2 files, FOUT risk       |

**Analysis**: The current repo's system font stack is superior for performance (no font loading), but the visual hierarchy is less distinct. Mattermost's Metropolis headings create a clearer typographic hierarchy. The `typeScale` object in the current repo is a well-designed system that the component code doesn't fully utilize yet.

### Spacing

| Dimension              | Current Repo                                                                                 | Reference Repo                            |
| ---------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------------- |
| **Base unit**          | 0.25rem (4px at 16px base)                                                                   | Implicit — no dedicated spacing scale     |
| **Scale**              | 0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6rem                                      | Ad-hoc via padding/margin utility classes |
| **Component spacing**  | Defined per component (button, input, badge, avatar, dialog, sidebar)                        | Scattered across Sass files               |
| **Density**            | `density` object (comfortable 1x, compact 0.75x, spacious 1.25x) — NOT used in any component | No density system                         |
| **Card/panel padding** | Inconsistent — `app__content` uses border-radius + shadow, other panels may vary             | Bootstrap grid + ad-hoc                   |

**Analysis**: The current repo has a well-defined spacing token system that is only partially applied. The density multiplier concept is ahead of Mattermost but unused. Component spacing is defined in tokens but most components use hardcoded Tailwind spacing classes.

### Color System

| Dimension            | Current Repo                                                                                       | Reference Repo                                              |
| -------------------- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| **Base palette**     | neutral 50-950, blue, green, yellow, red scales                                                    | Hex values + Sass variables                                 |
| **Semantic mapping** | `semanticColors` + `darkSemanticColors` (background, foreground, border, brand, status, component) | CSS vars at `:root` with `applyTheme()` runtime override    |
| **Component colors** | Per-component: button (primary/secondary/ghost), input, badge, avatar, skeleton, dialog, sidebar   | Global CSS vars consumed by Sass (e.g., `var(--button-bg)`) |
| **Opacity system**   | `--text-secondary-alpha: 0.72`, `--text-tertiary-alpha: 0.56`                                      | `--icon-opacity: 0.64`, `--icon-opacity-hover: 0.8`         |
| **Dark mode**        | `html.dark` CSS overrides in globals.css + ui/styles.css                                           | Runtime JS theme injection via `applyTheme()`               |
| **RGB variants**     | `*-rgb` vars for rgba usage in cross-theme opacity                                                 | `*-rgb` vars for the same purpose                           |
| **Status colors**    | online, away, dnd, offline with status-pill classes                                                | Same pattern with status icons                              |

**Analysis**: Both repos use nearly identical CSS custom property naming. The current repo's token system is architecturally cleaner (TypeScript source of truth → CSS variables) versus Mattermost's runtime JS injection. The current repo's semantic color mapping is more comprehensive with component-level color tokens.

---

## 2. Component System Strengths in Reference Repo

| Strength                        | Detail                                                                                       | Why It Matters                                                                                 |
| ------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| **GenericModal**                | `platform/components/src/generic_modal/` — reusable modal with consistent header/footer/body | Every modal follows the same pattern. Consistent width, close behavior, focus trap.            |
| **Advanced Text Editor**        | 47-file TipTap editor with formatting toolbar, AI rewrite, send scheduling, priority labels  | Rich composition surface. Priority labels (`urgent`, `important`) are a Mattermost innovation. |
| **Post view reactivity**        | Reactions with tooltip ("You and X others"), live update, burn-on-read                       | More mature reaction UX. Tooltip explains who reacted.                                         |
| **Sidebar category management** | Full DnD with collapse/expand, drag handle, channel count badge, filter-by-unreads           | More mature sidebar UX. Drag handle is always visible.                                         |
| **Global header**               | Top-level navigation bar with consistent search, settings, help icon positions               | Every page has the same header chrome. No feature page loses navigation context.               |
| **Component Library**           | In-house dev `/component_library` route for isolated component viewing                       | Documents components without needing Storybook. Accessible at a URL.                           |
| **Settings pages**              | 11 separate page components with left-nav categories                                         | Settings organized by category with navigation. Not a flat page.                               |
| **RHS panel**                   | Right-hand side panel for threads, channel info, search results                              | Contextual without losing main view. Usable alongside message list.                            |
| **Tour tip system**             | Reusable TourTip component with backdrop cutout                                              | Better onboarding UX than simple popover — highlights the target element.                      |

---

## 3. Component System Strengths in Current Repo

| Strength                       | Detail                                                                      | Why It Matters                                                                     |
| ------------------------------ | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| **Token-first design system**  | TypeScript tokens → CSS variables → Tailwind theme. Single source of truth. | Any token change propagates everywhere. No runtime JS injection needed.            |
| **Two-tier theme**             | `@chat/ui` tokens for design system + `globals.css` Mattermost vars         | Compatible with Mattermost naming while having a clean internal system.            |
| **Storybook integration**      | 11 stories across UI package + web components                               | Isolated component development and visual regression testing.                      |
| **Avatar component**           | `imgError` fallback state, responsive sizes, initials fallback              | Handles image load failure gracefully. UX-045 fix.                                 |
| **Dialog component**           | Reusable with overlay, close button, focus trap                             | Consistent modal behavior. Shared Dialog replaces ad-hoc implementations (UX-026). |
| **Toast system**               | ToastProvider with stacked notifications                                    | Clean notification pattern. Positioned consistently.                               |
| **Skeleton component**         | Reusable skeleton loading                                                   | Consistent loading state across features.                                          |
| **Keyboard shortcut registry** | Centralized system with modal display                                       | Keyboard shortcuts are discoverable and consistent.                                |
| **Tailwind v4 + CSS `@theme`** | No JS config file. Pure CSS-driven theme.                                   | Faster builds, simpler config, CSS-native.                                         |

---

## 4. Inconsistencies to Address

### High Priority

| Inconsistency               | Files Affected                                                                                                       | Impact                                                                                                                                   |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Dialog vs inline modals** | Multiple components use their own modal patterns despite shared `Dialog` component existing                          | Visual inconsistency in modal header/footer/close behavior. UX-026 partially addressed this (DeleteDialog refactored) but others remain. |
| **Button variant usage**    | Some buttons use `<button className="...">` with ad-hoc styles instead of `<Button variant="...">`                   | Inconsistent hover, active, focus behavior across the app.                                                                               |
| **Color reference mix**     | Some components use Tailwind color classes (`text-neutral-600`), others use CSS vars (`var(--center-channel-color)`) | Theme changes may not apply uniformly. Dark mode gaps.                                                                                   |
| **Typography usage**        | `typeScale` token object exists but components use arbitrary `text-sm`, `text-base`, etc.                            | Typographic hierarchy is not enforced. No guarantee of consistent heading sizes.                                                         |

### Medium Priority

| Inconsistency             | Files Affected                                                                               | Impact                                                                        |
| ------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| **Empty state patterns**  | Some lists show "No results", others show nothing, some use skeletons                        | User may not know if data is loading, empty, or errored.                      |
| **Spacing density**       | Hardcoded padding values in many components despite `density` config existing                | Density preference cannot be applied.                                         |
| **Label styling**         | Some forms use `<label className="text-sm font-medium">`, others `<Label>` component or none | Form label appearance varies.                                                 |
| **Error message styling** | Some inputs show `error` prop styled messages, others show raw errors                        | UX-049 addressed login form errors but other forms may still show raw errors. |
| **Icon button sizes**     | `.mm-button-icon` is 32x32 with custom CSS. Some icon buttons use different sizing           | Inconsistent touch target sizes.                                              |
| **Border radius usage**   | `--radius-s` through `--radius-xl` defined but some components hardcode `rounded-lg`         | Radius customization requires CSS override.                                   |

### Low Priority

| Inconsistency                 | Impact                                                                                                           |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| **Channel type icon styling** | `.channel-type-icon` opacity 0.7 used with `flex-shrink-0` but icon source varies                                | Minor visual inconsistency in sidebar.                |
| **Status pill border color**  | `border: 2px solid var(--sidebar-bg)` creates a cutout effect. Works on sidebar but looks odd in other contexts. | Only visible on non-sidebar contexts.                 |
| **Mention highlight colors**  | Two separate systems: `--mention-highlight-bg` (CSS var) and `bg-yellow-200` (Tailwind)                          | Mention highlighting may not match across components. |

---

## 5. Dark Theme and Readability Findings

### Strengths

- Dark theme defined in both `globals.css` (Mattermost vars) and `ui/styles.css` (design token vars)
- Contrast adjustments made: `--text-secondary-alpha: 0.72` (UX-017), `foreground.muted` changed to `neutral[500]` (#737373, UX-016)
- Elevation shadows increased in dark mode (higher alpha values for visibility)
- Border contrast increased in dark mode: `border-dark` goes from 0.16 alpha to 0.24 alpha
- Scrollbar thumb color adapts via `rgba(var(--center-channel-color-rgb), 0.4)` which changes with theme

### Risks

| Risk                         | Detail                                                                                                                                                                                                                                                       | Severity   |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| **Cross-theme color drift**  | `globals.css` dark mode colors are hand-picked values (e.g., `#1a1a1a` for center bg) while `ui/styles.css` uses `neutral[950]`. These may diverge if only one file is updated.                                                                              | Medium     |
| **Elevation visibility**     | Dark mode elevations use 0.28 alpha on black shadows. On very dark backgrounds (like `#1a1a1a`), shadows may be nearly invisible.                                                                                                                            | Medium     |
| **Semantic color RGB match** | Dark mode semantic colors (info/success/warning/danger) in globals.css use different RGB values than what `darkSemanticColors` generates. E.g., `--semantic-color-danger: 248, 113, 113` in globals.css vs `red[300]` (252, 165, 165) in semantic-colors.ts. | Medium     |
| **Sidebar text contrast**    | Dark mode sidebar text is `#e0e0e0` on `#0d2b66` — approximately 4.2:1 contrast ratio. Passes WCAG AA but may be hard to read for visually impaired users.                                                                                                   | Low-Medium |
| **Link color in dark mode**  | `--link-color: #60a5fa` (blue-400) on `#1a1a1a` background is approximately 4.5:1 — passes AA for normal text but not AAA.                                                                                                                                   | Low        |

---

## 6. High-Value Standardization Opportunities

| Opportunity                                                        | Effort                                                    | Impact                                                | Risk                                         |
| ------------------------------------------------------------------ | --------------------------------------------------------- | ----------------------------------------------------- | -------------------------------------------- |
| **Adopt `Button` component everywhere**                            | Medium (audit + replace 15-20 ad-hoc buttons)             | High — consistent hover/active/focus/disabled states  | Low — visual-only, no behavior change        |
| **Adopt `Input` component with `error` prop everywhere**           | Low-Medium (10-15 form inputs)                            | High — consistent styling, error display, focus rings | Low — wrapper component                      |
| **Adopt `Dialog` component for all modals**                        | Medium (5-7 modal-like components)                        | High — consistent modal behavior, focus trap, overlay | Low-Medium — some modals have unique layouts |
| **Use `typeScale` tokens in components**                           | Medium (add CSS classes or inline styles based on tokens) | Medium — typographic consistency                      | Low — visual-only                            |
| **Use `spacingTokens.component` values**                           | Low (replace hardcoded padding in components)             | Medium — density support                              | Low — visual only                            |
| **Standardize empty states**                                       | Low (create EmptyState component + use everywhere)        | Medium — UX clarity                                   | Low — additive                               |
| **Standardize error message display**                              | Low (create FormError component)                          | Medium — UX trust                                     | Low — additive                               |
| **Unify `globals.css` dark mode colors with `darkSemanticColors`** | Low (align RGB values)                                    | High — prevent dark mode theme drift                  | Low — color value changes only               |

---

## 7. Areas Where Forced Uniformity Would Be Counterproductive

| Area                       | Reason                                                                                                                                                                        |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Message list rendering** | Messages (posts) benefit from unique layout — author avatar, name, timestamp, content, reactions. Forcing a standard list/table pattern would harm readability.               |
| **Chat input area**        | The TipTap editor, formatting bar, emoji picker, slash command popup together form a complex input surface. Separating into standard form components would break composition. |
| **Workspace sidebar**      | Custom drag-and-drop with categories, resize handle, and responsive overlay. Standard list components can't replicate this.                                                   |
| **Channel header**         | Combines channel name, topic, member count, mute toggle, bookmark button. Unique layout justified by information density.                                                     |
| **Team sidebar rail**      | 65px icon rail is a distinct visual pattern. Standard button layout would waste space.                                                                                        |
| **Context menu**           | Must be positioned absolutely at cursor, with viewport clamping and keyboard nav. The custom implementation (UX-015 fix) is appropriate.                                      |
| **Floating timestamp**     | Absolutely positioned, opacity-transitioned element. Unique interaction pattern justified by UX goal (clean default view, reveal on hover).                                   |
