-- Rollback for: 20260625000001_create_users.sql
-- Generated on: ...

BEGIN;

DROP TRIGGER IF EXISTS users_updated_at ON public.users;
DROP FUNCTION IF EXISTS public.set_updated_at CASCADE;
ALTER TABLE IF EXISTS public.users DISABLE ROW LEVEL SECURITY;
DROP TABLE IF EXISTS public.users CASCADE;
-- Extension "uuid-ossp"; cannot be removed via DROP; skip manual removal if unused

COMMIT;
