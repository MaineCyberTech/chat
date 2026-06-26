-- RLS on public.webhook_endpoints:
-- Workspace members can view; admins/owners can manage.

create policy "webhook_endpoints_select_workspace_member"
  on public.webhook_endpoints for select
  to authenticated
  using (
    exists (
      select 1 from public.workspace_members
      where workspace_id = webhook_endpoints.workspace_id
      and user_id = auth.uid()
    )
  );

create policy "webhook_endpoints_manage_workspace_admin"
  on public.webhook_endpoints for all
  to authenticated
  using (
    exists (
      select 1 from public.workspace_members
      where workspace_id = webhook_endpoints.workspace_id
        and user_id = auth.uid()
        and role in ('owner', 'admin')
    )
  )
  with check (
    exists (
      select 1 from public.workspace_members
      where workspace_id = webhook_endpoints.workspace_id
        and user_id = auth.uid()
        and role in ('owner', 'admin')
    )
  );

-- RLS on public.webhook_deliveries:
-- Workspace members can view delivery logs.

create policy "webhook_deliveries_select_workspace_member"
  on public.webhook_deliveries for select
  to authenticated
  using (
    exists (
      select 1 from public.webhook_endpoints we
      join public.workspace_members wm on wm.workspace_id = we.workspace_id
      where we.id = webhook_deliveries.webhook_id
      and wm.user_id = auth.uid()
    )
  );

-- RLS on public.webhook_dead_letters:
-- Workspace members can review dead letters.

create policy "webhook_dead_letters_select_workspace_member"
  on public.webhook_dead_letters for select
  to authenticated
  using (
    exists (
      select 1 from public.webhook_endpoints we
      join public.workspace_members wm on wm.workspace_id = we.workspace_id
      where we.id = webhook_dead_letters.webhook_id
      and wm.user_id = auth.uid()
    )
  );