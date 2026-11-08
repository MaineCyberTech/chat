# Branch Protection Setup

## Recommended protected branches

- `develop` — repository default branch and development auto-deploy target
- `main` — production promotion branch (create it when production is enabled)
- `master`
- `release/*`

## Required rules on `develop`

The in-repo gate in `.github/workflows/validate.yml` (`Check Branch Protection`)
fails closed unless the branch carries active rules for all three:

- **Pull request review** before merging
- **Required status checks** before merging
- **Non-fast-forward** (block force pushes and deletions)

Recommended required checks (workflow / job names):

- `Lint, Typecheck, Test, Build / lint`
- `Lint, Typecheck, Test, Build / typecheck`
- `Lint, Typecheck, Test, Build / test`
- `Lint, Typecheck, Test, Build / security-audit`
- `Lint, Typecheck, Test, Build / Secret Scan (gitleaks)`
- `Lint, Typecheck, Test, Build / Test Database Migrations`
- `Lint, Typecheck, Test, Build / build`
- `Lint, Typecheck, Test, Build / Check Branch Protection`

## Recommended required checks (other branches)

- `audit-gate`
- your build / test / lint / typecheck jobs

## Setup outline

1. Open GitHub repository settings → Rules → Rulesets (or Branches).
2. Create an active branch ruleset targeting `refs/heads/develop`.
3. Require a pull request before merging (at least one approval).
4. Require status checks to pass before merge and add the checks above.
5. Block force pushes and deletions (`non_fast_forward`).
6. Repeat for `main` / `release/*` if production promotions rely on those branches.
7. Keep policy changes code-reviewed like any other release-governance change.

## Verification

```bash
gh api repos/<owner>/<repo>/rules/branches/develop --jq '.[].type'
```

The response must include `pull_request`, `required_status_checks` and
`non_fast_forward`. The in-repo gate reads the same endpoint, so a missing rule
fails CI instead of silently claiming the branch is protected.
