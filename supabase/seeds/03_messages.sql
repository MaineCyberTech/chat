-- 03_messages.sql
-- Seeds messages for local development

begin;

-- Clean up existing test messages
delete from public.messages where id in 
  ('m1e2s3s4-a5g6-e7-8s9e-message123456789',
   'm2e2s3s4-a5g6-e7-8s9e-message987654321',
   'm3e2s3s4-a5g6-e7-8s9e-message555555555',
   'm4e2s3s4-a5g6-e7-8s9e-message111111111',
   'm5e2s3s4-a5g6-e7-8s9e-message222222222');

-- Insert test messages
insert into public.messages (id, channel_id, user_id, content, parent_id, created_at, updated_at)
values
('m1e2s3s4-a5g6-e7-8s9e-message123456789', 'c1h2a3n4-n5e6-l7-8c9h-annel123456789', '6adfefa6-27c2-480e-9881-6514f4e9b708', 'Welcome to the engineering channel!', null, '2026-01-15 10:35:00+00', '2026-01-15 10:35:00+00'),
('m2e2s3s4-a5g6-e7-8s9e-message987654321', 'c1h2a3n4-n5e6-l7-8c9h-annel123456789', '817016dc-cc3b-49d1-8ee6-637f880fa0a4', 'Thanks! Excited to be here.', null, '2026-01-15 10:36:00+00', '2026-01-15 10:36:00+00'),
('m3e2s3s4-a5g6-e7-8s9e-message555555555', 'c1h2a3n4-n5e6-l7-8c9h-annel123456789', 'ef0370d6-0da8-43a1-8f24-d8c4f19448a0', 'Anyone reviewed the PR #234?', null, '2026-01-15 11:00:00+00', '2026-01-15 11:00:00+00'),
('m4e2s3s4-a5g6-e7-8s9e-message111111111', 'c1h2a3n4-n5e6-l7-8c9h-annel123456789', '6adfefa6-27c2-480e-9881-6514f4e9b708', 'I''m on it now', 'm3e2s3s4-a5g6-e7-8s9e-message555555555', '2026-01-15 11:01:00+00', '2026-01-15 11:01:00+00'),
('m5e2s3s4-a5g6-e7-8s9e-message222222222', 'c2h2a3n4-n5e6-l7-8c9h-annel987654321', 'b0a65dea-16c7-4f54-8192-d9267a4219d1', 'Random thought: we should add dark mode to the dashboard', null, '2026-01-15 14:00:00+00', '2026-01-15 14:00:00+00')
on conflict (id) do update set
  channel_id = excluded.channel_id,
  user_id = excluded.user_id,
  content = excluded.content,
  parent_id = excluded.parent_id,
  updated_at = excluded.updated_at;

commit;