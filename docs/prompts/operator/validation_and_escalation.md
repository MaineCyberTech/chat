# validation and escalation guide

## typical validation expectations

depending on the phase, expect some subset of:

- `pnpm install`
- `pnpm lint`
- `pnpm format:check`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm --filter ...`
- `docker compose ... config`
- `terraform fmt -check`
- `terraform validate`
- playwright / e2e where practical

## escalate when

- unresolved p0/p1 issues remain
- domain/environment usage drifts from the `.us` / `.com` model
- scripts/workflows no longer match the repo
- auth/origin/security assumptions drift
- duplicate systems are created instead of reconciliation
- ux/ui work introduces design-system forks or unstable styling patterns
