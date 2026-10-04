-- Rollback for: 20260627000012_read_only_channels.sql
-- Generated on: ...

BEGIN;

DROP TRIGGER IF EXISTS check_read_only_on_insert ON public.messages;
DROP FUNCTION IF EXISTS public.prevent_read_only_message CASCADE;
ALTER TABLE IF EXISTS public.channels DROP COLUMN IF EXISTS is_read_only;

COMMIT;
