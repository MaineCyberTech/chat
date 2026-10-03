-- Rollback for: 20260627000009_add_optimistic_locking.sql
-- Generated on: ...

BEGIN;

DROP TRIGGER IF EXISTS channels_version ON public.channels;
DROP TRIGGER IF EXISTS messages_version ON public.messages;
DROP FUNCTION IF EXISTS public.increment_version CASCADE;
ALTER TABLE IF EXISTS public.channels DROP COLUMN IF EXISTS version;
ALTER TABLE IF EXISTS public.messages DROP COLUMN IF EXISTS version;

COMMIT;
