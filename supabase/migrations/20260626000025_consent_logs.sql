create table if not exists public.consent_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  consent_type text not null check (consent_type in ('analytics', 'marketing', 'cookies')),
  granted boolean not null default true,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists idx_consent_logs_user_id on public.consent_logs(user_id);

alter table public.consent_logs enable row level security;

create policy if not exists "Users can view own consent"
  on public.consent_logs for select
  using (auth.uid() = user_id);

create policy if not exists "Users can insert own consent"
  on public.consent_logs for insert
  with check (auth.uid() = user_id);
