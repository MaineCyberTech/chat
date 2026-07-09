# UI/UX Phase 3 — Visual System, Component Consistency, and Design Language

**Run**: 2026-07-09 03:26 UTC

---

## 1. Visual Language Comparison

### Current Repo — Design Token System

- **Base palette**: 50-950 neutral scale, blue brand colors, semantic green/yellow/red
- **Semantic tokens** in `packages/ui/src/tokens/semantic-colors.ts`: background, foreground, border, status, component-specific (button, input, avatar, badge, skeleton, dialog, sidebar)
- **Mattermost variables** in `globals.css`: `--button-bg`, `--center-channel-bg`, `--sidebar-bg`, etc. — intentionally matching Mattermost naming for compatibility
- **Dark mode**: Full overrides in both `globals.css` (`html.dark`) and `packages/ui/src/styles.css` (`html.dark @theme`)

### Reference Repo — Visual System

- **Sass variables** in `sass/utils/_variables.scss` + CSS custom properties in `sass/base/_css_variables.scss`
- **Compass design system**: `components/compass_design_provider/` — Mattermost's design system wrapper
- **Metropolis font**: Headings, Open Sans: body text (18 font files total)
- **65 SVG icon components** in `widgets/icons/`
- **50 SVG illustration components** in `common/svg_images_components/`
- **Theme provider** dynamically injects CSS variable values via JavaScript

### Key Visual Difference

| Aspect             | Mattermost                                       | Current Repo                                                              |
| ------------------ | ------------------------------------------------ | ------------------------------------------------------------------------- |
| **Font**           | Metropolis (headings) + Open Sans (body)         | System UI stack (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto`) |
| **Icon library**   | Custom SVG components (65) + some font icons     | Lucide React icons (agnostic, popular library)                            |
| **Illustrations**  | 50+ SVG illustration components                  | Not present (intentionally minimal)                                       |
| **Design tokens**  | Sass variables + CSS custom properties           | Formal token files + Tailwind @theme + CSS vars                           |
| **Border radius**  | xs(2) / s(4) / m(8) / l(12) / xl(16) / full(50%) | Same radii (intentionally mirrored)                                       |
| **Elevation**      | 6 levels (e1-e6), same values                    | 6 levels (e1-e6), same values (intentionally mirrored)                    |
| **Spacing system** | 4px base increment                               | Tailwind standard (0.25rem base)                                          |
| **Color range**    | Themed (blue sidebar) + white center             | Same pattern (blue sidebar + white center)                                |

---

## 2. Component System Strengths in Reference Repo

- **Consistent modal patterns**: All modals use similar overlay + content + close patterns
- **Admin console uniformity**: 128 settings sections follow the same `setting.tsx` / `setting_set.tsx` / `settings_group.tsx` pattern
- **Post component system**: `post/` + `post_view/` (50 subdirectories) — extremely mature message rendering
- **Widgets library**: `widgets/inputs/` (7 types), `widgets/menu/` (24 files), `widgets/modals/` (16 files), `widgets/loading/`, `widgets/badges/`, `widgets/links/`, `widgets/separator/`
- **Common hooks**: 70 custom hooks covering every reusable behavior pattern
- **SVG icon consistency**: All 65 icons are React components with uniform props

## 3. Component System Strengths in Current Repo

- **Design token package**: `packages/ui/src/tokens/` provides a single source of truth for all visual properties
- **Tailwind integration**: `@theme` block in CSS generates Tailwind utility classes automatically — fast iteration
- **Small, intentional component surface**: 10 shared components (Button, Dialog, Input, Badge, Avatar, Skeleton, SidebarGroup, Toast, ThemeToggle) — easy to maintain, easy to audit
- **Storybook coverage**: 11 stories across all major components — living documentation
- **CSS variable maturity**: Full Mattermost variable compatibility + z-index layers + elevation system + text opacity levels + semantic colors
- **Dark mode completeness**: Every UI color has a dark mode counterpart (not always true in larger apps)
- **Responsive touch targets**: Global CSS for mobile touch areas (`min-height: 36px` for buttons, `44px` for sidebar channels)

## 4. Inconsistencies to Address

| Inconsistency                         | Location                                            | Details                                                                                                       |
| ------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **CSS variable duplication**          | `globals.css` + `styles.css` + `semantic-colors.ts` | Same concepts defined in 3 places (e.g., border colors, button colors) — leads to drift                       |
| **Hardcoded `#fff` references**       | 14+ component files                                 | Remaining `#fff` in admin page, search page, etc. should use `var(--button-color)`                            |
| **Inline styles mixed with Tailwind** | Many components                                     | Some use Tailwind classes, others use inline `style={{}}` with CSS vars — inconsistent styling approach       |
| **Dialog component not reused**       | `delete-dialog.tsx` vs shared `Dialog`              | DeleteDialog has its own modal implementation instead of extending shared Dialog                              |
| **Raw opacity values**                | Various files                                       | Uses `0.56`, `0.72` opacity directly instead of `var(--text-secondary-alpha)` or `var(--text-tertiary-alpha)` |
| **Button variants not exhaustive**    | `packages/ui/button.tsx`                            | Has primary/secondary/ghost but no danger or warning variant — some places use inline styled buttons          |
| **No status badge component**         | Various                                             | Status indicators (online/away/dnd/dnd) are CSS classes, not a `<Badge>` variant                              |
| **No empty state component**          | Various                                             | Empty states use bespoke markup in each location rather than a shared `<EmptyState>` component                |

## 5. Dark Theme and Readability Findings

### Current Repo Dark Mode

- **Center channel**: `#1a1a1a` bg, `#d4d4d4` text — good contrast ratio (~13:1)
- **Sidebar**: `#0d2b66` bg — not pure black, which is correct for readability
- **Button**: `#3b82f6` (Tailwind blue-500) — accessible against `#1a1a1a` bg
- **Elevation shadows**: Darkened from `rgba(0,0,0,0.12)` to `rgba(0,0,0,0.28)` — appropriate for dark mode
- **Link color**: `#60a5fa` — good contrast on dark bg

### Risks

| Risk                             | Details                                                                                                              |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **`foreground.muted`** (#737373) | WCAG AA requires 4.5:1 for normal text — `#737373` on `#1a1a1a` is ~5.6:1 for normal text (passes AA for 14pt+ text) |
| **Status colors in dark mode**   | `--dnd-indicator: #f87171` — red-400, `--online-indicator: #34d399` — green-400. Both pass AA on dark bg             |
| **Sidebar text on `#0d2b66`**    | `--sidebar-text: #e0e0e0` — contrast ratio ~8:1 on `#0d2b66` — good                                                  |
| **Mention highlight**            | `--mention-highlight-bg: #854d0e` (amber-700) — may be low contrast for black text if used as background highlight   |

## 6. High-Value Standardization Opportunities

| Opportunity                                                      | Effort   | Benefit                                                                              |
| ---------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------ |
| **Consolidate all CSS variables into `packages/ui/src/tokens/`** | 2-3 days | Eliminates drift between `globals.css`, `styles.css`, `semantic-colors.ts`           |
| **Create shared `<EmptyState>` component**                       | 0.5 day  | Consistent empty states for search, channel list, saved messages, scheduled messages |
| **Add `danger` variant to Button**                               | 0.25 day | Delete/destructive actions get consistent styling                                    |
| **Replace manual modal patterns with shared Dialog**             | 1 day    | Consistent focus trap, escape handling, overlay behavior                             |
| **Standardize inline style vs Tailwind usage**                   | 1-2 days | Consistent code review standards                                                     |
| **Create status badge component**                                | 0.5 day  | Consistent online/away/dnd indicators everywhere                                     |

## 7. Areas Where Forced Uniformity Would Be Counterproductive

- **Message list item**: Highly customized rendering (groups, reactions, edit, thread indicator, etc.) — abstracting into generic component would add complexity
- **Chat view layout**: Complex orchestration of MessageList + MessageInput + RHS panels — a generic layout component would be over-abstracted
- **Code block**: Specialized syntax highlighting — needs its own component, not a generic wrapper
- **Sidebar**: Deeply integrated with drag-and-drop, categories, resize — generic sidebar component would add indirection
- **Onboarding tour**: Transient UI overlay with unique behavior — not worth forcing into shared component
