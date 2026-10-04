-- Rollback for: 20260625000020_auto_create_user_profile.sql
-- Generated on: ...

BEGIN;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user CASCADE;

COMMIT;
