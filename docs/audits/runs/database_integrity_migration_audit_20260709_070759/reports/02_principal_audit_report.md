# Principal Audit Report

- Prompt: **database_integrity_migration_audit**
- Domain: **database**
- Run ID: **database_integrity_migration_audit_20260709_070759**
- Generated: **2026-07-09T12:00:00.000Z**
- Decision: **GO WITH RISKS**
- P0: **0**, P1: **0**
- P2: **2**, P3: **0**
- Readiness: **81.00**

## Findings

### P2 — Missing rollback script for migration 20260709000001_add_auto_responder

- **File:** `supabase/migrations/20260709000001_add_auto_responder.sql`
- **Category:** rollback_readiness
- **Impact:** 55 migrations exist but only 54 rollback scripts are present. Migration 20260709000001 (adds auto_responders table) has no corresponding down migration. If this migration needs to be rolled back in production, the auto_responders table will remain orphaned, causing schema drift between environments.
- **Fix:** Create supabase/rollback/20260709000001_add_auto_responder_down.sql with DROP TABLE IF EXISTS public.auto_responders CASCADE;

### P2 — Reactions SELECT policy uses using(true) with no tenant/workspace scoping

- **File:** `supabase/policies/06_reactions.sql`
- **Category:** rls
- **Impact:** The reactions table RLS policy allows all authenticated users to select all reactions across all workspaces. While reactions contain only emoji + user_id pairs, this violates the tenant isolation model used by all other tables and leaks user activity data across workspace boundaries.
- **Fix:** Replace using(true) with a policy that joins through messages -> channels -> workspace_members to verify workspace membership before allowing reaction reads.
