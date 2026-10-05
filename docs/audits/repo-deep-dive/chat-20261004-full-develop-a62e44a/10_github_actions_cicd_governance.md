# 10_github_actions_cicd_governance — Prompt 10 - GitHub Actions, CI/CD, and Governance Audit

- Run: `chat-20261004-full-develop-a62e44a`
- Target: `chat` @ `a62e44a` (branch `develop`)
- Domain: `10_github_actions_cicd_governance.md` (area CI, prompt)

## Verification Performed

Inspected all 22 workflows. Production
deploy/provision is gated behind the protected `production` environment;
security scans block; rollback executes. Residuals: destructive dev infra
workflow, auto-commit write scope, develop not branch-protected, and 13
workflows without explicit `permissions:`.

## Findings

| ID | Severity | Title |
|---|---|---|
| CI-P1-001 | P1 | Production provision/deploy ran destructive Terraform with no approval (fixed) |
| CI-P1-002 | P1 | Security scans were non-blocking (fixed) |
| CI-P2-001 | P2 | `infra-development` destroys infra on every push to `develop` |
| CI-P2-002 | P2 | Auto-commit workflows hold `contents: write` and push to main/develop |
| CI-P2-003 | P2 | `develop` (auto-deploy target) is not covered by the branch-protection gate |
| CI-P2-004 | P2 | `workflow_dispatch` inputs interpolated into `run:` (script injection) (fixed) |
| CI-P3-001 | P3 | 13 workflows omit an explicit `permissions:` block |
