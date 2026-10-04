# 11 — Supply Chain, Dependencies & Secrets

## Audit Metadata

- Run: `chat-20261004-full-develop-0695894`
- Target: `C:\temp\chat` @ `0695894`

## Scope

Secrets/credentials, dependency vulnerabilities and exceptions, container pinning/runtime hardening, SBOM/provenance, and GitHub Actions supply chain.

## Evidence Reviewed

- `.trivyignore`, `.pnpm-audit-exceptions.json`, `.npmrc`, `pnpm-lock.yaml`
- `infra/docker/docker-compose.prod.yml`, `dev.yml`, `devremote.yml`; `apps/{web,api,worker}/Dockerfile`
- `.github/workflows/validate.yml`, `build-push.yml`, `deploy-production.yml`
- Secrets posture from the focused lens (`chat-20261004-0700`)

## Verification Performed

- Confirmed the prod `web` service still receives `SUPABASE_SERVICE_ROLE_KEY` via `x-common-env`.
- Confirmed HIGH/CRITICAL scans fail closed behind time-boxed allowlists (`.trivyignore`, `.pnpm-audit-exceptions.json`, expiry `2026-11-03`).
- Confirmed no image digest pins and no `apk` version pins / exec-form HEALTHCHECK.
- Confirmed SBOM generation without signing/attestation and absence of a license/dependency-review gate.
- Reconciled with the focused supply-chain lens; secret values were never printed.

## Executive Summary

Dependency scanning fails closed but is currently suppressed by broad, time-boxed allowlists that expire `2026-11-03`. The production web container still receives the full-privilege Supabase service-role key. Container images are tag-pinned only, Dockerfiles have lint debt, SBOMs are unsigned, and there is no enforced license/dependency-review gate.

## Inventory

| Item | Evidence | Status |
|---|---|---|
| HIGH/CRITICAL exceptions | `.trivyignore`, `.pnpm-audit-exceptions.json` (`exp:2026-11-03`) | Time-boxed |
| Service-role in web | `docker-compose.prod.yml:3-7,26-32` | Exposed |
| Image digests | `docker-compose.*.yml`, `apps/*/Dockerfile` | None |
| SBOM | `build-push.yml`, `deploy-production.yml` | Generated, unsigned |
| Deployment-review gate | none found | Absent |

## Deterministic findings validation (no new IDs)

| DET ID | Verdict | Notes |
|---|---|---|
| DET-P1-002 (trivy 33 HIGH/CRITICAL) | REAL (time-boxed) | All listed packages present in `pnpm-lock.yaml`; every CVE in `.trivyignore` expiry `2026-11-03`. Fixed-version availability Unknown (no vuln DB offline). → DEP-P2-001. |
| DET-P2-003 (trivy 21 P2) | REAL (presence) | Non-gating (scan HIGH/CRITICAL only). → DEP-P3-001. |
| DET-P3-004 (trivy 3 P3) | REAL (presence) | `esbuild`/`body-parser`/`dompurify`; not gating. → DEP-P3-001. |
| DET-P2-006/007 (gitleaks) | FALSE-POSITIVE | Keybinding label and the well-known public Supabase local-dev demo JWTs. |
| DET-P3-008 (no digest pins) | REAL | → SUPPLY-P3-001. |
| DET-P3-009 (hadolint) | REAL | → SUPPLY-P3-002. |

## Findings

### Finding ID: SUPPLY-P2-001 - Production web container receives the Supabase service-role key

- Severity: P2
- Confidence: High
- Area: SUPPLY
- Evidence:
  - `infra/docker/docker-compose.prod.yml:3-7` — `x-common-env` includes `SUPABASE_SERVICE_ROLE_KEY`.
  - `infra/docker/docker-compose.prod.yml:26-32` — the internet-facing `web` service merges `*common-env`.
  - `apps/api/src/lib/supabase.ts` — the service-role client bypasses RLS entirely.
- What is happening: The web tier is given the full-privilege key even though only api/worker need it.
- Why it matters: Expands blast radius of any web-tier compromise or log leak (full DB read/write, RLS bypass).
- User / business impact: Tenant-isolation risk.
- Security / privacy / reliability impact: High.
- Recommended fix: Remove `SUPABASE_SERVICE_ROLE_KEY` from `x-common-env`; inject it only into `api`/`worker`.
- Suggested validation: `web` container env has no service-role key.
- Owner suggestion: Supply/Ops
- Effort estimate: S
- Dependencies: None
- Status: open

### Finding ID: DEP-P2-001 - 33 HIGH/CRITICAL dependency advisories risk-accepted until 2026-11-03

- Severity: P2
- Confidence: Medium
- Area: DEP
- Evidence:
  - `.github/workflows/validate.yml` — `pnpm audit --prod` blocking with `.pnpm-audit-exceptions.json`; trivy fs `severity: HIGH,CRITICAL`, `exit-code: "1"`.
  - `.trivyignore` header — entries time-boxed to `2026-11-03`.
  - `pnpm-lock.yaml` contains the flagged packages.
- What is happening: The gate fails closed, but a broad, time-boxed allowlist currently suppresses everything.
- Why it matters: Real known-vulnerable runtime packages ship; if the dependency bump slips past expiry, releases block hard.
- User / business impact: Security exposure or release blockage.
- Security / privacy / reliability impact: Medium-high.
- Recommended fix: Land the upgrades before `2026-11-03`; keep the allowlist small and per-CVE with tracking issues.
- Suggested validation: Trivy/audit clean without exceptions.
- Owner suggestion: Security
- Effort estimate: M
- Dependencies: FINAL-P2-002
- Status: open

### Finding ID: SUPPLY-P3-001 - Container images pinned only by mutable tag

- Severity: P3
- Confidence: High
- Area: SUPPLY
- Evidence:
  - `infra/docker/docker-compose.prod.yml` (`caddy:2-alpine`, `redis:7-alpine`, `livekit/livekit-server:latest`, `${WEB_IMAGE:-…:latest}`).
  - `docker-compose.dev.yml`/`devremote.yml` and `apps/*/Dockerfile` base images use tags only; no `@sha256:` anywhere.
- What is happening: Non-reproducible deploys subject to tag retagging.
- Why it matters: Tag mutation is a supply-chain vector.
- User / business impact: Low-medium.
- Security / privacy / reliability impact: Medium.
- Recommended fix: Pin base and infra images by digest; let Dependabot bump digests.
- Suggested validation: All `image:`/`FROM` entries include a digest.
- Owner suggestion: Supply
- Effort estimate: M
- Dependencies: None
- Status: open

### Finding ID: SUPPLY-P3-002 - Dockerfile lint: unpinned apk and shell-form HEALTHCHECK

- Severity: P3
- Confidence: High
- Area: SUPPLY
- Evidence:
  - `apps/web/Dockerfile:53,59`; `apps/api/Dockerfile:46,50`; `apps/worker/Dockerfile:30,37` — `apk add --no-cache wget` (DL3018) and shell-form `HEALTHCHECK` (DL3025).
  - `apps/worker/Dockerfile` `EXPOSE` differs from the health port used in compose (`4100`).
- What is happening: Unpinned packages and shell-form health checks.
- Why it matters: Lower reproducibility; minor lint debt.
- User / business impact: Low.
- Security / privacy / reliability impact: Low.
- Recommended fix: Pin apk versions, use exec-form HEALTHCHECK, align worker EXPOSE with `4100`.
- Suggested validation: hadolint clean.
- Owner suggestion: Supply
- Effort estimate: S
- Dependencies: None
- Status: open

### Finding ID: SUPPLY-P3-003 - SBOMs generated but not signed/attested; no license or dependency-review gate

- Severity: P3
- Confidence: High
- Area: SUPPLY
- Evidence:
  - `.github/workflows/build-push.yml` and `deploy-production.yml` generate SPDX SBOMs via `anchore/sbom-action`.
  - No `actions/attest-build-provenance`, `cosign`, `dependency-review-action`, or license allowlist appears in any workflow.
- What is happening: SBOMs exist and are retained, but provenance/signing and an enforced license policy are absent.
- Why it matters: Cannot verify artifact provenance or block disallowed licenses; SBOMs can be mutated post-generation.
- User / business impact: Compliance/supply-chain risk.
- Security / privacy / reliability impact: Medium.
- Recommended fix: Add build provenance attestation, sign images/SBOMs, and a `dependency-review-action`/license gate.
- Suggested validation: Provenance verifies with `gh attestation verify`.
- Owner suggestion: Supply
- Effort estimate: M
- Dependencies: None
- Status: open

### Finding ID: SUPPLY-P3-004 - Containers lack runtime hardening beyond non-root

- Severity: P3
- Confidence: Medium
- Area: SUPPLY
- Evidence:
  - `infra/docker/docker-compose.prod.yml` services define no `read_only`, `cap_drop`, `security_opt: [no-new-privileges:true]`, or `tmpfs`.
  - Images already run as non-root (`Dockerfile USER`).
- What is happening: No runtime restrictions are declared.
- Why it matters: A container escape/post-compromise has an easier path.
- User / business impact: Low.
- Security / privacy / reliability impact: Medium.
- Recommended fix: Add `read_only: true`, `cap_drop: [ALL]`, `security_opt: ["no-new-privileges:true"]` where compatible (with `tmpfs` for writable paths).
- Suggested validation: Compose config applies the restrictions.
- Owner suggestion: Supply/Infra
- Effort estimate: M
- Dependencies: None
- Status: open

### Finding ID: DEP-P3-001 - Medium/low advisories are non-gating

- Severity: P3
- Confidence: Medium
- Area: DEP
- Evidence:
  - CI scans `HIGH,CRITICAL` only; `DET-P2-003`/`DET-P3-004` IDs are not in `.trivyignore`.
- What is happening: Medium/low CVEs accumulate without a gate.
- Why it matters: Medium issues can become exploitable; no prioritization signal.
- User / business impact: Low.
- Security / privacy / reliability impact: Medium.
- Recommended fix: Add a non-blocking medium report/SARIF and a scheduled triage.
- Suggested validation: Medium findings are surfaced and triaged.
- Owner suggestion: Security
- Effort estimate: S
- Dependencies: DEP-P2-001
- Status: open

## Risks

- Known-vulnerable runtime dependencies; broad token exposure; unsigned artifacts.

## Recommendations

1. Land dependency upgrades before `2026-11-03`.
2. Remove the service-role key from the web container.
3. Pin images by digest; add provenance and license gates.

## Quick Wins

- Move `SUPABASE_SERVICE_ROLE_KEY` out of `x-common-env`.

## Hardening Backlog

- Digest pins, SBOM signing, container runtime hardening.

## Suggested Tests

- `gh attestation verify` on a built image; hadolint/actionlint gates.

## Suggested Documentation Updates

- Secret rotation runbook including `WEBHOOK_ENCRYPTION_KEY`.

## Open Questions

- Fixed-version availability for the flagged CVEs is Unknown offline.

## Appendix

- No live secret values were printed; only paths and secret types are reported.
