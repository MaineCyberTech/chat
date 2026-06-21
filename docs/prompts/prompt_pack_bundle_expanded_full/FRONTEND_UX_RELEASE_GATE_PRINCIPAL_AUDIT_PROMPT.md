# Frontend UX Release Gate / Principal Audit Prompt

## Ultra-Hardened Release-Style Frontend UX Audit

Use this as the dedicated end-of-process frontend UX audit.

## Severity Model

- `P0` — release-blocking UX/UI defects
- `P1` — major experience risks
- `P2` — important hardening / consistency / polish issues
- `P3` — nice-to-have / deferred enhancements

## Required Audit Dimensions

### Visual Consistency Audit

Audit shell surfaces, navigation, content panels, chat surfaces, profile/settings/search/content views, typography, spacing, icon treatment, color consistency, and component state consistency.

### Accessibility Readiness Audit

Audit keyboard nav, focus visibility, contrast, semantic structure, dialog/menu accessibility, form labeling/errors, touch targets, reduced motion, and critical interaction accessibility.

### Responsive Readiness Audit

Audit desktop, tablet, mobile adaptation, shell behavior, chat on mobile, settings/search/profile/content responsiveness, side panels/drawers, and breakpoint stability.

### Design System Coherence Audit

Audit token usage, semantic color usage, typography usage, primitive reuse, state style consistency, theme provider consistency, density/customization interactions, and local styling drift.

### Interaction Quality Audit

Audit hover/focus/active/disabled clarity, message actions, thread affordances, empty/loading/error states, feedback timing, command/search interaction quality, settings ergonomics, and panel/drawer/dialog behavior.

### Product Surface Quality Audit

Audit app shell, navigation, channel/chat/thread/composer, search, profile/member surfaces, content/document/file surfaces, settings/preferences/admin surfaces, and activity surfaces if present.

## Required Release-Readiness Grading

Each must be graded as PASS / PASS WITH RISKS / FAIL:

- Overall Frontend Release Readiness
- Accessibility Readiness
- Visual Consistency Readiness
- Responsive Readiness
- Design System Readiness
- Chat Experience Readiness

## Validation

Run the most relevant commands available:

- web lint / typecheck / test / build
- ui lint / typecheck / test
- root lint / typecheck / test / build
- Playwright / E2E where practical

## Report Format

- FRONTEND UX RELEASE GATE: PRINCIPAL AUDIT
- OBJECTIVE
- REPO INSPECTION SUMMARY
- AUDIT COVERAGE
- FINDINGS BY SEVERITY
- FIXES APPLIED
- FILES CREATED
- FILES MODIFIED
- FILES REMOVED
- COMMANDS RUN
- VALIDATION RESULTS
- RELEASE-READINESS GRADING
- BLOCKERS
- RESIDUAL RISKS
- NEXT RECOMMENDED STEP
