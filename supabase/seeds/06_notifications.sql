-- 06_notifications.sql
-- Seeds notifications for local development

begin;

-- Clean up existing test notifications
delete from public.notifications where id in 
  ('d1111111-1111-4111-8111-111111111111',
   'd2222222-2222-4222-8222-222222222222',
   'd3333333-3333-4333-8333-333333333333');

-- Insert test notifications
insert into public.notifications (id, user_id, workspace_id, type, title, body, link, read, created_at)
values
('d1111111-1111-4111-8111-111111111111', 'ef0370d6-0da8-43a1-8f24-d8c4f19448a0', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'reply', 'New reply in #general', 'Alice Johnson replied to your message', '/workspaces/engineering/channels/a1111111-1111-4111-8111-111111111111', false, '2026-01-15 11:05:00+00'),
('d2222222-2222-4222-8222-222222222222', '6adfefa6-27c2-480e-9881-6514f4e9b708', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'mention', 'You were mentioned in #general', 'Bob Smith mentioned you', '/workspaces/engineering/channels/a1111111-1111-4111-8111-111111111111', false, '2026-01-15 11:00:00+00'),
('d3333333-3333-4333-8333-333333333333', '817016dc-cc3b-49d1-8ee6-637f880fa0a4', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'reaction', 'Someone reacted to your message', 'Admin User reacted with 👍', '/workspaces/engineering/channels/a1111111-1111-4111-8111-111111111111', true, '2026-01-15 10:35:30+00')
on conflict (id) do update set
  user_id = excluded.user_id,
  workspace_id = excluded.workspace_id,
  type = excluded.type,
  title = excluded.title,
  body = excluded.body,
  link = excluded.link,
  read = excluded.read,
  created_at = excluded.created_at;

commit;