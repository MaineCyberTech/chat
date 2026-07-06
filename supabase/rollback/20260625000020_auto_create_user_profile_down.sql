-- Rollback for: 20260625000020_auto_create_user_profile.sql
-- Generated on: ...

BEGIN;

DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TRIGGER IF EXISTS on_auth_user_created;

COMMIT;
