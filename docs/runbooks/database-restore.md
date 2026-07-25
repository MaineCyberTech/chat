# Database Restore

Restoring from Supabase backups. Supabase provides daily automated backups with 7-day retention (Pro) or 28-day retention with PITR (Team).

## Before You Begin

- Restore is **destructive** — it replaces the current database state
- Notify the team and put up a maintenance notice if restoring to production
- Verify the backup timestamp covers the desired state

## Restore via Supabase Dashboard

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) → your project
2. **Database** → **Backups**
3. Find the backup with the desired timestamp
4. Click **Restore** → confirm the warning dialog
5. Wait for restoration to complete (typically 5-15 minutes)

The project will be read-only during restoration. All connections will be dropped.

## Restore via CLI

```bash
supabase db dump --file ./backups/snapshot-$(date +%F).sql
```

To restore from a local dump to a fresh local instance:

```bash
supabase stop
supabase start
supabase db reset
psql postgresql://postgres:postgres@localhost:54322/postgres < ./backups/snapshot-2026-07-24.sql
supabase db push
```

## Post-Restore Verification

After restore completes, run these checks:

```sql
SELECT count(*) FROM auth.users;
SELECT count(*) FROM workspaces;
SELECT count(*) FROM messages;
SELECT count(*) FROM channels;
```

Compare against pre-restore counts. Verify login works:

```bash
curl -X POST 'https://<ref>.supabase.co/auth/v1/token?grant_type=password' \
  -H 'apikey: <anon-key>' \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@seed.test","password":"password123"}'
```

## Point-in-Time Recovery (PITR)

Available on Team plan and above. Go to **Database** → **PITR** → select timestamp → **Restore**.

## If Restore Fails

1. Check [Supabase Status](https://status.supabase.com) for platform issues
2. Verify you have the correct project selected
3. Contact Supabase support if backup is unavailable
4. Fallback to the most recent export in your CI artifact store
