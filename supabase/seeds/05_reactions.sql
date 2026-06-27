-- 05_reactions.sql
-- Seeds reactions for local development

begin;

-- Clean up existing test reactions
delete from public.reactions where id in 
  ('c1111111-1111-4111-8111-111111111111',
   'c2222222-2222-4222-8222-222222222222',
   'c3333333-3333-4333-8333-333333333333');

-- Insert test reactions
insert into public.reactions (id, message_id, user_id, emoji, created_at)
values
('c1111111-1111-4111-8111-111111111111', 'b1111111-1111-4111-8111-111111111111', '817016dc-cc3b-49d1-8ee6-637f880fa0a4', '👍', '2026-01-15 10:35:30+00'),
('c2222222-2222-4222-8222-222222222222', 'b1111111-1111-4111-8111-111111111111', 'ef0370d6-0da8-43a1-8f24-d8c4f19448a0', '🎉', '2026-01-15 10:35:45+00'),
('c3333333-3333-4333-8333-333333333333', 'b2222222-2222-4222-8222-222222222222', '6adfefa6-27c2-480e-9881-6514f4e9b708', '❤️', '2026-01-15 10:36:15+00')
on conflict (id) do update set
  message_id = excluded.message_id,
  user_id = excluded.user_id,
  emoji = excluded.emoji,
  created_at = excluded.created_at;

commit;