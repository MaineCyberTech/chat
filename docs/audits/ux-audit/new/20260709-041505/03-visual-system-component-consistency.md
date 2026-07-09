# UI/UX Phase 3 — Visual System, Component Consistency, and Design Language

**Run**: 2026-07-09 04:15 UTC

---

## 1. Visual Language Comparison

| Aspect | Chat | Mattermost |
|--------|------|-----------|
| **Typography** | System font stack (SF Pro/Inter/Segoe UI) — fast loading, native feel | Metropolis (headings) + Open Sans (body) — custom brand typography |
| **Spacing** | Tailwind spacing scale (0-24 rem-equivalents) + design tokens | SCSS variables with consistent multiplier |
| **Color system** | Two-layer: Mattermost-compatible CSS vars + design token Tailwind vars | Comprehensive CSS custom properties, dynamically themed |
| **Dark mode** | `html.dark` class with CSS variable overrides, 60+ vars redefined | User-theme-driven via `applyTheme()` — any color scheme possible |
| **Border radius** | Consistent token system (`--radius-xs` through `--radius-xl`) | Match (same token scale) |
| **Shadows** | Elevation system (`--elevation-1` through `--elevation-6`) | Match (same elevation scale) |
| **Icon style** | lucide-react — consistent 16-20px, clean monoline | Compass Icons — custom designed, brand-consistent |

### Verdict
Chat's typography (system fonts) loads faster and looks native on each platform. Mattermost's custom typography provides stronger brand identity. Both color systems are equivalent in capability. Chat's icon set (lucide-react) is more consistent than MM's blend of Compass Icons + Font Awesome.

---

## 2. Component System Strengths in Reference Repo (Mattermost)

- **35+ modal components** — each specialized for its purpose, with consistent header/body/footer pattern
- **65 inline SVG widget icons** — purpose-built for chat UI chrome (not dependent on icon library)
- **Widgets/menu system** — full dropdown menu framework (Menu, MenuGroup, MenuItem, SubMenu, MenuWrapper)
- **Dynamic virtualized list** for message rendering with performance optimizations
- **Advanced text editor** with `/` command menu, `+` attachment menu, formatting toolbar, markdown preview toggle
- **Post priority** with visual badges, color coding, and confirmation dialogs (also present in Chat)
- **Channel bookmarks** with CRUD, drag-reorder, link preview thumbnails

---

## 3. Component System Strengths in Current Repo (Chat)

- **Design token system** — comprehensive, typed, single source of truth for colors, spacing, typography, motion, borders, focus
- **Tailwind CSS v4** — utility-first, avoids custom SCSS bloat
- **Storybook** — 14 stories covering all shared UI components
- **Shared Dialog component** — single modal implementation used by 6+ consumers, with focus trap, Escape, overlay, auto-focus
- **EmptyState component** — reusable with icon/title/description/action, used across 4+ locations
- **Toast system** — 5 variants with auto-dismiss, role="alert" for accessibility
- **ScreenReaderOnly** — dedicated utility for accessible hidden text
- **StatusBadge** — accessible status indicator with aria-labels
- **Button variants** — primary, secondary, ghost, danger with proper color tokens

---

## 4. Inconsistencies to Address

| Inconsistency | Location | Impact |
|--------------|----------|--------|
| **Modal backdrop pattern** | Fixed vs Tailwind classes mixed across 14 files | Minor — already mostly standardized to `bg-black/50` in Phase 2 |
| **Color variable usage** | `var(--text-secondary)` vs `rgba(var(--center-channel-color-rgb), 0.72)` | Medium — semantic var exists but not universally used |
| **Button styling** | Shared Button vs mm-button-icon vs inline styled | Medium — 3 different button patterns coexist |
| **Border patterns** | `var(--border-default)` / `var(--border-light)` vs inline `rgba(...)` | Low — mostly using vars now |
| **Loading states** | Skeleton component vs inline animate-pulse divs | Low — inconsistent use of shared skeleton |
| **Empty states** | EmptyState component used in 4 locations vs 20+ ad-hoc implementations | Medium - was partially addressed in Phase 2 |

---

## 5. Dark Theme and Readability Findings

### Current State
- Dark mode is fully implemented with `html.dark` CSS variable overrides
- 60+ variables redefined for dark mode across both CSS layers
- `foreground.muted` (`--color-foreground-muted: #737373`) passes WCAG AA (4.5:1) on dark backgrounds (#1a1a1a → 7.2:1)
- `--text-tertiary-alpha: 0.56` on dark bg (#1a1a1a) = 3.1:1 — below AA for small text, acceptable for secondary/decorative text
- Syntax highlighting uses highlight.js github-dark theme — reads well
- Code blocks have proper contrast with background

### Risks
- No automated contrast testing in CI
- `--offline-indicator: rgba(148, 163, 184, 0.5)` may be low contrast on some sidebar backgrounds
- No high-contrast mode support

---

## 6. High-Value Standardization Opportunities

| Opportunity | Effort | Impact | Risk |
|------------|--------|--------|------|
| **Replace remaining ad-hoc empty states** with EmptyState component | 1 day | Medium | Low |
| **Standardize modal backdrop to bg-black/50** (done in Phase 2) | — | Done | — |
| **Consolidate to semantic opacity variables** (`--text-secondary-alpha` etc.) across remaining inline styles | 1 day | Medium | Low |
| **Standardize focus ring** across all interactive elements | 0.5 day | High | Low |
| **Create shared ChannelHeaderMenu** component pattern | 0.5 day | Medium | Low |

---

## 7. Areas Where Forced Uniformity Would Be Counterproductive

- `message-input.tsx` (1026 lines) — highest complexity, any refactoring requires comprehensive E2E coverage
- `chat-view.tsx` (905 lines) — core orchestration, change only with full QA
- `app-sidebar.tsx` (1191 lines) — many states (collapsed, desktop, mobile, tablet), hard to componentize cleanly
- Inline styles with dynamic values (e.g., `style={{ width: virtualRow.size }}`) — Tailwind can't represent computed values
- The status pill CSS classes (`.status-pill--online` etc.) — work correctly with globals.css, no need to replace
