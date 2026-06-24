-- 04_threads.sql
-- Seeds thread replies for local development

begin;

-- Clean up existing test thread messages (replies)
delete from public.messages where id in 
  ('m6e2s3s4-a5g6-e7-8s9e-thread123456789',
   'm7e2s3s4-a5g6-e7-8s9e-thread987654321');

-- Insert thread replies
insert into public.messages (id, channel_id, user_id, content, parent_id, created_at, updated_at)
values
('m6e2s3s4-a5g6-e7-8s9e-thread123456789', 'c1h2a3n4-n5e6-l7-8c9h-annel123456789', '817016dc-cc3b-49d1-8ee6-637f880fa0a4', 'LGTM, merging now', 'm3e2s3s4-a5g6-e7-8s9e-message555555555', '2026-01-15 11:05:00+00', '2026-01-15 11:05:00+00'),
('m7e2s3s4-a5g6-e7-8s9e-thread987654321', 'c1h2a3n4-n5e6-l7-8c9h-annel123456789', 'ef0370d6-0da8-43a1-8f24-d8c4f19448a0', 'Thanks!', 'm3e2s3s4-a5g6-e7-8s9e-message555555555', '2026-01-15 11:06:00+00', '2026-01-15 11:06:00+00')
on conflict (id) do update set
  channel_id = excluded.channel_id,
  user_id = excluded.user_id,
  content = excluded.content,
  parent_id = excluded.parent_id,
  updated_at = excluded.updated_at;

commit;