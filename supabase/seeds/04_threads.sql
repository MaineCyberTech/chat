-- 04_threads.sql
-- Seeds thread replies for local development

begin;

-- Clean up existing test thread messages (replies)
delete from public.messages where id in 
  ('b6666666-6666-4666-8666-666666666666',
   'b7777777-7777-4777-8777-777777777777');

-- Insert thread replies
insert into public.messages (id, channel_id, user_id, content, parent_id, created_at)
values
('b6666666-6666-4666-8666-666666666666', 'a1111111-1111-4111-8111-111111111111', '817016dc-cc3b-49d1-8ee6-637f880fa0a4', 'LGTM, merging now', 'b3333333-3333-4333-8333-333333333333', '2026-01-15 11:05:00+00'),
('b7777777-7777-4777-8777-777777777777', 'a1111111-1111-4111-8111-111111111111', 'ef0370d6-0da8-43a1-8f24-d8c4f19448a0', 'Thanks!', 'b3333333-3333-4333-8333-333333333333', '2026-01-15 11:06:00+00')
on conflict (id) do update set
  channel_id = excluded.channel_id,
  user_id = excluded.user_id,
  content = excluded.content,
  parent_id = excluded.parent_id;

commit;
