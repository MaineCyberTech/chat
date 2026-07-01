# Principal Audit Report

- Prompt: **database_integrity_migration_audit**
- Domain: **database**
- Run ID: **database_integrity_migration_audit_20260701_071112**
- Generated: **2026-07-01T07:11:05Z**
- Decision: **NO-GO**
- P0: **2**, P1: **4**
- P2: **3**, P3: **2**
- Readiness: **45.00**

## Findings

### P0 — SECURITY DEFINER functions missing SET search_path — 4 functions affected

- **File:** `supabase/migrations/20260625000002_create_workspaces.sql`
- **Category:** rls_posture
- **Impact:** Search_path injection attack: user-created objects can hijack elevated privileges
- **Fix:** Add SET search_path = 'public' to handle_new_user(), handle_new_channel(), handle_new_workspace(), and the fixed version in migration 22

### P0 — Missing INSERT/UPDATE/DELETE RLS policies for workspace_members and channel_members tables

- **File:** `supabase/migrations/20260626000022_apply_rls_policies.sql`
- **Category:** rls_posture
- **Impact:** Direct user operations on member tables bypass RLS — relies entirely on application-level middleware
- **Fix:** Add INSERT/UPDATE/DELETE policies for workspace_members and channel_members with auth.uid() checks

### P1 — TypeScript types significantly out of sync with database schema — 6 types defined vs 16 tables exist

- **File:** `packages/db/src/types.ts`
- **Category:** schema_drift
- **Impact:** Type safety gaps: developers referencing missing types will fall back to any; soft-delete fields (deleted_at, archived_at) missing from Workspace, Channel, Message types
- **Fix:** Run npx supabase gen types typescript --local > packages/db/src/types.ts; verify all tables represented

### P1 — Migration sequence gap in 20260626 batch — jumps from 01 to 22 with 21 missing sequence numbers

- **File:** `supabase/migrations/`
- **Category:** migration_safety
- **Impact:** Suggests migrations were deleted or renumbered; Supabase CLI tracking by filename may conflict
- **Fix:** Audit migration sequence; create placeholder files or renumber to eliminate gaps

### P1 — Webhook_endpoints.created_by FK has no ON DELETE action — defaults to RESTRICT

- **File:** `supabase/migrations/20260625000012_create_webhooks.sql`
- **Category:** schema_drift
- **Impact:** Deleting an auth user who created webhooks will fail with FK violation
- **Fix:** Add ON DELETE SET NULL or ON DELETE CASCADE to webhook_endpoints.created_by FK constraint

### P1 — Runbook incorrectly states 'PostgreSQL does not support transactional DDL rollback'

- **File:** `docs/runbooks/database-migrations.md`
- **Category:** migration_safety
- **Impact:** Misguided operator guidance — DDL inside BEGIN/ROLLBACK IS supported, preventing safe rollback
- **Fix:** Correct the runbook: PostgreSQL fully supports DDL rollback within transaction blocks

### P2 — Missing index on reactions.message_id — all reaction queries filter by message_id

- **File:** `supabase/migrations/20260625000008_create_reactions.sql`
- **Category:** index_coverage
- **Impact:** Full table scans on reaction queries for channels with many messages and reactions
- **Fix:** CREATE INDEX idx_reactions_message_id ON public.reactions(message_id)

### P2 — Missing index on notifications.workspace_id — workspace-level notification queries

- **File:** `supabase/migrations/20260625000011_create_notifications.sql`
- **Category:** index_coverage
- **Impact:** Full table scans for workspace notification listing
- **Fix:** CREATE INDEX idx_notifications_workspace_id ON public.notifications(workspace_id)

### P2 — Seed data contains plaintext webhook secrets visible in repository

- **File:** `supabase/seeds/07_webhooks.sql`
- **Category:** schema_drift
- **Impact:** Development secrets committed to git — if repository access is compromised, secrets are exposed
- **Fix:** Remove hardcoded secrets from seed files; use placeholder values like 'CHANGE_ME'

### P3 — No down/rollback scripts exist for any of the 26 migrations

- **File:** `supabase/migrations/`
- **Category:** migration_safety
- **Impact:** Rollback requires manual SQL construction per incident or PITR with data loss
- **Fix:** Write .down.sql reversal scripts for each migration, starting with the last 5 additive-column migrations

### P3 — Dual migration application paths: supabase db execute (dev scripts) vs supabase db push (CI)

- **File:** `supabase/migrations/`
- **Category:** schema_drift
- **Impact:** Different code paths may produce different results — db push uses migration tracking, db execute runs raw SQL
- **Fix:** Standardize on supabase db push for all environments; remove db execute fallback path
