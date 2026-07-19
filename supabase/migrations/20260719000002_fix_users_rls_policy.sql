-- Fix users RLS: allow seeing other users who share a workspace
-- Policy "users_select_own" (auth.uid() = id) prevents the users!inner JOIN
-- in workspace/channel member queries from returning other members' profiles.

DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_select" ON public.users;

CREATE POLICY "users_select" ON public.users
  FOR SELECT TO authenticated
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.user_id = users.id
        AND wm.workspace_id IN (SELECT public.get_user_workspace_ids())
    )
  );
