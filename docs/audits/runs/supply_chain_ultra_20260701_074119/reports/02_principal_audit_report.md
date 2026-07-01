# Principal Audit Report

- Prompt: **supply_chain_ultra**
- Domain: **supply_chain**
- Run ID: **supply_chain_ultra_20260701_074119**
- Generated: **2026-07-01T07:41:18Z**
- Decision: **NO-GO**
- P0: **2**, P1: **2**
- P2: **2**, P3: **1**
- Readiness: **48.00**

## Findings

### P0 — Trivy vulnerability scanner uses @master mutable tag — not pinned to a specific SHA or semver

- **File:** `.github/workflows/validate.yml`
- **Category:** CI/CD artifacts
- **Impact:** Supply chain risk: a compromised or updated @master could introduce malicious code into CI pipeline without review
- **Fix:** Pin trivy-action to a specific SHA (e.g., aquasecurity/trivy-action@595be6a...) or semver tag (e.g., @v0.28.0)

### P0 — Trivy action also uses @master tag in build-push.yml — same supply chain issue

- **File:** `.github/workflows/build-push.yml`
- **Category:** CI/CD artifacts
- **Impact:** Supply chain risk across two CI workflows using unpinned mutable reference
- **Fix:** Pin trivy-action to a specific SHA in build-push.yml as well

### P1 — pnpm audit threshold set to --audit-level=moderate — only blocks moderate+ severity; high/critical advisories pass if below moderate threshold

- **File:** ``
- **Category:** Dependencies
- **Impact:** High-severity dependency vulnerabilities may not block CI; false sense of security from audit check
- **Fix:** Set --audit-level=high to at minimum block high-severity vulnerabilities; consider blocking at critical level

### P1 — wget installed in production Docker image — unnecessary package increases runtime attack surface

- **File:** `apps/api/Dockerfile`
- **Category:** Docker hygiene
- **Impact:** Extra package in production container provides additional attack vector for RCE exploits
- **Fix:** Remove wget from production Dockerfile; use curl or HEALTHCHECK built-in instead

### P2 — Docker multi-stage builds use npm ci and then discard devDependencies, but pnpm store is not cleaned — final image may contain package manager artifacts

- **File:** `apps/api/Dockerfile`
- **Category:** Docker hygiene
- **Impact:** Unnecessary layer bloat increases image size and attack surface
- **Fix:** Add pnpm store prune and .pnpm-store directory cleanup in final stage

### P2 — No Dependabot or Renovate configuration for automated dependency updates — .github/dependabot.yml does not exist

- **File:** ``
- **Category:** Dependencies
- **Impact:** Dependency vulnerabilities may go unnoticed until manually discovered; no automated PRs for security patches
- **Fix:** Create .github/dependabot.yml with weekly checks for npm, GitHub Actions, and Docker dependencies

### P3 — Dockerfile has HEALTHCHECK (good) but no USER directive — containers run as root by default

- **File:** `apps/api/Dockerfile`
- **Category:** Docker hygiene
- **Impact:** If container is compromised, attacker has root access inside the container
- **Fix:** Add 'USER appuser' after installing dependencies; create appuser in Dockerfile
