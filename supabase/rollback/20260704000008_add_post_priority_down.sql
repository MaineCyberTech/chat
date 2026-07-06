-- Rollback for: 20260704000008_add_post_priority.sql
-- Generated on: ...

BEGIN;

ALTER TABLE public.messages DROP COLUMN IF EXISTS priority;
DROP POLICY IF EXISTS "channel_member_insert";

COMMIT;
