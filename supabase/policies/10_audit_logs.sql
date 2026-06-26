-- RLS on public.audit_logs:
-- Users can read their own entries.
-- Workspace admins/owners can read audit logs for their workspace.

create policy "audit_logs_select_authenticated"
  on public.audit_logs for select
  to authenticated
  using (
    actor_user_id = auth.uid()
    or (
      organization_id is not null
      and exists (
        select 1 from public.workspace_members
        where workspace_id = audit_logs.organization_id
          and user_id = auth.uid()
          and role in ('owner', 'admin')
      )
    )
  );

create policy "audit_logs_insert_authenticated"
  on public.audit_logs for insert
  to authenticated
  with check (
    actor_user_id = auth.uid()
    and actor_type = 'user'
  );