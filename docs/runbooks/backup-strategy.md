# Backup Strategy

## Recovery Objectives (RTO/RPO)

Targets for the current single-droplet topology (`infra/terraform/main.tf`,
`infra/docker/docker-compose.prod.yml`). These are **targets**, not measured guarantees;
the restore drill below must confirm them and this table updated with the observed numbers.

| Failure                 | Data loss target (RPO)                              | Recovery target (RTO)              | Mechanism                                                              |
| ----------------------- | --------------------------------------------------- | ---------------------------------- | ---------------------------------------------------------------------- |
| Supabase Postgres       | <= 24 h (Pro daily) / minutes (Team PITR)           | <= 1 h (dashboard restore)         | Supabase automated backups / PITR                                       |
| Supabase Storage        | <= 24 h                                             | <= 1 h                             | Supabase backups                                                        |
| Redis (queues/presence) | Acceptable loss (jobs are idempotent)               | <= 15 min                          | AOF + scheduler re-enqueue (`docs/runbooks/redis-recovery.md`)          |
| Droplet / host          | Last successful off-host backup (see below)         | <= 2 h (CI redeploy + DB restore)  | Re-deploy via CI/CD, then restore Supabase                              |

## Single-node risk and off-host backups

All services (Caddy, web, api, worker, Redis, LiveKit) run on one
`digitalocean_droplet` (`chat-${environment}`), sized `s-1vcpu-512mb-10gb` by default. Any
host failure is a full outage, and the local `redis-data` volume is a single point of
failure for queues, idempotency keys and presence. Until Redis is moved to a managed/HA
instance, operators must:

- Keep the primary database and storage backups on Supabase (already off-host) - never
  treat a droplet-local dump as the only copy.
- Take a **nightly off-host copy** of any droplet-local state that is not otherwise
  covered (Redis AOF) and of the deployment `.env`/compose files, e.g.:
  ```bash
  docker exec chat-redis-prod redis-cli BGSAVE
  docker cp chat-redis-prod:/data/appendonly.aof ./backups/redis-$(date +%F).aof
  # then copy ./backups off the droplet (object storage / another host)
  ```
- Re-run the restore drill (below) at least monthly and record the actual RTO/RPO.

Moving Redis to a managed/HA service and adding a second application replica remain
out of scope for this runbook and are tracked as an architecture follow-up.

## Database (Supabase PostgreSQL)

Supabase provides automated daily backups on the Pro plan with 7-day retention. Point-in-time recovery (PITR) is available on the Team plan.

### Automated Backups

- **Schedule**: Daily (automated by Supabase)
- **Retention**: 7 days (Pro) / 28 days (Team with PITR)
- **Scope**: Full database, including schemas, data, and indexes
- **Restore**: Via Supabase Dashboard → Database → Backups → Restore

### Manual Snapshots

For additional safety before risky operations (migrations, schema changes):

```bash
# Using Supabase CLI
supabase db dump --file ./backups/pre-migration-$(date +%F).sql

# Download from Supabase dashboard
# Project Settings → Database → "Generate a backup"
```

## Object Storage (Avatars, Uploads)

Uploads are stored in Supabase Storage (S3-compatible).

- Backups are included in Supabase daily backups
- For additional redundancy, configure a lifecycle rule to replicate to another bucket
- Avatar files are small; consider syncing to a secondary region

## Cache (Redis)

Redis holds ephemeral data (sessions, rate-limit counters, socket.io state).

- **No persistent backup needed** — Redis is a cache layer
- `appendonly yes` is enabled in production for crash recovery
- On total data loss, the system will repopulate cache naturally

## Worker Queues (BullMQ / Redis)

Job queues are stored in Redis and will be lost on Redis failure.

- BullMQ jobs should be designed with idempotency (already implemented)
- Consider adding Redis persistence snapshot (`save "" 900 1 300 10 60 10000`)

## Infrastructure (Docker Compose, Caddy)

Volumes are defined in `docker-compose.prod.yml`:

| Volume         | Content                        | Backup                             |
| -------------- | ------------------------------ | ---------------------------------- |
| `caddy-data`   | TLS certificates, ACME account | Optional — Caddy auto-renews certs |
| `caddy-config` | Caddy configuration            | Tracked in git                     |
| `redis-data`   | AOF persistence file           | Not backed up (ephemeral)          |

## Recovery Procedure

1. **Database**: Supabase Dashboard → Database → Backups → Restore to a specific timestamp
2. **Storage**: Supabase Dashboard → Storage → Recover deleted files (within 30 days)
3. **Infrastructure**: Redeploy from CI/CD pipeline — all configuration is in git

## Verification

Test backup integrity monthly by restoring to a staging environment:

```bash
supabase db dump --file ./backups/verify-$(date +%F).sql
supabase db restore --file ./backups/verify-$(date +%F).sql --target staging
```

## Retention Policy

| Data Type       | Retention    | Backup Frequency            |
| --------------- | ------------ | --------------------------- |
| Database (full) | 7-28 days    | Daily                       |
| Message history | Indefinite   | Daily (via DB backup)       |
| Uploaded files  | Indefinite   | Daily (via Supabase backup) |
| User sessions   | Until expiry | Not backed up               |
| Audit logs      | 90 days      | Daily (via DB backup)       |
| Cached data     | Ephemeral    | Not backed up               |
