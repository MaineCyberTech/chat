-- Add foreign key constraint to audit_logs.organization_id referencing workspaces
-- Run after 006_user_preferences.sql
-- NOTE: The FK is already defined inline in 010_create_audit_logs.sql.
-- This migration only adds it if somehow missing.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'audit_logs_organization_id_fkey'
      AND conrelid = 'public.audit_logs'::regclass
  ) THEN
    ALTER TABLE public.audit_logs
    ADD CONSTRAINT audit_logs_organization_id_fkey
    FOREIGN KEY (organization_id)
    REFERENCES public.workspaces(id)
    ON DELETE SET NULL;
  END IF;
END $$;

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
