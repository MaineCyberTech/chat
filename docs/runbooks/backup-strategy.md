# Backup Strategy

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

| Volume | Content | Backup |
|--------|---------|--------|
| `caddy-data` | TLS certificates, ACME account | Optional — Caddy auto-renews certs |
| `caddy-config` | Caddy configuration | Tracked in git |
| `redis-data` | AOF persistence file | Not backed up (ephemeral) |

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

| Data Type | Retention | Backup Frequency |
|-----------|-----------|-----------------|
| Database (full) | 7-28 days | Daily |
| Message history | Indefinite | Daily (via DB backup) |
| Uploaded files | Indefinite | Daily (via Supabase backup) |
| User sessions | Until expiry | Not backed up |
| Audit logs | 90 days | Daily (via DB backup) |
| Cached data | Ephemeral | Not backed up |
