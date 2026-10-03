# 11 — Supply Chain, Dependencies & Secrets

## Audit Metadata

- Run: 20261003-0018-develop-a72b8cc
- Target: `C:\temp\chat` @ `a72b8cc`

## Scope

Third-party dependencies, GitHub Actions pinning, SBOM, scanners, secret handling, and committed artifacts.

## Evidence Reviewed

- `package.json`, `pnpm-lock.yaml` (presence), per-app `package.json`
- `.github/workflows/build-push.yml`, `validate.yml`
- `.github/dependabot.yml`, `.husky/pre-commit`
- `.gitignore`, `git ls-files`, `test-signin.json`, `docs-prompts-archive.zip`, `infra.zip`

## Verification Performed

- Checked action pinning style across workflows.
- Confirmed scanner/SBOM steps and their gating.
- Enumerated tracked secret-adjacent and binary files.

## Executive Summary

Dependency automation exists (Dependabot, SBOM via anchore, Trivy, pnpm audit) but is largely advisory, and Actions are mostly version-tag pinned rather than SHA-pinned. A tracked credential and committed binary archives are concrete supply-chain hygiene issues.

## Inventory

| Control | Status | Evidence |
|---|---|---|
| Lockfile | Present | `pnpm-lock.yaml` |
| Dependabot | Grouped (npm/actions/docker), cooldown 15d | `.github/dependabot.yml` |
| SBOM | anchore/sbom-action, develop push only | `build-push.yml:91-114` |
| Vulnerability scan | Trivy (continue-on-error) | `build-push.yml`, `validate.yml` |
| Audit | `pnpm audit` advisory | `validate.yml:228-229` |
| Action pinning | Mixed (mostly tags) | workflows |

## Findings

### Finding ID: SUPPLY-P1-001 - Credential committed to the repository

- Severity: P1
- Confidence: High
- Area: SUPPLY
- Evidence:
  - `test-signin.json` — tracked, contains email + plaintext password (redacted)
  - `git ls-files` — present; `.gitignore` only covers `.env*` patterns
- What is happening: A secret-adjacent file is in version control.
- Why it matters: supply-chain/credential exposure; history rewrite or rotation required.
- User / business impact: account compromise risk.
- Security / privacy / reliability impact: high.
- Recommended fix: remove, rotate, gitignore, secret-scan in CI.
- Suggested validation: `gitleaks`/`trufflehog` finds nothing.
- Owner suggestion: Security
- Effort estimate: S
- Dependencies: None
- Status: open

### Finding ID: SUPPLY-P2-002 - GitHub Actions are not pinned to commit SHAs

- Severity: P2
- Confidence: High
- Area: SUPPLY
- Evidence:
  - `.github/workflows/build-push.yml:37` `actions/checkout@v4`, `:42` `docker/setup-buildx-action@v3`, `:155` etc.
  - Exceptions: `aquasecurity/trivy-action@a9c7b0f…` (`build-push.yml:117,126`)
  - `.github/workflows/*` broadly use `@v4`/`@v3` tags
- What is happening: Mutable tags are used for most actions.
- Why it matters: upstream tag compromise/tampering executes in CI with repo secrets.
- User / business impact: supply-chain compromise.
- Security / privacy / reliability impact: medium-high.
- Recommended fix: pin every action to a full commit SHA (Dependabot can bump SHAs).
- Suggested validation: `actionlint`/policy check forbids non-SHA `uses:`.
- Owner suggestion: CI/Security
- Effort estimate: M
- Dependencies: None
- Status: open

### Finding ID: SUPPLY-P2-003 - Dependency vulnerability scanning is advisory-only

- Severity: P2
- Confidence: High
- Area: SUPPLY
- Evidence:
  - `.github/workflows/validate.yml:228-229` — `pnpm audit --prod --audit-level=high || true`
  - `.husky/pre-commit:20-25` — prints warning, does not exit non-zero
  - Trivy steps `continue-on-error: true`
- What is happening: Findings never block.
- Why it matters: known-vulnerable deps ship.
- User / business impact: security debt.
- Security / privacy / reliability impact: medium-high.
- Recommended fix: block on high/critical with an exceptions file; enable Dependabot security updates.
- Suggested validation: injected advisory fails CI.
- Owner suggestion: Security
- Effort estimate: S
- Dependencies: None
- Status: open

### Finding ID: SUPPLY-P2-004 - SBOM is generated only for develop and not for production artifacts

- Severity: P2
- Confidence: Medium
- Area: SUPPLY
- Evidence:
  - `.github/workflows/build-push.yml:91-114` — SBOM steps gated `if: push && ref == refs/heads/develop`, labeled "CycloneDX" but `format: spdx-json`
  - `.github/workflows/deploy-production.yml:144-202` — builds and pushes images with no SBOM step
- What is happening: production images have no SBOM; format label mismatches format.
- Why it matters: no artifact inventory/provenance for the shipped build.
- User / business impact: slower CVE response.
- Security / privacy / reliability impact: medium.
- Recommended fix: produce SBOMs for every pushed image (all branches), fix format naming, attach as attestations.
- Suggested validation: SBOM artifact exists for a production build run.
- Owner suggestion: CI
- Effort estimate: S
- Dependencies: None
- Status: open

### Finding ID: SUPPLY-P3-005 - Large binary archives committed to the repo

- Severity: P3
- Confidence: High
- Area: SUPPLY
- Evidence:
  - `docs-prompts-archive.zip`, `infra.zip` (root)
  - `inventory.json` totals include 4 `.zip` files
- What is happening: Archives are versioned instead of stored externally.
- Why it matters: bloat and unauditable binary content (may contain secrets).
- User / business impact: repo bloat.
- Security / privacy / reliability impact: low-medium.
- Recommended fix: remove archives; store externally; add pre-commit large-file ban (already 5MB check — verify zips are <5MB or bypassed).
- Suggested validation: no tracked `*.zip`.
- Owner suggestion: Maintainer
- Effort estimate: S
- Dependencies: None
- Status: open

## Risks

- Tag-pinned actions + advisory scanners + committed secret.

## Recommendations

1. SHA-pin actions.
2. Make vuln scanning blocking.
3. Remove/rotate the credential and archives.

## Quick Wins

- Add gitleaks to CI; gitignore `test-signin.json`.

## Hardening Backlog

- Sigstore/cosign image signing and provenance attestations.

## Suggested Tests

- CI secret scan; action-pinning policy check.

## Suggested Documentation Updates

- Supply-chain policy (`SECURITY.md`).

## Open Questions

- Are SBOMs retained beyond default artifact expiry? Unknown.

## Appendix

- Trivy action is SHA-pinned (good example) while others are not.
