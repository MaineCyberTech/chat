-- Rollback for: 20260705000002_add_scheduled_posts.sql
-- Generated on: ...

BEGIN;

DROP TABLE IF EXISTS public.scheduled_posts CASCADE;
DROP INDEX IF EXISTS idx_scheduled_posts_due;
ALTER TABLE public.scheduled_posts DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users;

COMMIT;
