# Branch Protection Setup

## Recommended protected branches

- `main`
- `master`
- `release/*`

## Recommended required checks

- `audit-gate`
- your build / test / lint / typecheck jobs

## Setup outline

1. Open GitHub repository settings.
2. Configure a branch protection rule for `main`.
3. Require status checks to pass before merge.
4. Add `audit-gate` as a required check.
5. Repeat for `release/*` if production promotions rely on release branches.
6. Keep policy changes code-reviewed like any other release-governance change.
