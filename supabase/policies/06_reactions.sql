-- RLS on public.reactions:
-- Any authenticated user can see reactions.
-- Users can insert/delete their own reactions.

create policy "reactions_select"
  on public.reactions for select
  using (
    exists (
      select 1 from public.messages
      where id = message_id
        and channel_id in (
          select channel_id from public.channel_members
          where user_id = auth.uid()
        )
    )
  );

create policy "reactions_insert_own"
  on public.reactions for insert
  with check (auth.uid() = user_id);

create policy "reactions_delete_own"
  on public.reactions for delete
  using (auth.uid() = user_id);