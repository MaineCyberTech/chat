# Principal Audit Report

- Prompt: **database_integrity_migration_audit**
- Domain: **database**
- Run ID: **database_integrity_migration_audit_20260703_054832**
- Generated: **2026-07-03T18:00:00.000Z**
- Decision: **GO WITH RISKS**
- P0: **0**, P1: **2**
- P2: **3**, P3: **0**
- Readiness: **65.00**

## Findings

### P1 — Message interface declares archived_at field but no migration ever adds this column to the messages table

- **File:** `packages/db/src/types.ts`
- **Category:** schema_drift
- **Impact:** TypeScript `Message` type has `archived_at: string | null` but no migration adds the column. At runtime, `data as Message` produces `undefined` for `archived_at`, causing logic errors in archival workflows.
- **Fix:** Add migration: ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ; OR remove archived_at from the TypeScript type.

### P1 — Reactions table SELECT RLS policy is USING (true), granting any authenticated user access to all reactions across all workspaces

- **File:** `supabase/migrations/20260625000008_create_reactions.sql`
- **Category:** rls_posture
- **Impact:** Any authenticated user can enumerate reactions for any message regardless of workspace or channel membership, leaking message IDs and reaction patterns in private channels.
- **Fix:** Replace with membership-scoped policy joining through messages, channels, and workspace_members.

### P2 — Circular RLS dependency between channels and channel_role_overrides required three hotfix migrations (006, 007, 008) — final state removes override check from channels entirely

- **File:** `supabase/migrations/20260627000006_channel_role_overrides.sql`
- **Category:** migration_safety
- **Impact:** Migration 006 introduced circular RLS dependency causing infinite recursion. Final state (008) removed override check from channels SELECT entirely, making the override table inert for hiding channels.
- **Fix:** Re-integrate channel_role_overrides into channel SELECT policy via SECURITY DEFINER helper that breaks circular dependency, or remove the table entirely.

### P2 — Message deletion uses hard DELETE despite full soft-delete infrastructure being built and deployed

- **File:** `apps/api/src/modules/messages/service.ts`
- **Category:** constraint_completeness
- **Impact:** Migration 014 built soft-delete infrastructure (deleted_at column, RLS filtering, restore functions) but the API still uses hard DELETE. Deleted messages cannot be recovered by admins.
- **Fix:** Change to UPDATE messages SET deleted_at = NOW() WHERE id = $1. Add PATCH /messages/:id/restore endpoint (admin-only) calling existing restore_message() function.

### P2 — No index on messages.parent_id, causing full table scans for thread reply listing and the thread_metadata trigger

- **File:** `supabase/migrations/20260627000004_threads.sql`
- **Category:** constraint_completeness
- **Impact:** Thread queries SELECT \* FROM messages WHERE parent_id = $1 ORDER BY created_at ASC. Neither existing index covers this pattern. Each thread view performs a sequential scan.
- **Fix:** Add migration: CREATE INDEX IF NOT EXISTS idx_messages_parent_id ON public.messages(parent_id) WHERE parent_id IS NOT NULL;
