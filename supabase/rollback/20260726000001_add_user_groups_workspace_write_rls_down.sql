-- down
-- Rollback DATA-P2-003: restore the 20260724000006 user_groups write policies.

DROP POLICY IF EXISTS "user_groups_insert" ON public.user_groups;
DROP POLICY IF EXISTS "user_groups_update" ON public.user_groups;
DROP POLICY IF EXISTS "user_groups_delete" ON public.user_groups;

CREATE POLICY "user_groups_insert" ON public.user_groups FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = user_groups.workspace_id
      AND wm.user_id = auth.uid()
      AND wm.role IN ('admin', 'owner')
  ));

CREATE POLICY "user_groups_update" ON public.user_groups FOR UPDATE
  USING (
    user_groups.created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = user_groups.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('admin', 'owner')
    )
  )
  WITH CHECK (
    user_groups.created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = user_groups.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('admin', 'owner')
    )
  );

CREATE POLICY "user_groups_delete" ON public.user_groups FOR DELETE
  USING (
    user_groups.created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = user_groups.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('admin', 'owner')
    )
  );
