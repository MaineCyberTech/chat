# Deployment Policy

## Tiers

### Dev (development)

- **Trigger**: Auto-deploy on push to `develop`
- **Approval**: None (CI must pass)
- **Environment**: chat.mainecybertech.us
- **Deploy Type**: `deploy-development.yml`

### RC (release candidate)

- **Trigger**: Manual `workflow_dispatch` on `develop`
- **Approval**: All status checks required (lint, typecheck, test, build, E2E)
- **Environment**: Staging (same droplet, separate compose project)
- **Validation**: Health check + smoke test required

### Production

- **Trigger**: Push to `main` or manual `workflow_dispatch`
- **Approval**: Environment approval required (`deploy` job uses `environment: production`)
- **Environment**: chat.mainecybertech.com
- **Deploy Type**: `deploy-production.yml`
- **Rollback**: Supported via `rollback_sha` input

### Hotfix

- **Trigger**: Emergency `workflow_dispatch` with `hotfix=true`
- **Approval**: Bypasses environment approval; requires post-deployment audit within 24 hours
- **Process**: Branch from `main`, minimal fix, PR review, deploy, notify #operations, schedule post-mortem
