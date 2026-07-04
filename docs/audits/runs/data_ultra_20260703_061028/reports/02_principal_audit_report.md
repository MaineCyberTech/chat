# Principal Audit Report

- Prompt: **data_ultra**
- Domain: **data**
- Run ID: **data_ultra_20260703_061028**
- Generated: **2026-07-03T06:10:00Z**
- Decision: **NO-GO**
- P0: **2**, P1: **2**
- P2: **4**, P3: **0**
- Readiness: **0.00**

## Findings

### P0 — No optimistic locking on ANY PATCH handler - all 9 use last-write-wins. No version column, If-Match header, or ETag comparison anywhere.
- **File:** `apps/api/src/modules/`
- **Category:** Concurrency
- **Impact:** Two users simultaneously editing the same message, workspace, channel, or webhook will silently overwrite each other's changes. Data loss on concurrent edits guaranteed.
- **Fix:** Add version column to all mutable entities, require If-Match header on PATCH, return 409 Conflict on version mismatch

### P0 — GDPR DELETE /account performs 8 sequential deletes without transaction wrapping - partial deletion if any step fails
- **File:** `apps/api/src/modules/auth/routes.ts`
- **Category:** Transactions
- **Impact:** If deletion fails mid-way (e.g. after removing messages but before removing the user), the user is left with dangling references and can't retry. Data integrity violation.
- **Fix:** Wrap all deletion operations in a Supabase RPC transaction with BEGIN/COMMIT/ROLLBACK

### P1 — webhook_endpoints.created_by FK references auth.users(id) with NO ON DELETE clause - defaults to NO ACTION
- **File:** `supabase/migrations/20260625000012_create_webhooks.sql`
- **Category:** Relational Integrity
- **Impact:** Deleting an auth user who created webhook endpoints will fail with foreign key violation. Orphan blocking delete.
- **Fix:** Add ON DELETE SET NULL or ON DELETE CASCADE to the webhook_endpoints.created_by FK

### P1 — API services use hard DELETE instead of calling soft-delete functions that exist in migrations (soft_delete_workspace, soft_delete_channel, etc.)
- **File:** `apps/api/src/modules/messages/service.ts`
- **Category:** Soft Delete
- **Impact:** Deleted workspaces, channels, and messages are permanently lost with no recovery option. Soft-delete infrastructure exists but is bypassed.
- **Fix:** Replace .delete() calls with .update({ deleted_at: new Date().toISOString() }) or RPC calls to soft-delete functions

### P2 — No transaction coverage on multi-table writes - message creation, webhook delivery, notification creation are fire-and-forget with no rollback safety
- **File:** `apps/api/src/modules/`
- **Category:** Transactions
- **Impact:** Message inserted but webhook trigger or mention notification may fail silently. No atomicity guarantee for any write operation spanning multiple tables.
- **Fix:** Use Supabase RPC functions with BEGIN/COMMIT/ROLLBACK for multi-table write operations

### P2 — All 6 data retention/purge/archive pg_cron.schedule calls are commented out. Worker cleanup processor is a no-op with TODO comments.
- **File:** `supabase/migrations/`
- **Category:** Retention
- **Impact:** Audit logs, notifications, consent logs, old messages, and webhook deliveries accumulate indefinitely. Unbounded table growth degrades query performance over time.
- **Fix:** Enable pg_cron extension and uncomment cron.schedule calls. Implement cleanup logic in worker/src/processors/cleanup.ts

### P2 — notification_preferences table is created with trigger-based defaults but has no API endpoints to read or write them
- **File:** `supabase/migrations/20260627000005_notification_preferences.sql`
- **Category:** Orphan Data
- **Impact:** Data is written but never queried from the API. Preferences cannot be managed by users despite the settings UI having toggles for them.
- **Fix:** Add API endpoints for notification preferences CRUD, or remove the table if superseded by user_preferences

### P2 — 4 database tables are missing TypeScript types: thread_metadata, thread_participants, channel_role_overrides, notification_preferences
- **File:** `packages/db/src/types.ts`
- **Category:** Type Safety
- **Impact:** TypeScript code using these tables has implicit 'any' types. Runtime errors from type mismatches not caught at compile time. Drift between schema and types.
- **Fix:** Add type definitions for all 4 missing tables to packages/db/src/types.ts
