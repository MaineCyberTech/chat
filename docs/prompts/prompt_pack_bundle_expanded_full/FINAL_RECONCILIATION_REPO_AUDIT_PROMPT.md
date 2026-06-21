# Final Reconciliation / Repo Audit Prompt
## Strict End-of-Process Cross-Phase Repair Pass

Use this after all 7 platform phases are complete.

## Objective
Perform a strict cross-phase audit and repair pass across:
- monorepo/workspace config
- TypeScript/build/import consistency
- frontend/backend/database contract consistency
- auth/env/origin consistency
- `.us` / `.com` domain consistency
- Docker/Traefik/runtime orchestration
- Terraform/cloud-init
- CI/CD workflows
- docs/runbooks/contributor guidance
- dead files / duplicate systems

## Validation Matrix
Run the most relevant available commands, including an appropriate subset of:
- `pnpm install`
- `pnpm lint`
- `pnpm format:check`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- targeted workspace commands
- Docker compose config checks
- `terraform fmt -check`
- `terraform validate`

## Report Format
- FINAL RECONCILIATION: CROSS-PHASE REPO AUDIT
- OBJECTIVE
- REPO INSPECTION SUMMARY
- AUDIT COVERAGE
- IMPLEMENTATION PLAN
- FILES CREATED
- FILES MODIFIED
- FILES REMOVED
- COMMANDS RUN
- VALIDATION RESULTS
- BLOCKERS
- RISKS / FOLLOW-UP NOTES
- NEXT RECOMMENDED STEP
