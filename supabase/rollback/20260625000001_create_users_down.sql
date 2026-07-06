-- Rollback for: 20260625000001_create_users.sql
-- Generated on: ...

BEGIN;

-- Extension "uuid-ossp"; cannot be removed via DROP; skip manual removal if unused
DROP TABLE IF EXISTS public.users CASCADE;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
DROP FUNCTION IF EXISTS public.set_updated_at();
DROP TRIGGER IF EXISTS users_updated_at;
-- Manual rollback needed: UPDATE on ON

COMMIT;
