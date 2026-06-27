-- Add INSERT policy for channels (workspace members can create channels)
do $$ begin
  create policy "channels_insert_member" on public.channels for insert to authenticated with check (
    exists (select 1 from public.workspace_members where workspace_id = channels.workspace_id and user_id = auth.uid())
  );
exception when duplicate_object then null;
end $$;