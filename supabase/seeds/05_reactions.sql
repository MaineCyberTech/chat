-- 05_reactions.sql
-- Seeds reactions for local development

begin;

-- Clean up existing test reactions
delete from public.reactions where id in 
  ('r1a2c3t4-i5o6-n7-8s9e-reaction123456789',
   'r2a2c3t4-i5o6-n7-8s9e-reaction987654321',
   'r3a2c3t4-i5o6-n7-8s9e-reaction555555555');

-- Insert test reactions
insert into public.reactions (id, message_id, user_id, emoji, created_at)
values
('r1a2c3t4-i5o6-n7-8s9e-reaction123456789', 'm1e2s3s4-a5g6-e7-8s9e-message123456789', '817016dc-cc3b-49d1-8ee6-637f880fa0a4', '👍', '2026-01-15 10:35:30+00'),
('r2a2c3t4-i5o6-n7-8s9e-reaction987654321', 'm1e2s3s4-a5g6-e7-8s9e-message123456789', 'ef0370d6-0da8-43a1-8f24-d8c4f19448a0', '🎉', '2026-01-15 10:35:45+00'),
('r3a2c3t4-i5o6-n7-8s9e-reaction555555555', 'm2e2s3s4-a5g6-e7-8s9e-message987654321', '6adfefa6-27c2-480e-9881-6514f4e9b708', '❤️', '2026-01-15 10:36:15+00')
on conflict (id) do update set
  message_id = excluded.message_id,
  user_id = excluded.user_id,
  emoji = excluded.emoji,
  created_at = excluded.created_at;

commit;