-- 04_comprehensive_features.sql
-- Notifications, webhooks, audit logs, compliance exports, feature flags.

begin;

-- Cleanup
DELETE FROM public.webhook_deliveries WHERE webhook_id IN (
  SELECT id FROM public.webhook_endpoints WHERE workspace_id IN (
    'b0000001-0000-4000-8000-000000000001','b0000002-0000-4000-8000-000000000002','b0000003-0000-4000-8000-000000000003'
  )
);
DELETE FROM public.webhook_dead_letters WHERE webhook_id IN (
  SELECT id FROM public.webhook_endpoints WHERE workspace_id IN (
    'b0000001-0000-4000-8000-000000000001','b0000002-0000-4000-8000-000000000002','b0000003-0000-4000-8000-000000000003'
  )
);
DELETE FROM public.webhook_endpoints WHERE workspace_id IN (
  'b0000001-0000-4000-8000-000000000001','b0000002-0000-4000-8000-000000000002','b0000003-0000-4000-8000-000000000003'
);
DELETE FROM public.compliance_exports WHERE workspace_id IN (
  'b0000001-0000-4000-8000-000000000001','b0000002-0000-4000-8000-000000000002','b0000003-0000-4000-8000-000000000003'
);
DELETE FROM public.audit_logs WHERE organization_id IN (
  'b0000001-0000-4000-8000-000000000001','b0000002-0000-4000-8000-000000000002','b0000003-0000-4000-8000-000000000003'
);
DELETE FROM public.notifications WHERE user_id IN (
  SELECT id FROM public.users WHERE email LIKE '%@seed.test'
);
DELETE FROM public.push_subscriptions WHERE user_id IN (
  SELECT id FROM public.users WHERE email LIKE '%@seed.test'
);

-- ======================================================================
-- NOTIFICATIONS (varied types, read/unread mix)
-- ======================================================================
INSERT INTO public.notifications (user_id, workspace_id, type, title, body, link, read, created_at)
VALUES
-- Marcus notifications (workspace owner - gets lots of notifications)
('a0000001-0000-4000-8000-000000000001', 'b0000001-0000-4000-8000-000000000001', 'mention',
 'You were mentioned in #engineering', 'Liam O''Brien mentioned you: "@marcus can you review?"',
 '/workspaces/acme-corp/channels/c0000002-0000-4000-8000-000000000002', false, '2025-08-15 10:30:00+00'),
('a0000001-0000-4000-8000-000000000001', 'b0000001-0000-4000-8000-000000000001', 'reply',
 'New reply in #engineering', 'Elena Volkov replied to your message about database migration',
 '/workspaces/acme-corp/channels/c0000002-0000-4000-8000-000000000002', true, '2025-07-20 11:30:00+00'),
('a0000001-0000-4000-8000-000000000001', 'b0000001-0000-4000-8000-000000000001', 'reaction',
 'Someone reacted to your message', 'Jake Morrison reacted with 👍 to your sprint planning message',
 '/workspaces/acme-corp/channels/c0000002-0000-4000-8000-000000000002', true, '2025-09-01 09:10:00+00'),
('a0000001-0000-4000-8000-000000000001', 'b0000001-0000-4000-8000-000000000001', 'channel_created',
 'New channel created', 'Aisha Johnson created #design in Acme Corp',
 '/workspaces/acme-corp/channels/c0000005-0000-4000-8000-000000000005', false, '2025-08-10 09:31:00+00'),
('a0000001-0000-4000-8000-000000000001', 'b0000001-0000-4000-8000-000000000001', 'member_joined',
 'New member in #project-alpha', 'Priya Sharma joined #project-alpha',
 '/workspaces/acme-corp/channels/c0000008-0000-4000-8000-000000000008', false, '2025-09-01 09:10:00+00'),

-- Sarah notifications
('a0000002-0000-4000-8000-000000000002', 'b0000003-0000-4000-8000-000000000003', 'mention',
 'You were mentioned in #general', 'Aisha Johnson mentioned you about the design system launch',
 '/workspaces/designhub/channels/c0000014-0000-4000-8000-000000000014', false, '2025-10-15 10:05:00+00'),
('a0000002-0000-4000-8000-000000000002', 'b0000001-0000-4000-8000-000000000001', 'reply',
 'New reply in #product', 'Marcus Chen replied to your user research findings',
 '/workspaces/acme-corp/channels/c0000003-0000-4000-8000-000000000003', true, '2025-07-25 10:00:00+00'),

-- Jake notifications
('a0000003-0000-4000-8000-000000000003', 'b0000001-0000-4000-8000-000000000001', 'review_requested',
 'Review requested', 'Liam O''Brien requested your review on PR #42',
 '/workspaces/acme-corp/channels/c0000002-0000-4000-8000-000000000002', false, '2025-08-15 10:00:00+00'),

-- Elena notifications
('a0000004-0000-4000-8000-000000000004', 'b0000001-0000-4000-8000-000000000001', 'mention',
 'You were mentioned in #project-alpha', 'Marcus Chen mentioned you about the architecture proposal',
 '/workspaces/acme-corp/channels/c0000008-0000-4000-8000-000000000008', true, '2025-09-02 10:05:00+00'),

-- Priya notifications
('a0000006-0000-4000-8000-000000000006', 'b0000001-0000-4000-8000-000000000001', 'mention',
 'You were mentioned in #engineering', 'Marcus Chen assigned you a QA ticket',
 '/workspaces/acme-corp/channels/c0000002-0000-4000-8000-000000000002', true, '2025-09-20 14:05:00+00'),

-- Carlos notifications
('a0000007-0000-4000-8000-000000000007', 'b0000002-0000-4000-8000-000000000002', 'alert',
 'Infrastructure alert', 'CPU usage exceeded 80% on production server',
 '/workspaces/techstart/channels/c0000010-0000-4000-8000-000000000010', false, '2025-10-20 01:55:00+00'),

-- Tom notifications (new user - fewer notifications)
('a0000015-0000-4000-8000-000000000015', 'b0000002-0000-4000-8000-000000000002', 'welcome',
 'Welcome to TechStart!', 'You have been added to 3 channels. Check out #general to introduce yourself!',
 '/workspaces/techstart/channels/c0000009-0000-4000-8000-000000000009', true, '2025-10-01 09:01:00+00'),
('a0000015-0000-4000-8000-000000000015', 'b0000002-0000-4000-8000-000000000002', 'mention',
 'You were mentioned in #random', 'Raj Gupta mentioned you: "Welcome @tom!"',
 '/workspaces/techstart/channels/c0000009-0000-4000-8000-000000000009', true, '2025-10-01 09:10:00+00'),

-- Tyler notifications
('a0000005-0000-4000-8000-000000000005', 'b0000001-0000-4000-8000-000000000001', 'reply',
 'New reply in #design', 'Aisha Johnson replied to your dark mode question',
 '/workspaces/acme-corp/channels/c0000005-0000-4000-8000-000000000005', true, '2025-08-10 11:30:00+00'),
('a0000005-0000-4000-8000-000000000005', 'b0000003-0000-4000-8000-000000000003', 'mention',
 'You were mentioned in #design-reviews', 'Aisha Johnson tagged you for tablet sidebar review',
 '/workspaces/designhub/channels/c0000015-0000-4000-8000-000000000015', false, '2025-09-02 09:05:00+00'),

-- Liam notifications
('a0000009-0000-4000-8000-000000000009', 'b0000001-0000-4000-8000-000000000001', 'review_requested',
 'PR review requested', 'Marcus Chen requested your review on the CI/CD pipeline PR',
 '/workspaces/acme-corp/channels/c0000002-0000-4000-8000-000000000002', true, '2025-08-15 10:35:00+00'),

-- Dmitri notifications
('a0000011-0000-4000-8000-000000000011', 'b0000001-0000-4000-8000-000000000001', 'mention',
 'You were mentioned in #engineering', 'Marcus Chen assigned you a security tracking issue',
 '/workspaces/acme-corp/channels/c0000002-0000-4000-8000-000000000002', false, '2025-09-10 10:05:00+00'),

-- Nkechi notifications
('a0000012-0000-4000-8000-000000000012', 'b0000001-0000-4000-8000-000000000001', 'reply',
 'New reply in DM', 'Marcus Chen replied about the partnership call',
 '/workspaces/acme-corp/channels/d0000001-0000-4000-8000-000000000001', true, '2025-07-20 10:20:00+00'),
('a0000012-0000-4000-8000-000000000012', 'b0000002-0000-4000-8000-000000000002', 'channel_created',
 'New channel in TechStart', 'Raj Gupta created #standup channel',
 '/workspaces/techstart/channels/c0000011-0000-4000-8000-000000000011', true, '2025-08-01 09:00:00+00'),

-- Raj notifications
('a0000013-0000-4000-8000-000000000013', 'b0000002-0000-4000-8000-000000000002', 'reply',
 'Reply in #devops', 'Carlos Rivera added details about the monitoring stack',
 '/workspaces/techstart/channels/c0000010-0000-4000-8000-000000000010', false, '2025-09-15 10:10:00+00'),

-- Aisha notifications
('a0000008-0000-4000-8000-000000000008', 'b0000003-0000-4000-8000-000000000003', 'reply',
 'Reply in #design-reviews', 'Tyler Kim commented on the dashboard mockup',
 '/workspaces/designhub/channels/c0000015-0000-4000-8000-000000000015', true, '2025-09-02 09:00:00+00'),
('a0000008-0000-4000-8000-000000000008', 'b0000001-0000-4000-8000-000000000001', 'member_joined',
 'New member in #design', 'Priya Sharma joined the design channel',
 '/workspaces/acme-corp/channels/c0000005-0000-4000-8000-000000000005', true, '2025-09-01 09:10:00+00'),

-- Carlos notifications
('a0000007-0000-4000-8000-000000000007', 'b0000002-0000-4000-8000-000000000002', 'mention',
 'You were mentioned in #devops', 'Raj Gupta mentioned you about PagerDuty integration',
 '/workspaces/techstart/channels/c0000010-0000-4000-8000-000000000010', false, '2025-09-15 10:15:00+00'),

-- Super Admin notifications (cross-workspace)
('a0000016-0000-4000-8000-000000000016', 'b0000001-0000-4000-8000-000000000001', 'alert',
 'Security scan complete', 'Platform security scan completed for Acme Corp — 0 critical findings',
 '/workspaces/acme-corp/channels/c0000002-0000-4000-8000-000000000002', false, '2026-01-10 09:05:00+00'),
('a0000016-0000-4000-8000-000000000016', 'b0000002-0000-4000-8000-000000000002', 'member_joined',
 'New member in TechStart', 'Tom Nguyen joined as intern',
 '/workspaces/techstart/channels/c0000009-0000-4000-8000-000000000009', true, '2025-10-01 09:05:00+00'),
 ('a0000016-0000-4000-8000-000000000016', 'b0000003-0000-4000-8000-000000000003', 'reply',
  'New reply in #design', 'Aisha Johnson replied to your workspace review',
  '/workspaces/designhub/channels/c0000014-0000-4000-8000-000000000014', false, '2026-01-08 14:00:00+00'),

-- Olivia notifications (Staff Engineer, Acme Corp - joined Feb 2026)
('a0000017-0000-4000-8000-000000000017', 'b0000001-0000-4000-8000-000000000001', 'welcome',
 'Welcome to Acme Corp!', 'You have been added to Acme Corp. Check out #general to get started!',
 '/workspaces/acme-corp/channels/c0000001-0000-4000-8000-000000000001', true, '2026-02-01 09:01:00+00'),
('a0000017-0000-4000-8000-000000000017', 'b0000001-0000-4000-8000-000000000001', 'mention',
 'You were mentioned in #security', 'Alex Admin assigned you the Q4 security review',
 '/workspaces/acme-corp/channels/c0000016-0000-4000-8000-000000000016', false, '2026-02-12 14:00:00+00'),
('a0000017-0000-4000-8000-000000000017', 'b0000001-0000-4000-8000-000000000001', 'reply',
 'New reply in #engineering', 'Liam O''Brien replied to your WebSocket heartbeat proposal',
 '/workspaces/acme-corp/channels/c0000002-0000-4000-8000-000000000002', true, '2026-02-05 14:30:00+00'),
('a0000017-0000-4000-8000-000000000017', 'b0000001-0000-4000-8000-000000000001', 'alert',
 'Security scan complete', 'Q4 security review completed — 1 medium finding in auth module',
 '/workspaces/acme-corp/channels/c0000016-0000-4000-8000-000000000016', true, '2026-02-20 09:05:00+00'),

-- Jamal notifications (Intern, TechStart - joined Mar 2026)
('a0000018-0000-4000-8000-000000000018', 'b0000002-0000-4000-8000-000000000002', 'welcome',
 'Welcome to TechStart!', 'You have been added to the engineering channel. Welcome aboard!',
 '/workspaces/techstart/channels/c0000009-0000-4000-8000-000000000009', true, '2026-03-01 09:01:00+00'),
('a0000018-0000-4000-8000-000000000018', 'b0000002-0000-4000-8000-000000000002', 'mention',
 'You were mentioned in #standup', 'Carlos Rivera mentioned you about the CSV parser fix',
 '/workspaces/techstart/channels/c0000011-0000-4000-8000-000000000011', true, '2026-03-05 09:10:00+00'),
('a0000018-0000-4000-8000-000000000018', 'b0000002-0000-4000-8000-000000000002', 'reply',
 'New reply in #standup', 'Raj Gupta replied to your CSV parser improvement',
 '/workspaces/techstart/channels/c0000011-0000-4000-8000-000000000011', true, '2026-03-05 09:30:00+00'),

-- Chen notifications (Product Manager, DesignHub - joined Jan 2026)
('a0000019-0000-4000-8000-000000000019', 'b0000003-0000-4000-8000-000000000003', 'welcome',
 'Welcome to DesignHub!', 'You have been added to the product channel. Looking forward to working with you!',
 '/workspaces/designhub/channels/c0000014-0000-4000-8000-000000000014', true, '2026-01-01 09:01:00+00'),
('a0000019-0000-4000-8000-000000000019', 'b0000003-0000-4000-8000-000000000003', 'mention',
 'You were mentioned in #product', 'Sarah Patel mentioned you about Q4 roadmap',
 '/workspaces/designhub/channels/c0000014-0000-4000-8000-000000000014', false, '2026-05-03 09:05:00+00'),
('a0000019-0000-4000-8000-000000000019', 'b0000003-0000-4000-8000-000000000003', 'reply',
 'New reply in #product', 'Tyler Kim replied to your Q4 planning doc',
 '/workspaces/designhub/channels/c0000014-0000-4000-8000-000000000014', true, '2026-05-03 09:20:00+00'),

-- Sofia notifications (Designer, Acme Corp - joined Apr 2026)
('a0000020-0000-4000-8000-000000000020', 'b0000001-0000-4000-8000-000000000001', 'welcome',
 'Welcome to Acme Corp!', 'Welcome to the team! Check out #design for design discussions.',
 '/workspaces/acme-corp/channels/c0000005-0000-4000-8000-000000000005', true, '2026-04-01 09:01:00+00'),
('a0000020-0000-4000-8000-000000000020', 'b0000001-0000-4000-8000-000000000001', 'mention',
 'You were mentioned in #design', 'Aisha Johnson tagged you for accessibility review',
 '/workspaces/acme-corp/channels/c0000005-0000-4000-8000-000000000005', false, '2026-04-20 14:00:00+00'),
('a0000020-0000-4000-8000-000000000020', 'b0000001-0000-4000-8000-000000000001', 'reply',
 'New reply in #design', 'Tyler Kim replied to your dark mode implementation plan',
 '/workspaces/acme-corp/channels/c0000005-0000-4000-8000-000000000005', true, '2026-05-25 14:30:00+00'),

-- Ethan notifications (Sales Engineer, TechStart - joined May 2026)
('a0000021-0000-4000-8000-000000000021', 'b0000002-0000-4000-8000-000000000002', 'welcome',
 'Welcome to TechStart!', 'Welcome to the team! You have been added to #sales channel.',
 '/workspaces/techstart/channels/c0000011-0000-4000-8000-000000000011', true, '2026-05-01 09:01:00+00'),
('a0000021-0000-4000-8000-000000000021', 'b0000002-0000-4000-8000-000000000002', 'mention',
 'You were mentioned in #sales', 'Nkechi Okonkwo mentioned you about the enterprise deal',
 '/workspaces/techstart/channels/c0000011-0000-4000-8000-000000000011', false, '2026-06-16 10:00:00+00'),
('a0000021-0000-4000-8000-000000000021', 'b0000002-0000-4000-8000-000000000002', 'reply',
 'New reply in #sales', 'Raj Gupta congratulated you on the $250K deal',
 '/workspaces/techstart/channels/c0000011-0000-4000-8000-000000000011', true, '2026-06-18 16:05:00+00')
ON CONFLICT DO NOTHING;

-- ======================================================================
-- WEBHOOKS (4 endpoints with delivery history)
-- ======================================================================
INSERT INTO public.webhook_endpoints (id, workspace_id, name, url, secret, events, is_active, created_by, last_success_at, created_at, updated_at)
VALUES
('e0000001-0000-4000-8000-000000000001', 'b0000001-0000-4000-8000-000000000001',
 'Slack Notifications', 'https://hooks.slack.com/services/T00/B00/xxx', 'whsec_abc123def456',
 ARRAY['message_created','message_updated']::text[], true,
 'a0000001-0000-4000-8000-000000000001', '2026-01-18 08:00:00+00',
 '2025-08-01 10:00:00+00', '2026-01-18 08:00:00+00'),
('e0000002-0000-4000-8000-000000000002', 'b0000001-0000-4000-8000-000000000001',
 'CI/CD Trigger', 'https://ci.example.com/api/webhook', 'whsec_ci_trigger_789',
 ARRAY['channel_created','member_joined']::text[], true,
 'a0000003-0000-4000-8000-000000000003', '2025-12-15 10:00:00+00',
 '2025-09-01 09:00:00+00', '2025-12-15 10:00:00+00'),
('e0000003-0000-4000-8000-000000000003', 'b0000002-0000-4000-8000-000000000002',
 'Analytics Pipeline', 'https://analytics.example.com/ingest', 'whsec_analytics_456',
 ARRAY['message_created','reaction_added','message_flagged']::text[], true,
 'a0000012-0000-4000-8000-000000000012', '2026-01-18 09:00:00+00',
 '2025-08-15 09:00:00+00', '2026-01-18 09:00:00+00'),
('e0000004-0000-4000-8000-000000000004', 'b0000003-0000-4000-8000-000000000003',
 'Design Tool Sync', 'https://figma.example.com/webhook', 'whsec_figma_sync_123',
 ARRAY['message_created']::text[], false,
 'a0000002-0000-4000-8000-000000000002', NULL,
 '2025-10-01 09:00:00+00', '2025-11-01 09:00:00+00')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, is_active = EXCLUDED.is_active,
  last_success_at = EXCLUDED.last_success_at, updated_at = EXCLUDED.updated_at;

-- Webhook deliveries (success + failure mix)
INSERT INTO public.webhook_deliveries (webhook_id, event, status, request_body, response_status, response_body, duration_ms, created_at)
VALUES
-- Slack webhook: mostly successful
('e0000001-0000-4000-8000-000000000001', 'message_created', 'success',
 '{"event":"message_created","channel":"general","user":"Marcus Chen"}'::jsonb,
 200, '{"ok":true}', 145, '2026-01-18 08:00:00+00'),
('e0000001-0000-4000-8000-000000000001', 'message_created', 'success',
 '{"event":"message_created","channel":"engineering","user":"Elena Volkov"}'::jsonb,
 200, '{"ok":true}', 120, '2026-01-17 14:00:00+00'),
('e0000001-0000-4000-8000-000000000001', 'message_updated', 'success',
 '{"event":"message_updated","channel":"product","user":"Sarah Patel"}'::jsonb,
 200, '{"ok":true}', 130, '2026-01-16 09:00:00+00'),
-- CI/CD trigger: success + one failure
('e0000002-0000-4000-8000-000000000002', 'channel_created', 'success',
 '{"event":"channel_created","name":"project-alpha"}'::jsonb,
 201, '{"triggered":true}', 250, '2025-09-01 09:05:00+00'),
('e0000002-0000-4000-8000-000000000002', 'member_joined', 'failed',
 '{"event":"member_joined","user":"Priya Sharma","channel":"project-alpha"}'::jsonb,
 502, 'Bad Gateway', 5002, '2025-09-01 09:10:00+00'),
('e0000002-0000-4000-8000-000000000002', 'member_joined', 'success',
 '{"event":"member_joined","user":"Priya Sharma","channel":"project-alpha"}'::jsonb,
 201, '{"triggered":true}', 180, '2025-09-01 09:15:00+00'),
-- Analytics pipeline: consistent successes
('e0000003-0000-4000-8000-000000000003', 'message_created', 'success',
 '{"event":"message_created","workspace":"TechStart"}'::jsonb,
 202, '{"accepted":true}', 80, '2026-01-18 09:00:00+00'),
('e0000003-0000-4000-8000-000000000003', 'reaction_added', 'success',
 '{"event":"reaction_added","emoji":"🚀"}'::jsonb,
 202, '{"accepted":true}', 75, '2026-01-17 17:00:00+00'),
-- More webhook deliveries
('e0000001-0000-4000-8000-000000000001', 'message_created', 'success',
 '{"event":"message_created","channel":"leadership","user":"Marcus Chen"}'::jsonb,
 200, '{"ok":true}', 155, '2026-01-15 10:00:00+00'),
('e0000001-0000-4000-8000-000000000001', 'message_updated', 'success',
 '{"event":"message_updated","channel":"engineering","user":"Alex Admin"}'::jsonb,
 200, '{"ok":true}', 110, '2026-01-10 09:05:00+00'),
('e0000003-0000-4000-8000-000000000003', 'message_flagged', 'success',
 '{"event":"message_flagged","user":"Alex Admin"}'::jsonb,
 202, '{"accepted":true}', 90, '2026-01-15 10:10:00+00'),
('e0000003-0000-4000-8000-000000000003', 'message_created', 'success',
 '{"event":"message_created","workspace":"TechStart","channel":"devops"}'::jsonb,
 202, '{"accepted":true}', 85, '2026-01-14 09:00:00+00'),
('e0000002-0000-4000-8000-000000000002', 'channel_created', 'success',
 '{"event":"channel_created","name":"standup"}'::jsonb,
 201, '{"triggered":true}', 200, '2025-08-01 09:00:00+00'),
('e0000001-0000-4000-8000-000000000001', 'message_created', 'failed',
 '{"event":"message_created","channel":"general"}'::jsonb,
 408, 'Request Timeout', 30000, '2026-01-12 03:00:00+00')
ON CONFLICT DO NOTHING;

-- Webhook dead letters (permanently failed deliveries)
INSERT INTO public.webhook_dead_letters (webhook_id, event, request_body, last_error, attempt_count, created_at, last_attempt_at)
VALUES
('e0000002-0000-4000-8000-000000000002', 'member_joined',
 '{"event":"member_joined","user":"Deleted User","channel":"test"}'::jsonb,
 'Connection refused after 5 retries', 5, '2025-10-01 02:00:00+00', '2025-10-01 02:30:00+00'),
('e0000001-0000-4000-8000-000000000001', 'message_created',
 '{"event":"message_created","channel":"general"}'::jsonb,
 'Request Timeout after 30s', 3, '2026-01-12 03:00:00+00', '2026-01-12 03:05:00+00'),
('e0000003-0000-4000-8000-000000000003', 'reaction_added',
 '{"event":"reaction_added","workspace":"deleted-workspace"}'::jsonb,
 'HTTP 410 Gone — workspace deleted', 2, '2025-12-01 12:00:00+00', '2025-12-01 12:05:00+00')
ON CONFLICT DO NOTHING;

-- ======================================================================
-- AUDIT LOGS (activity trail across workspaces)
-- ======================================================================
INSERT INTO public.audit_logs (organization_id, actor_user_id, actor_type, action, entity_type, entity_id, metadata, created_at)
VALUES
-- Workspace creation
('b0000001-0000-4000-8000-000000000001', 'a0000001-0000-4000-8000-000000000001', 'user', 'workspace.created',
 'workspace', 'b0000001-0000-4000-8000-000000000001',
 '{"name":"Acme Corp","slug":"acme-corp"}'::jsonb, '2025-07-18 09:00:00+00'),
-- Member additions
('b0000001-0000-4000-8000-000000000001', 'a0000001-0000-4000-8000-000000000001', 'user', 'member.added',
 'workspace_member', NULL,
 '{"user":"Jake Morrison","role":"admin"}'::jsonb, '2025-07-19 10:00:00+00'),
('b0000001-0000-4000-8000-000000000001', 'a0000001-0000-4000-8000-000000000001', 'user', 'member.added',
 'workspace_member', NULL,
 '{"user":"Elena Volkov","role":"member"}'::jsonb, '2025-07-20 08:30:00+00'),
-- Channel creation
('b0000001-0000-4000-8000-000000000001', 'a0000001-0000-4000-8000-000000000001', 'user', 'channel.created',
 'channel', 'c0000001-0000-4000-8000-000000000001',
 '{"name":"general","type":"public"}'::jsonb, '2025-07-18 09:01:00+00'),
('b0000001-0000-4000-8000-000000000001', 'a0000001-0000-4000-8000-000000000001', 'user', 'channel.created',
 'channel', 'c0000007-0000-4000-8000-000000000007',
 '{"name":"leadership","type":"private"}'::jsonb, '2025-07-20 10:00:00+00'),
-- Message actions
('b0000001-0000-4000-8000-000000000001', 'a0000001-0000-4000-8000-000000000001', 'user', 'message.pinned',
 'message', 'm0000001-0000-4000-8000-000000000001',
 '{"channel":"general"}'::jsonb, '2025-07-18 09:20:00+00'),
('b0000001-0000-4000-8000-000000000001', 'a0000001-0000-4000-8000-000000000001', 'user', 'message.pinned',
 'message', 'm0000019-0000-4000-8000-000000000019',
 '{"channel":"engineering"}'::jsonb, '2025-09-01 09:10:00+00'),
-- Security actions
('b0000001-0000-4000-8000-000000000001', 'a0000011-0000-4000-8000-000000000011', 'user', 'security.audit_completed',
 'audit', NULL,
 '{"issues_found":3,"severity":"medium"}'::jsonb, '2025-09-10 09:30:00+00'),
-- Webhook management
('b0000001-0000-4000-8000-000000000001', 'a0000001-0000-4000-8000-000000000001', 'user', 'webhook.created',
 'webhook', 'e0000001-0000-4000-8000-000000000001',
 '{"name":"Slack Notifications"}'::jsonb, '2025-08-01 10:00:00+00'),
-- Role changes
('b0000001-0000-4000-8000-000000000001', 'a0000001-0000-4000-8000-000000000001', 'user', 'member.role_changed',
 'workspace_member', NULL,
 '{"user":"Aisha Johnson","old_role":"member","new_role":"admin"}'::jsonb, '2025-08-10 09:30:00+00'),
-- Settings changes
('b0000001-0000-4000-8000-000000000001', 'a0000001-0000-4000-8000-000000000001', 'user', 'settings.updated',
 'workspace', 'b0000001-0000-4000-8000-000000000001',
 '{"setting":"announcement","value":"Q3 Planning Kickoff"}'::jsonb, '2025-12-30 09:00:00+00'),
-- TechStart events
('b0000002-0000-4000-8000-000000000002', 'a0000012-0000-4000-8000-000000000012', 'user', 'workspace.created',
 'workspace', 'b0000002-0000-4000-8000-000000000002',
 '{"name":"TechStart","slug":"techstart"}'::jsonb, '2025-07-18 08:00:00+00'),
('b0000002-0000-4000-8000-000000000002', 'a0000012-0000-4000-8000-000000000012', 'user', 'member.added',
 'workspace_member', NULL,
 '{"user":"Tom Nguyen","role":"member"}'::jsonb, '2025-10-01 09:00:00+00'),
-- Infra events
('b0000002-0000-4000-8000-000000000002', 'a0000007-0000-4000-8000-000000000007', 'user', 'infrastructure.hotfix',
 'deployment', NULL,
 '{"service":"api","issue":"memory_leak","resolution":"socket_cleanup"}'::jsonb, '2025-10-20 02:00:00+00'),
('b0000002-0000-4000-8000-000000000002', 'a0000013-0000-4000-8000-000000000013', 'user', 'database.performance',
 'migration', NULL,
 '{"index":"idx_messages_channel_created","improvement":"340ms to 12ms"}'::jsonb, '2025-10-15 10:00:00+00'),
-- DesignHub events
('b0000003-0000-4000-8000-000000000003', 'a0000002-0000-4000-8000-000000000002', 'user', 'workspace.created',
 'workspace', 'b0000003-0000-4000-8000-000000000003',
 '{"name":"DesignHub","slug":"designhub"}'::jsonb, '2025-08-01 09:00:00+00'),
('b0000003-0000-4000-8000-000000000003', 'a0000008-0000-4000-8000-000000000008', 'user', 'design.system_updated',
 'design_system', NULL,
 '{"version":"v2","components":47}'::jsonb, '2025-11-01 09:00:00+00'),
-- Bulk import/export audit
('b0000001-0000-4000-8000-000000000001', 'a0000001-0000-4000-8000-000000000001', 'user', 'data.exported',
 'compliance_export', NULL,
 '{"type":"messages","row_count":15420,"date_range":"2025-Q3"}'::jsonb, '2025-10-02 09:00:00+00'),
-- Super Admin cross-workspace audit logs
('b0000001-0000-4000-8000-000000000001', 'a0000016-0000-4000-8000-000000000016', 'user', 'security.scan_completed',
 'security_scan', NULL,
 '{"scan_type":"platform","critical":0,"high":0,"medium":2}'::jsonb, '2026-01-10 09:00:00+00'),
('b0000001-0000-4000-8000-000000000001', 'a0000016-0000-4000-8000-000000000016', 'user', 'platform.health_check',
 'platform', NULL,
 '{"uptime_30d":"99.97%","workspaces":3}'::jsonb, '2026-01-01 09:00:00+00'),
('b0000001-0000-4000-8000-000000000001', 'a0000016-0000-4000-8000-000000000016', 'user', 'member.added',
 'workspace_member', NULL,
 '{"user":"Alex Admin","role":"admin","workspace":"Acme Corp"}'::jsonb, '2025-07-15 08:00:00+00'),
('b0000002-0000-4000-8000-000000000002', 'a0000016-0000-4000-8000-000000000016', 'user', 'member.added',
 'workspace_member', NULL,
 '{"user":"Alex Admin","role":"admin","workspace":"TechStart"}'::jsonb, '2025-07-15 08:00:00+00'),
('b0000003-0000-4000-8000-000000000003', 'a0000016-0000-4000-8000-000000000016', 'user', 'member.added',
 'workspace_member', NULL,
 '{"user":"Alex Admin","role":"admin","workspace":"DesignHub"}'::jsonb, '2025-07-15 08:00:00+00'),
('b0000001-0000-4000-8000-000000000001', 'a0000016-0000-4000-8000-000000000016', 'user', 'infrastructure.dr_test',
 'disaster_recovery', NULL,
 '{"rpo":"15min","rto":"45min","status":"passed"}'::jsonb, '2025-12-20 09:00:00+00'),
('b0000002-0000-4000-8000-000000000002', 'a0000016-0000-4000-8000-000000000016', 'user', 'platform.budget_review',
 'workspace', NULL,
 '{"quarter":"Q3","status":"on_track"}'::jsonb, '2026-01-15 10:00:00+00'),
 ('b0000003-0000-4000-8000-000000000003', 'a0000016-0000-4000-8000-000000000016', 'user', 'platform.workspace_review',
  'workspace', NULL,
  '{"review":"quarterly","status":"approved"}'::jsonb, '2026-01-08 09:00:00+00'),
-- New user audit logs (Olivia, Jamal, Sofia, Chen, Ethan)
('b0000001-0000-4000-8000-000000000001', 'a0000017-0000-4000-8000-000000000017', 'user', 'security.scan_completed',
  'security_scan', NULL,
  '{"scan_type":"quarterly","critical":0,"high":0,"medium":1}'::jsonb, '2026-02-20 09:00:00+00'),
('b0000001-0000-4000-8000-000000000001', 'a0000017-0000-4000-8000-000000000017', 'user', 'feature.proposed',
  'feature', NULL,
  '{"name":"WebSocket heartbeat monitoring","priority":"high"}'::jsonb, '2026-02-05 13:00:00+00'),
('b0000002-0000-4000-8000-000000000002', 'a0000018-0000-4000-8000-000000000018', 'user', 'contribution.milestone',
  'contribution', NULL,
  '{"contributions":10,"role":"intern"}'::jsonb, '2026-03-20 09:00:00+00'),
('b0000003-0000-4000-8000-000000000003', 'a0000019-0000-4000-8000-000000000019', 'user', 'product.roadmap_updated',
  'roadmap', NULL,
  '{"quarter":"Q4","features":8}'::jsonb, '2026-05-03 09:00:00+00'),
('b0000001-0000-4000-8000-000000000001', 'a0000020-0000-4000-8000-000000000020', 'user', 'design.system_updated',
  'design_system', NULL,
  '{"version":"v3","components":52}'::jsonb, '2026-05-25 14:00:00+00'),
('b0000001-0000-4000-8000-000000000001', 'a0000020-0000-4000-8000-000000000020', 'user', 'accessibility.audit_completed',
  'accessibility_audit', NULL,
  '{"issues_found":5,"severity":"low"}'::jsonb, '2026-04-20 14:00:00+00'),
('b0000002-0000-4000-8000-000000000002', 'a0000021-0000-4000-8000-000000000021', 'user', 'sales.deal_closed',
  'deal', NULL,
  '{"amount":250000,"client":"Enterprise Corp","timeline":"3 weeks"}'::jsonb, '2026-06-18 16:00:00+00'),
('b0000001-0000-4000-8000-000000000001', 'a0000017-0000-4000-8000-000000000017', 'user', 'data.exported',
  'compliance_export', NULL,
  '{"type":"messages","row_count":18500,"date_range":"2026-Q1"}'::jsonb, '2026-04-02 09:00:00+00')
ON CONFLICT DO NOTHING;

-- ======================================================================
-- COMPLIANCE EXPORTS
-- ======================================================================
INSERT INTO public.compliance_exports (type, date_from, date_to, row_count, csv_content, status, created_by, workspace_id, created_at)
VALUES
('messages', '2025-07-18 00:00:00+00', '2025-09-30 23:59:59+00', 15420,
  'channel,user,content,created_at\ngeneral,Marcus Chen,Welcome to Acme Corp,2025-07-18...',
  'completed', 'a0000001-0000-4000-8000-000000000001', 'b0000001-0000-4000-8000-000000000001', '2025-10-02 09:00:00+00'),
('audit_logs', '2025-07-18 00:00:00+00', '2025-09-30 23:59:59+00', 2847,
 'actor,action,entity_type,created_at\nMarcus Chen,workspace.created,workspace,2025-07-18...',
 'completed', 'a0000001-0000-4000-8000-000000000001', 'b0000001-0000-4000-8000-000000000001', '2025-10-02 09:05:00+00'),
('users', '2025-07-18 00:00:00+00', '2026-01-18 23:59:59+00', 16,
  'email,display_name,created_at\nmarcus@seed.test,Marcus Chen,2025-07-18...',
  'completed', 'a0000001-0000-4000-8000-000000000001', 'b0000001-0000-4000-8000-000000000001', '2026-01-01 09:00:00+00'),
('messages', '2025-10-01 00:00:00+00', '2025-12-31 23:59:59+00', 0,
 NULL, 'pending', 'a0000012-0000-4000-8000-000000000012', 'b0000002-0000-4000-8000-000000000002', '2026-01-01 09:10:00+00'),
('channels', '2025-07-18 00:00:00+00', '2026-01-18 23:59:59+00', 0,
 NULL, 'failed', 'a0000001-0000-4000-8000-000000000001', 'b0000001-0000-4000-8000-000000000001', '2025-12-15 09:00:00+00')
ON CONFLICT DO NOTHING;

-- Update the failed export with error message
UPDATE public.compliance_exports
SET error_msg = 'Export timed out after 30 seconds. Try narrowing the date range.'
WHERE status = 'failed' AND workspace_id = 'b0000001-0000-4000-8000-000000000001';

-- More compliance exports
INSERT INTO public.compliance_exports (type, date_from, date_to, row_count, csv_content, status, created_by, workspace_id, created_at)
VALUES
('messages', '2025-10-01 00:00:00+00', '2025-12-31 23:59:59+00', 8340,
 'channel,user,content,created_at\nengineering,Alex Admin,Security scan complete,2026-01-10...',
 'completed', 'a0000016-0000-4000-8000-000000000016', 'b0000001-0000-4000-8000-000000000001', '2026-01-05 09:00:00+00'),
('messages', '2025-07-18 00:00:00+00', '2026-01-18 23:59:59+00', 3210,
 'channel,user,content,created_at\ngeneral,Nkechi Okonkwo,Welcome to TechStart,2025-07-18...',
 'completed', 'a0000012-0000-4000-8000-000000000012', 'b0000002-0000-4000-8000-000000000002', '2026-01-15 09:00:00+00'),
('audit_logs', '2025-10-01 00:00:00+00', '2025-12-31 23:59:59+00', 890,
 'actor,action,entity_type,created_at\nAlex Admin,platform.health_check,platform,2026-01-01...',
 'completed', 'a0000016-0000-4000-8000-000000000016', 'b0000001-0000-4000-8000-000000000001', '2026-01-05 09:05:00+00'),
('users', '2025-07-18 00:00:00+00', '2026-07-18 23:59:59+00', 21,
  'email,display_name,created_at\nnkechi@seed.test,Nkechi Okonkwo,2025-07-18...',
  'completed', 'a0000012-0000-4000-8000-000000000012', 'b0000002-0000-4000-8000-000000000002', '2026-01-01 09:10:00+00')
ON CONFLICT DO NOTHING;

-- ======================================================================
-- PUSH SUBSCRIPTIONS (browser push notification endpoints)
-- ======================================================================
-- PUSH SUBSCRIPTIONS (browser push notification endpoints)
INSERT INTO public.push_subscriptions (user_id, endpoint, p256dh, auth, user_agent, created_at)
SELECT * FROM (VALUES
  ('a0000001-0000-4000-8000-000000000001'::uuid, 'https://fcm.googleapis.com/fcm/send/acme-marcus-001', 'BH0key_base64_marcus==', 'auth_key_marcus_001', 'Mozilla/5.0 Chrome/125', '2025-12-01 09:00:00+00'::timestamptz),
  ('a0000002-0000-4000-8000-000000000002'::uuid, 'https://fcm.googleapis.com/fcm/send/designhub-sarah-001', 'BH0key_base64_sarah==', 'auth_key_sarah_001', 'Mozilla/5.0 Firefox/125', '2025-09-01 09:00:00+00'::timestamptz),
  ('a0000012-0000-4000-8000-000000000012'::uuid, 'https://fcm.googleapis.com/fcm/send/techstart-nkechi-001', 'BH0key_base64_nkechi==', 'auth_key_nkechi_001', 'Mozilla/5.0 Chrome/126', '2025-08-01 09:00:00+00'::timestamptz),
  ('a0000016-0000-4000-8000-000000000016'::uuid, 'https://fcm.googleapis.com/fcm/send/platform-alex-001', 'BH0key_base64_alex==', 'auth_key_alex_001', 'Mozilla/5.0 Chrome/126', '2025-07-20 09:00:00+00'::timestamptz),
  ('a0000013-0000-4000-8000-000000000013'::uuid, 'https://fcm.googleapis.com/fcm/send/techstart-raj-001', 'BH0key_base64_raj==', 'auth_key_raj_001', 'Mozilla/5.0 Chrome/125', '2025-08-01 09:00:00+00'::timestamptz),
  ('a0000017-0000-4000-8000-000000000017'::uuid, 'https://fcm.googleapis.com/fcm/send/acme-olivia-001', 'BH0key_base64_olivia==', 'auth_key_olivia_001', 'Mozilla/5.0 Chrome/127', '2026-02-01 09:00:00+00'::timestamptz),
  ('a0000018-0000-4000-8000-000000000018'::uuid, 'https://fcm.googleapis.com/fcm/send/techstart-jamal-001', 'BH0key_base64_jamal==', 'auth_key_jamal_001', 'Mozilla/5.0 Chrome/127', '2026-03-01 09:00:00+00'::timestamptz),
  ('a0000019-0000-4000-8000-000000000019'::uuid, 'https://fcm.googleapis.com/fcm/send/designhub-chen-001', 'BH0key_base64_chen==', 'auth_key_chen_001', 'Mozilla/5.0 Firefox/128', '2026-01-01 09:00:00+00'::timestamptz),
  ('a0000020-0000-4000-8000-000000000020'::uuid, 'https://fcm.googleapis.com/fcm/send/acme-sofia-001', 'BH0key_base64_sofia==', 'auth_key_sofia_001', 'Mozilla/5.0 Chrome/128', '2026-04-01 09:00:00+00'::timestamptz),
  ('a0000021-0000-4000-8000-000000000021'::uuid, 'https://fcm.googleapis.com/fcm/send/techstart-ethan-001', 'BH0key_base64_ethan==', 'auth_key_ethan_001', 'Mozilla/5.0 Chrome/128', '2026-05-01 09:00:00+00'::timestamptz)
) AS v(user_id, endpoint, p256dh, auth, user_agent, created_at)
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'push_subscriptions')
ON CONFLICT (user_id, endpoint) DO NOTHING;

-- ======================================================================
-- FEATURE FLAGS
-- ======================================================================
-- Upsert existing flags (may already exist from migration seed)
INSERT INTO public.feature_flags (key, name, description, enabled, rollout_percentage, target_roles, target_user_ids, created_at, updated_at)
VALUES
('new-thread-ui', 'New Thread UI', 'Redesigned thread panel with nested replies', true, 100, '{}', '{}', now(), now()),
('reactions-v2', 'Reactions V2', 'Expanded emoji picker with skin tone support', true, 100, '{}', '{}', now(), now()),
('dark-mode-auto', 'Auto Dark Mode', 'Automatically switch theme based on system preference', true, 75, '{}', '{}', now(), now()),
('push-notifications', 'Push Notifications', 'Browser push notification support', true, 50, '{}', '{}', now(), now()),
('message-editing', 'Message Editing', 'Allow users to edit sent messages', true, 100, '{}', '{}', now(), now()),
('ai-rewrite', 'AI Rewrite', 'AI-powered message rewrite suggestions', true, 30, ARRAY['owner','admin']::text[], '{}', now(), now()),
('scheduled-posts', 'Scheduled Posts', 'Schedule messages for future delivery', true, 100, '{}', '{}', now(), now()),
('data-export', 'Data Export', 'Compliance data export functionality', true, 100, '{}', '{}', now(), now())
ON CONFLICT (key) DO UPDATE SET
  enabled = EXCLUDED.enabled, rollout_percentage = EXCLUDED.rollout_percentage,
  target_roles = EXCLUDED.target_roles, updated_at = EXCLUDED.updated_at;

commit;
