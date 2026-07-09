# Principal Audit Report

- Prompt: **environment_drift_audit**
- Domain: **environment**
- Run ID: **environment_drift_audit_20260709_070724**
- Generated: **2026-07-09T03:06:59Z**
- Decision: **GO WITH RISKS**
- P0: **0**, P1: **1**
- P2: **3**, P3: **2**
- Readiness: **85.00**

## Findings

### P1 — Dev Caddyfile missing HSTS and Permissions-Policy headers present in prod Caddyfile
- **File:** `infra/docker/Caddyfile`
- **Category:** security_headers
- **Impact:** Development environment less secure; security testing may miss HSTS/Permissions-Policy issues before prod deploy
- **Fix:** Add same security headers (Strict-Transport-Security, Permissions-Policy) to dev Caddyfile

### P2 — Prod Caddyfile missing /healthz route â€” only /health is routed
- **File:** `infra/docker/Caddyfile.prod`
- **Category:** caddy_tls
- **Impact:** Full health check (including DB check) not available via Caddy on prod; direct API access needed
- **Fix:** Add @healthz path block in prod Caddyfile routing to api:4000

### P2 — Prod compose file missing env_file: .env reference on web service (dev has it)
- **File:** `infra/docker/docker-compose.devremote.yml : docker-compose.prod.yml`
- **Category:** compose_drift
- **Impact:** Prod web service may not pick up all env vars consistently
- **Fix:** Add env_file: .env to web service in docker-compose.prod.yml

### P2 — Prod compose file missing healthcheck on web service (dev has one)
- **File:** `infra/docker/docker-compose.prod.yml`
- **Category:** health_check
- **Impact:** Deploy health check only validates API, not web service availability
- **Fix:** Add healthcheck block to web service in docker-compose.prod.yml matching dev compose

### P3 — Dev Caddyfile uses .us domain via internal certs, prod uses .com via CF origin cert â€” drift expected but no documentation of domain-specific cookie config
- **File:** `infra/docker/Caddyfile : Caddyfile.prod`
- **Category:** domain_cookie
- **Impact:** Auth cookies set on .us domain won't work on .com; operators must be aware of this during promotion
- **Fix:** Document required auth cookie domain changes in environment promotion runbook

### P3 — Dev LiveKit uses turn.domain: localhost; prod uses $DOMAIN variable â€” TURN TLS port 5349 only in prod
- **File:** `infra/docker/docker-compose.devremote.yml : docker-compose.prod.yml`
- **Category:** livekit_config
- **Impact:** TURN/STUN not fully functional in dev for WebRTC behind NAT
- **Fix:** Document that LiveKit TURN requires production domain for full functionality
