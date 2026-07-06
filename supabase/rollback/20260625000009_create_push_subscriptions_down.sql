-- Rollback for: 20260625000009_create_push_subscriptions.sql
-- Generated on: ...

BEGIN;

DROP TABLE IF EXISTS public.push_subscriptions CASCADE;
ALTER TABLE public.push_subscriptions DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "push_subscriptions_select_own";
DROP POLICY IF EXISTS "push_subscriptions_insert_own";
DROP POLICY IF EXISTS "push_subscriptions_delete_own";
DROP POLICY IF EXISTS "push_subscriptions_update_own";
DROP INDEX IF EXISTS push_subscriptions_user_id_idx;

COMMIT;
