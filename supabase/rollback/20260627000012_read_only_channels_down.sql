-- Rollback for: 20260627000012_read_only_channels.sql
-- Generated on: ...

BEGIN;

DROP FUNCTION IF EXISTS public.prevent_read_only_message();
DROP TRIGGER IF EXISTS check_read_only_on_insert;

COMMIT;
