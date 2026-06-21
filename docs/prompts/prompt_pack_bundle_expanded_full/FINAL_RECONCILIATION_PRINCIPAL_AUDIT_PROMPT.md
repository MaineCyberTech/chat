# Final Reconciliation / Principal Audit Prompt

## Ultra-Hardened End-of-Process Cross-Phase Audit, Repair, and Release Readiness Pass

Use this as the final principal-level repo audit.

## Severity Model

- `P0` — release-blocking / repo-integrity / security-critical
- `P1` — major correctness / deployability / operability risk
- `P2` — important hardening / quality / cleanup
- `P3` — nice-to-have / deferred enhancement

## Required Audit Dimensions

- monorepo/workspace/package governance
- TS/module/import/build integrity
- frontend/backend/database/shared contract alignment
- auth/authorization/security surface consistency
- `.us` / `.com` domain consistency
- API/socket/realtime correctness
- frontend routing/state/realtime UX integration
- quality tooling/testing/validation infrastructure
- CI/CD and release automation
- Docker/Traefik/runtime orchestration
- Terraform/cloud-init/host provisioning alignment
- docs/runbooks/contributor experience consistency
- dead files / duplicate systems / stale artifacts

## Release Readiness Categories

Grade each as:

- PASS
- PASS WITH RISKS
- FAIL

Categories:

- Repo Integrity
- Build/Test Integrity
- Runtime Integrity
- Environment Integrity
- CI/CD Integrity
- Infrastructure Integrity
- Security Posture Baseline
- Operational Readiness

## Report Format

- FINAL PRINCIPAL AUDIT: CROSS-PHASE RECONCILIATION
- OBJECTIVE
- REPO INSPECTION SUMMARY
- AUDIT COVERAGE
- FINDINGS BY SEVERITY
- FIXES APPLIED
- FILES CREATED
- FILES MODIFIED
- FILES REMOVED
- COMMANDS RUN
- VALIDATION RESULTS
- RELEASE READINESS ASSESSMENT
- BLOCKERS
- RESIDUAL RISKS
- NEXT RECOMMENDED STEP
