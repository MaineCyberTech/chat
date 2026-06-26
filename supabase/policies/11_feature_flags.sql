-- RLS on public.feature_flags:
-- Only workspace owners/admins can read or manage feature flags.

create policy "feature_flags_select_admin"
  on public.feature_flags for select
  to authenticated
  using (
    exists (
      select 1 from public.workspace_members
      where user_id = auth.uid()
        and role in ('owner', 'admin')
    )
  );

create policy "feature_flags_manage_admin"
  on public.feature_flags for all
  to authenticated
  using (
    exists (
      select 1 from public.workspace_members
      where user_id = auth.uid()
        and role in ('owner', 'admin')
    )
  )
  with check (
    exists (
      select 1 from public.workspace_members
      where user_id = auth.uid()
        and role in ('owner', 'admin')
    )
  );