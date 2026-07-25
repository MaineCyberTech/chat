# Alerting & Monitoring

**This document has been consolidated.** The authoritative alerting reference is now [docs/runbooks/alerting.md](../runbooks/alerting.md).

## Current Monitoring Infrastructure

### DigitalOcean Monitoring
- CPU > 80% for 5m → email alert
- Memory > 80% for 5m → email alert
- Disk > 90% for 5m → email alert
- Configured via Terraform `digitalocean_monitor_alert` resources in `infra/terraform/main.tf`

### Application-Level
- Sentry error tracking for API and Web runtime errors
- Container health checks defined in `docker-compose.prod.yml` — Caddy, API, worker, Redis each have health check probes
- Docker auto-restart via `restart: unless-stopped` on all containers

### Manual Monitoring
- `docker ps` / `docker compose ps` on the droplet to check container status
- `docker compose logs` for troubleshooting
