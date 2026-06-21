-- Audit logging
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid,
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_type text not null default 'user',
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_org_created_at
  on public.audit_logs (organization_id, created_at desc);

create index if not exists idx_audit_logs_actor
  on public.audit_logs (actor_user_id);

alter table public.audit_logs enable row level security;

-- Users can read their own audit log entries
-- Server-side writes use service_role which bypasses RLS
create policy "audit_logs_select_authenticated"
on public.audit_logs for select
to authenticated
using (
  actor_user_id = auth.uid()
);

-- Inserts are handled server-side via service role, but if direct inserts are needed:
create policy "audit_logs_insert_authenticated"
on public.audit_logs for insert
to authenticated
with check (
  actor_user_id = auth.uid()
  and actor_type = 'user'
);