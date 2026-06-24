# pg_cron Setup for Data Retention (Supabase)

This runbook documents the manual steps required to enable `pg_cron` and schedule retention jobs in Supabase.

## Prerequisites

- Supabase project with database access
- `pg_cron` extension available (enabled by default on Supabase)

## Enable pg_cron Extension

Run in Supabase SQL Editor:

```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

## Schedule Audit Log Pruning (Daily at 3 AM UTC)

```sql
-- Prune audit logs older than 90 days
SELECT cron.schedule(
  'prune-audit-logs',
  '0 3 * * *',
  'SELECT public.prune_audit_logs()'
);
```

## Schedule Message Archival (Weekly Sunday 2 AM UTC)

```sql
-- Archive messages older than 365 days
SELECT cron.schedule(
  'archive-old-messages',
  '0 2 * * 0',
  'SELECT public.archive_old_messages()'
);
```

## Schedule Message Purging (Monthly 1st at 3 AM UTC)

```sql
-- Purge archived messages older than 7 years (2555 days)
SELECT cron.schedule(
  'purge-archived-messages',
  '0 3 1 * *',
  'SELECT public.purge_archived_messages()'
);
```

## Schedule Webhook Retry Processing (Every Minute)

```sql
-- Process pending webhook retries
SELECT cron.schedule(
  'webhook-retries',
  '* * * * *',
  'SELECT public.process_webhook_retries()'
);
```

## Verify Scheduled Jobs

```sql
SELECT * FROM cron.job;
```

## View Job Run History

```sql
SELECT * FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 20;
```

## Unschedule a Job

```sql
SELECT cron.unschedule('job-name');
```

## Manual Trigger (for testing)

```sql
-- Test audit log pruning
SELECT public.prune_audit_logs();

-- Test message archival
SELECT public.archive_old_messages();

-- Test message purging
SELECT public.purge_archived_messages();

-- Test webhook retry processing
SELECT public.process_webhook_retries();
```

## Monitoring

- Check `cron.job_run_details` for failures
- Set up alerts on failed job runs
- Monitor audit_logs table size growth
- Monitor messages table size growth

## Notes

- All functions use `SECURITY DEFINER` and run with elevated privileges
- Retention periods are configurable via function parameters
- Webhook retries use exponential backoff (1min, 2min, 4min, 8min, 16min)
- Dead letter queue captures permanently failed deliveries after 5 attempts
