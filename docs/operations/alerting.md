# Alerting & Monitoring

## Current State

### DigitalOcean Monitoring
- CPU > 80% for 5m → email alert
- Memory > 80% for 5m → email alert
- Disk > 90% for 5m → email alert
- Configured via Terraform `digitalocean_monitor_alert` resources in `infra/terraform/main.tf`

### GitHub Actions
- CI failures → GitHub notifications (email/web) to committer
- Deploy failures → visible in Actions UI; email notifications if configured

### Application-Level
- Sentry error tracking (if configured) for API and Web runtime errors
- Container health checks defined in `docker-compose.prod.yml` — Caddy, API, worker, Redis each have health check probes
- Docker auto-restart via `restart: unless-stopped` on all containers

### Manual Monitoring
- `docker ps` / `docker compose ps` on the droplet to check container status
- `docker compose logs` for troubleshooting

## On-Call Recommendations

### Formal On-Call (Not Yet Implemented)
The following would be needed for a formal on-call rotation:

1. **Incident notification tool**: PagerDuty, Opsgenie, or Grafana On-Call to deliver alerts via phone, SMS, or push
2. **Health check endpoint monitoring**: Uptime Robot, Better Uptime, or Checkly to poll `/health` and alert on non-200
3. **Structured alert routing**: Separate notification channels for P0 (page), P1 (SMS), P2 (email/Slack)
4. **On-call schedule**: Rotating schedule with primary and secondary responders
5. **Escalation policy**: Automated escalation if primary does not acknowledge within N minutes
6. **Runbooks**: Documented procedures for common incidents (deploy failure, high CPU, disk full, DB connection pool exhaustion)
7. **Slack/Teams integration**: Alert notifications to #operations channel with severity badges

### Recommended Alert Thresholds

| Severity | Condition                              | Channel     | Response Time |
| -------- | -------------------------------------- | ----------- | ------------- |
| P0       | API health check failure > 2 min       | Phone/SMS   | 15 min        |
| P0       | Disk > 95%                             | Phone/SMS   | 15 min        |
| P1       | CPU > 80% for 10m                      | SMS/Slack   | 30 min        |
| P1       | Memory > 80% for 10m                   | SMS/Slack   | 30 min        |
| P2       | CI pipeline failure > 2 runs           | Slack       | 4 hours       |
| P2       | Deploy failure                         | SMS/Slack   | 1 hour        |
| P3       | SSL cert expiry < 30 days              | Slack       | 1 week        |
