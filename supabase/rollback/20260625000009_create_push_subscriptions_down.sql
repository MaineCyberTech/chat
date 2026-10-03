-- Rollback for: 20260625000009_create_push_subscriptions.sql
-- Generated on: ...

BEGIN;

DROP INDEX IF EXISTS push_subscriptions_user_id_idx;
DROP POLICY IF EXISTS "push_subscriptions_update_own" ON public.push_subscriptions;
DROP POLICY IF EXISTS "push_subscriptions_delete_own" ON public.push_subscriptions;
DROP POLICY IF EXISTS "push_subscriptions_insert_own" ON public.push_subscriptions;
DROP POLICY IF EXISTS "push_subscriptions_select_own" ON public.push_subscriptions;
ALTER TABLE IF EXISTS public.push_subscriptions DISABLE ROW LEVEL SECURITY;
DROP TABLE IF EXISTS public.push_subscriptions CASCADE;

COMMIT;
