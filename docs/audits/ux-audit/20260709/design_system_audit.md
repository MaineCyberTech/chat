# Design System Audit

## Token System Assessment

| Token Category               | Completeness | Issues                                                  |
| ---------------------------- | :----------: | ------------------------------------------------------- |
| Colors (base palette)        |   Complete   | —                                                       |
| Semantic colors (light+dark) |   Complete   | Dark values exist but not wired to `.dark` class        |
| Typography                   |   Complete   | Font families, sizes, weights, line heights, type scale |
| Spacing                      |   Complete   | Base scale + component-specific + density presets       |
| Motion                       |   Complete   | Duration, easing, component transitions                 |
| Borders                      |   Complete   | Radius + shadow elevation + component defaults          |
| Focus                        |   Complete   | Ring styles, CSS variable generation                    |
| Tailwind v4 theme mapping    |   Complete   | Maps tokens to Tailwind theme                           |

## Critical Issues

### 1. Two Competing CSS Variable Namespaces (P2)

The design system (`styles.css`) defines `--color-*` variables but the web app (`globals.css`) defines a completely separate Mattermost-compatibility namespace:

| Design System (`styles.css`)         | Web App (`globals.css`)                 |
| ------------------------------------ | --------------------------------------- |
| `--color-foreground-primary`         | `--center-channel-color`                |
| `--color-background-primary`         | `--center-channel-bg`                   |
| `--color-border-primary`             | `--border-default`                      |
| `--color-button-primary-bg`          | `--button-bg`                           |
| `--shadow-xs` through `--shadow-2xl` | `--elevation-1` through `--elevation-6` |

**Impact**: The design system CSS variables are effectively inoperative in the web app. Components use 100+ inline `rgba(var(--center-channel-color-rgb), ...)` styles.

### 2. Triple-Defined Radius Values (P2)

Three different radius naming/value systems:

| globals.css (`:root`) | styles.css (`@theme`) | tailwind-theme.css (`@theme`) |
| --------------------- | --------------------- | ----------------------------- |
| `--radius-xs: 2px`    | `--radius-sm: 4px`    | `--radius-xs: 2px`            |
| `--radius-s: 4px`     | `--radius-md: 6px`    | `--radius-sm: 4px`            |
| `--radius-m: 8px`     | `--radius-lg: 8px`    | `--radius-md: 8px`            |
| `--radius-l: 12px`    | `--radius-xl: 12px`   | `--radius-lg: 12px`           |
| `--radius-xl: 16px`   | `--radius-2xl: 16px`  | `--radius-xl: 16px`           |

### 3. No Centralized Z-Index System (P2)

8 distinct z-index values scattered across 20+ files with no coordination:

- 6, 10, 15, 20, 30, 40, 50, 100
- Loading indicator (z-50) overlaps dialogs (also z-50)
- Context menus at z-100 and keyboard shortcuts at z-[100] use different syntax for same layer

## Component Consistency

### Components to Standardize

| Component            | Current State                    | Issue                                                                      | Recommendation                          |
| -------------------- | -------------------------------- | -------------------------------------------------------------------------- | --------------------------------------- |
| `DeleteDialog`       | Custom dialog in `message-list/` | Duplicates `@chat/ui` Dialog with own focus trap, hardcoded colors/strings | Refactor to use shared Dialog component |
| Button loading state | Missing                          | No loading spinner variant across buttons                                  | Add `loading` prop to Button            |
| Avatar error state   | Missing                          | Broken images show no fallback                                             | Add `onError` to show initials fallback |
| Dialog animation     | Missing                          | No enter/exit transitions                                                  | Add CSS transitions for open/close      |
| Toast actions        | Missing                          | No "Undo" or "Retry" action buttons                                        | Add `action` prop to Toast              |

### Components to Remove

- None — all components serve a purpose, but `DeleteDialog` should be refactored

### Tokens to Introduce

- `--z-base: 1` through `--z-max: 100` — centralized z-index layer map
- `--button-color` — already defined but not used everywhere (hardcoded `#fff` used in 5+ places)

### Documentation Needed

- Usage guide for `@chat/ui` components with examples
- Design token reference (colors, spacing, typography)
- Theme customization guide
- Responsive design pattern documentation
- Accessibility compliance checklist for component authors
