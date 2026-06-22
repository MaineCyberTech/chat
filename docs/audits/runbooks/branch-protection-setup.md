# Branch Protection Setup Guide

## Recommended protected branches

- `main`
- `master`
- `release/*`

## Required status checks to add

- `audit-gate` from `.github/workflows/audit-pr-gate.yml`
- your existing build / test / lint / typecheck jobs

## Suggested setup steps

1. Open **GitHub → Settings → Branches**.
2. Create or update a protection rule for `main`.
3. Enable:
   - Require a pull request before merging
   - Require status checks to pass before merging
   - Require branches to be up to date before merging
   - Require conversation resolution before merging
4. Add the `audit-gate` workflow job as a required status check.
5. Repeat for `release/*` if production promotion uses release branches.

## Policy strategy

- Use `docs/audits/policies/gate-policy.dev.json` for PR and development gate checks.
- Use `docs/audits/policies/gate-policy.prod.json` for production promotion checks.
- Prefer changing policy JSON rather than editing thresholds in workflows.
