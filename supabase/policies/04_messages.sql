-- RLS on public.messages:
-- Members see messages in channels they can access (excluding soft-deleted).

create policy "messages_select_member"
  on public.messages for select
  to authenticated
  using (
    deleted_at is null
    and exists (
      select 1 from public.channels ch
      join public.workspace_members wm on wm.workspace_id = ch.workspace_id
      where ch.id = messages.channel_id
      and wm.user_id = auth.uid()
    )
  );

create policy "messages_insert_own"
  on public.messages for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "messages_update_own"
  on public.messages for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "messages_delete_own"
  on public.messages for delete
  to authenticated
  using (auth.uid() = user_id);