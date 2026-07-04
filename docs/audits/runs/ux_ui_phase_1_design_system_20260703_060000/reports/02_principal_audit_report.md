# Principal Audit Report

- Prompt: **ux_ui_phase_1_design_system**
- Domain: **uxui**
- Run ID: **ux_ui_phase_1_design_system_20260703_060000**
- Generated: **2026-07-03T06:00:00Z**
- Decision: **GO WITH RISKS**
- P0: **1**, P1: **1**
- P2: **3**, P3: **1**
- Readiness: **0.00**

## Findings

### P0 — Dark theme CSS variables only defined inside @media (prefers-color-scheme: dark) - no .dark class selector

- **File:** `packages/ui/src/styles.css`
- **Category:** Design System
- **Impact:** ThemeProvider applies .dark class to <html> on manual toggle, but CSS has no .dark selector. Manual light/dark toggle has zero visual effect.
- **Fix:** Duplicate dark theme variables under a .dark selector or restructure to use class-based theming in addition to the media query

### P1 — --color-accent-primary CSS variable referenced but never defined in any token file or @theme block

- **File:** `apps/web/app/auth/callback/page.tsx`
- **Category:** Design System
- **Impact:** Falls through to default browser styling. The callback page may have invisible or incorrectly styled accent elements.
- **Fix:** Define --color-accent-primary in semantic-colors.ts and styles.css, or replace with existing --color-brand-primary

### P2 — Dialog close button uses raw Unicode '✕' instead of lucide-react X icon

- **File:** `packages/ui/src/components/dialog.tsx`
- **Category:** Visual Consistency
- **Impact:** Visual inconsistency - toast component uses lucide-react X, but dialog uses Unicode. Icon weight/alignment differs.
- **Fix:** Replace with lucide-react X component

### P2 — globals.css re-declares --font-sans and --font-mono identical to values already in packages/ui/src/styles.css

- **File:** `apps/web/app/globals.css`
- **Category:** CSS Hygiene
- **Impact:** Unnecessary duplication. If one is updated and the other is not, font rendering becomes inconsistent.
- **Fix:** Remove duplicate font declarations from globals.css, rely on styles.css import

### P2 — Toast component uses inline SVG icons for variant indicators instead of lucide-react icons

- **File:** `packages/ui/src/components/toast.tsx`
- **Category:** Visual Consistency
- **Impact:** Inconsistent with the rest of the app which uses lucide-react throughout. Inline SVGs have different sizing and stroke styles.
- **Fix:** Replace inline SVGs with lucide-react CheckCircle, AlertTriangle, XCircle, Info components

### P3 — Density (comfortable/compact/spacious) and motion token systems defined in JS but never used in any component or CSS

- **File:** `packages/ui/src/tokens/spacing.ts`
- **Category:** Token Usage
- **Impact:** Dead code that adds complexity. Users cannot customize UI density or animation speed as the token system intended.
- **Fix:** Either implement density mode switching in the theme provider, wire to CSS variables, or remove unused token groups
