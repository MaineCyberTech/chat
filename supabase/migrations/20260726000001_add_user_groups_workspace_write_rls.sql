-- up
-- DATA-P2-003: constrain user_groups INSERT/UPDATE/DELETE to the group's
-- workspace. The earlier creator-only policies allowed an authenticated user
-- to create/update a group in an arbitrary workspace_id via PostgREST (the
-- permissive policies OR together). This replaces them with policies that
-- require a workspace_members row for the row being written.
--
-- Product decision: any member may create a group they own (matching the API
-- route's membership gate); only the creator or a workspace admin/owner may
-- update/delete it. The 20260724000006 migration had already narrowed INSERT
-- to admins, but UPDATE still trusted created_by alone; both are re-asserted
-- here so future policy edits cannot silently drop the workspace check.

DROP POLICY IF EXISTS "user_groups_insert" ON public.user_groups;
DROP POLICY IF EXISTS "user_groups_update" ON public.user_groups;
DROP POLICY IF EXISTS "user_groups_delete" ON public.user_groups;

CREATE POLICY "user_groups_insert" ON public.user_groups FOR INSERT
  WITH CHECK (
    user_groups.created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = user_groups.workspace_id
        AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "user_groups_update" ON public.user_groups FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = user_groups.workspace_id
        AND wm.user_id = auth.uid()
        AND (
          user_groups.created_by = auth.uid()
          OR wm.role IN ('admin', 'owner')
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = user_groups.workspace_id
        AND wm.user_id = auth.uid()
        AND (
          user_groups.created_by = auth.uid()
          OR wm.role IN ('admin', 'owner')
        )
    )
  );

CREATE POLICY "user_groups_delete" ON public.user_groups FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = user_groups.workspace_id
        AND wm.user_id = auth.uid()
        AND (
          user_groups.created_by = auth.uid()
          OR wm.role IN ('admin', 'owner')
        )
    )
  );
