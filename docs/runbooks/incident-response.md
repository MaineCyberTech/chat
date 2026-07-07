# Incident Response Runbook

This runbook provides procedures for responding to production incidents.

## Severity Levels

| Severity | Name                | Response Time     | Examples                                                    | Escalation                 |
| -------- | ------------------- | ----------------- | ----------------------------------------------------------- | -------------------------- |
| SEV1     | Site Down / Outage  | 15 min            | API returns 5xx, database unreachable, DNS failure          | Page on-call immediately   |
| SEV2     | Major Degradation   | 30 min            | High latency, elevated errors, feature broken for all users | Page on-call within 1 hour |
| SEV3     | Minor Issue         | 2 hours           | Single user affected, non-critical feature broken           | Assign to next sprint      |
| SEV4     | Low Impact / Inquiry| Next business day | Cosmetic bugs, documentation errors, feature requests       | Track in backlog           |

---

## SEV1: Site Down / Complete Outage

### Symptoms

- All health checks failing (`/healthz` returns 503 or times out)
- Users cannot access chat.mainecybertech.com
- No API responses from chat-api.mainecybertech.com

### Response Procedures

#### API Down
1. **Check droplet status**: `ssh root@<droplet-ip> "docker ps -a"`
2. **Check API container logs**: `ssh root@<droplet-ip> "docker compose -f /opt/chat/infra/docker/docker-compose.prod.yml logs api --tail 100"`
3. **Check health endpoint**: `curl -s https://chat-api.mainecybertech.com/healthz`
4. **Restart API**: `ssh root@<droplet-ip> "docker compose -f /opt/chat/infra/docker/docker-compose.prod.yml restart api"`
5. **If failed, check Node process**: Look for OOM kills (`dmesg | grep -i oom`), port conflicts, uncaught exceptions

#### Database Unavailable
1. **Check Supabase status**: `curl -s https://status.supabase.com/api/v2/status.json | jq`
2. **Check Supabase Dashboard → Logs** for connection pool exhaustion
3. **Verify Supabase URL and keys** in `.env` on the droplet
4. **If Supabase-managed**: Open support ticket via Supabase Dashboard
5. **If connection pool exhausted**: Temporarily increase pool size, identify slow queries via Supabase Query Performance tab

#### Redis Down
1. **Check Redis container**: `ssh root@<droplet-ip> "docker compose -f /opt/chat/infra/docker/docker-compose.prod.yml ps redis"`
2. **Check Redis logs**: `ssh root@<droplet-ip> "docker compose -f /opt/chat/infra/docker/docker-compose.prod.yml logs redis --tail 50"`
3. **Test Redis connectivity**: `ssh root@<droplet-ip> "docker exec $(docker ps -q -f name=redis) redis-cli ping"`
4. **If Redis is down**: Restart with `docker compose restart redis`
5. **If Redis data corruption**: Restore from snapshot (`/var/lib/redis/dump.rdb` backup)
6. **Impact if Redis unavailable**: Socket.io falls back to polling; BullMQ jobs queue locally; user presence shows stale

#### Deployment Failure
1. **Check GitHub Actions run logs** for the failing deploy workflow
2. **Common causes**:
   - Terraform state drift: Run `terraform plan` manually to identify drift
   - Docker registry auth failure: Verify `GITHUB_TOKEN` has `packages:write` scope
   - Disk space on droplet: `ssh root@<droplet-ip> "df -h"` — prune Docker images if full
3. **Rollback**: Trigger workflow manually with `rollback_sha` input set to last known good SHA
4. **If container fails to start**: `docker compose logs <service>` to check startup errors
5. **If Caddy certificate issues**: `docker logs caddy` for ACME errors; verify DNS records point to droplet IP

### Common Causes & Fixes

| Cause              | Diagnosis                                                            | Fix                                             |
| ------------------ | -------------------------------------------------------------------- | ----------------------------------------------- |
| OOM Kill           | `docker ps` shows exited containers with code 137; `dmesg` shows OOM | Upgrade droplet, add swap, reduce memory limits |
| Caddy cert failure | Caddy logs show ACME errors; Let's Encrypt rate limited              | Use Cloudflare origin certs; check DNS          |
| Supabase down      | Health check shows DB connectivity failed                            | Check Supabase status page; failover to backup  |
| Disk full          | `df -h` shows 100% usage                                             | Clean Docker images, rotate logs                |
| Network/firewall   | Cannot reach droplet IP; Cloudflare 521                              | Check DO firewall, Cloudflare proxy status      |

### Recovery Procedure

1. **Restart services**: `ssh root@<droplet-ip> "cd /opt/chat && docker compose restart"`
2. **Full redeploy if restart fails**: Trigger deploy workflow manually via `gh workflow run deploy-production.yml`
3. **Database recovery**: Go to Supabase Dashboard → Logs, check for connection pool exhaustion
4. **Post-recovery**: Verify all health checks pass, check Sentry for error spikes, document in post-mortem

---

## SEV2: Major Degradation

### Symptoms

- High latency (>5s p95)
- Elevated error rates (>5%)
- Specific features broken (file upload, search, real-time)

### Response Procedures

1. **Check health endpoint**: `curl -s https://chat-api.mainecybertech.com/healthz | jq`
2. **Check API logs for errors**: `ssh root@<droplet-ip> "docker compose -f /opt/chat/infra/docker/docker-compose.prod.yml logs api --tail 200 | grep -i error"`
3. **Check database performance**: Supabase Dashboard → Database → Query Performance — look for slow queries, missing indexes
4. **Check resource utilization**: `ssh root@<droplet-ip> "docker stats --no-stream"`
5. **Check Redis**: If Socket.io or queue latency, check Redis CPU/memory

### Common Causes & Fixes

| Cause                        | Diagnosis                                                  | Fix                                    |
| ---------------------------- | ---------------------------------------------------------- | -------------------------------------- |
| DB connection pool exhausted | Health check shows high DB latency; logs show pool timeout | Increase pool size, optimize queries   |
| Slow queries                 | Supabase query performance shows sequential scans          | Add indexes, optimize queries          |
| Memory pressure              | Container memory near limit; GC pauses                     | Increase memory limit, optimize code   |
| Real-time issues             | Socket.io connections dropping; typing/presence broken     | Check Socket.io adapter, Redis if used |
| Rate limiting                | 429 responses in logs                                      | Adjust rate limits, check for abuse    |

---

## SEV3: Minor Issues

### Symptoms

- Non-critical feature broken (emoji picker, thread view)
- Single user reports issue
- Intermittent failures

### Response

1. Create GitHub issue with reproduction steps
2. Assign to next sprint
3. Deploy fix via normal CI/CD pipeline

---

## SEV4: Low Impact / Inquiry

### Symptoms

- Cosmetic UI bugs (alignment, spacing, color)
- Documentation errors
- Feature requests
- "How do I..." questions

### Response

1. Triage in GitHub Issues
2. Assign `priority: low` label
3. Address during regular maintenance cycle

---

## Communication Templates

### Internal Slack (Incident Channel)

```
🚨 INCIDENT [SEV1/SEV2]: <brief description>
Impact: <what's affected>
Status: Investigating
Lead: @oncall
Updates: Every 15 min
```

### Status Page Update

```
We are investigating reports of <issue>. Some users may experience <impact>. We'll provide updates every 15 minutes.
```

---

## Post-Mortem Process

### When to Conduct

A post-mortem is required for all SEV1 and SEV2 incidents. SEV3 incidents may warrant a post-mortem at the on-call engineer's discretion.

### Timeline

1. **Within 24 hours**: Create incident report in `docs/incidents/YYYY-MM-DD-<slug>.md`
2. **Within 48 hours**: Schedule post-mortem meeting
3. **Within 72 hours**: Complete post-mortem report and assign action items

### Post-Mortem Report Template

```markdown
# Post-Mortem: YYYY-MM-DD - <Incident Title>

## Incident Summary
- **Date**: YYYY-MM-DD
- **Severity**: SEV1/SEV2
- **Duration**: HH:MM to HH:MM (X hours, Y minutes)
- **Impact**: <users affected, features impacted, downtime duration>

## Timeline
| Time (UTC) | Event |
| ---------- | ----- |
| HH:MM      | First alert triggered |
| HH:MM      | On-call engineer acknowledged |
| HH:MM      | Root cause identified |
| HH:MM      | Mitigation applied |
| HH:MM      | Services restored |

## Root Cause
<What caused the incident>

## Contributing Factors
- <Factor 1>
- <Factor 2>

## Detection
<How was the incident first detected? Was there a gap in monitoring?>

## Resolution
<Steps taken to resolve the incident>

## Action Items
| # | Action | Owner | Target Date | Status |
| - | ------ | ----- | ----------- | ------ |
| 1 | <action> | @person | YYYY-MM-DD | [ ] |
| 2 | <action> | @person | YYYY-MM-DD | [ ] |

## Lessons Learned
<What went well, what could be improved>
```

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
docker compose -f /opt/chat/infra/docker/docker-compose.prod.yml logs -f

# Restart specific service
docker compose -f /opt/chat/infra/docker/docker-compose.prod.yml restart api

# Check container health
docker compose -f /opt/chat/infra/docker/docker-compose.prod.yml ps

# Check Redis
docker compose -f /opt/chat/infra/docker/docker-compose.prod.yml exec redis redis-cli ping

# Force rebuild and redeploy
gh workflow run deploy-production.yml

# Rollback to specific SHA
gh workflow run deploy-production.yml --field rollback_sha=<sha>

# Check Supabase status
curl -s https://status.supabase.com/api/v2/status.json | jq

# View disk usage
ssh root@<droplet-ip> "df -h"

# Prune Docker images
ssh root@<droplet-ip> "docker system prune -af"
```
