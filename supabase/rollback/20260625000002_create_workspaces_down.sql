-- Rollback for: 20260625000002_create_workspaces.sql
-- Generated on: ...

BEGIN;

DROP TABLE IF EXISTS public.workspaces CASCADE;
DROP TABLE IF EXISTS public.workspace_members CASCADE;
ALTER TABLE public.workspaces DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members DISABLE ROW LEVEL SECURITY;
DROP FUNCTION IF EXISTS public.handle_new_workspace();
DROP TRIGGER IF EXISTS on_workspace_created;
DROP FUNCTION IF EXISTS public.generate_slug(name;
DROP TRIGGER IF EXISTS workspaces_updated_at;
-- Manual rollback needed: UPDATE on ON

COMMIT;
