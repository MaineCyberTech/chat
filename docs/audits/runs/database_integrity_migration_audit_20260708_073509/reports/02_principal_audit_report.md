# Principal Audit Report

- Prompt: **database_integrity_migration_audit**
- Domain: **database**
- Run ID: **database_integrity_migration_audit_20260708_073509**
- Generated: **2026-07-08T12:00:00.000Z**
- Decision: **GO WITH RISKS**
- P0: **0**, P1: **2**
- P2: **4**, P3: **3**
- Readiness: **81.00**

## Findings

### P1 — GDPR account deletion does not clean up consent_logs, sidebar_categories, channel_bookmarks, or audit_logs

- **File:** `apps/api/src/modules/auth/routes.ts`
- **Category:** data_lifecycle
- **Impact:** When a user deletes their account via DELETE /account at auth/routes.ts:212, user data is deleted from notifications, push_subscriptions, messages, reactions, channel_members, workspace_members, user_preferences, and users — but consent_logs, sidebar_categories, sidebar_channel_assignments, channel_bookmarks, message_reminders, and audit_logs are left behind, violating GDPR right to erasure and leaving orphaned PII
- **Fix:** Add delete operations for consent_logs, sidebar_categories, sidebar_channel_assignments, channel_bookmarks, message_reminders, and audit_logs (or anonymize actor_user_id in audit_logs)

### P1 — Migration 20260707000002 adds a trigger on auth.users DELETE but cannot be rolled back (no down migration)

- **File:** `supabase/migrations/20260707000002_cleanup_deleted_users.sql`
- **Category:** migration_safety
- **Impact:** If the cleanup trigger needs to be modified or reverted, there is no rollback script. The TRIGGER on_auth_user_deleted and FUNCTION handle_user_deletion remain in the database permanently after deployment, making it impossible to cleanly roll back this migration in CI or production rollback scenarios
- **Fix:** Create supabase/rollback/20260707000002_cleanup_deleted_users_down.sql that DROP TRIGGER on_auth_user_deleted and DROP FUNCTION handle_user_deletion

### P2 — Message remove() performs hard DELETE instead of soft-delete, inconsistent with soft-delete strategy

- **File:** `apps/api/src/modules/messages/service.ts`
- **Category:** migration_safety
- **Impact:** The message remove() in messages/service.ts:328 does a hard DELETE from the messages table, bypassing the soft-delete column (deleted_at). Messages deleted via the API are permanently removed, cannot be restored, and break referential integrity for child records (reactions, flags, edit history) despite CASCADE. This is inconsistent with the soft-delete RLS policy that filters by deleted_at IS NULL
- **Fix:** Change message remove() to soft-delete (UPDATE deleted_at = NOW()) instead of hard DELETE. Reserve hard delete for a separate admin purge endpoint or data retention job

### P2 — message_flags table has UNIQUE(user_id, message_id) constraint but no explicit index matching the unique constraint

- **File:** `supabase/migrations/20260703000001_add_message_features.sql`
- **Category:** schema_integrity
- **Impact:** While a unique constraint implicitly creates a btree index, there is no explicit composite index on (user_id, message_id) for the common query pattern filtering by user_id only. The separate indexes idx_message_flags_user and idx_message_flags_message are single-column and less efficient for the upsert pattern with onConflict
- **Fix:** The implicit unique index is sufficient for the constraint, but consider adding a covering index with INCLUDE (created_at) for the getFlagged query which joins message_flags → messages by user_id

### P2 — Channel reordering updates individual rows sequentially with no transaction wrapping — partial updates possible

- **File:** `apps/api/src/modules/channels/service.ts`
- **Category:** schema_integrity
- **Impact:** The reorderChannel method in channels/service.ts:48-64 updates each channel's sort_order in a loop without a database transaction. If the process fails mid-way, channels will have inconsistent sort_order values, leaving some updated and others not
- **Fix:** Wrap the sort_order updates in a Supabase RPC with BEGIN/COMMIT/ROLLBACK transaction, or use a batch update approach with a single query

### P2 — Reactions SELECT RLS policy allows all authenticated users to read any reaction without channel membership check

- **File:** `supabase/migrations/20260625000008_create_reactions.sql`
- **Category:** rls_posture
- **Impact:** The policy 'reactions_select' at line 12-14 allows SELECT for all authenticated users (USING (true)). This means any authenticated user can enumerate reactions across all messages in all channels, leaking which users reacted to which content even in private channels they don't belong to
- **Fix:** Restrict reactions SELECT policy to only return reactions for messages in channels the user can access via workspace/channel membership, matching the messages_select_member pattern

### P3 — Data retention enforcement uses pg_cron setup documented in a separate runbook rather than a migration

- **File:** `supabase/migrations/20260627000002_enforce_data_retention.sql`
- **Category:** schema_integrity
- **Impact:** The data retention policy for consent_logs and old messages requires manual pg_cron setup. This is not automatically applied during deployment, creating a gap between migration state and actual enforcement
- **Fix:** Either include the pg_cron job creation SQL directly in the migration (gated by IF pg_cron extension exists), or integrate the setup into the deployment pipeline script

### P3 — consent_logs indexes only cover user_id but not consent_type or created_at for audit queries

- **File:** `supabase/migrations/20260626000025_consent_logs.sql`
- **Category:** indexing
- **Impact:** The idx_consent_logs_user_id index supports user-specific lookups, but audit queries filtering by consent_type or date range will require full table scans
- **Fix:** Consider adding a composite index on (consent_type, created_at) if audit queries against consent_logs are expected at scale

### P3 — Webhook RLS policies allow workspace members to read webhook_endpoints including encrypted secrets

- **File:** `supabase/policies/09_webhooks.sql`
- **Category:** rls_posture
- **Impact:** While the API masks secrets at the application layer (webhooks/routes.ts:106-108), the RLS policy allows any workspace member to SELECT from webhook_endpoints, which includes the encrypted_secret column. If an attacker gains direct DB access (via SQL injection or exposed anon key), they could extract encrypted webhook secrets
- **Fix:** Restrict webhook_endpoints RLS to only expose non-secret columns, or use a VIEW that excludes the secret column for regular users
