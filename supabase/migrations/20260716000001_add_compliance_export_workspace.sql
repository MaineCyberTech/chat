ALTER TABLE public.compliance_exports ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_compliance_exports_workspace ON public.compliance_exports(workspace_id);

DROP POLICY IF EXISTS compliance_exports_select ON public.compliance_exports;

CREATE POLICY compliance_exports_select ON public.compliance_exports
  FOR SELECT USING (
    workspace_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = compliance_exports.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin')
    )
  );
