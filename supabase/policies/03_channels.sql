-- RLS on public.channels:
-- Members see channels in workspaces they belong to (excluding soft-deleted).

create policy "channels_select_member"
  on public.channels for select
  to authenticated
  using (
    deleted_at is null
    and exists (
      select 1 from public.workspace_members
      where workspace_id = channels.workspace_id
      and user_id = auth.uid()
    )
  );

-- Workspace members can create channels.

create policy "channels_insert_member"
  on public.channels for insert
  to authenticated
  with check (
    exists (
      select 1 from public.workspace_members
      where workspace_id = channels.workspace_id
      and user_id = auth.uid()
    )
  );

-- RLS on public.channel_members:
-- Members can see channel membership lists.
create policy "channel_members_select_member"
  on public.channel_members for select
  to authenticated
  using (
    channel_id in (
      select c.id from public.channels c
      join public.workspace_members wm on wm.workspace_id = c.workspace_id
      where wm.user_id = auth.uid()
    )
  );