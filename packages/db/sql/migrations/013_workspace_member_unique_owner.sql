-- Add unique constraint on workspace_members.role = 'owner'
-- Run after 002_workspaces.sql

-- Ensure only one owner per workspace
CREATE UNIQUE INDEX IF NOT EXISTS idx_workspace_members_unique_owner
  ON public.workspace_members (workspace_id)
  WHERE role = 'owner';

-- Also add check constraint to ensure role values are valid (already exists in table definition)
-- But we can add a comment for clarity
COMMENT ON COLUMN public.workspace_members.role IS 'Member role: owner, admin, or member. Only one owner per workspace enforced by partial unique index.';