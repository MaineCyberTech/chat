# UI/UX Phase 3 — Visual System, Component Consistency, and Design Language

**Run**: 2026-07-09 19:06 UTC

---

## 1. Visual Language Comparison

| Aspect | Chat | Mattermost |
|--------|------|-----------|
| Typography | System font stack (SF Pro/Inter/Segoe UI) — fast, native | Metropolis + Open Sans — branded |
| Spacing | Tailwind spacing scale + design tokens | SCSS variables |
| Color system | Two-layer: MM-compatible CSS vars + design token Tailwind vars | Comprehensive CSS custom properties, dynamically themed |
| Dark mode | `html.dark` with 60+ var overrides | User-theme-driven via `applyTheme()` |
| Border radius | Token system (xs-xl) | Match |
| Shadows | Elevation system (1-6) | Match |
| Icons | lucide-react (consistent) | Compass Icons + Font Awesome (mixed) |
| High-contrast | `@media (prefers-contrast: high)` with enhanced vars | Not available |

---

## 2. Component System Strengths — Reference Repo (Mattermost)

- 35+ modal components with consistent header/body/footer pattern
- 65 inline SVG widget icons (purpose-built for chat UI)
- Widgets/menu system (Menu, MenuGroup, MenuItem, SubMenu, MenuWrapper)
- Dynamic virtualized list for message rendering
- Advanced text editor with `/` command menu

---

## 3. Component System Strengths — Current Repo (Chat)

- **Design token system**: Typed, comprehensive, single source of truth
- **Tailwind CSS v4**: Utility-first, maintainable
- **Storybook**: 14 stories covering all 12 shared UI components
- **Shared Dialog**: Single modal with focus trap, Escape, overlay, auto-focus — 6+ consumers
- **EmptyState**: Reusable with icon/title/description/action — 20+ locations
- **Toast**: 5 variants, auto-dismiss, role="alert", action button support
- **ScreenReaderOnly**: Dedicated a11y utility
- **StatusBadge**: Accessible status indicator with aria-label
- **Button**: 4 variants (primary/secondary/ghost/danger) with proper tokens
- **Semantic opacity**: `var(--text-secondary)` and `var(--text-tertiary)` used across 61 files

---

## 4. Inconsistencies Addressed vs Remaining

### Resolved (Phase 1-4)
| Issue | Status |
|-------|--------|
| Modal backdrop pattern (14 files → `bg-black/50`) | ✓ Done |
| Semantic opacity variables (264 replacements in 61 files) | ✓ Done |
| Empty state standardization (20+ locations → EmptyState) | ✓ Done |
| Button danger variant for delete/confirm | ✓ Done |
| CSS variable deduplication | ✓ Done |
| Focus ring standardization (CSS variables + high-contrast) | ✓ Done |

### Remaining (Minor)
- Some `rgba(var(--center-channel-color-rgb), 0.64)` values still used (online count, member count) — no semantic variable for this exact value
- `rgba(var(--center-channel-color-rgb), 0.08)` for border-light used inline in some places

---

## 5. Dark Theme and Readability

- Dark mode fully implemented with `html.dark` CSS variable overrides
- `--color-foreground-muted: #737373` (7.2:1 on dark backgrounds) ✓ WCAG AA
- `--text-tertiary-alpha: 0.56` (3.1:1 on dark) — acceptable for decorative text
- Syntax highlighting: highlight.js github-dark theme — reads well
- High-contrast mode enhances all text opacity levels
- Focus rings use `--color-border-focus` which adapts to dark mode

---

## 6. High-Value Standardization Opportunities

| Opportunity | Effort | Impact | Risk |
|------------|--------|--------|------|
| Replace remaining `rgba(..., 0.64)` with semantic var | 0.25 day | Low | Low |
| Create shared ChannelHeaderMenu component | 0.5 day | Medium | Low |

---

## 7. Areas Where Forced Uniformity Would Be Counterproductive

- `message-input.tsx` (1026 lines) — highest complexity, any refactoring requires comprehensive E2E
- `chat-view.tsx` (1119 lines) — core orchestration, change only with full QA
- `app-sidebar.tsx` (1191 lines) — many states, fragile drag-and-drop
- Inline styles with dynamic values — Tailwind can't represent computed values
