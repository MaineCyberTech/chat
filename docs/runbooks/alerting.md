# Alerting

**This is the authoritative alerting reference.** The previous duplicate at `docs/operations/alerting.md` has been consolidated here. Severity definitions and thresholds in this document take precedence.

## What to Alert On

| Alert                         | Threshold                                    | Severity | Response                                      |
| ----------------------------- | -------------------------------------------- | -------- | --------------------------------------------- |
| **API down**                  | Health check fails for 2+ consecutive checks | P0       | Restart API container, check logs             |
| **High error rate**           | HTTP 5xx rate > 1% over 5 min                | P0       | Check Sentry, recent deploys, DB connectivity |
| **P0/P1 audit findings**      | Any P0 or P1 in latest audit run             | P0/P1    | Address findings per severity                 |
| **Disk usage > 80%**          | DO monitoring metric                         | P1       | Clean up old logs, prune Docker images        |
| **Redis down**                | Redis ping fails                             | P1       | Restart Redis container, check AOF            |
| **Worker queue backlog**      | Queue depth > 1000 for > 5 min               | P1       | Check worker logs, scale workers              |
| **Memory usage > 80%**        | DO monitoring metric                         | P2       | Add swap, increase droplet size               |
| **TLS cert expiry < 30 days** | Caddy auto-renew warning                     | P2       | Verify Cloudflare proxy + Caddy               |

## Current Monitoring Setup

### Prometheus Metrics

- Endpoint: `GET /metrics` (authenticated)
- Metrics exposed: HTTP request count/duration, WebSocket connections, DB query duration, circuit breaker status, webhook deliveries, auth attempts
- Intended for Prometheus + Alertmanager (not yet deployed)

### Sentry

- Initialized in `server.ts` via `initSentry()`
- Captures unhandled exceptions and performance issues
- Configure error alert rules in Sentry dashboard

### DigitalOcean Monitoring

- CPU, memory, and disk alerts configurable in DO control panel
- Health check endpoint consumed by DO monitoring: `GET /health`
- TCP health check on port 3000 (Caddy)

## How to Configure Alerts

### DO Monitoring Alerts

1. Go to [cloud.digitalocean.com](https://cloud.digitalocean.com)
2. Navigate to Monitoring → Alerts
3. Create alert with:
   - Resource: Droplet (chat-api)
   - Metric: CPU > 80% (avg over 5 min)
   - Notification: Email + Slack webhook
4. Repeat for Memory > 80% and Disk > 80%

### Sentry Error Alerts

1. Go to [sentry.io](https://sentry.io)
2. Select project → Alerts → Create Alert
3. Set: `count() > 10` in `1h` for `level:error`
4. Action: Send to Slack/Email/PagerDuty

### Prometheus / Alertmanager (future)

Once deployed, configure ruleset in `infra/prometheus/rules/`:

```yaml
groups:
  - name: chat
    rules:
      - alert: HighErrorRate
        expr: rate(chat_http_requests_total{status_code=~"5.."}[5m]) > 0.01
        for: 5m
        labels: { severity: critical }
```

## Runbook Links

| Alert Type        | Runbook                                              |
| ----------------- | ---------------------------------------------------- |
| API crash         | [Development Deploy](development-deploy-overview.md) |
| Database issue    | [Database Migrations](database-migrations.md)        |
| Migration failure | [Migration Rollback](migration-rollback.md)          |
| Data retention    | [pg_cron Setup](pg_cron_setup.md)                    |
| Full incident     | [Incident Response](incident-response.md)            |
| Backup restore    | [Backup Strategy](backup-strategy.md)                |
