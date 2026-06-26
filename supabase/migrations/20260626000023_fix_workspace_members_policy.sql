-- Apply RLS policies - fix workspace_members recursion

-- Drop the old recursive policy first
drop policy if exists "workspace_members_select_own" on public.workspace_members;
drop policy if exists "workspace_members_select_own" on public.workspace_members;

-- Create the non-recursive policy
create policy "workspace_members_select_own"
  on public.workspace_members for select
  to authenticated
  using (user_id = auth.uid());