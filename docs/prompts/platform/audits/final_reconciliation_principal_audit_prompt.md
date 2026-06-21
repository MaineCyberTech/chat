# final reconciliation / principal audit prompt

use this as the final principal-level repo audit.

## severity model

- p0 — release-blocking / repo-integrity / security-critical
- p1 — major correctness / deployability / operability risk
- p2 — important hardening / quality / cleanup
- p3 — nice-to-have / deferred enhancement

## required audit dimensions

- monorepo/workspace/package governance
- ts/module/import/build integrity
- frontend/backend/database/shared contract alignment
- auth/authorization/security surface consistency
- .us / .com domain consistency
- api/socket/realtime correctness
- frontend routing/state/realtime ux integration
- quality tooling/testing/validation infrastructure
- ci/cd and release automation
- docker/traefik/runtime orchestration
- terraform/cloud-init/host provisioning alignment
- docs/runbooks/contributor experience consistency
- dead files / duplicate systems / stale artifacts

## release readiness categories

grade each as pass / pass with risks / fail:

- repo integrity
- build/test integrity
- runtime integrity
- environment integrity
- ci/cd integrity
- infrastructure integrity
- security posture baseline
- operational readiness

## report format

- final principal audit: cross-phase reconciliation
- objective
- repo inspection summary
- audit coverage
- findings by severity
- fixes applied
- files created
- files modified
- files removed
- commands run
- validation results
- release readiness assessment
- blockers
- residual risks
- next recommended step
