-- 02_channels.sql
-- Seeds channels for local development

begin;

-- Clean up existing test channels
delete from public.channels where id in ('c1h2a3n4-n5e6-l7-8c9h-annel123456789', 'c2h2a3n4-n5e6-l7-8c9h-annel987654321', 'c3h2a3n4-n5e6-l7-8c9h-annel555555555');

-- Insert test channels
insert into public.channels (id, workspace_id, name, slug, created_by, is_private, created_at, updated_at)
values
('c1h2a3n4-n5e6-l7-8c9h-annel123456789', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'general', 'general', '6adfefa6-27c2-480e-9881-6514f4e9b708', false, '2026-01-15 10:30:00+00', '2026-01-15 10:30:00+00'),
('c2h2a3n4-n5e6-l7-8c9h-annel987654321', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'random', 'random', '6adfefa6-27c2-480e-9881-6514f4e9b708', false, '2026-01-15 10:31:00+00', '2026-01-15 10:31:00+00'),
('c3h2a3n4-n5e6-l7-8c9h-annel555555555', 'f0e1d2c3-b4a5-9678-0fed-cba987654321', 'design-review', 'design-review', '817016dc-cc3b-49d1-8ee6-637f880fa0a4', true, '2026-01-16 10:30:00+00', '2026-01-16 10:30:00+00')
on conflict (id) do update set
  workspace_id = excluded.workspace_id,
  name = excluded.name,
  slug = excluded.slug,
  created_by = excluded.created_by,
  is_private = excluded.is_private,
  updated_at = excluded.updated_at;

commit;