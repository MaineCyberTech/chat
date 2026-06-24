-- Add foreign key constraint to audit_logs.organization_id referencing workspaces
-- Run after 006_user_preferences.sql

-- First, verify that organization_id values reference existing workspaces
-- This will fail if there are orphaned organization_id values
DO $$
DECLARE
  orphaned_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO orphaned_count
  FROM public.audit_logs al
  WHERE al.organization_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.workspaces w WHERE w.id = al.organization_id
    );

  IF orphaned_count > 0 THEN
    RAISE NOTICE 'Found % orphaned organization_id values in audit_logs. These will need to be cleaned up before adding FK.', orphaned_count;
    -- Optionally, set them to NULL or delete them
    -- UPDATE public.audit_logs SET organization_id = NULL WHERE organization_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.workspaces WHERE id = audit_logs.organization_id);
  END IF;
END $$;

-- Add foreign key constraint
ALTER TABLE public.audit_logs
ADD CONSTRAINT audit_logs_organization_id_fkey
FOREIGN KEY (organization_id)
REFERENCES public.workspaces(id)
ON DELETE SET NULL;

-- Also add a comment to clarify the relationship
COMMENT ON COLUMN public.audit_logs.organization_id IS 'References public.workspaces(id) - the workspace this audit event belongs to';

-- Update RLS policy to allow workspace admins/owners to view audit logs
DROP POLICY IF EXISTS "audit_logs_select_authenticated" ON public.audit_logs;
CREATE POLICY "audit_logs_select_authenticated"
ON public.audit_logs FOR SELECT
TO authenticated
USING (
  actor_user_id = auth.uid()
  OR (
    organization_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_id = audit_logs.organization_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  )
);