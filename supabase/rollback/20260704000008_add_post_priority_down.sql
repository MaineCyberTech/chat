-- Rollback for: 20260704000008_add_post_priority.sql
-- Generated on: ...

BEGIN;

DROP POLICY IF EXISTS "channel_member_insert" ON public.messages;
ALTER TABLE IF EXISTS public.messages DROP COLUMN IF EXISTS priority;

COMMIT;
