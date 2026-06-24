-- 07_webhooks.sql
-- Seeds webhooks for local development

begin;

-- Clean up existing test webhooks
delete from public.webhook_endpoints where id in 
  ('w1e2b3h4-o5o6-k7-8s9e-webhook123456789',
   'w2e2b3h4-o5o6-k7-8s9e-webhook987654321');

-- Insert test webhooks
insert into public.webhook_endpoints (id, workspace_id, name, url, secret, events, is_active, created_by, created_at, updated_at)
values
('w1e2b3h4-o5o6-k7-8s9e-webhook123456789', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Deploy Notifications', 'https://hooks.example.com/deploy', 'webhook-secret-deploy-123', '{"message_created","message_updated","channel_created"}', true, '6adfefa6-27c2-480e-9881-6514f4e9b708', '2026-01-20 10:00:00+00', '2026-01-20 10:00:00+00'),
('w2e2b3h4-o5o6-k7-8s9e-webhook987654321', 'f0e1d2c3-b4a5-9678-0fed-cba987654321', 'Design Updates', 'https://hooks.example.com/design', 'webhook-secret-design-456', '{"message_created","reaction_added"}', true, '817016dc-cc3b-49d1-8ee6-637f880fa0a4', '2026-01-21 10:00:00+00', '2026-01-21 10:00:00+00')
on conflict (id) do update set
  workspace_id = excluded.workspace_id,
  name = excluded.name,
  url = excluded.url,
  secret = excluded.secret,
  events = excluded.events,
  is_active = excluded.is_active,
  created_by = excluded.created_by,
  updated_at = excluded.updated_at;

commit;