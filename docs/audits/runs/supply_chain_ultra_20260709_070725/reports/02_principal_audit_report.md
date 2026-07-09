# Principal Audit Report

- Prompt: **supply_chain_ultra**
- Domain: **supply_chain**
- Run ID: **supply_chain_ultra_20260709_070725**
- Generated: **2026-07-09T03:06:59Z**
- Decision: **GO WITH RISKS**
- P0: **0**, P1: **1**
- P2: **2**, P3: **2**
- Readiness: **86.00**

## Findings

### P1 — Worker Dockerfile missing HEALTHCHECK directive â€” API and web have it

- **File:** `apps/worker/Dockerfile`
- **Category:** docker_healthcheck
- **Impact:** Container orchestrator cannot detect worker process hang or crash; unhealthy worker may silently stop processing jobs
- **Fix:** Add HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget --no-verbose --tries=1 --spider http://localhost:4100/healthz || exit 1

### P2 — Dockerfiles use `node:22-alpine` without SHA digest pinning â€” base image tag is mutable

- **File:** `apps/api/Dockerfile, apps/web/Dockerfile, apps/worker/Dockerfile`
- **Category:** base_image_pinning
- **Impact:** Builds may produce different images over time as node:22-alpine is updated; supply chain integrity not verifiable
- **Fix:** Pin to specific SHA digest: FROM node:22-alpine@sha256:<digest> and update via Dependabot

### P2 — Root package.json may have postinstall scripts that download executables â€” no safety check in CI

- **File:** `package.json (root)`
- **Category:** postinstall_scripts
- **Impact:** Untrusted postinstall scripts could execute arbitrary code during install
- **Fix:** Run `pnpm audit --audit-level=high` with block on postinstall scripts, add pnpm config ignore-scripts=true for production installs

### P3 — Trivy scans only run on push (build-push.yml) â€” not on PRs or scheduled scans for already-deployed images

- **File:** `.github/workflows/build-push.yml`
- **Category:** vulnerability_scanning
- **Impact:** Vulnerabilities may be introduced between scans; no periodic re-scan of :latest images
- **Fix:** Add weekly scheduled Trivy scan against ghcr.io images and PR scan in validate.yml

### P3 — LiveKit service uses `livekit/livekit-server:latest` tag in both dev and prod â€” mutable tag with no version pinning

- **File:** `infra/docker/docker-compose.devremote.yml : docker-compose.prod.yml`
- **Category:** container_base_images
- **Impact:** Unintentional LiveKit version upgrades on deploy; no rollback to known-good version
- **Fix:** Pin livekit/livekit-server to specific version tag (e.g., :1.8.0) in both compose files
