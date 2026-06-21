# Do-Not-Break Guardrails

Document the hard constraints the final reconciliation must preserve.

## Functional Guardrails

- Auth flows that must not break:
- Role/permission-sensitive flows that must not break:
- Critical business workflows that must not break:
- API/route contracts that must not break:

## Frontend / UX Guardrails

- Pages/layouts that should not be reorganized yet:
- UX patterns that are working and should be preserved:
- Areas where behavior matters more than visual polish:
- Areas that require visual QA before any change:

## Deployment / Environment Guardrails

- Dev/prod assumptions that must not drift:
- Environment variable contracts that must stay stable:
- CI/CD workflows that must not be disrupted:
- Secrets / integration assumptions that must not change:

## Refactor Guardrails

- Files/folders currently off-limits:
- Areas that require tests first:
- Areas that require human review before acceptance:
- Naming or structure that should not be changed yet:

## Explicit Non-Goals

- Changes we are not pursuing right now:
- Optimizations we intentionally defer:
- Reference-repo similarities we explicitly do not want to force:
