-- Rollback for: 20260625000002_create_workspaces.sql
-- Generated on: ...

BEGIN;

DROP TRIGGER IF EXISTS workspaces_updated_at ON public.workspaces;
DROP FUNCTION IF EXISTS public.generate_slug CASCADE;
DROP TRIGGER IF EXISTS on_workspace_created ON public.workspaces;
DROP FUNCTION IF EXISTS public.handle_new_workspace CASCADE;
ALTER TABLE IF EXISTS public.workspace_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.workspaces DISABLE ROW LEVEL SECURITY;
DROP TABLE IF EXISTS public.workspace_members CASCADE;
DROP TABLE IF EXISTS public.workspaces CASCADE;

COMMIT;
