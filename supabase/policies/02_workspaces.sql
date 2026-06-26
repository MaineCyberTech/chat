-- RLS on public.workspaces:
-- Members see workspaces they belong to (excluding soft-deleted).

create policy "workspaces_select_member"
  on public.workspaces for select
  to authenticated
  using (
    deleted_at is null
    and exists (
      select 1 from public.workspace_members
      where workspace_id = workspaces.id
      and user_id = auth.uid()
    )
  );

-- RLS on public.workspace_members:
-- Members can see who else is in the workspace.
create policy "workspace_members_select_own"
  on public.workspace_members for select
  to authenticated
  using (
    workspace_id in (
      select workspace_id from public.workspace_members
      where user_id = auth.uid()
    )
  );