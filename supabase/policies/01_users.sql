-- RLS: Users can read their own profile and profiles of co-members in shared workspaces.
create policy "users_select"
  on public.users for select
  to authenticated
  using (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM public.workspace_members wm1
      JOIN public.workspace_members wm2 ON wm1.workspace_id = wm2.workspace_id
      WHERE wm1.user_id = auth.uid() AND wm2.user_id = users.id
    )
  );

-- RLS: Users can update their own profile.
create policy "users_update_own"
  on public.users for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- RLS: Only the owning user or a trusted trigger/backend can insert.
create policy "users_insert_own"
  on public.users for insert
  to authenticated
  with check (auth.uid() = id);