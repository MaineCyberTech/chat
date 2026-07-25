# Quality Confirmation Report

- Prompt: **environment_promotion_audit**
- Domain: **environment**
- Run ID: **environment_promotion_audit_20260716_060609**
- Generated: **2026-07-16T06:04:00.000Z**
- Decision: **GO WITH RISKS**
- P0: **0**, P1: **0**
- P2: **3**, P3: **3**
- Readiness: **82.50**

## Findings

### P2 — No backup volume configuration or backup service defined for production data

- **File:** `infra/docker/docker-compose.prod.yml`
- **Category:** backup_config
- **Impact:** Redis data and Caddy certs have no automated backup; loss of volumes = data loss
- **Fix:** Add automated backup volume to production compose or document manual backup procedure

### P2 — Dev environment has no explicit mem_limit on services unlike production

- **File:** `infra/docker/docker-compose.devremote.yml`
- **Category:** resource_limits
- **Impact:** Dev environment may over-consume droplet resources, masking OOM issues in production
- **Fix:** Add matching mem_limit values to dev compose for api (192m), worker (128m), web (256m), redis (64m), caddy (64m)

### P2 — Worker healthcheck port (4100) not exposed in Dockerfile EXPOSE or compose ports

- **File:** `infra/docker/docker-compose.prod.yml`
- **Category:** worker_healthcheck
- **Impact:** Health check works via internal network but container metadata incomplete
- **Fix:** Add EXPOSE 4100 to worker Dockerfile for consistency

### P3 — Production compose uses :latest tag as fallback; deploy overrides to SHA but :latest not uniquely pinned

- **File:** `infra/docker/docker-compose.prod.yml`
- **Category:** image_tags
- **Impact:** Manual compose up could pull stale images if deploy script not run
- **Fix:** Remove :latest defaults from production compose; require explicit SHA tag via .env

### P3 — Dev compose uses :dev tag fallback; deploy pulls SHA tag and retags to :dev — potential race

- **File:** `infra/docker/docker-compose.devremote.yml`
- **Category:** image_tags
- **Impact:** Race condition between build-push completing and deploy pulling :dev before retag
- **Fix:** Use SHA tag directly in dev compose via WEB_IMAGE env var, remove :dev fallback

### P3 — Dev LiveKit config uses localhost for TURN domain while prod uses DOMAIN variable

- **File:** `infra/docker/docker-compose.devremote.yml`
- **Category:** livekit_config
- **Impact:** Dev TURN may not work correctly for external clients testing WebRTC
- **Fix:** Use ${DOMAIN:-localhost} for dev LiveKit TURN domain matching prod pattern
