-- Fix workspace_members RLS: allow members to see other members in same workspace
-- Current policy (user_id = auth.uid()) only lets users see their own row

CREATE OR REPLACE FUNCTION public.get_user_workspace_ids()
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid();
$$;

DROP POLICY IF EXISTS "workspace_members_select_own" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members_select" ON public.workspace_members;

CREATE POLICY "workspace_members_select" ON public.workspace_members
  FOR SELECT TO authenticated
  USING (workspace_id IN (SELECT public.get_user_workspace_ids()));
