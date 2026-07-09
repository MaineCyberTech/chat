# Principal Audit Report

- Prompt: **environment_promotion_audit**
- Domain: **environment**
- Run ID: **environment_promotion_audit_20260709_070724**
- Generated: **2026-07-09T03:06:59Z**
- Decision: **GO WITH RISKS**
- P0: **0**, P1: **1**
- P2: **3**, P3: **1**
- Readiness: **82.00**

## Findings

### P1 — Web service (Next.js) missing healthcheck in prod compose â€” dev compose has healthcheck
- **File:** `infra/docker/docker-compose.prod.yml`
- **Category:** health_check
- **Impact:** Deploy health check only validates API container; web container crash won't be detected
- **Fix:** Add healthcheck: test: ['CMD', 'wget', '-q', '--spider', 'http://localhost:3000'] to web service in prod compose

### P2 — Prod Caddyfile missing /healthz route â€” only /health is routed to API
- **File:** `infra/docker/Caddyfile.prod`
- **Category:** caddy_routes
- **Impact:** Full health check (DB, Redis) not accessible via Caddy on prod; requires direct API access
- **Fix:** Add @healthz path block routing to api:4000 in Caddyfile.prod

### P2 — Prod compose web service lacks env_file: .env â€” dev compose has it
- **File:** `infra/docker/docker-compose.prod.yml`
- **Category:** compose_env
- **Impact:** Web prod container may miss required env vars; dev and prod env injection differs
- **Fix:** Add env_file: .env to web service in docker-compose.prod.yml

### P2 — Prod compose uses :latest tags (not SHA-pinned) for all images â€” rollback races could pull wrong version
- **File:** `infra/docker/docker-compose.prod.yml`
- **Category:** image_tags
- **Impact:** Concurrent deploys may cause race condition where :latest tag points to different SHA during rollback
- **Fix:** Pin prod image tags to SHA digest after pull in deploy-production.yml deploy step

### P3 — Prod compose has same mem_limit values as dev compose (e.g. api: 192m, web: 256m)
- **File:** `infra/docker/docker-compose.prod.yml`
- **Category:** mem_limits
- **Impact:** Production may need higher memory limits under real load â€” potential OOM risk
- **Fix:** Review and increase prod memory limits based on load testing: api: 512m, web: 512m, worker: 256m recommended
