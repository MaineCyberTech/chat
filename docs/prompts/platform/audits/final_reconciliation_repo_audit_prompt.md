# final reconciliation / repo audit prompt

use this after all 7 platform phases are complete.

## objective
perform a strict cross-phase audit and repair pass across:
- monorepo/workspace config
- typescript/build/import consistency
- frontend/backend/database contract consistency
- auth/env/origin consistency
- .us / .com domain consistency
- docker/traefik/runtime orchestration
- terraform/cloud-init
- ci/cd workflows
- docs/runbooks/contributor guidance
- dead files / duplicate systems

## validation matrix
run the most relevant available commands, including an appropriate subset of:
- pnpm install
- pnpm lint
- pnpm format:check
- pnpm typecheck
- pnpm test
- pnpm build
- targeted workspace commands
- docker compose config checks
- terraform fmt -check
- terraform validate

## report format
- final reconciliation: cross-phase repo audit
- objective
- repo inspection summary
- audit coverage
- implementation plan
- files created
- files modified
- files removed
- commands run
- validation results
- blockers
- risks / follow-up notes
- next recommended step
