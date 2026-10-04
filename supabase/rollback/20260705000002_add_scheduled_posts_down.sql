-- Rollback for: 20260705000002_add_scheduled_posts.sql
-- Generated on: ...

BEGIN;

DROP POLICY IF EXISTS "Users manage their own scheduled posts" ON public.scheduled_posts;
ALTER TABLE IF EXISTS public.scheduled_posts DISABLE ROW LEVEL SECURITY;
DROP INDEX IF EXISTS idx_scheduled_posts_due;
DROP TABLE IF EXISTS public.scheduled_posts CASCADE;

COMMIT;
