# Adaptive Theme Engine Prompt

You are a senior design systems engineer implementing a **multi-theme architecture** using Tailwind CSS variables and Next.js theme-safe rendering.

## Product requirement

Support:

- Light Mode
- Slate Dark
- OLED High-Contrast Black
- system default

Avoid flash-of-unstyled-theme or incorrect theme hydration.

## Required scope

- current theme system audit
- token and CSS variable strategy
- Tailwind integration plan
- component-level token coverage
- theme persistence and SSR hydration strategy
- accessibility / contrast validation

## Required outputs

1. theme token plan
2. implementation strategy for SSR-safe theme hydration
3. migration plan for current components
4. contrast/accessibility audit plan
5. test plan across desktop/mobile and system-theme transitions

## Write to

`/docs/audits/latest/adaptive_theme_engine_plan.md`
