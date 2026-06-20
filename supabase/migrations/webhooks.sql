-- Webhook management
create table if not exists public.webhook_endpoints (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  url text not null,
  secret text,
  events text[] not null default '{}',
  is_active boolean not null default true,
  last_success_at timestamptz,
  last_failure_at timestamptz,
  last_error text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_webhook_endpoints_workspace
  on public.webhook_endpoints (workspace_id);

alter table public.webhook_endpoints enable row level security;

create policy "webhook_endpoints_select_workspace_member"
on public.webhook_endpoints for select
to authenticated
using (
  exists (
    select 1 from public.workspace_members
    where workspace_id = webhook_endpoints.workspace_id
    and user_id = auth.uid()
  )
);

create policy "webhook_endpoints_manage_workspace_member"
on public.webhook_endpoints for all
to authenticated
using (
  exists (
    select 1 from public.workspace_members
    where workspace_id = webhook_endpoints.workspace_id
    and user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.workspace_members
    where workspace_id = webhook_endpoints.workspace_id
    and user_id = auth.uid()
  )
);

-- Webhook delivery log
create table if not exists public.webhook_deliveries (
  id uuid primary key default gen_random_uuid(),
  webhook_id uuid not null references public.webhook_endpoints(id) on delete cascade,
  event text not null,
  status text not null,
  request_body jsonb,
  response_status int,
  response_body text,
  error text,
  duration_ms int,
  created_at timestamptz not null default now()
);

create index if not exists idx_webhook_deliveries_webhook
  on public.webhook_deliveries (webhook_id, created_at desc);

alter table public.webhook_deliveries enable row level security;

create policy "webhook_deliveries_select_workspace_member"
on public.webhook_deliveries for select
to authenticated
using (
  exists (
    select 1 from public.webhook_endpoints we
    join public.workspace_members wm on wm.workspace_id = we.workspace_id
    where we.id = webhook_deliveries.webhook_id
    and wm.user_id = auth.uid()
  )
);