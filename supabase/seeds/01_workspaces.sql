-- 01_workspaces.sql
-- Seeds workspaces for local development

begin;

-- Clean up existing test workspaces
delete from public.workspaces where id in ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'f0e1d2c3-b4a5-9678-0fed-cba987654321');

-- Insert test workspaces
insert into public.workspaces (id, name, slug, owner_id, created_at, updated_at)
values
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Engineering', 'engineering', '6adfefa6-27c2-480e-9881-6514f4e9b708', '2026-01-15 10:00:00+00', '2026-01-15 10:00:00+00'),
('f0e1d2c3-b4a5-9678-0fed-cba987654321', 'Design', 'design', '817016dc-cc3b-49d1-8ee6-637f880fa0a4', '2026-01-16 10:00:00+00', '2026-01-16 10:00:00+00')
on conflict (id) do update set
  name = excluded.name,
  slug = excluded.slug,
  owner_id = excluded.owner_id,
  updated_at = excluded.updated_at;

commit;