# frontend ux release gate / principal audit prompt

use this as the dedicated end-of-process frontend ux audit.

## severity model

- p0 — release-blocking ux/ui defects
- p1 — major experience risks
- p2 — important hardening / consistency / polish issues
- p3 — nice-to-have / deferred enhancements

## required audit dimensions

### visual consistency audit

- shell surfaces
- navigation
- content panels
- chat surfaces
- profile/settings/search/content views
- typography
- spacing
- icon treatment
- color consistency
- component state consistency

### accessibility readiness audit

- keyboard nav
- focus visibility
- contrast
- semantic structure
- dialog/menu accessibility
- form labeling/errors
- touch targets
- reduced motion
- critical interaction accessibility

### responsive readiness audit

- desktop
- tablet
- mobile adaptation
- shell behavior
- chat on mobile
- settings/search/profile/content responsiveness
- side panels/drawers
- breakpoint stability

### design system coherence audit

- token usage
- semantic color usage
- typography usage
- primitive reuse
- state style consistency
- theme provider consistency
- density/customization interactions
- local styling drift

### interaction quality audit

- hover/focus/active/disabled clarity
- message actions
- thread affordances
- empty/loading/error states
- feedback timing
- command/search interaction quality
- settings ergonomics
- panel/drawer/dialog behavior

### product surface quality audit

- app shell
- navigation
- channel/chat/thread/composer
- search
- profile/member surfaces
- content/document/file surfaces
- settings/preferences/admin surfaces
- activity surfaces if present

## required release-readiness grading

all must be graded pass / pass with risks / fail:

- overall frontend release readiness
- accessibility readiness
- visual consistency readiness
- responsive readiness
- design system readiness
- chat experience readiness

## validation

run the most relevant commands available:

- web lint / typecheck / test / build
- ui lint / typecheck / test
- root lint / typecheck / test / build
- playwright / e2e where practical

## report format

- frontend ux release gate: principal audit
- objective
- repo inspection summary
- audit coverage
- findings by severity
- fixes applied
- files created
- files modified
- files removed
- commands run
- validation results
- release-readiness grading
- blockers
- residual risks
- next recommended step
