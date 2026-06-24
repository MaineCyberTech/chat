-- 06_notifications.sql
-- Seeds notifications for local development

begin;

-- Clean up existing test notifications
delete from public.notifications where id in 
  ('n1o2t3i4-f5i6-c7-8a9t-notif123456789',
   'n2o2t3i4-f5i6-c7-8a9t-notif987654321',
   'n3o2t3i4-f5i6-c7-8a9t-notif555555555');

-- Insert test notifications
insert into public.notifications (id, user_id, type, title, message, data, read, created_at)
values
('n1o2t3i4-f5i6-c7-8a9t-notif123456789', 'ef0370d6-0da8-43a1-8f24-d8c4f19448a0', 'reply', 'New reply in #general', 'Alice Johnson replied to your message', '{"channel_id": "c1h2a3n4-n5e6-l7-8c9h-annel123456789", "message_id": "m3e2s3s4-a5g6-e7-8s9e-message555555555"}', false, '2026-01-15 11:05:00+00'),
('n2o2t3i4-f5i6-c7-8a9t-notif987654321', '6adfefa6-27c2-480e-9881-6514f4e9b708', 'mention', 'You were mentioned in #general', 'Bob Smith mentioned you', '{"channel_id": "c1h2a3n4-n5e6-l7-8c9h-annel123456789", "message_id": "m3e2s3s4-a5g6-e7-8s9e-message555555555"}', false, '2026-01-15 11:00:00+00'),
('n3o2t3i4-f5i6-c7-8a9t-notif555555555', '817016dc-cc3b-49d1-8ee6-637f880fa0a4', 'reaction', 'Someone reacted to your message', 'Admin User reacted with 👍', '{"channel_id": "c1h2a3n4-n5e6-l7-8c9h-annel123456789", "message_id": "m1e2s3s4-a5g6-e7-8s9e-message123456789"}', true, '2026-01-15 10:35:30+00')
on conflict (id) do update set
  user_id = excluded.user_id,
  type = excluded.type,
  title = excluded.title,
  message = excluded.message,
  data = excluded.data,
  read = excluded.read,
  created_at = excluded.created_at;

commit;