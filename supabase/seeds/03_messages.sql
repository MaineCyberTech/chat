-- 03_messages.sql
-- Seeds messages for local development

begin;

-- Clean up existing test messages
delete from public.messages where id in 
  ('b1111111-1111-4111-8111-111111111111',
   'b2222222-2222-4222-8222-222222222222',
   'b3333333-3333-4333-8333-333333333333',
   'b4444444-4444-4444-8444-444444444444',
   'b5555555-5555-4555-8555-555555555555');

-- Insert test messages
insert into public.messages (id, channel_id, user_id, content, parent_id, created_at)
values
('b1111111-1111-4111-8111-111111111111', 'a1111111-1111-4111-8111-111111111111', '6adfefa6-27c2-480e-9881-6514f4e9b708', 'Welcome to the engineering channel!', null, '2026-01-15 10:35:00+00'),
('b2222222-2222-4222-8222-222222222222', 'a1111111-1111-4111-8111-111111111111', '817016dc-cc3b-49d1-8ee6-637f880fa0a4', 'Thanks! Excited to be here.', null, '2026-01-15 10:36:00+00'),
('b3333333-3333-4333-8333-333333333333', 'a1111111-1111-4111-8111-111111111111', 'ef0370d6-0da8-43a1-8f24-d8c4f19448a0', 'Anyone reviewed the PR #234?', null, '2026-01-15 11:00:00+00'),
('b4444444-4444-4444-8444-444444444444', 'a1111111-1111-4111-8111-111111111111', '6adfefa6-27c2-480e-9881-6514f4e9b708', 'I''m on it now', 'b3333333-3333-4333-8333-333333333333', '2026-01-15 11:01:00+00'),
('b5555555-5555-4555-8555-555555555555', 'a2222222-2222-4222-8222-222222222222', 'b0a65dea-16c7-4f54-8192-d9267a4219d1', 'Random thought: we should add dark mode to the dashboard', null, '2026-01-15 14:00:00+00')
on conflict (id) do update set
  channel_id = excluded.channel_id,
  user_id = excluded.user_id,
  content = excluded.content,
  parent_id = excluded.parent_id;

commit;