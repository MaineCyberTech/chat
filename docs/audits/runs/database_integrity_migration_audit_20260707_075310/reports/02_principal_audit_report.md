# Principal Audit Report

- Prompt: **database_integrity_migration_audit**
- Domain: **database**
- Run ID: **database_integrity_migration_audit_20260707_075310**
- Generated: **2026-07-07T12:00:00Z**
- Decision: **GO**
- P0: **0**, P1: **3**
- P2: **6**, P3: **5**
- Readiness: **76.00**

## Findings

### P1 — Duplicate user_groups table creation with different schemas
- **File:** `supabase/migrations/20260704000007_add_user_groups.sql, supabase/migrations/20260705000003_add_user_groups.sql`
- **Category:** Migration Correctness
- **Impact:** Two migrations (20260704000007 and 20260705000003) both CREATE TABLE public.user_groups with different column sets. The second drops display_name. Schema drift depends on which runs last.
- **Fix:** Remove 20260705000003_add_user_groups.sql or convert to ALTER TABLE migration that adds/modifies columns on the table created by 20260704000007.

### P1 — Truncated DROP POLICY statements in rollback script
- **File:** `supabase/rollback/20260704000001_add_dm_presence_categories_down.sql`
- **Category:** Rollback Scripts
- **Impact:** Twelve DROP POLICY statements have policy names truncated at 6 characters due to line breaks. The SQL is invalid and rollback will fail with syntax errors, making the migration irreversible.
- **Fix:** Replace lines 26-37 with complete DROP POLICY IF EXISTS statements using the full quoted policy names from the original migration.

### P1 — Truncated function signature in DROP FUNCTION statement
- **File:** `supabase/rollback/20260627000006_channel_role_overrides_down.sql`
- **Category:** Rollback Scripts
- **Impact:** Line 11: 'DROP FUNCTION IF EXISTS public.channel_workspace(channel_id;' is missing closing parenthesis. Rollback will fail with syntax error.
- **Fix:** Fix to 'DROP FUNCTION IF EXISTS public.channel_workspace(UUID)' or use 'DROP FUNCTION IF EXISTS public.channel_workspace(channel_id UUID)'.

### P2 — Missing TypeScript type definitions for 16 database tables
- **File:** `packages/db/src/types.ts`
- **Category:** TypeScript Types
- **Impact:** Tables created since the original type definitions (thread_metadata, thread_participants, channel_role_overrides, dm_channels, dm_members, user_presence, channel_bookmarks, sidebar_categories, sidebar_channel_assignments, channel_notification_preferences, custom_emoji, message_reminders, notification_preferences, user_statuses, channel_member_history, webhook_dead_letters) have no client-side types. SDK consumers must use raw any-typed queries.
- **Fix:** Add TypeScript interfaces for all untabled tables in types.ts and export from index.ts.

### P2 — feature_flags RLS not scoped to a specific workspace
- **File:** `supabase/policies/11_feature_flags.sql`
- **Category:** RLS Policies
- **Impact:** The feature_flags RLS policy checks workspace_members.role across ANY workspace, allowing an admin in any workspace to read/manage feature flags that apply globally. If feature flags are meant to be global, the workspace_members join is unnecessary and misleading.
- **Fix:** Add workspace_id FK to feature_flags table and scope RLS to that workspace, or remove the workspace_members join and document that feature_flags are a global system table.

### P2 — Data retention worker has unimplemented consent_logs and notifications types
- **File:** `apps/worker/src/processors/data-retention.ts`
- **Category:** Data Lifecycle
- **Impact:** DataRetentionJobData includes 'consent_logs' and 'notifications' types in the union but the worker switch statement only handles messages, audit_logs, soft_deleted_channels, and soft_deleted_workspaces. Sending these jobs silently does nothing. Consent logs have GDPR compliance implications.
- **Fix:** Implement retainConsentLogs and retainNotifications functions following the SQL purge functions in enforce_data_retention.sql.

### P2 — archive_old_messages channel_id filter is always true due to parameter/column name collision
- **File:** `supabase/migrations/20260625000015_data_retention.sql`
- **Category:** Data Lifecycle
- **Impact:** Line 28: AND (channel_id = channel_id OR channel_id IS NULL) — the parameter name shadows the column name, making this always true. Archive operations cannot be scoped to a specific channel.
- **Fix:** Rename the function parameter to target_channel_id to disambiguate from the column reference.

### P2 — channel_member_history INSERT policy allows any authenticated user to forge audit records
- **File:** `supabase/migrations/20260707000001_add_channel_member_history.sql`
- **Category:** Data Lifecycle
- **Impact:** Line 30: WITH CHECK (true) policy lets any authenticated user insert arbitrary join/leave events into the audit history. Though the trigger uses SECURITY DEFINER (bypassing RLS), the permissive policy is dangerous if ever relied upon.
- **Fix:** Change the INSERT policy to WITH CHECK (false) so only SECURITY DEFINER trigger can insert, or tighten to match trigger logic.

### P2 — Migration comments reference old sequential filenames instead of actual timestamp-based names
- **File:** `supabase/migrations/20260625000013_audit_log_pruning.sql, supabase/migrations/20260625000014_soft_delete.sql, supabase/migrations/20260625000015_data_retention.sql, supabase/migrations/20260625000017_audit_logs_org_fk.sql`
- **Category:** Migration Correctness
- **Impact:** Comments like 'Run after 006_user_preferences.sql' refer to the old sequential naming scheme. With the YYYYMMDDHHMMSS naming convention, these references are ambiguous and make dependency tracing confusing.
- **Fix:** Update all migration comments to reference actual timestamp-based filenames or remove sequential references entirely.

### P3 — channel_role_overrides has no INSERT/DELETE policy for non-admin users
- **File:** `supabase/migrations/20260627000006_channel_role_overrides.sql`
- **Category:** RLS Policies
- **Impact:** The table only has manage_admin (FOR ALL for admins) and select_member (FOR SELECT for members) policies. Regular members cannot create or delete overrides through the API, but the overrides control channel-level deny rules that members might need to request.
- **Fix:** Document the access model. Consider adding a request_override flow at the app level if needed. By design for now.

### P3 — audit_logs.organization_id column name is misleading
- **File:** `supabase/migrations/20260625000010_create_audit_logs.sql`
- **Category:** Schema
- **Impact:** The column is named organization_id but its FK constraint references public.workspaces(id). Developers reading the schema will assume it references an organizations table that does not exist.
- **Fix:** Rename the column to workspace_id via a new migration, or add documentation clarifying the workspace mapping.

### P3 — Seed scripts can overwrite production data due to ON CONFLICT DO UPDATE pattern and no runtime guard
- **File:** `supabase/seeds/00_local_test_users.sql, supabase/seeds/01_workspaces.sql, supabase/seeds/02_channels.sql, supabase/seeds/03_messages.sql, supabase/seeds/04_threads.sql, supabase/seeds/05_reactions.sql, supabase/seeds/06_notifications.sql`
- **Category:** Seed Data
- **Impact:** All seed scripts use ON CONFLICT DO UPDATE which overwrites existing rows with matching IDs. Only 00_local_test_users.sql has a 'LOCAL / DEV ONLY' comment. Running these against production would silently overwrite data.
- **Fix:** Add runtime guards at the top of each seed file: DO $$ BEGIN IF EXISTS (SELECT 1 FROM public.workspaces LIMIT 1) THEN RAISE EXCEPTION 'Seeds not for production'; END IF; END $$;

### P3 — Rollback scripts contain auto-generation placeholder comments
- **File:** `supabase/rollback/20260625000001_create_users_down.sql, supabase/rollback/20260627000004_threads_down.sql`
- **Category:** Rollback Scripts
- **Impact:** Files contain 'Manual rollback needed: UPDATE on ON/SET' comment artifacts that appear to be stubs from auto-generation. These suggest incomplete rollback coverage for trigger functions.
- **Fix:** Remove placeholder comments after verifying the DROP FUNCTION and DROP TRIGGER statements correctly handle the rollback. Add manual steps if triggers truly need custom rollback.

### P3 — No index on channels.channel_type for type-based filtering
- **File:** `supabase/migrations/20260704000001_add_dm_presence_categories.sql`
- **Category:** Indexes
- **Impact:** channel_type column was added for DM/GM/public/private filtering but has no dedicated index. Queries filtering by type (e.g., list all DM channels) will perform sequential scans as channel count grows.
- **Fix:** Add CREATE INDEX IF NOT EXISTS idx_channels_channel_type ON public.channels(channel_type) as a new migration.
