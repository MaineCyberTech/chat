# Principal Audit Report

- Prompt: **data_ultra**
- Domain: **data**
- Run ID: **data_ultra_20260707_075310**
- Generated: **2026-07-07T12:00:00Z**
- Decision: **GO**
- P0: **0**, P1: **2**
- P2: **5**, P3: **3**
- Readiness: **69.00**

## Findings

### P1 — Data retention worker does not process consent_logs or notifications despite including them in the job type definition
- **File:** `apps/worker/src/processors/data-retention.ts`
- **Category:** Data Retention Architecture
- **Impact:** The DataRetentionJobData type includes 'consent_logs' and 'notifications' types but the worker switch statement has no matching case blocks. Scheduled jobs for these types would silently complete without doing any work. Consent logs have GDPR/regulatory retention requirements.
- **Fix:** Implement retainConsentLogs (purge after 1 year) and retainNotifications (purge read notifications after 30 days) functions, or remove the unused types from the job data union.

### P1 — channel_member_history INSERT policy allows any authenticated user to forge audit records
- **File:** `supabase/migrations/20260707000001_add_channel_member_history.sql`
- **Category:** Data Integrity
- **Impact:** Line 30: CREATE POLICY ... WITH CHECK (true) permits any authenticated user to insert arbitrary join/leave events into the channel member history. This is an audit integrity vulnerability — users could inject false history records.
- **Fix:** Change WITH CHECK (true) to WITH CHECK (false) so only the SECURITY DEFINER trigger function can insert records.

### P2 — Dual-path data retention with overlapping and inconsistent coverage
- **File:** `apps/worker/src/processors/data-retention.ts, supabase/migrations/20260625000015_data_retention.sql, supabase/migrations/20260627000002_enforce_data_retention.sql`
- **Category:** Data Retention Architecture
- **Impact:** Data retention is split across a BullMQ worker (hard-deletes soft-deleted rows) and SQL functions (purge_old_*, archive_old_messages). The SQL functions are never called (pg_cron commented out). The worker handles 4 of the 6 purge types. This fragmentation risks inconsistent retention behavior.
- **Fix:** Consolidate all retention into the BullMQ worker: add consent_logs, notifications, and archival jobs. Remove or clearly separate the SQL-only purge functions. Activate one scheduling mechanism (worker preferred for observability).

### P2 — archive_old_messages channel_id filter always evaluates to true due to parameter/column name collision
- **File:** `supabase/migrations/20260625000015_data_retention.sql`
- **Category:** Data Integrity
- **Impact:** The function parameter is named channel_id (same as the column), so the WHERE clause (channel_id = channel_id OR channel_id IS NULL) is always true for the first condition. The function cannot scope archival to a specific channel.
- **Fix:** Rename the parameter to target_channel_id so the WHERE clause correctly reads: AND (target_channel_id IS NULL OR m.channel_id = target_channel_id).

### P2 — All pg_cron scheduling is commented out, DB-level retention functions are never invoked automatically
- **File:** `supabase/migrations/20260625000013_audit_log_pruning.sql, supabase/migrations/20260625000015_data_retention.sql, supabase/migrations/20260627000002_enforce_data_retention.sql`
- **Category:** Data Retention Architecture
- **Impact:** Three migrations define purge SQL functions (purge_old_audit_logs, archive_old_messages, purge_archived_messages) with commented-out pg_cron schedules. The BullMQ worker does not call these functions. Data grows unbounded unless manually triggered.
- **Fix:** Either activate pg_cron schedules in production, or have the BullMQ worker call the SQL functions via supabase.rpc(). Do not leave both paths dormant.

### P2 — Seed scripts can overwrite production data with no safety guards
- **File:** `supabase/seeds/01_workspaces.sql, supabase/seeds/02_channels.sql, supabase/seeds/03_messages.sql, supabase/seeds/04_threads.sql, supabase/seeds/05_reactions.sql, supabase/seeds/06_notifications.sql, supabase/seeds/07_webhooks.sql`
- **Category:** Seed Data Safety
- **Impact:** All seed scripts use ON CONFLICT DO UPDATE pattern. If accidentally run against production, they silently overwrite live workspaces, channels, and messages with test data. Only 00_local_test_users.sql has a LOCAL DEV ONLY comment; the other seeds have no warnings.
- **Fix:** Add runtime guards: DO $$ BEGIN IF EXISTS (SELECT 1 FROM public.workspaces LIMIT 1) THEN RAISE EXCEPTION 'Seed scripts must not run against production'; END IF; END $$;

### P3 — No cross-channel validation for messages.parent_id
- **File:** `supabase/migrations/20260625000004_create_messages.sql`
- **Category:** Data Integrity
- **Impact:** The self-referential FK only validates the parent message exists. A client could set parent_id to a message in a different channel, causing thread replies to appear under a message from another conversation.
- **Fix:** Add a trigger to validate parent_id references a message with the same channel_id, or add application-layer validation in the message store.

### P3 — scheduled_posts CHECK constraint prevents same-second scheduling
- **File:** `supabase/migrations/20260705000002_add_scheduled_posts.sql`
- **Category:** Data Integrity
- **Impact:** CONSTRAINT future_schedule CHECK (scheduled_at > created_at) uses strict greater-than, preventing scheduling a post with the same timestamp as creation. This blocks scheduling within the same transaction or sub-second interval.
- **Fix:** Change to CHECK (scheduled_at >= created_at) to allow same-timestamp scheduling.

### P3 — Soft-delete and data retention cleanup does not handle orphaned storage objects
- **File:** `apps/worker/src/processors/data-retention.ts`
- **Category:** Storage Cleanup
- **Impact:** When messages or channels are hard-deleted by the data retention worker, associated file uploads in Supabase Storage are not cleaned up. Orphaned storage objects accumulate, consuming bucket capacity and potentially exposing deleted file URLs.
- **Fix:** Add storage cleanup steps that list and delete objects in the chat-uploads bucket for deleted message/channel IDs. Filter objects by path prefix matching the deleted IDs.
