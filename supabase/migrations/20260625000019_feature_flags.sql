-- Feature flags table
create table if not exists public.feature_flags (
  key text primary key,
  name text not null,
  description text,
  enabled boolean not null default false,
  rollout_percentage integer not null default 0 check (rollout_percentage >= 0 and rollout_percentage <= 100),
  target_roles text[] not null default '{}',
  target_user_ids text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_feature_flags_enabled
  on public.feature_flags (enabled);

alter table public.feature_flags enable row level security;

-- Only workspace owners/admins can manage feature flags
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

-- Trigger to update updated_at
create trigger feature_flags_updated_at
  before update on public.feature_flags
  for each row
  execute function public.set_updated_at();

-- Seed some initial flags
insert into public.feature_flags (key, name, description, enabled, rollout_percentage)
values
  ('new-thread-ui', 'New Thread UI', 'Enable the redesigned thread view', true, 100),
  ('reactions-v2', 'Reactions v2', 'New reaction picker with categories', false, 50),
  ('dark-mode-auto', 'Auto Dark Mode', 'Automatically switch to dark mode based on system preference', true, 100),
  ('push-notifications', 'Push Notifications', 'Enable browser push notifications', true, 100),
  ('message-editing', 'Message Editing', 'Allow users to edit sent messages', true, 100)
on conflict (key) do nothing;