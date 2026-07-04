# Principal Audit Report

- Prompt: **environment_drift_audit**
- Domain: **environment**
- Run ID: **environment_drift_audit_20260703_054833**
- Generated: **2026-07-03T12:00:00Z**
- Decision: **NO-GO**
- P0: **0**, P1: **2**
- P2: **3**, P3: **0**
- Readiness: **40.00**

## Findings

### P1 — Dev Caddyfile defines a separate chat-api.mainecybertech.us subdomain virtual host; prod Caddyfile.prod has no API subdomain

- **File:** `infra/docker/Caddyfile:23-31`
- **Category:** domain_wiring
- **Impact:** The separate API subdomain bypasses the same-origin architecture for cookie visibility. SameSite=Strict cookies won't be sent to the API subdomain, breaking auth.
- **Fix:** Remove chat-api.mainecybertech.us virtual host from dev Caddyfile. Route API traffic through chat.mainecybertech.us/v1/\* matching prod topology. Update API_BASE_URL in deploy-development.yml.

### P1 — Dev compose missing LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_HOST env vars on api service; prod compose includes all three

- **File:** `infra/docker/docker-compose.devremote.yml:84-89`
- **Category:** env_var_alignment
- **Impact:** Dev environment will either crash or silently disable WebRTC features. Developers testing on dev may get different behavior than production.
- **Fix:** Add LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_HOST=http://livekit:7880 to dev compose api service environment mirroring prod configuration.

### P2 — Dev deployment writes NEXT_PUBLIC_API_URL and API_BASE_URL pointing to different subdomains; prod follows same pattern with .com TLD

- **File:** `.github/workflows/deploy-development.yml:100-107`
- **Category:** cookie_domain_drift
- **Impact:** Mixed API URL configuration creates two divergent code paths for API access. Cookies set by main domain won't be sent to API subdomain.
- **Fix:** Use a single canonical API URL. Set both NEXT_PUBLIC_API_URL and API_BASE_URL to https://chat.mainecybertech.us. Remove API subdomain routing entirely.

### P2 — Dev livekit turn domain hardcoded to 'localhost'; prod livekit uses DOMAIN env var (chat.mainecybertech.com)

- **File:** `infra/docker/docker-compose.devremote.yml:59`
- **Category:** domain_topology
- **Impact:** Mobile or remote clients connecting to dev environment will fail TURN connectivity. WebRTC/media features cannot be validated on dev before prod deployment.
- **Fix:** Parametrize livekit turn domain in dev compose using ${DOMAIN:-localhost} to match prod pattern.

### P2 — Dev Caddyfile uses local filesystem TLS certs; prod uses Cloudflare origin certificates at different paths

- **File:** `infra/docker/Caddyfile:2`
- **Category:** ssl_tls_config
- **Impact:** Dev and prod have different cert paths (/etc/caddy/certs/ vs /certs/), creating confusion for debugging certificate issues.
- **Fix:** Align cert mount points and naming between dev and prod compose files using consistent paths.
