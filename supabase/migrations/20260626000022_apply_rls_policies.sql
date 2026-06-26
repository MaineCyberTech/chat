-- Apply all RLS policies from supabase/policies/
-- These were defined but never migrated

-- Users
do $$ begin
  create policy "users_select_own" on public.users for select to authenticated using (auth.uid() = id);
exception when duplicate_object then null;
end $$;
do $$ begin
  create policy "users_update_own" on public.users for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
exception when duplicate_object then null;
end $$;

-- Workspaces
do $$ begin
  create policy "workspaces_select_member" on public.workspaces for select to authenticated using (
    deleted_at is null and exists (
      select 1 from public.workspace_members where workspace_id = workspaces.id and user_id = auth.uid()
    )
  );
exception when duplicate_object then null;
end $$;

-- Workspace Members
do $$ begin
  create policy "workspace_members_select_own" on public.workspace_members for select to authenticated using (
    workspace_id in (select workspace_id from public.workspace_members where user_id = auth.uid())
  );
exception when duplicate_object then null;
end $$;

-- Channels
do $$ begin
  create policy "channels_select_member" on public.channels for select to authenticated using (
    deleted_at is null and exists (
      select 1 from public.workspace_members where workspace_id = channels.workspace_id and user_id = auth.uid()
    )
  );
exception when duplicate_object then null;
end $$;
do $$ begin
  create policy "channel_members_select_member" on public.channel_members for select to authenticated using (
    channel_id in (select c.id from public.channels c join public.workspace_members wm on wm.workspace_id = c.workspace_id where wm.user_id = auth.uid())
  );
exception when duplicate_object then null;
end $$;

-- Messages
do $$ begin
  create policy "messages_select_member" on public.messages for select to authenticated using (
    deleted_at is null and exists (
      select 1 from public.channels ch join public.workspace_members wm on wm.workspace_id = ch.workspace_id where ch.id = messages.channel_id and wm.user_id = auth.uid()
    )
  );
exception when duplicate_object then null;
end $$;
do $$ begin
  create policy "messages_insert_own" on public.messages for insert to authenticated with check (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;
do $$ begin
  create policy "messages_update_own" on public.messages for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;
do $$ begin
  create policy "messages_delete_own" on public.messages for delete to authenticated using (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;

-- User Preferences
do $$ begin
  create policy "user_preferences_select_own" on public.user_preferences for select using (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;
do $$ begin
  create policy "user_preferences_insert_own" on public.user_preferences for insert with check (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;
do $$ begin
  create policy "user_preferences_update_own" on public.user_preferences for update using (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;

-- Reactions
do $$ begin
  create policy "reactions_select" on public.reactions for select using (true);
exception when duplicate_object then null;
end $$;
do $$ begin
  create policy "reactions_insert_own" on public.reactions for insert with check (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;
do $$ begin
  create policy "reactions_delete_own" on public.reactions for delete using (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;

-- Push Subscriptions
do $$ begin
  create policy "push_subscriptions_select_own" on public.push_subscriptions for select using (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;
do $$ begin
  create policy "push_subscriptions_insert_own" on public.push_subscriptions for insert with check (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;
do $$ begin
  create policy "push_subscriptions_delete_own" on public.push_subscriptions for delete using (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;
do $$ begin
  create policy "push_subscriptions_update_own" on public.push_subscriptions for update using (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;

-- Notifications
do $$ begin
  create policy "notifications_select_own" on public.notifications for select to authenticated using (user_id = auth.uid());
exception when duplicate_object then null;
end $$;
do $$ begin
  create policy "notifications_update_own" on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
exception when duplicate_object then null;
end $$;

-- Webhook Endpoints
do $$ begin
  create policy "webhook_endpoints_select_workspace_member" on public.webhook_endpoints for select to authenticated using (
    exists (select 1 from public.workspace_members where workspace_id = webhook_endpoints.workspace_id and user_id = auth.uid())
  );
exception when duplicate_object then null;
end $$;
do $$ begin
  create policy "webhook_endpoints_manage_workspace_admin" on public.webhook_endpoints for all to authenticated
    using (exists (select 1 from public.workspace_members where workspace_id = webhook_endpoints.workspace_id and user_id = auth.uid() and role in ('owner', 'admin')))
    with check (exists (select 1 from public.workspace_members where workspace_id = webhook_endpoints.workspace_id and user_id = auth.uid() and role in ('owner', 'admin')));
exception when duplicate_object then null;
end $$;

-- Webhook Deliveries
do $$ begin
  create policy "webhook_deliveries_select_workspace_member" on public.webhook_deliveries for select to authenticated using (
    exists (select 1 from public.webhook_endpoints we join public.workspace_members wm on wm.workspace_id = we.workspace_id where we.id = webhook_deliveries.webhook_id and wm.user_id = auth.uid())
  );
exception when duplicate_object then null;
end $$;

-- Webhook Dead Letters
do $$ begin
  create policy "webhook_dead_letters_select_workspace_member" on public.webhook_dead_letters for select to authenticated using (
    exists (select 1 from public.webhook_endpoints we join public.workspace_members wm on wm.workspace_id = we.workspace_id where we.id = webhook_dead_letters.webhook_id and wm.user_id = auth.uid())
  );
exception when duplicate_object then null;
end $$;

-- Audit Logs
do $$ begin
  create policy "audit_logs_select_authenticated" on public.audit_logs for select to authenticated using (
    actor_user_id = auth.uid() or (organization_id is not null and exists (select 1 from public.workspace_members where workspace_id = audit_logs.organization_id and user_id = auth.uid() and role in ('owner', 'admin')))
  );
exception when duplicate_object then null;
end $$;
do $$ begin
  create policy "audit_logs_insert_authenticated" on public.audit_logs for insert to authenticated with check (actor_user_id = auth.uid() and actor_type = 'user');
exception when duplicate_object then null;
end $$;

-- Feature Flags
do $$ begin
  create policy "feature_flags_select_admin" on public.feature_flags for select to authenticated using (
    exists (select 1 from public.workspace_members where user_id = auth.uid() and role in ('owner', 'admin'))
  );
exception when duplicate_object then null;
end $$;
do $$ begin
  create policy "feature_flags_manage_admin" on public.feature_flags for all to authenticated
    using (exists (select 1 from public.workspace_members where user_id = auth.uid() and role in ('owner', 'admin')))
    with check (exists (select 1 from public.workspace_members where user_id = auth.uid() and role in ('owner', 'admin')));
exception when duplicate_object then null;
end $$;