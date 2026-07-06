-- Rollback for: 20260627000009_add_optimistic_locking.sql
-- Generated on: ...

BEGIN;

DROP FUNCTION IF EXISTS public.increment_version();
DROP TRIGGER IF EXISTS messages_version;
-- Manual rollback needed: UPDATE on ON
DROP TRIGGER IF EXISTS channels_version;
-- Manual rollback needed: UPDATE on ON

COMMIT;
