# Pre-Reconciliation Checklist

## Repo state safety

- [ ] Confirm current branch and target reconciliation branch
- [ ] Capture `git status`
- [ ] Capture `git remote -v`
- [ ] Create a restore point / checkpoint branch
- [ ] Confirm whether there are uncommitted local changes

## Build/test baseline

- [ ] Install dependencies successfully
- [ ] Run lint
- [ ] Run typecheck
- [ ] Run unit/integration tests
- [ ] Run E2E tests if available
- [ ] Capture baseline failures before any edits

## Environment/deployment safety

- [ ] Confirm dev/prod environment separation is unchanged
- [ ] Confirm secret/variable source of truth
- [ ] Confirm Terraform working directory and var-file conventions
- [ ] Confirm Supabase migration workflow expectations
- [ ] Confirm Vercel/AWS deploy assumptions

## Review scope safety

- [ ] Confirm whether reconciliation is main->current, develop->current, or both
- [ ] Confirm whether chat repo is in scope now or deferred
- [ ] Confirm whether docs-only drift should be included
- [ ] Confirm whether generated artifacts should be excluded

## Approval gates

- [ ] Changes to auth
- [ ] Changes to database migrations/seeds
- [ ] Changes to deployment workflows
- [ ] Changes to infra/terraform
- [ ] Changes to API contract / public routes
