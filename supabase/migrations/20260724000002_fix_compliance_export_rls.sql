DROP POLICY IF EXISTS compliance_exports_select ON public.compliance_exports;

CREATE POLICY compliance_exports_select ON public.compliance_exports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin')
    )
  );
