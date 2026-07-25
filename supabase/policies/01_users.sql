-- RLS: Users can read their own profile.
-- Implicit: users see only their own row.
create policy "users_select_own"
  on public.users for select
  to authenticated
  using (auth.uid() = id);

-- RLS: Users can update their own profile.
create policy "users_update_own"
  on public.users for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- RLS: Only the owning user or a trusted trigger/backend can insert.
-- This prevents users from inserting rows for other users.
create policy "users_insert_own"
  on public.users for insert
  to authenticated
  with check (auth.uid() = id);