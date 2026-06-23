# Incident Response Runbook

This runbook provides procedures for responding to production incidents.

## Quick Reference

| Severity               | Response Time     | Escalation                 |
| ---------------------- | ----------------- | -------------------------- |
| P0 (Site Down)         | 15 min            | Page on-call immediately   |
| P1 (Major Degradation) | 30 min            | Page on-call within 1 hour |
| P2 (Minor Issue)       | 2 hours           | Assign to next sprint      |
| P3 (Low Impact)        | Next business day | Track in backlog           |

---

## P0: Site Down / Complete Outage

### Symptoms

- All health checks failing (`/healthz` returns 503 or times out)
- Users cannot access chat.mainecybertech.com
- No API responses from chat-api.mainecybertech.com

### Diagnosis Steps

1. **Check droplet status**

   ```bash
   # From local machine
   ssh root@<droplet-ip> "docker ps -a"
   ```

2. **Check container logs**

   ```bash
   ssh root@<droplet-ip> "docker compose -f /opt/chat/docker-compose.yml logs --tail 100"
   ```

3. **Check system resources**

   ```bash
   ssh root@<droplet-ip> "df -h && free -h && top -bn1 | head -20"
   ```

4. **Check Caddy logs**

   ```bash
   ssh root@<droplet-ip> "docker logs chat-caddy-prod --tail 100"
   ```

5. **Check Supabase connectivity**
   ```bash
   ssh root@<droplet-ip> "curl -s https://<supabase-url>/health"
   ```

### Common Causes & Fixes

| Cause              | Diagnosis                                                            | Fix                                             |
| ------------------ | -------------------------------------------------------------------- | ----------------------------------------------- |
| OOM Kill           | `docker ps` shows exited containers with code 137; `dmesg` shows OOM | Upgrade droplet, add swap, reduce memory limits |
| Caddy cert failure | Caddy logs show ACME errors; Let's Encrypt rate limited              | Use Cloudflare origin certs; check DNS          |
| Supabase down      | Health check shows DB connectivity failed                            | Check Supabase status page; failover to backup  |
| Disk full          | `df -h` shows 100% usage                                             | Clean Docker images, rotate logs                |
| Network/firewall   | Cannot reach droplet IP; Cloudflare 521                              | Check DO firewall, Cloudflare proxy status      |

### Recovery Procedure

1. **Restart services**

   ```bash
   ssh root@<droplet-ip> "cd /opt/chat && docker compose restart"
   ```

2. **If restart fails, full redeploy**

   ```bash
   # Trigger GitHub Actions deploy workflow manually
   gh workflow run deploy-production.yml
   ```

3. **If database issue, check Supabase**
   - Go to Supabase Dashboard → Logs
   - Check for connection pool exhaustion
   - Restart Supabase if self-hosted

4. **Post-recovery**
   - Verify all health checks pass
   - Check Sentry for error spikes
   - Document incident in retrospectives

---

## P1: Major Degradation

### Symptoms

- High latency (>5s p95)
- Elevated error rates (>5%)
- Specific features broken (file upload, search, real-time)

### Diagnosis Steps

1. **Check health endpoint details**

   ```bash
   curl https://chat-api.mainecybertech.com/healthz | jq
   ```

2. **Check application logs for errors**

   ```bash
   ssh root@<droplet-ip> "docker compose logs api --tail 200 | grep -i error"
   ```

3. **Check database performance**

   ```bash
   # In Supabase Dashboard → Database → Query Performance
   # Look for slow queries, missing indexes
   ```

4. **Check resource utilization**
   ```bash
   ssh root@<droplet-ip> "docker stats --no-stream"
   ```

### Common Causes & Fixes

| Cause                        | Diagnosis                                                  | Fix                                    |
| ---------------------------- | ---------------------------------------------------------- | -------------------------------------- |
| DB connection pool exhausted | Health check shows high DB latency; logs show pool timeout | Increase pool size, optimize queries   |
| Slow queries                 | Supabase query performance shows sequential scans          | Add indexes, optimize queries          |
| Memory pressure              | Container memory near limit; GC pauses                     | Increase memory limit, optimize code   |
| Real-time issues             | Socket.io connections dropping; typing/presence broken     | Check Socket.io adapter, Redis if used |
| Rate limiting                | 429 responses in logs                                      | Adjust rate limits, check for abuse    |

---

## P2: Minor Issues

### Symptoms

- Non-critical feature broken (emoji picker, thread view)
- Single user reports issue
- Intermittent failures

### Response

1. Create GitHub issue with reproduction steps
2. Assign to next sprint
3. Deploy fix via normal CI/CD pipeline

---

## Communication Templates

### Internal Slack (Incident Channel)

```
🚨 INCIDENT [P0/P1]: <brief description>
Impact: <what's affected>
Status: Investigating
Lead: @oncall
Updates: Every 15 min
```

### Status Page Update

```
We are investigating reports of <issue>. Some users may experience <impact>. We'll provide updates every 15 minutes.
```

### Post-Incident

1. Create incident report in `docs/incidents/YYYY-MM-DD-<slug>.md`
2. Include: timeline, root cause, impact, action items
3. Schedule retrospective within 48 hours
4. Add preventive tasks to backlog

---

## Key Contacts

| Role                 | Contact                                |
| -------------------- | -------------------------------------- |
| Primary On-Call      | @mainecybertech (GitHub)               |
| Supabase Support     | https://supabase.com/support           |
| DigitalOcean Support | https://cloud.digitalocean.com/support |
| Cloudflare Support   | https://support.cloudflare.com         |

---

## Useful Commands

```bash
# SSH to droplet
ssh root@<droplet-ip>

# View all logs
docker compose -f /opt/chat/docker-compose.yml logs -f

# Restart specific service
docker compose -f /opt/chat/docker-compose.yml restart api

# Check container health
docker compose -f /opt/chat/docker-compose.yml ps

# Force rebuild and redeploy
gh workflow run deploy-production.yml

# Check Supabase status
curl -s https://status.supabase.com/api/v2/status.json | jq
```
