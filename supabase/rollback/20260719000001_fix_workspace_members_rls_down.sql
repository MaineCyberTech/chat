DROP FUNCTION IF EXISTS public.get_user_workspace_ids() CASCADE;
DROP POLICY IF EXISTS "workspace_members_select" ON public.workspace_members;
CREATE POLICY "workspace_members_select_own" ON public.workspace_members FOR SELECT TO authenticated USING (user_id = auth.uid());
