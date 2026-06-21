# bootstrap prompt — empty repo execution mode (super-strict)

use this when you want a stricter foundation for an empty or near-empty repo.

## force creation of

- root lint config
- root formatting config
- root vitest config
- root playwright scaffold
- package script matrix
- stricter readme / runbook / contributor docs structure

## explicit root tooling

- eslint config
- prettier config + ignore rules
- vitest config
- playwright config
- root scripts: dev, build, lint, format, format:check, typecheck, test, test:unit, test:integration, test:e2e, check, clean, ci

## additional docs structure

- docs/readme.md
- docs/architecture/...
- docs/environments/...
- docs/runbooks/...
- docs/contributing/...

## execution requirements

- create/modify files directly
- run install/lint/format:check/typecheck/test/build
- add docker/terraform validation if practical
- repair actionable issues

## response format

- bootstrap: empty repo foundation (super-strict)
- objective
- repo inspection summary
- implementation plan
- directories created
- files created
- files modified
- dependencies added
- script matrix
- commands run
- validation results
- blockers
- next recommended step
