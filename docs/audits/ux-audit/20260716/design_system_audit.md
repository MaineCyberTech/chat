# Design System Audit — July 16, 2026

## Component Inventory

### packages/ui (Shared Library) — 12 Components

| Component        | Status    | Tested | Storybook | ARIA Built-in | Notes               |
| ---------------- | --------- | ------ | --------- | ------------- | ------------------- |
| Button           | ✅ Stable | ✅     | ✅        | ✅            | 4 variants, 3 sizes |
| Avatar           | ✅ Stable | ✅     | ✅        | ✅            | imgError handled    |
| Input            | ✅ Stable | ✅     | ✅        | ✅            | Error state         |
| Badge            | ✅ Stable | ✅     | ✅        | ✅            | 4 colors            |
| Dialog           | ✅ Stable | ✅     | ✅        | ✅            | Focus trap, overlay |
| Toast            | ✅ Stable | ❌     | ✅        | ✅            | 5 variants          |
| Skeleton         | ✅ Stable | ✅     | ✅        | ✅            | 3 variants          |
| SidebarGroup     | ✅ Stable | ✅     | ✅        | ✅            | Collapsible         |
| ThemeToggle      | ✅ Stable | ❌     | ❌        | ❌            | Under-tested        |
| ScreenReaderOnly | ✅ Stable | ❌     | ✅        | ✅            | Minimal component   |
| StatusBadge      | ✅ Stable | ❌     | ✅        | ✅            | Online/away/dnd     |
| EmptyState       | ✅ New    | ❌     | ✅        | ✅            | Used in 16 files    |

### Inline Components (apps/web) — Should Be Shared

| Component       | Location                         | Reason to Share                    |
| --------------- | -------------------------------- | ---------------------------------- |
| `StatusBadge`   | admin/page.tsx                   | `@chat/ui` already has StatusBadge |
| `Card`          | admin/page.tsx                   | Reusable wrapper pattern           |
| `ToggleRow`     | settings/page.tsx                | `role="switch"` with label pattern |
| `highlightText` | search-bar.tsx + search/page.tsx | Duplicated in 2 files              |
| Pagination      | admin/page.tsx (×3)              | Duplicated across 3 tabs           |

## Token System Audit

### Strengths

- 8 dedicated token files (`colors.ts`, `semantic-colors.ts`, `typography.ts`, `spacing.ts`, `borders.ts`, `focus.ts`, `motion.ts`, `index.ts`)
- CSS variable generation via `generateCSSVariables()`
- Tailwind v4 `@theme` integration
- Component-level semantic color granularity (button primary/secondary/ghost)
- Mattermost CSS var compatibility (`--button-bg`, `--center-channel-bg`, etc.)

### Problems

| Problem                                     | Location                         | Impact                                                   | Fix                                  |
| ------------------------------------------- | -------------------------------- | -------------------------------------------------------- | ------------------------------------ |
| Two parallel var systems                    | globals.css + styles.css         | Confusion about convention                               | Document layers, plan consolidation  |
| `--border-default` includes `solid 1px`     | globals.css                      | Can't compose with `border-top`                          | Split into width/style/color         |
| Dark mode `--text-secondary` hardcoded rgba | globals.css                      | Alpha var pattern broken                                 | Derive from `--text-secondary-alpha` |
| Density modes unused                        | spacing.ts                       | Dead code — 3 modes defined but never wired              | Implement or remove                  |
| Some values duplicated                      | globals.css + tailwind-theme.css | `--radius-xs`, `--radius-sm` defined in both Conflicting | Define in one source of truth        |

## Component Consolidation Plan

### Components to Standardize

1. **Inline StatusBadge** in admin → use `@chat/ui` StatusBadge
2. **Inline Card** in admin → extract to shared component or remove
3. **ToggleRow** in settings → extract to shared component
4. **highlightText** → shared utility in `packages/ui/src/utils/`
5. **Pagination** → shared component for admin and search

### Components to Remove

- None identified — all serve a purpose

### Components to Refactor

1. **message-input.tsx** (1018 lines) → split into:
   - `ChatEditor` — TipTap wrapper + formatting
   - `AutocompleteManager` — @mentions, :emoji, /commands
   - `FileUploadArea` — drag-and-drop + paste
   - `Scheduler` — send scheduling UI
   - `ComposerToolbar` — AI, priority, formatting toggle

### Tokens to Introduce

- `--border-width-default`, `--border-style-default`, `--border-color-default`
- `--density-compact/comfortable/spacious` implementations

### Documentation Needed

- CSS variable layer architecture (Mattermost vs design tokens) — which to use when
- Component usage guidelines for each `@chat/ui` component
- Migration guide from inline components to shared library
