-- 02_channels.sql
-- Seeds channels for local development

begin;

-- Clean up existing test channels
delete from public.channels where id in ('a1111111-1111-4111-8111-111111111111', 'a2222222-2222-4222-8222-222222222222', 'a3333333-3333-4333-8333-333333333333');

-- Insert test channels
insert into public.channels (id, workspace_id, name, slug, created_by, is_private, created_at, updated_at)
values
('a1111111-1111-4111-8111-111111111111', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'general', 'general', '6adfefa6-27c2-480e-9881-6514f4e9b708', false, '2026-01-15 10:30:00+00', '2026-01-15 10:30:00+00'),
('a2222222-2222-4222-8222-222222222222', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'random', 'random', '6adfefa6-27c2-480e-9881-6514f4e9b708', false, '2026-01-15 10:31:00+00', '2026-01-15 10:31:00+00'),
('a3333333-3333-4333-8333-333333333333', 'f0e1d2c3-b4a5-9678-0fed-cba987654321', 'design-review', 'design-review', '817016dc-cc3b-49d1-8ee6-637f880fa0a4', true, '2026-01-16 10:30:00+00', '2026-01-16 10:30:00+00')
on conflict (id) do update set
  workspace_id = excluded.workspace_id,
  name = excluded.name,
  slug = excluded.slug,
  created_by = excluded.created_by,
  is_private = excluded.is_private,
  updated_at = excluded.updated_at;

commit;