create table if not exists auto_responders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  message text not null default 'I am currently away.',
  enabled boolean not null default false,
  trigger_status text[] not null default array['away','dnd'],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, workspace_id)
);

alter table auto_responders enable row level security;

create policy "Users can manage their own auto-responders"
  on auto_responders
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
