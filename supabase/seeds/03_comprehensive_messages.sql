-- 03_comprehensive_messages.sql
-- 350+ messages across 24 channels spanning Jul 2025 - Jul 2026.
-- Includes threads, reactions, edit history, flags, message reads, scheduled posts.
-- Super admin (Alex Admin) active in all workspaces. 5 new users active Feb-May 2026.

begin;

-- Cleanup message-related data
DELETE FROM public.message_reads WHERE channel_id IN (
  SELECT id FROM public.channels WHERE workspace_id IN (
    'b0000001-0000-4000-8000-000000000001','b0000002-0000-4000-8000-000000000002','b0000003-0000-4000-8000-000000000003'
  )
);
DELETE FROM public.message_reminders WHERE user_id IN (
  SELECT id FROM public.users WHERE email LIKE '%@seed.test'
);
DELETE FROM public.message_edit_history WHERE message_id IN (
  SELECT id FROM public.messages WHERE user_id IN (SELECT id FROM public.users WHERE email LIKE '%@seed.test')
);
DELETE FROM public.message_flags WHERE user_id IN (
  SELECT id FROM public.users WHERE email LIKE '%@seed.test'
);
DELETE FROM public.reactions WHERE user_id IN (
  SELECT id FROM public.users WHERE email LIKE '%@seed.test'
);
DELETE FROM public.message_reads WHERE message_id IN (
  SELECT id FROM public.messages WHERE user_id IN (SELECT id FROM public.users WHERE email LIKE '%@seed.test')
);
DELETE FROM public.thread_participants WHERE user_id IN (
  SELECT id FROM public.users WHERE email LIKE '%@seed.test'
);
DELETE FROM public.thread_metadata WHERE message_id IN (
  SELECT id FROM public.messages WHERE user_id IN (SELECT id FROM public.users WHERE email LIKE '%@seed.test')
);
DELETE FROM public.scheduled_posts WHERE user_id IN (
  SELECT id FROM public.users WHERE email LIKE '%@seed.test'
);
DELETE FROM public.messages WHERE user_id IN (SELECT id FROM public.users WHERE email LIKE '%@seed.test');

-- Temporarily disable read-only trigger for seeding
ALTER TABLE public.messages DISABLE TRIGGER check_read_only_on_insert;

-- ======================================================================
-- MESSAGES: Fixed seed conversations (root messages, no parent_id)
-- ======================================================================
-- Format: id, channel_id, user_id, content, parent_id, is_pinned, priority, edited_at, created_at

INSERT INTO public.messages (id, channel_id, user_id, content, parent_id, is_pinned, priority, created_at)
VALUES
-- ===== JANUARY =====
-- #general: Welcome messages
('f0000001-0000-4000-8000-000000000001', 'c0000001-0000-4000-8000-000000000001', 'a0000001-0000-4000-8000-000000000001',
 'Welcome to Acme Corp everyone! This is our main communication channel. Please keep it professional and fun.', null, true, 'standard', '2025-07-18 09:10:00+00'),
('f0000002-0000-4000-8000-000000000002', 'c0000001-0000-4000-8000-000000000001', 'a0000002-0000-4000-8000-000000000002',
 'Excited to be here! Looking forward to collaborating with everyone.', null, false, 'standard', '2025-07-18 09:15:00+00'),
('f0000003-0000-4000-8000-000000000003', 'c0000001-0000-4000-8000-000000000001', 'a0000003-0000-4000-8000-000000000003',
 'Hey all! Just pushed the initial project setup. Check out the README for dev instructions.', null, false, 'standard', '2025-07-19 10:15:00+00'),
('f0000004-0000-4000-8000-000000000004', 'c0000001-0000-4000-8000-000000000001', 'a0000004-0000-4000-8000-000000000004',
 'Just joined the team! I''m Elena, backend engineer. Previously worked on distributed systems at CloudScale.', null, false, 'standard', '2025-07-20 08:45:00+00'),
('f0000005-0000-4000-8000-000000000005', 'c0000001-0000-4000-8000-000000000001', 'a0000005-0000-4000-8000-000000000005',
 'Welcome Elena! I''m Tyler, frontend. Let me know if you need help with the setup.', null, false, 'standard', '2025-07-22 11:10:00+00'),

-- #engineering: Technical discussions
('f0000006-0000-4000-8000-000000000006', 'c0000002-0000-4000-8000-000000000002', 'a0000001-0000-4000-8000-000000000001',
 'Team, we need to decide on our database migration strategy. I''m leaning toward using Supabase migrations with rollback scripts.', null, false, 'standard', '2025-07-20 10:00:00+00'),
('f0000007-0000-4000-8000-000000000007', 'c0000002-0000-4000-8000-000000000002', 'a0000004-0000-4000-8000-000000000004',
 'Agreed on Supabase migrations. I''ve set up the initial schema with RLS policies for tenant isolation. Here''s what I''m thinking for the core tables:\n\n```sql\nCREATE TABLE workspaces (\n  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n  name TEXT NOT NULL,\n  slug TEXT NOT NULL UNIQUE,\n  owner_id UUID REFERENCES users(id)\n);\n```\n\nFeedback welcome!', null, false, 'standard', '2025-07-20 10:30:00+00'),
('f0000008-0000-4000-8000-000000000008', 'c0000002-0000-4000-8000-000000000002', 'a0000003-0000-4000-8000-000000000003',
 'Looks good Elena! One suggestion: add a `version` column for optimistic locking. We''ll need it for concurrent edits.', null, false, 'standard', '2025-07-20 11:00:00+00'),
('f0000009-0000-4000-8000-000000000009', 'c0000002-0000-4000-8000-000000000002', 'a0000004-0000-4000-8000-000000000004',
 'Good call Jake! Added version column and a trigger to auto-increment it on UPDATE.', null, false, 'standard', '2025-07-20 11:30:00+00'),
('f0000010-0000-4000-8000-000000000010', 'c0000002-0000-4000-8000-000000000002', 'a0000001-0000-4000-8000-000000000001',
 'Perfect. Let''s also add soft-delete support from day one. Add a `deleted_at` column to all major tables.', null, false, 'standard', '2025-07-20 14:00:00+00'),
('f0000011-0000-4000-8000-000000000011', 'c0000002-0000-4000-8000-000000000002', 'a0000007-0000-4000-8000-000000000007',
 'I can set up the CI/CD pipeline this week. Thinking GitHub Actions with parallel test + lint + typecheck jobs.', null, false, 'standard', '2025-08-05 14:30:00+00'),
('f0000012-0000-4000-8000-000000000012', 'c0000002-0000-4000-8000-000000000002', 'a0000009-0000-4000-8000-000000000009',
 'First PR is up! Added the workspace CRUD endpoints. Would appreciate reviews from @marcus and @jake.', null, false, 'standard', '2025-08-15 10:30:00+00'),
('f0000013-0000-4000-8000-000000000013', 'c0000002-0000-4000-8000-000000000002', 'a0000003-0000-4000-8000-000000000003',
 'Reviewed Liam''s PR. Left a few comments about error handling patterns. Overall looks solid for a first contribution!', null, false, 'standard', '2025-08-16 09:00:00+00'),
('f0000014-0000-4000-8000-000000000014', 'c0000002-0000-4000-8000-000000000002', 'a0000011-0000-4000-8000-000000000011',
 'Security audit completed. Found 3 medium-severity issues in the auth flow. Opening tickets now.', null, false, 'important', '2025-09-10 09:30:00+00'),
('f0000015-0000-4000-8000-000000000015', 'c0000002-0000-4000-8000-000000000002', 'a0000001-0000-4000-8000-000000000001',
 'Thanks Dmitri. Let''s prioritize fixing those before the v1.0 launch. Can you create a tracking issue?', null, false, 'urgent', '2025-09-10 10:00:00+00'),
('f0000016-0000-4000-8000-000000000016', 'c0000002-0000-4000-8000-000000000002', 'a0000013-0000-4000-8000-000000000013',
 'Finished implementing the full-text search function. Uses `to_tsvector` with English config. Performance looks great with the GIN index.', null, false, 'standard', '2025-07-25 14:00:00+00'),
('f0000017-0000-4000-8000-000000000017', 'c0000002-0000-4000-8000-000000000002', 'a0000005-0000-4000-8000-000000000005',
 'The new virtual list for message rendering is performing well. Scrolling through 10k messages with no jank.', null, false, 'standard', '2025-09-15 11:00:00+00'),
('f0000018-0000-4000-8000-000000000018', 'c0000002-0000-4000-8000-000000000002', 'a0000004-0000-4000-8000-000000000004',
 'Just deployed the webhook system with HMAC signing, circuit breaker, and dead-letter queue. Pretty robust setup.', null, false, 'standard', '2025-10-01 10:00:00+00'),
('f0000019-0000-4000-8000-000000000019', 'c0000002-0000-4000-8000-000000000002', 'a0000001-0000-4000-8000-000000000001',
 'Sprint planning: Q2 priorities are:\n1. Real-time notifications (Socket.io)\n2. Threaded conversations\n3. File upload/download\n4. Search improvements\n\nLet''s discuss assignments in the standup.', null, true, 'standard', '2025-09-01 09:00:00+00'),
('f0000020-0000-4000-8000-000000000020', 'c0000002-0000-4000-8000-000000000002', 'a0000006-0000-4000-8000-000000000006',
 'QA report: tested the entire message flow end-to-end. Found 2 minor issues:\n- Emoji picker doesn''t close on outside click on mobile\n- Date separator renders incorrectly at month boundaries\n\nBoth are non-blocking.', null, false, 'standard', '2025-09-20 14:00:00+00'),

-- #product: Feature discussions
('f0000021-0000-4000-8000-000000000021', 'c0000003-0000-4000-8000-000000000003', 'a0000002-0000-4000-8000-000000000002',
 'Sharing the user research findings from last week. Key insights:\n\n- 73% of users want threaded conversations\n- Search is the #1 requested feature\n- Mobile experience needs work\n\nFull report attached to the bookmark above.', null, false, 'standard', '2025-07-25 09:00:00+00'),
('f0000022-0000-4000-8000-000000000022', 'c0000003-0000-4000-8000-000000000003', 'a0000001-0000-4000-8000-000000000001',
 'Great findings Sarah. For threads, I''m thinking we use a parent_id self-reference with a thread_metadata table for aggregation. Similar to how Slack does it.', null, false, 'standard', '2025-07-25 10:00:00+00'),
('f0000023-0000-4000-8000-000000000023', 'c0000003-0000-4000-8000-000000000003', 'a0000002-0000-4000-8000-000000000002',
 'Love that approach. Let''s also add participant tracking so we can notify thread subscribers of new replies.', null, false, 'standard', '2025-07-25 10:30:00+00'),
('f0000024-0000-4000-8000-000000000024', 'c0000003-0000-4000-8000-000000000003', 'a0000008-0000-4000-8000-000000000008',
 'I''ve been working on the design system. Here are the key principles:\n\n- **Consistent spacing**: 4px grid system\n- **Color tokens**: Semantic naming (e.g., `--color-primary`, `--color-success`)\n- **Typography scale**: Modular scale with 1.25 ratio\n- **Component variants**: Size (sm/md/lg) + intent (default/success/warning/danger)', null, false, 'standard', '2025-08-10 10:00:00+00'),
('f0000025-0000-4000-8000-000000000025', 'c0000003-0000-4000-8000-000000000003', 'a0000002-0000-4000-8000-000000000002',
 'Feature request from users: message pinning. They want to pin important messages in channels for easy reference.', null, false, 'standard', '2025-10-15 09:00:00+00'),
('f0000026-0000-4000-8000-000000000026', 'c0000003-0000-4000-8000-000000000003', 'a0000001-0000-4000-8000-000000000001',
 'Adding pinning to the sprint. It''s a simple boolean + API endpoint. Should be a quick win.', null, false, 'standard', '2025-10-15 09:30:00+00'),
('f0000027-0000-4000-8000-000000000027', 'c0000003-0000-4000-8000-000000000003', 'a0000002-0000-4000-8000-000000000002',
 'Q3 planning doc is ready. Major themes: accessibility audit, mobile-first redesign, and performance optimization.', null, false, 'important', '2025-12-15 10:00:00+00'),

-- #random: Off-topic
('f0000028-0000-4000-8000-000000000028', 'c0000004-0000-4000-8000-000000000004', 'a0000005-0000-4000-8000-000000000005',
 'Anyone catch the game last night? What a finish!', null, false, 'standard', '2025-07-22 12:00:00+00'),
('f0000029-0000-4000-8000-000000000029', 'c0000004-0000-4000-8000-000000000004', 'a0000009-0000-4000-8000-000000000009',
 'Missed it but saw the highlights. That last-second goal was insane! 🏒', null, false, 'standard', '2025-07-22 12:15:00+00'),
('f0000030-0000-4000-8000-000000000030', 'c0000004-0000-4000-8000-000000000004', 'a0000007-0000-4000-8000-000000000007',
 'Friday team lunch at the new Thai place. Who''s in? 🍜', null, false, 'standard', '2025-08-07 12:00:00+00'),
('f0000031-0000-4000-8000-000000000031', 'c0000004-0000-4000-8000-000000000004', 'a0000006-0000-4000-8000-000000000006',
 'Count me in! Their pad thai is amazing.', null, false, 'standard', '2025-08-07 12:10:00+00'),
('f0000032-0000-4000-8000-000000000032', 'c0000004-0000-4000-8000-000000000004', 'a0000004-0000-4000-8000-000000000004',
 'Fun fact: I used to be a competitive chess player. Anyone want to play during lunch?', null, false, 'standard', '2025-08-10 13:00:00+00'),
('f0000033-0000-4000-8000-000000000033', 'c0000004-0000-4000-8000-000000000004', 'a0000010-0000-4000-8000-000000000010',
 'Just finished "The Pragmatic Programmer" for the third time. Still the best software book ever written.', null, false, 'standard', '2025-09-05 12:30:00+00'),
('f0000034-0000-4000-8000-000000000034', 'c0000004-0000-4000-8000-000000000004', 'a0000015-0000-4000-8000-000000000015',
 'Starting my first week as intern! Any tips for getting up to speed quickly?', null, false, 'standard', '2025-10-01 09:30:00+00'),
('f0000035-0000-4000-8000-000000000035', 'c0000004-0000-4000-8000-000000000004', 'a0000003-0000-4000-8000-000000000003',
 'Welcome Tom! Tip #1: Read the codebase. Tip #2: Don''t be afraid to ask questions. Tip #3: Set up your dev environment using the README.', null, false, 'standard', '2025-10-01 09:45:00+00'),
('f0000036-0000-4000-8000-000000000036', 'c0000004-0000-4000-8000-000000000004', 'a0000014-0000-4000-8000-000000000014',
 'Hot take: tabs > spaces. Fight me. 😤', null, false, 'standard', '2025-11-10 12:00:00+00'),
('f0000037-0000-4000-8000-000000000037', 'c0000004-0000-4000-8000-000000000004', 'a0000005-0000-4000-8000-000000000005',
 'Prettier says no. And Prettier is always right. 😂', null, false, 'standard', '2025-11-10 12:05:00+00'),

-- #design
('f0000038-0000-4000-8000-000000000038', 'c0000005-0000-4000-8000-000000000005', 'a0000008-0000-4000-8000-000000000008',
 'Sharing the new color palette for the design system. Primary: #3B82F6, Secondary: #8B5CF6, Success: #10B981, Warning: #F59E0B, Danger: #EF4444', null, false, 'standard', '2025-08-10 10:30:00+00'),
('f0000039-0000-4000-8000-000000000039', 'c0000005-0000-4000-8000-000000000005', 'a0000005-0000-4000-8000-000000000005',
 'These look great Aisha! How do they work in dark mode?', null, false, 'standard', '2025-08-10 11:00:00+00'),
('f0000040-0000-4000-8000-000000000040', 'c0000005-0000-4000-8000-000000000005', 'a0000008-0000-4000-8000-000000000008',
 'Good question! For dark mode, I''ve created adjusted variants:\n\n- Primary: #60A5FA (lighter blue)\n- Background: #1F2937 (dark gray)\n- Surface: #374151\n- Text: #F9FAFB\n\nAll using CSS custom properties for easy switching.', null, false, 'standard', '2025-08-10 11:30:00+00'),
('f0000041-0000-4000-8000-000000000041', 'c0000005-0000-4000-8000-000000000005', 'a0000014-0000-4000-8000-000000000014',
 'Updated the component library docs. Added usage guidelines, do/don''t examples, and accessibility notes for every component.', null, false, 'standard', '2025-10-01 10:00:00+00'),
('f0000042-0000-4000-8000-000000000042', 'c0000005-0000-4000-8000-000000000005', 'a0000008-0000-4000-8000-000000000008',
 'Design review schedule: every Tuesday at 2pm. Please share Figma links in advance so we can prepare feedback.', null, false, 'standard', '2025-09-01 09:00:00+00'),

-- #announcements (read-only)
('f0000043-0000-4000-8000-000000000043', 'c0000006-0000-4000-8000-000000000006', 'a0000001-0000-4000-8000-000000000001',
 '🎉 We''re thrilled to announce that Acme Corp has secured Series A funding! This means we can expand the team and accelerate our product roadmap. More details at the all-hands next week.', null, false, 'standard', '2025-09-15 09:00:00+00'),
('f0000044-0000-4000-8000-000000000044', 'c0000006-0000-4000-8000-000000000006', 'a0000001-0000-4000-8000-000000000001',
 'Office will be closed July 4th for Independence Day. Enjoy the long weekend!', null, false, 'standard', '2026-07-01 10:00:00+00'),

-- #leadership (private)
('f0000045-0000-4000-8000-000000000045', 'c0000007-0000-4000-8000-000000000007', 'a0000001-0000-4000-8000-000000000001',
 'Team leads meeting: discussed headcount planning for Q3. We need 2 more backend engineers and 1 designer.', null, false, 'standard', '2025-10-10 09:00:00+00'),
('f0000046-0000-4000-8000-000000000046', 'c0000007-0000-4000-8000-000000000007', 'a0000008-0000-4000-8000-000000000008',
 'Agree on the designer hire. Our current team is stretched thin with the design system + product work.', null, false, 'standard', '2025-10-10 09:30:00+00'),
('f0000047-0000-4000-8000-000000000047', 'c0000007-0000-4000-8000-000000000007', 'a0000003-0000-4000-8000-000000000003',
 'Budget review: we''re under budget by 12% this quarter. Could allocate more to infrastructure.', null, false, 'important', '2025-11-01 09:00:00+00'),

-- #project-alpha (private)
('f0000048-0000-4000-8000-000000000048', 'c0000008-0000-4000-8000-000000000008', 'a0000001-0000-4000-8000-000000000001',
 'Project Alpha kickoff! Goal: build a real-time collaboration feature similar to Google Docs. Timeline: 6 weeks.', null, false, 'standard', '2025-09-01 09:05:00+00'),
('f0000049-0000-4000-8000-000000000049', 'c0000008-0000-4000-8000-000000000008', 'a0000004-0000-4000-8000-000000000004',
 'Architecture proposal:\n\n1. **Crdt-based** conflict resolution\n2. **WebSocket** for real-time sync\n3. **Operational transform** for text editing\n4. **Postgres** for persistence\n\nThoughts?', null, false, 'standard', '2025-09-02 10:00:00+00'),
('f0000050-0000-4000-8000-000000000050', 'c0000008-0000-4000-8000-000000000008', 'a0000005-0000-4000-8000-000000000005',
 'For the frontend, I''m thinking TipTap for the editor (it''s CRDT-ready) + Yjs for the sync layer. Both have great React integration.', null, false, 'standard', '2025-09-02 11:00:00+00'),
('f0000051-0000-4000-8000-000000000051', 'c0000008-0000-4000-8000-000000000008', 'a0000003-0000-4000-8000-000000000003',
 'Milestone 1 complete: basic document editing with 2-user collaboration. No conflicts detected in testing.', null, false, 'standard', '2025-09-15 16:00:00+00'),
('f0000052-0000-4000-8000-000000000052', 'c0000008-0000-4000-8000-000000000008', 'a0000001-0000-4000-8000-000000000001',
 'Excellent progress! Let''s demo this to the product team on Friday.', null, false, 'standard', '2025-09-15 16:30:00+00'),

-- TechStart #general
('f0000053-0000-4000-8000-000000000053', 'c0000009-0000-4000-8000-000000000009', 'a0000012-0000-4000-8000-000000000012',
 'Welcome to TechStart! Our mission: make developer tools that actually make developers productive.', null, true, 'standard', '2025-07-18 08:10:00+00'),
('f0000054-0000-4000-8000-000000000054', 'c0000009-0000-4000-8000-000000000009', 'a0000013-0000-4000-8000-000000000013',
 'Our stack: Next.js + Supabase + Turborepo + pnpm. Modern, fast, and developer-friendly.', null, false, 'standard', '2025-07-18 08:20:00+00'),
('f0000055-0000-4000-8000-000000000055', 'c0000009-0000-4000-8000-000000000009', 'a0000015-0000-4000-8000-000000000015',
 'First day done! The codebase is really well organized. Thanks for the warm welcome everyone.', null, false, 'standard', '2025-10-01 17:00:00+00'),

-- TechStart #devops
('f0000056-0000-4000-8000-000000000056', 'c0000010-0000-4000-8000-000000000010', 'a0000013-0000-4000-8000-000000000013',
 'Infrastructure overview:\n\n- **Compute**: DigitalOcean droplet (s-2vcpu-2gb)\n- **DNS**: Cloudflare (proxied)\n- **TLS**: Caddy (auto ACME)\n- **Database**: Supabase (managed PostgreSQL)\n- **Cache**: Redis (BullMQ adapter)\n\nAll provisioned via Terraform.', null, false, 'standard', '2025-07-18 08:30:00+00'),
('f0000057-0000-4000-8000-000000000057', 'c0000010-0000-4000-8000-000000000010', 'a0000007-0000-4000-8000-000000000007',
 'Added monitoring alerts: CPU > 80%, memory > 80%, disk > 90%. PagerDuty integration pending.', null, false, 'standard', '2025-08-10 10:00:00+00'),
('f0000058-0000-4000-8000-000000000058', 'c0000010-0000-4000-8000-000000000010', 'a0000007-0000-4000-8000-000000000007',
 '🔥 Hotfix deployed! Memory leak in the WebSocket adapter was causing OOM every ~6 hours. Root cause: missing `socket.disconnect()` cleanup. Patched and verified.', null, false, 'urgent', '2025-10-20 02:00:00+00'),

-- TechStart #standup
('f0000059-0000-4000-8000-000000000059', 'c0000011-0000-4000-8000-000000000011', 'a0000013-0000-4000-8000-000000000013',
 '**Standup - March 1**\n\n**Yesterday**: Finished CI/CD pipeline setup\n**Today**: Starting Terraform module for monitoring\n**Blockers**: None', null, false, 'standard', '2025-09-01 09:00:00+00'),
('f0000060-0000-4000-8000-000000000060', 'c0000011-0000-4000-8000-000000000011', 'a0000005-0000-4000-8000-000000000005',
 '**Standup - March 1**\n\n**Yesterday**: Implemented virtual scroll for message list\n**Today**: Start notification preferences UI\n**Blockers**: Need design specs from Aisha', null, false, 'standard', '2025-09-01 09:05:00+00'),
('f0000061-0000-4000-8000-000000000061', 'c0000011-0000-4000-8000-000000000011', 'a0000015-0000-4000-8000-000000000015',
 '**Standup - April 2**\n\n**Yesterday**: Onboarding, read documentation\n**Today**: Pick up first ticket (button component)\n**Blockers**: Still setting up local environment', null, false, 'standard', '2025-10-02 09:00:00+00'),

-- DesignHub #general
('f0000062-0000-4000-8000-000000000062', 'c0000014-0000-4000-8000-000000000014', 'a0000002-0000-4000-8000-000000000002',
 'Welcome to DesignHub! This is our space for design collaboration, feedback, and resource sharing.', null, false, 'standard', '2025-08-01 09:10:00+00'),
('f0000063-0000-4000-8000-000000000063', 'c0000014-0000-4000-8000-000000000014', 'a0000008-0000-4000-8000-000000000008',
 'Design system v2 is launching next month. Key changes: new spacing scale, updated typography, and dark mode support.', null, false, 'standard', '2025-10-15 10:00:00+00'),

-- DesignHub #design-reviews (private)
('f0000064-0000-4000-8000-000000000064', 'c0000015-0000-4000-8000-000000000015', 'a0000008-0000-4000-8000-000000000008',
 'New dashboard mockup ready for review. Figma link: figma.com/file/abc123\n\nKey decisions:\n- Sidebar navigation (collapsible)\n- Card-based layout for metrics\n- Chart library: Recharts\n\nPlease leave comments in Figma.', null, false, 'standard', '2025-09-01 10:00:00+00'),
('f0000065-0000-4000-8000-000000000065', 'c0000015-0000-4000-8000-000000000015', 'a0000005-0000-4000-8000-000000000005',
 'Love the card layout! One concern: the sidebar might be too narrow on tablets. Can we add a breakpoint for tablet collapsed view?', null, false, 'standard', '2025-09-02 09:00:00+00'),

-- DesignHub #brand-assets
('f0000066-0000-4000-8000-000000000066', 'c0000016-0000-4000-8000-000000000016', 'a0000002-0000-4000-8000-000000000002',
 'Brand guidelines updated. New logo variants: full-color, monochrome, and reversed. All in SVG format.', null, false, 'standard', '2025-08-15 09:00:00+00'),

-- DM channels
('f0000067-0000-4000-8000-000000000067', 'd0000001-0000-4000-8000-000000000001', 'a0000001-0000-4000-8000-000000000001',
 'Hey Nkechi, wanted to discuss the partnership opportunity. Are you free for a call this week?', null, false, 'standard', '2025-07-20 10:05:00+00'),
('f0000068-0000-4000-8000-000000000068', 'd0000001-0000-4000-8000-000000000001', 'a0000012-0000-4000-8000-000000000012',
 'Absolutely! How about Thursday at 2pm? I''ll send a calendar invite.', null, false, 'standard', '2025-07-20 10:15:00+00'),
('f0000069-0000-4000-8000-000000000069', 'd0000001-0000-4000-8000-000000000001', 'a0000001-0000-4000-8000-000000000001',
 'Perfect, Thursday works. Let''s also discuss the API integration between our platforms.', null, false, 'standard', '2025-07-20 10:20:00+00'),
('f0000070-0000-4000-8000-000000000070', 'd0000002-0000-4000-8000-000000000002', 'a0000004-0000-4000-8000-000000000004',
 'Jake, quick question about the auth middleware. Should we use Supabase RLS or custom middleware for workspace isolation?', null, false, 'standard', '2025-08-01 09:10:00+00'),
('f0000071-0000-4000-8000-000000000071', 'd0000002-0000-4000-8000-000000000002', 'a0000003-0000-4000-8000-000000000003',
 'I''d recommend both. RLS for data-level isolation, custom middleware for auth + RBAC checks. Defense in depth.', null, false, 'standard', '2025-08-01 09:20:00+00'),
('f0000072-0000-4000-8000-000000000072', 'd0000003-0000-4000-8000-000000000003', 'a0000005-0000-4000-8000-000000000005',
 'Aisha, what do you think about using Radix primitives for the component library? They handle a11y really well.', null, false, 'standard', '2025-09-01 09:10:00+00'),
('f0000073-0000-4000-8000-000000000073', 'd0000003-0000-4000-8000-000000000003', 'a0000008-0000-4000-8000-000000000008',
 'Great idea! Radix + Tailwind is a solid combo. Let''s prototype a button and dialog component this week.', null, false, 'standard', '2025-09-01 09:30:00+00'),

-- Group DM
('f0000074-0000-4000-8000-000000000074', 'd0000004-0000-4000-8000-000000000004', 'a0000001-0000-4000-8000-000000000001',
 'Quick sync: the investor demo is scheduled for April 15. We need the core features polished by then.', null, false, 'standard', '2025-10-01 09:10:00+00'),
('f0000075-0000-4000-8000-000000000075', 'd0000004-0000-4000-8000-000000000004', 'a0000002-0000-4000-8000-000000000002',
 'I''ll prepare the product demo flow. Focus areas: messaging, search, and real-time features.', null, false, 'standard', '2025-10-01 09:15:00+00'),
('f0000076-0000-4000-8000-000000000076', 'd0000004-0000-4000-8000-000000000004', 'a0000003-0000-4000-8000-000000000003',
 'I''ll handle the backend stability. Running load tests this week to make sure we can handle the demo traffic.', null, false, 'standard', '2025-10-01 09:20:00+00'),

-- More messages for volume and variety across months
('f0000077-0000-4000-8000-000000000077', 'c0000001-0000-4000-8000-000000000001', 'a0000006-0000-4000-8000-000000000006',
 'Happy Monday everyone! Reminder: team retrospective at 3pm today.', null, false, 'standard', '2025-08-03 09:00:00+00'),
('f0000078-0000-4000-8000-000000000078', 'c0000001-0000-4000-8000-000000000001', 'a0000010-0000-4000-8000-000000000010',
 'Just published the monthly analytics report. Key metrics: DAU up 23%, message volume up 45%, search usage up 180%.', null, false, 'standard', '2025-09-01 09:00:00+00'),
('f0000079-0000-4000-8000-000000000079', 'c0000001-0000-4000-8000-000000000001', 'a0000007-0000-4000-8000-000000000007',
 'Scheduled maintenance window: Saturday 2am-4am EST. Database migration for the new indexes.', null, false, 'important', '2025-10-10 09:00:00+00'),
('f0000080-0000-4000-8000-000000000080', 'c0000001-0000-4000-8000-000000000001', 'a0000011-0000-4000-8000-000000000011',
 'Security reminder: please enable 2FA on all your accounts. I''ll be auditing compliance next week.', null, false, 'standard', '2025-11-15 09:00:00+00'),
('f0000081-0000-4000-8000-000000000081', 'c0000002-0000-4000-8000-000000000002', 'a0000010-0000-4000-8000-000000000010',
 'Data pipeline update: processing 2.3M messages/day. Avg query time: 12ms with our new composite indexes.', null, false, 'standard', '2025-10-01 10:00:00+00'),
('f0000082-0000-4000-8000-000000000082', 'c0000002-0000-4000-8000-000000000002', 'a0000006-0000-4000-8000-000000000006',
 'Regression test suite: 847 tests, all passing. Coverage at 78%. Target: 85% by end of month.', null, false, 'standard', '2025-11-01 09:00:00+00'),
('f0000083-0000-4000-8000-000000000083', 'c0000002-0000-4000-8000-000000000002', 'a0000015-0000-4000-8000-000000000015',
 'Working on the Button component tests. Learned a lot about React Testing Library! Here''s my first contribution:', null, false, 'standard', '2025-10-05 14:00:00+00'),
('f0000084-0000-4000-8000-000000000084', 'c0000003-0000-4000-8000-000000000003', 'a0000010-0000-4000-8000-000000000010',
 'User survey results: NPS score improved from 32 to 58 over the past quarter. Top praise: search speed, thread organization.', null, false, 'standard', '2025-11-15 10:00:00+00'),
('f0000085-0000-4000-8000-000000000085', 'c0000003-0000-4000-8000-000000000003', 'a0000002-0000-4000-8000-000000000002',
 'Feature prioritization for Q3 based on user votes:\n1. Mobile app (245 votes)\n2. Integrations marketplace (189 votes)\n3. Advanced permissions (156 votes)\n4. Custom themes (134 votes)', null, false, 'standard', '2025-12-01 09:00:00+00'),
('f0000086-0000-4000-8000-000000000086', 'c0000004-0000-4000-8000-000000000004', 'a0000012-0000-4000-8000-000000000012',
 'Just adopted a puppy! 🐕 His name is Kernel (yes, like a kernel panic).', null, false, 'standard', '2025-10-15 12:00:00+00'),
('f0000087-0000-4000-8000-000000000087', 'c0000004-0000-4000-8000-000000000004', 'a0000009-0000-4000-8000-000000000009',
 'That''s adorable! Does he crash often? 😄', null, false, 'standard', '2025-10-15 12:05:00+00'),
('f0000088-0000-4000-8000-000000000088', 'c0000004-0000-4000-8000-000000000004', 'a0000001-0000-4000-8000-000000000001',
 'Best name ever! Does he have a kernel log? 📝', null, false, 'standard', '2025-10-15 12:10:00+00'),
('f0000089-0000-4000-8000-000000000089', 'c0000004-0000-4000-8000-000000000004', 'a0000013-0000-4000-8000-000000000013',
 'Summer BBQ at my place this Saturday! Bring your own meat, I''ll provide sides and drinks. 🍖', null, false, 'standard', '2025-12-20 10:00:00+00'),
('f0000090-0000-4000-8000-000000000090', 'c0000005-0000-4000-8000-000000000005', 'a0000014-0000-4000-8000-000000000014',
 'Published the content style guide. Covers: voice and tone, terminology, formatting rules, and accessibility language guidelines.', null, false, 'standard', '2025-11-01 10:00:00+00'),
('f0000091-0000-4000-8000-000000000091', 'c0000009-0000-4000-8000-000000000009', 'a0000012-0000-4000-8000-000000000012',
 'Monthly metrics: Revenue up 15% MoM. 3 new enterprise pilots signed. Churn down to 2.1%.', null, false, 'standard', '2025-12-01 09:00:00+00'),
('f0000092-0000-4000-8000-000000000092', 'c0000010-0000-4000-8000-000000000010', 'a0000007-0000-4000-8000-000000000007',
 'Kubernetes migration plan:\n- Week 1: Set up cluster + helm charts\n- Week 2: Migrate API service\n- Week 3: Migrate worker service\n- Week 4: Cutover + monitoring\n\nDetailed doc in Confluence.', null, false, 'standard', '2025-11-01 09:00:00+00'),
('f0000093-0000-4000-8000-000000000093', 'c0000010-0000-4000-8000-000000000010', 'a0000013-0000-4000-8000-000000000013',
 'Database performance update: after adding the composite index on (channel_id, created_at DESC), query time dropped from 340ms to 12ms. 🎉', null, false, 'standard', '2025-10-15 10:00:00+00'),
('f0000094-0000-4000-8000-000000000094', 'c0000011-0000-4000-8000-000000000011', 'a0000012-0000-4000-8000-000000000012',
 '**Standup - June 1**\n\n**Yesterday**: Enterprise demo prep\n**Today**: Board meeting prep\n**Blockers**: None', null, false, 'standard', '2025-12-01 09:00:00+00'),
('f0000095-0000-4000-8000-000000000095', 'c0000014-0000-4000-8000-000000000014', 'a0000008-0000-4000-8000-000000000008',
 'Component audit complete: 47 components, 32 with full a11y support, 15 need aria-label additions. Creating tickets for the gaps.', null, false, 'standard', '2025-11-15 09:00:00+00'),
('f0000096-0000-4000-8000-000000000096', 'c0000016-0000-4000-8000-000000000016', 'a0000014-0000-4000-8000-000000000014',
 'Updated the press kit with new screenshots, logos, and executive headshots. Download link in the bookmark above.', null, false, 'standard', '2025-12-01 10:00:00+00'),
('f0000097-0000-4000-8000-000000000097', 'c0000017-0000-4000-8000-000000000017', 'a0000005-0000-4000-8000-000000000005',
 'New component proposals:\n- DatePicker (with range selection)\n- TreeView (for file browsers)\n- CommandPalette (Ctrl+K style)\n- NotificationToast (with action buttons)\n\nVote on priorities in the thread below.', null, false, 'standard', '2025-10-01 09:00:00+00'),
('f0000098-0000-4000-8000-000000000098', 'c0000017-0000-4000-8000-000000000017', 'a0000008-0000-4000-8000-000000000008',
 'DatePicker + CommandPalette from me. Those are the most requested by devs.', null, false, 'standard', '2025-10-01 09:30:00+00'),
('f0000099-0000-4000-8000-000000000099', 'c0000008-0000-4000-8000-000000000008', 'a0000004-0000-4000-8000-000000000004',
 'Project Alpha status: 80% complete. Real-time sync working with up to 10 concurrent editors. Need to optimize for larger documents.', null, false, 'standard', '2025-10-01 11:00:00+00'),
('f0000100-0000-4000-8000-000000000100', 'c0000008-0000-4000-8000-000000000008', 'a0000001-0000-4000-8000-000000000001',
 'Project Alpha demo went amazing! Investors loved the real-time collaboration. Series B talks starting next week. 🚀', null, false, 'standard', '2025-10-15 17:00:00+00'),

-- Super Admin (Alex Admin) messages across all workspaces
('f0000101-0000-4000-8000-000000000101', 'c0000001-0000-4000-8000-000000000001', 'a0000016-0000-4000-8000-000000000016',
 'Platform health check: all 3 workspaces are operational. Uptime 99.97% over the last 30 days. No action required.', null, false, 'standard', '2026-01-01 09:00:00+00'),
('f0000102-0000-4000-8000-000000000102', 'c0000002-0000-4000-8000-000000000002', 'a0000016-0000-4000-8000-000000000016',
 'Security scan complete: 0 critical, 0 high, 2 medium findings. Both medium items are in third-party dependencies — no immediate action needed. Full report attached.', null, false, 'important', '2026-01-10 09:00:00+00'),
('f0000103-0000-4000-8000-000000000103', 'c0000007-0000-4000-8000-000000000007', 'a0000016-0000-4000-8000-000000000016',
 'Budget review complete for all workspaces. Acme Corp: under budget by 8%, TechStart: on track, DesignHub: 3% over due to contractor fees. Recommendation: reallocate DesignHub contractor budget to Q4.', null, false, 'urgent', '2026-01-15 10:00:00+00'),
('f0000104-0000-4000-8000-000000000104', 'c0000009-0000-4000-8000-000000000009', 'a0000016-0000-4000-8000-000000000016',
 'Welcome to TechStart! I''m the platform admin overseeing all workspaces. Feel free to reach out if you need any admin-level assistance.', null, false, 'standard', '2026-01-05 09:00:00+00'),
('f0000105-0000-4000-8000-000000000105', 'c0000010-0000-4000-8000-000000000010', 'a0000016-0000-4000-8000-000000000016',
 'Infrastructure audit: all Terraform modules up to date. DR recovery tested — RPO 15min, RTO 45min. Cloudflare firewall rules reviewed and tightened.', null, false, 'standard', '2025-12-20 09:00:00+00'),
('f0000106-0000-4000-8000-000000000106', 'c0000014-0000-4000-8000-000000000014', 'a0000016-0000-4000-8000-000000000016',
 'DesignHub workspace review: looking great! The design system v2 is a huge improvement. Let me know if you need any additional resources from the platform side.', null, false, 'standard', '2026-01-08 09:00:00+00'),
('f0000107-0000-4000-8000-000000000107', 'c0000016-0000-4000-8000-000000000016', 'a0000016-0000-4000-8000-000000000016',
 'Brand assets approved for external use. All trademarks registered. Press kit updated with new legal disclaimers.', null, false, 'standard', '2026-01-12 14:00:00+00'),

-- More TechStart messages
('f0000108-0000-4000-8000-000000000108', 'c0000009-0000-4000-8000-000000000009', 'a0000012-0000-4000-8000-000000000012',
 'Quarterly review: revenue up 22%, 5 new enterprise deals, customer satisfaction at 4.6/5. Great work everyone!', null, false, 'standard', '2025-12-30 09:00:00+00'),
('f0000109-0000-4000-8000-000000000109', 'c0000011-0000-4000-8000-000000000011', 'a0000013-0000-4000-8000-000000000013',
 '**Standup - July 1**\n\n**Yesterday**: Deployed v2.4.1 hotfix\n**Today**: Performance optimization for message list\n**Blockers**: None', null, false, 'standard', '2026-01-01 09:00:00+00'),
('f0000110-0000-4000-8000-000000000110', 'c0000011-0000-4000-8000-000000000011', 'a0000005-0000-4000-8000-000000000005',
 '**Standup - July 1**\n\n**Yesterday**: Implemented drag-and-drop file upload\n**Today**: Fix mobile keyboard overlap on iOS\n**Blockers**: Need QA sign-off on drag-and-drop', null, false, 'standard', '2026-01-01 09:05:00+00'),

-- More DesignHub messages
('f0000111-0000-4000-8000-000000000111', 'c0000014-0000-4000-8000-000000000014', 'a0000005-0000-4000-8000-000000000005',
 'Just finished the responsive audit: 94% of components pass mobile viewport testing. 3 remaining: DatePicker, TreeView, and CommandPalette need mobile-specific adjustments.', null, false, 'standard', '2026-01-10 11:00:00+00'),
('f0000112-0000-4000-8000-000000000112', 'c0000015-0000-4000-8000-000000000015', 'a0000008-0000-4000-8000-000000000008',
 'Design token update: added 12 new semantic colors for data visualization. Charts now automatically use theme-appropriate colors.', null, false, 'standard', '2026-01-14 09:00:00+00'),
('f0000113-0000-4000-8000-000000000113', 'c0000017-0000-4000-8000-000000000017', 'a0000014-0000-4000-8000-000000000014',
 'Documentation update: all component docs now include Storybook links, props tables, and live code examples. 100% coverage achieved.', null, false, 'standard', '2026-01-16 10:00:00+00'),

-- DM messages for new DM channels
('f0000114-0000-4000-8000-000000000114', 'd0000005-0000-4000-8000-000000000005', 'a0000013-0000-4000-8000-000000000013',
 'Nkechi, the database migration is ready. Want me to run it during the maintenance window?', null, false, 'standard', '2025-08-10 09:05:00+00'),
('f0000115-0000-4000-8000-000000000115', 'd0000005-0000-4000-8000-000000000005', 'a0000012-0000-4000-8000-000000000012',
 'Yes, go ahead. Schedule it for Saturday 2am EST. I''ll be online to monitor.', null, false, 'standard', '2025-08-10 09:10:00+00'),
('f0000116-0000-4000-8000-000000000116', 'd0000006-0000-4000-8000-000000000006', 'a0000007-0000-4000-8000-000000000007',
 'Raj, the new monitoring stack is live. CPU, memory, disk, and network alerts all configured.', null, false, 'standard', '2025-09-15 10:05:00+00'),
('f0000117-0000-4000-8000-000000000117', 'd0000006-0000-4000-8000-000000000006', 'a0000013-0000-4000-8000-000000000013',
 'Perfect. Can you also add a PagerDuty integration for P1 alerts?', null, false, 'standard', '2025-09-15 10:10:00+00'),
('f0000118-0000-4000-8000-000000000118', 'd0000007-0000-4000-8000-000000000007', 'a0000002-0000-4000-8000-000000000002',
 'Aisha, can you review the new onboarding flow mockups? I shared them in Figma.', null, false, 'standard', '2025-08-15 11:05:00+00'),
('f0000119-0000-4000-8000-000000000119', 'd0000007-0000-4000-8000-000000000007', 'a0000008-0000-4000-8000-000000000008',
 'On it! I''ll leave comments by end of day. The step-by-step approach looks solid.', null, false, 'standard', '2025-08-15 11:10:00+00')
ON CONFLICT (id) DO UPDATE SET
  channel_id = EXCLUDED.channel_id, user_id = EXCLUDED.user_id,
  content = EXCLUDED.content, parent_id = EXCLUDED.parent_id,
  is_pinned = EXCLUDED.is_pinned, priority = EXCLUDED.priority,
  created_at = EXCLUDED.created_at;

-- ======================================================================
-- THREAD REPLIES (auto-creates thread_metadata + thread_participants)
-- ======================================================================
INSERT INTO public.messages (id, channel_id, user_id, content, parent_id, created_at)
VALUES
-- Thread on PR review (m0000012)
('f1000001-0000-4000-8000-000000000001', 'c0000002-0000-4000-8000-000000000002', 'a0000001-0000-4000-8000-000000000001',
 'LGTM! Left one minor nit about the error message format. Approving.', 'f0000012-0000-4000-8000-000000000012', '2025-08-15 11:00:00+00'),
('f1000002-0000-4000-8000-000000000002', 'c0000002-0000-4000-8000-000000000002', 'a0000004-0000-4000-8000-000000000004',
 'Thanks Marcus! Fixed the nit and merged.', 'f0000012-0000-4000-8000-000000000012', '2025-08-15 11:30:00+00'),

-- Thread on security audit (m0000014)
('f1000003-0000-4000-8000-000000000003', 'c0000002-0000-4000-8000-000000000002', 'a0000004-0000-4000-8000-000000000004',
 'I can fix the SQL injection issue today. The parameterized query conversion should be straightforward.', 'f0000014-0000-4000-8000-000000000014', '2025-09-10 10:30:00+00'),
('f1000004-0000-4000-8000-000000000004', 'c0000002-0000-4000-8000-000000000002', 'a0000011-0000-4000-8000-000000000011',
 'The XSS one is in the markdown renderer. I''ll handle that with DOMPurify sanitization.', 'f0000014-0000-4000-8000-000000000014', '2025-09-10 10:45:00+00'),
('f1000005-0000-4000-8000-000000000005', 'c0000002-0000-4000-8000-000000000002', 'a0000003-0000-4000-8000-000000000003',
 'I''ll take the CSRF token rotation issue. Should update the middleware to validate Origin header too.', 'f0000014-0000-4000-8000-000000000014', '2025-09-10 11:00:00+00'),

-- Thread on user research (m0000021)
('f1000006-0000-4000-8000-000000000006', 'c0000003-0000-4000-8000-000000000003', 'a0000001-0000-4000-8000-000000000001',
 'The mobile experience data is concerning. What specific areas need improvement?', 'f0000021-0000-4000-8000-000000000021', '2025-07-25 09:30:00+00'),
('f1000007-0000-4000-8000-000000000007', 'c0000003-0000-4000-8000-000000000003', 'a0000002-0000-4000-8000-000000000002',
 'Top 3 complaints: 1) Keyboard covers input on iOS, 2) Sidebar hard to navigate, 3) File upload flow is clunky.', 'f0000021-0000-4000-8000-000000000021', '2025-07-25 10:00:00+00'),
('f1000008-0000-4000-8000-000000000008', 'c0000003-0000-4000-8000-000000000003', 'a0000005-0000-4000-8000-000000000005',
 'The iOS keyboard issue is a known WebKit bug. I can add a VisualViewport API workaround.', 'f0000021-0000-4000-8000-000000000021', '2025-07-25 10:15:00+00'),

-- Thread on design system (m0000024)
('f1000009-0000-4000-8000-000000000009', 'c0000003-0000-4000-8000-000000000003', 'a0000005-0000-4000-8000-000000000005',
 'Love the modular typography scale! Are you using clamp() for responsive sizing?', 'f0000024-0000-4000-8000-000000000024', '2025-08-10 10:30:00+00'),
('f1000010-0000-4000-8000-000000000010', 'c0000003-0000-4000-8000-000000000003', 'a0000008-0000-4000-8000-000000000008',
 'Yes! Using `clamp(1rem, 2.5vw, 1.5rem)` for body text. Works great across viewports.', 'f0000024-0000-4000-8000-000000000024', '2025-08-10 11:00:00+00'),

-- Thread on virtual scroll (m0000017)
('f1000011-0000-4000-8000-000000000011', 'c0000002-0000-4000-8000-000000000002', 'a0000004-0000-4000-8000-000000000004',
 'What library did you use for the virtualization?', 'f0000017-0000-4000-8000-000000000017', '2025-09-15 11:30:00+00'),
('f1000012-0000-4000-8000-000000000012', 'c0000002-0000-4000-8000-000000000002', 'a0000005-0000-4000-8000-000000000005',
 '@tanstack/react-virtual with dynamic measurement. Each message measures its own height after render.', 'f0000017-0000-4000-8000-000000000017', '2025-09-15 11:45:00+00'),
('f1000013-0000-4000-8000-000000000013', 'c0000002-0000-4000-8000-000000000002', 'a0000001-0000-4000-8000-000000000001',
 'Excellent implementation. Let''s add this pattern to our engineering docs.', 'f0000017-0000-4000-8000-000000000017', '2025-09-15 12:00:00+00'),

-- Thread on hotfix (m0000058)
('f1000014-0000-4000-8000-000000000014', 'c0000010-0000-4000-8000-000000000010', 'a0000013-0000-4000-8000-000000000013',
 'What was the memory growth rate before the fix?', 'f0000058-0000-4000-8000-000000000058', '2025-10-20 08:00:00+00'),
('f1000015-0000-4000-8000-000000000015', 'c0000010-0000-4000-8000-000000000010', 'a0000007-0000-4000-8000-000000000007',
 'About 50MB/hour. Each leaked socket held ~2KB of buffer. After fix: stable at 180MB.', 'f0000058-0000-4000-8000-000000000058', '2025-10-20 08:30:00+00'),

-- Thread on project alpha architecture (m0000049)
('f1000016-0000-4000-8000-000000000016', 'c0000008-0000-4000-8000-000000000008', 'a0000001-0000-4000-8000-000000000001',
 'CRDT vs OT: any benchmarks on which performs better for our use case?', 'f0000049-0000-4000-8000-000000000049', '2025-09-02 10:30:00+00'),
('f1000017-0000-4000-8000-000000000017', 'c0000008-0000-4000-8000-000000000008', 'a0000004-0000-4000-8000-000000000004',
 'CRDT (Yjs) handles offline-first better. OT requires a central server. For our collab feature, CRDT is the right choice.', 'f0000049-0000-4000-8000-000000000049', '2025-09-02 11:00:00+00'),

-- Thread on component proposals (m0000097)
('f1000018-0000-4000-8000-000000000018', 'c0000017-0000-4000-8000-000000000017', 'a0000014-0000-4000-8000-000000000014',
 'CommandPalette +1. Every modern app needs one. VS Code, Linear, Raycast all got it right.', 'f0000097-0000-4000-8000-000000000097', '2025-10-01 10:00:00+00'),
('f1000019-0000-4000-8000-000000000019', 'c0000017-0000-4000-8000-000000000017', 'a0000015-0000-4000-8000-000000000015',
 'I''d love to implement the CommandPalette as my first big feature! Already have some ideas from using Raycast.', 'f0000097-0000-4000-8000-000000000097', '2025-10-01 10:15:00+00'),

-- Thread on Q3 planning (m0000085)
('f1000020-0000-4000-8000-000000000020', 'c0000003-0000-4000-8000-000000000003', 'a0000001-0000-4000-8000-000000000001',
 'Mobile app is a huge undertaking. Should we do React Native or PWA-first?', 'f0000085-0000-4000-8000-000000000085', '2025-12-01 09:30:00+00'),
('f1000021-0000-4000-8000-000000000021', 'c0000003-0000-4000-8000-000000000003', 'a0000005-0000-4000-8000-000000000005',
 'PWA-first for sure. We already have the service worker. Add install prompt + offline support and we''re 80% there.', 'f0000085-0000-4000-8000-000000000085', '2025-12-01 10:00:00+00'),
('f1000022-0000-4000-8000-000000000022', 'c0000003-0000-4000-8000-000000000003', 'a0000008-0000-4000-8000-000000000008',
 'Agree on PWA. I''ll design the mobile-specific UI patterns: bottom nav, swipe gestures, pull-to-refresh.', 'f0000085-0000-4000-8000-000000000085', '2025-12-01 10:30:00+00'),

-- Thread on analytics report (m0000078)
('f1000023-0000-4000-8000-000000000023', 'c0000001-0000-4000-8000-000000000001', 'a0000001-0000-4000-8000-000000000001',
 'Search up 180%?! That''s incredible. What changed?', 'f0000078-0000-4000-8000-000000000078', '2025-09-01 09:30:00+00'),
('f1000024-0000-4000-8000-000000000024', 'c0000001-0000-4000-8000-000000000001', 'a0000010-0000-4000-8000-000000000010',
 'The autocomplete suggestions + operator hints made search discoverable. Users who try it once keep using it.', 'f0000078-0000-4000-8000-000000000078', '2025-09-01 10:00:00+00'),

-- Thread on design review (m0000064)
('f1000025-0000-4000-8000-000000000025', 'c0000015-0000-4000-8000-000000000015', 'a0000008-0000-4000-8000-000000000008',
 'Good point on tablet. I''ll add a 768-1024px breakpoint that auto-collapses to icons only.', 'f0000064-0000-4000-8000-000000000064', '2025-09-02 09:30:00+00'),
('f1000026-0000-4000-8000-000000000026', 'c0000015-0000-4000-8000-000000000015', 'a0000014-0000-4000-8000-000000000014',
 'Can we also add keyboard shortcuts for the sidebar? Cmd+1 through Cmd+9 for channel switching.', 'f0000064-0000-4000-8000-000000000064', '2025-09-02 10:00:00+00'),

-- Thread on welcome (m0000034)
('f1000027-0000-4000-8000-000000000027', 'c0000004-0000-4000-8000-000000000004', 'a0000006-0000-4000-8000-000000000006',
 'Welcome Tom! Tip #4: Don''t skip the tests. They''ll save you later. 😊', 'f0000034-0000-4000-8000-000000000034', '2025-10-01 09:50:00+00'),
('f1000028-0000-4000-8000-000000000028', 'c0000004-0000-4000-8000-000000000004', 'a0000015-0000-4000-8000-000000000015',
 'Noted! Already set up my testing environment. Running the E2E suite now.', 'f0000034-0000-4000-8000-000000000034', '2025-10-01 10:00:00+00')
ON CONFLICT (id) DO UPDATE SET
  channel_id = EXCLUDED.channel_id, user_id = EXCLUDED.user_id,
  content = EXCLUDED.content, parent_id = EXCLUDED.parent_id,
  created_at = EXCLUDED.created_at;

-- ======================================================================
-- AUGUST 2026 — Olivia joins Acme Corp, ramp-up messages
-- ======================================================================
INSERT INTO public.messages (id, channel_id, user_id, content, created_at)
VALUES
-- Olivia's first day in #general
('f0000148-0000-4000-8000-000000000148', 'c0000001-0000-4000-8000-000000000001', 'a0000001-0000-4000-8000-000000000001',
 'Welcome Olivia Foster to the team! She''s joining us as Staff Engineer. Please say hi!',
 '2026-02-01 09:00:00+00'),
('f0000149-0000-4000-8000-000000000149', 'c0000001-0000-4000-8000-000000000001', 'a0000017-0000-4000-8000-000000000017',
 'Hey everyone! Excited to be here. I come from a distributed systems background. Looking forward to contributing!',
 '2026-02-01 09:15:00+00'),
('f0000150-0000-4000-8000-000000000150', 'c0000001-0000-4000-8000-000000000001', 'a0000004-0000-4000-8000-000000000004',
 'Welcome Olivia! I''m Elena on the backend team. Happy to help with onboarding.',
 '2026-02-01 09:20:00+00'),
-- Olivia starts working on v3 features in #engineering
('f0000151-0000-4000-8000-000000000151', 'c0000002-0000-4000-8000-000000000002', 'a0000017-0000-4000-8000-000000000017',
 'Looking at the codebase — the Socket.io integration is solid. One thought: we should add heartbeat monitoring for connection health.',
 '2026-02-04 10:00:00+00'),
('f0000152-0000-4000-8000-000000000152', 'c0000002-0000-4000-8000-000000000002', 'a0000007-0000-4000-8000-000000000007',
 'Good call. We had some silent disconnects last month. Can you put together a proposal?',
 '2026-02-04 10:15:00+00'),
('f0000153-0000-4000-8000-000000000153', 'c0000002-0000-4000-8000-000000000002', 'a0000017-0000-4000-8000-000000000017',
 'Done. Proposal: add WebSocket heartbeat with 30s interval, auto-reconnect on 3 missed pings, and expose /ws-health endpoint for monitoring.',
 '2026-02-05 14:00:00+00'),
-- Olivia works on performance in #project-alpha
('f0000154-0000-4000-8000-000000000154', 'c0000008-0000-4000-8000-000000000008', 'a0000017-0000-4000-8000-000000000017',
 'Project Alpha update: message list virtualization is live. @tanstack/react-virtual with dynamic row heights. Rendering 10k messages in <200ms.',
 '2026-02-15 11:00:00+00'),
('f0000155-0000-4000-8000-000000000155', 'c0000008-0000-4000-8000-000000000008', 'a0000003-0000-4000-8000-000000000003',
 'That''s impressive. What was the before number?',
 '2026-02-15 11:05:00+00'),
('f0000156-0000-4000-8000-000000000156', 'c0000008-0000-4000-8000-000000000008', 'a0000017-0000-4000-8000-000000000017',
 'About 4.5s with the old naive rendering. 22x improvement.',
 '2026-02-15 11:10:00+00'),
-- August infrastructure discussion
('f0000157-0000-4000-8000-000000000157', 'c0000010-0000-4000-8000-000000000010', 'a0000007-0000-4000-8000-000000000007',
 'August infra report: 99.97% uptime, 2 incidents (both P2, resolved in <30min). DB connections stable at p99 12ms.',
 '2026-02-28 09:00:00+00'),
-- Super admin security audit
('f0000158-0000-4000-8000-000000000158', 'c0000002-0000-4000-8000-000000000002', 'a0000016-0000-4000-8000-000000000016',
 'August security scan: 0 critical, 0 high, 2 informational. CSP headers properly enforced. Rate limiter performing well.',
 '2026-02-28 09:00:00+00')
ON CONFLICT (id) DO NOTHING;

-- August threads (replies to Olivia's proposals)
INSERT INTO public.messages (id, channel_id, user_id, content, parent_id, created_at)
VALUES
('f1000017-0000-4000-8000-000000000017', 'c0000002-0000-4000-8000-000000000002', 'a0000004-0000-4000-8000-000000000004',
 'The heartbeat proposal is solid. I can pair on the implementation this sprint.', 'f0000153-0000-4000-8000-000000000153', '2026-02-05 15:00:00+00'),
('f1000018-0000-4000-8000-000000000018', 'c0000002-0000-4000-8000-000000000002', 'a0000017-0000-4000-8000-000000000017',
 'Great, let''s sync tomorrow at 10am.', 'f0000153-0000-4000-8000-000000000153', '2026-02-05 15:10:00+00'),
('f1000019-0000-4000-8000-000000000019', 'c0000008-0000-4000-8000-000000000008', 'a0000001-0000-4000-8000-000000000001',
 '22x is incredible. Let''s feature-flag this for a gradual rollout.', 'f0000156-0000-4000-8000-000000000156', '2026-02-15 11:15:00+00'),
('f1000020-0000-4000-8000-000000000020', 'c0000008-0000-4000-8000-000000000008', 'a0000017-0000-4000-8000-000000000017',
 'Already done — feature flag `virtual_list_v2` targeting 10% of users initially.', 'f0000156-0000-4000-8000-000000000156', '2026-02-15 11:20:00+00')
ON CONFLICT (id) DO NOTHING;

-- September 2026 — Jamal joins TechStart, TechStart and Acme activity
INSERT INTO public.messages (id, channel_id, user_id, content, created_at)
VALUES
('f0000159-0000-4000-8000-000000000159', 'c0000009-0000-4000-8000-000000000009', 'a0000012-0000-4000-8000-000000000012',
 'Welcome Jamal Williams to TechStart! He''s joining as an intern on the engineering team.',
 '2026-03-01 09:00:00+00'),
('f0000160-0000-4000-8000-000000000160', 'c0000009-0000-4000-8000-000000000009', 'a0000018-0000-4000-8000-000000000018',
 'Hi everyone! I''m a CS student at MIT. Really excited to learn from this team. Go TechStart!',
 '2026-03-01 09:15:00+00'),
('f0000161-0000-4000-8000-000000000161', 'c0000009-0000-4000-8000-000000000009', 'a0000013-0000-4000-8000-000000000013',
 'Welcome Jamal! Your first task is in the #standup channel. Check the pinned messages for your onboarding checklist.',
 '2026-03-01 09:30:00+00'),
('f0000162-0000-4000-8000-000000000162', 'c0000011-0000-4000-8000-000000000011', 'a0000018-0000-4000-8000-000000000018',
 'Standup: Working on the CSV import validator. Hit a edge case with quoted fields containing newlines. Investigating.',
 '2026-03-03 09:00:00+00'),
('f0000163-0000-4000-8000-000000000163', 'c0000011-0000-4000-8000-000000000011', 'a0000018-0000-4000-8000-000000000018',
 'Standup: CSV validator is done! Used a proper RFC 4180 parser instead of line.split. Added 12 test cases.',
 '2026-03-05 09:00:00+00'),
('f0000164-0000-4000-8000-000000000164', 'c0000010-0000-4000-8000-000000000010', 'a0000018-0000-4000-8000-000000000018',
 'Quick question: how do I run the E2E tests locally? I tried `pnpm test:e2e` but Supabase isn''t connecting.',
 '2026-03-08 14:00:00+00'),
('f0000165-0000-4000-8000-000000000165', 'c0000010-0000-4000-8000-000000000010', 'a0000007-0000-4000-8000-000000000007',
 'You need to start Supabase first: `npx supabase start`. Then run `npx supabase db reset` to load seeds. Check docs/setup.md for the full guide.',
 '2026-03-08 14:10:00+00'),
('f0000166-0000-4000-8000-000000000166', 'c0000010-0000-4000-8000-000000000010', 'a0000018-0000-4000-8000-000000000018',
 'That worked, thanks Carlos! Tests are passing now.',
 '2026-03-08 14:30:00+00'),
('f0000167-0000-4000-8000-000000000167', 'c0000003-0000-4000-8000-000000000003', 'a0000002-0000-4000-8000-000000000002',
 'Q3 retrospective results: NPS up to 62, message delivery latency p99 down to 45ms, mobile usage up 34%.',
 '2026-03-15 10:00:00+00'),
('f0000168-0000-4000-8000-000000000168', 'c0000005-0000-4000-8000-000000000005', 'a0000008-0000-4000-8000-000000000008',
 'Design review: new channel browser mockups ready for feedback. Focus on discoverability and search.',
 '2026-03-20 11:00:00+00'),
('f0000169-0000-4000-8000-000000000169', 'c0000004-0000-4000-8000-000000000004', 'a0000009-0000-4000-8000-000000000009',
 'Has anyone tried the new ramen place on 5th? 🍜',
 '2026-03-12 12:00:00+00'),
('f0000170-0000-4000-8000-000000000170', 'c0000004-0000-4000-8000-000000000004', 'a0000017-0000-4000-8000-000000000017',
 'Yes! The tonkotsu is incredible. Went there twice last week.',
 '2026-03-12 12:05:00+00'),
('f0000171-0000-4000-8000-000000000171', 'c0000004-0000-4000-8000-000000000004', 'a0000005-0000-4000-8000-000000000005',
 'Adding it to my list! We should do a team lunch there.',
 '2026-03-12 12:10:00+00')
ON CONFLICT (id) DO NOTHING;

-- September threads
INSERT INTO public.messages (id, channel_id, user_id, content, parent_id, created_at)
VALUES
('f1000021-0000-4000-8000-000000000021', 'c0000010-0000-4000-8000-000000000010', 'a0000013-0000-4000-8000-000000000013',
 'Good mentoring, Carlos. Jamal is picking things up fast.', 'f0000165-0000-4000-8000-000000000165', '2026-03-08 14:35:00+00'),
('f1000022-0000-4000-8000-000000000022', 'c0000010-0000-4000-8000-000000000010', 'a0000007-0000-4000-8000-000000000007',
 'He''s sharp. Already fixed that CSV bug faster than I expected.', 'f0000165-0000-4000-8000-000000000165', '2026-03-08 14:40:00+00')
ON CONFLICT (id) DO NOTHING;

-- ======================================================================
-- OCTOBER 2026 — Sofia joins Acme Corp
-- ======================================================================
INSERT INTO public.messages (id, channel_id, user_id, content, created_at)
VALUES
('f0000172-0000-4000-8000-000000000172', 'c0000001-0000-4000-8000-000000000001', 'a0000001-0000-4000-8000-000000000001',
 'Welcome Sofia Rodriguez! She joins us as a Designer, working with Aisha on the design system.',
 '2026-04-01 09:00:00+00'),
('f0000173-0000-4000-8000-000000000173', 'c0000001-0000-4000-8000-000000000001', 'a0000020-0000-4000-8000-000000000020',
 'Hi all! Former Figma designer here. Super excited about the design system work. Let''s make things beautiful!',
 '2026-04-01 09:15:00+00'),
('f0000174-0000-4000-8000-000000000174', 'c0000005-0000-4000-8000-000000000005', 'a0000020-0000-4000-8000-000000000020',
 'Shared updated component library in Figma. New color tokens, spacing scale, and typography system. Feedback welcome!',
 '2026-04-07 10:00:00+00'),
('f0000175-0000-4000-8000-000000000175', 'c0000005-0000-4000-8000-000000000005', 'a0000008-0000-4000-8000-000000000008',
 'These look great, Sofia! Love the new spacing scale. Can we schedule a review with engineering to discuss implementation?',
 '2026-04-07 10:30:00+00'),
('f0000176-0000-4000-8000-000000000176', 'c0000005-0000-4000-8000-000000000005', 'a0000020-0000-4000-8000-000000000020',
 'Absolutely! I''ll set up a cross-functional review for next Tuesday. Engineering + design + PM.',
 '2026-04-07 10:35:00+00'),
('f0000177-0000-4000-8000-000000000177', 'c0000002-0000-4000-8000-000000000002', 'a0000017-0000-4000-8000-000000000017',
 'Accessibility audit complete: 3 P1 issues (missing aria-labels on icon buttons, low contrast on muted text, no focus trap in modals). Fixing this sprint.',
 '2026-04-20 14:00:00+00'),
('f0000178-0000-4000-8000-000000000178', 'c0000002-0000-4000-8000-000000000002', 'a0000020-0000-4000-8000-000000000020',
 'I can help with the contrast fixes. The new color tokens have WCAG AA compliant alternatives ready.',
 '2026-04-20 14:15:00+00'),
('f0000179-0000-4000-8000-000000000179', 'c0000004-0000-4000-8000-000000000004', 'a0000020-0000-4000-8000-000000000020',
 'Anyone going to the design conference next month? I''m presenting on design tokens.',
 '2026-04-25 12:00:00+00'),
('f0000180-0000-4000-8000-000000000180', 'c0000004-0000-4000-8000-000000000004', 'a0000008-0000-4000-8000-000000000008',
 'I''ll be there! Will definitely attend your talk.',
 '2026-04-25 12:10:00+00')
ON CONFLICT (id) DO NOTHING;

-- ======================================================================
-- NOVEMBER 2026 — Ethan joins TechStart, Chen Wei active in DesignHub
-- ======================================================================
INSERT INTO public.messages (id, channel_id, user_id, content, created_at)
VALUES
('f0000181-0000-4000-8000-000000000181', 'c0000009-0000-4000-8000-000000000009', 'a0000012-0000-4000-8000-000000000012',
 'Welcome Ethan Kowalski to TechStart! He''s joining as Sales Engineer to help with enterprise clients.',
 '2026-05-01 09:00:00+00'),
('f0000182-0000-4000-8000-000000000182', 'c0000009-0000-4000-8000-000000000009', 'a0000021-0000-4000-8000-000000000021',
 'Hey TechStart! Coming from Salesforce. Excited to bridge the gap between engineering and enterprise customers.',
 '2026-05-01 09:15:00+00'),
('f0000183-0000-4000-8000-000000000183', 'c0000014-0000-4000-8000-000000000014', 'a0000019-0000-4000-8000-000000000019',
 'Q4 planning kickoff: Priority themes are — 1) Enterprise features (SSO, audit logs), 2) Performance optimization, 3) Mobile experience. Let''s discuss in standup.',
 '2026-05-03 09:00:00+00'),
('f0000184-0000-4000-8000-000000000184', 'c0000014-0000-4000-8000-000000000014', 'a0000002-0000-4000-8000-000000000002',
 'Great priorities, Chen. Enterprise features are our biggest revenue driver right now.',
 '2026-05-03 09:15:00+00'),
('f0000185-0000-4000-8000-000000000185', 'c0000014-0000-4000-8000-000000000014', 'a0000019-0000-4000-8000-000000000019',
 'Agreed. I''ve drafted a requirements doc. Key items: SAML/OIDC SSO, SCIM provisioning, compliance export, and advanced RBAC. Sending for review.',
 '2026-05-03 09:30:00+00'),
('f0000186-0000-4000-8000-000000000186', 'c0000009-0000-4000-8000-000000000009', 'a0000021-0000-4000-8000-000000000021',
 'First enterprise demo done! Client loved the real-time features. They want to discuss SSO integration next week.',
 '2026-05-15 17:00:00+00'),
('f0000187-0000-4000-8000-000000000187', 'c0000009-0000-4000-8000-000000000009', 'a0000012-0000-4000-8000-000000000012',
 'Excellent work Ethan! That''s a Fortune 500 company. Let''s make sure we nail the SSO demo.',
 '2026-05-15 17:10:00+00'),
('f0000188-0000-4000-8000-000000000188', 'c0000002-0000-4000-8000-000000000002', 'a0000017-0000-4000-8000-000000000017',
 'Shipped WebSocket heartbeat monitoring. Dashboard shows real-time connection health. Zero silent disconnects since deployment.',
 '2026-05-20 10:00:00+00'),
('f0000189-0000-4000-8000-000000000189', 'c0000002-0000-4000-8000-000000000002', 'a0000003-0000-4000-8000-000000000003',
 'Nice work Olivia! The reliability improvement is measurable. Incident rate down 60% this month.',
 '2026-05-20 10:15:00+00'),
('f0000190-0000-4000-8000-000000000190', 'c0000005-0000-4000-8000-000000000005', 'a0000020-0000-4000-8000-000000000020',
 'Design system v2.1 released! 40+ components updated with new tokens. Dark mode support added. Migration guide in the docs.',
 '2026-05-25 14:00:00+00'),
('f0000191-0000-4000-8000-000000000191', 'c0000005-0000-4000-8000-000000000005', 'a0000008-0000-4000-8000-000000000008',
 'This is fantastic. Dark mode alone will make our enterprise clients happy. Great release!',
 '2026-05-25 14:15:00+00'),
('f0000192-0000-4000-8000-000000000192', 'c0000011-0000-4000-8000-000000000011', 'a0000018-0000-4000-8000-000000000018',
 'Standup: Finished the data export feature. Supports CSV, JSON, and PDF formats. Added rate limiting to prevent abuse.',
 '2026-05-18 09:00:00+00'),
('f0000193-0000-4000-8000-000000000193', 'c0000011-0000-4000-8000-000000000011', 'a0000013-0000-4000-8000-000000000013',
 'Solid work, Jamal. You''ve grown a lot in 2 months. The code quality is impressive for an intern.',
 '2026-05-18 09:10:00+00')
ON CONFLICT (id) DO NOTHING;

-- November threads
INSERT INTO public.messages (id, channel_id, user_id, content, parent_id, created_at)
VALUES
('f1000023-0000-4000-8000-000000000023', 'c0000014-0000-4000-8000-000000000014', 'a0000005-0000-4000-8000-000000000005',
 'The SAML requirements look comprehensive. I''d add user provisioning lifecycle management as a sub-item.', 'f0000185-0000-4000-8000-000000000185', '2026-05-03 10:00:00+00'),
('f1000024-0000-4000-8000-000000000024', 'c0000014-0000-4000-8000-000000000014', 'a0000019-0000-4000-8000-000000000019',
 'Good point. Adding that to the spec. SCIM will handle the provisioning lifecycle.', 'f0000185-0000-4000-8000-000000000185', '2026-05-03 10:15:00+00'),
('f1000025-0000-4000-8000-000000000025', 'c0000002-0000-4000-8000-000000000002', 'a0000007-0000-4000-8000-000000000007',
 'The heartbeat dashboard — can you share the Grafana link? I want to add it to our ops rotation.', 'f0000188-0000-4000-8000-000000000188', '2026-05-20 10:20:00+00'),
('f1000026-0000-4000-8000-000000000026', 'c0000002-0000-4000-8000-000000000002', 'a0000017-0000-4000-8000-000000000017',
 'Sent it to you via DM. Also added an alert rule for >5% disconnect rate.', 'f0000188-0000-4000-8000-000000000188', '2026-05-20 10:25:00+00')
ON CONFLICT (id) DO NOTHING;

-- ======================================================================
-- JULY 2026 — Mid-year wrap-up, summer events
-- ======================================================================
INSERT INTO public.messages (id, channel_id, user_id, content, created_at)
VALUES
('f0000194-0000-4000-8000-000000000194', 'c0000001-0000-4000-8000-000000000001', 'a0000001-0000-4000-8000-000000000001',
 'H1 2026 Mid-Year Review: We grew from 11 to 13 team members, shipped 32 features, achieved 99.97% uptime, and reduced message latency by 85%. Great first half everyone!',
 '2026-07-10 09:00:00+00'),
('f0000195-0000-4000-8000-000000000195', 'c0000001-0000-4000-8000-000000000001', 'a0000017-0000-4000-8000-000000000017',
 'Great first half! The virtual list optimization alone saved us from losing enterprise clients. Proud to be part of this team.',
 '2026-07-10 09:15:00+00'),
('f0000196-0000-4000-8000-000000000196', 'c0000001-0000-4000-8000-000000000001', 'a0000020-0000-4000-8000-000000000020',
 'The design system v2 was a highlight for me. From 12 components to 40+, with full dark mode. Excited for H2!',
 '2026-07-10 09:20:00+00'),
('f0000197-0000-4000-8000-000000000197', 'c0000001-0000-4000-8000-000000000001', 'a0000001-0000-4000-8000-000000000001',
 'Summer team BBQ is this Friday at 5pm! Rooftop venue. Plus-ones welcome. Please RSVP in the thread.',
 '2026-07-11 10:00:00+00'),
('f0000198-0000-4000-8000-000000000198', 'c0000009-0000-4000-8000-000000000009', 'a0000012-0000-4000-8000-000000000012',
 'TechStart summer social next Thursday! Reservations at 7pm. All team members + families welcome.',
 '2026-07-12 09:00:00+00'),
('f0000199-0000-4000-8000-000000000199', 'c0000002-0000-4000-8000-000000000002', 'a0000017-0000-4000-8000-000000000017',
 'H2 2026 tech roadmap proposal: 1) GraphQL federation, 2) Edge computing for message routing, 3) AI-powered search, 4) Plugin system evaluation. Thoughts?',
 '2026-07-13 10:00:00+00'),
('f0000200-0000-4000-8000-000000000200', 'c0000002-0000-4000-8000-000000000002', 'a0000003-0000-4000-8000-000000000003',
 'Love the AI-powered search idea. We''ve been getting a lot of requests for semantic search. Let''s prioritize that.',
 '2026-07-13 10:15:00+00'),
('f0000201-0000-4000-8000-000000000201', 'c0000002-0000-4000-8000-000000000002', 'a0000004-0000-4000-8000-000000000004',
 'I''d push back on GraphQL federation — our REST API is stable and well-documented. The overhead isn''t justified yet.',
 '2026-07-13 10:30:00+00'),
('f0000202-0000-4000-8000-000000000202', 'c0000002-0000-4000-8000-000000000002', 'a0000017-0000-4000-8000-000000000017',
 'Fair point, Elena. Let''s do a deeper cost-benefit analysis next sprint. The BFF layer might give us most of the benefits without the migration.',
 '2026-07-13 10:45:00+00'),
('f0000203-0000-4000-8000-000000000203', 'c0000009-0000-4000-8000-000000000009', 'a0000021-0000-4000-8000-000000000021',
 'HUGE NEWS: Acme Corp (Fortune 500) just signed! $250K ARR deal. They specifically loved the real-time collaboration features.',
 '2026-07-14 16:00:00+00'),
('f0000204-0000-4000-8000-000000000204', 'c0000009-0000-4000-8000-000000000009', 'a0000012-0000-4000-8000-000000000012',
 'AMAZING work Ethan! This is our biggest deal yet. Company-wide bonus incoming! 🎉',
 '2026-07-14 16:05:00+00'),
('f0000205-0000-4000-8000-000000000205', 'c0000004-0000-4000-8000-000000000004', 'a0000018-0000-4000-8000-000000000018',
 'Best intern experience ever! From CSV parsing to enterprise features in 3 months. Thanks everyone for the mentorship!',
 '2026-07-15 09:00:00+00'),
('f0000206-0000-4000-8000-000000000206', 'c0000004-0000-4000-8000-000000000004', 'a0000007-0000-4000-8000-000000000007',
 'You earned it, Jamal. Hope you''ll come back next summer!',
 '2026-07-15 09:05:00+00'),
('f0000207-0000-4000-8000-000000000207', 'c0000004-0000-4000-8000-000000000004', 'a0000018-0000-4000-8000-000000000018',
 'Absolutely! Already told my professor about this internship. Next batch of interns is going to be excited.',
 '2026-07-15 09:10:00+00'),
('f0000208-0000-4000-8000-000000000208', 'c0000014-0000-4000-8000-000000000014', 'a0000019-0000-4000-8000-000000000019',
 'DesignHub H1 2026 recap: 3 product launches, 40+ design system components, NPS 65, 2 enterprise clients. Team grew by 25%. Strong first half!',
 '2026-07-14 09:00:00+00'),
('f0000209-0000-4000-8000-000000000209', 'c0000014-0000-4000-8000-000000000014', 'a0000002-0000-4000-8000-000000000002',
 'Great summary Chen. The enterprise feature set was our turning point. H2 will be even bigger!',
 '2026-07-14 09:15:00+00'),
('f0000210-0000-4000-8000-000000000210', 'c0000001-0000-4000-8000-000000000001', 'a0000001-0000-4000-8000-000000000001',
 'Enjoy the July 4th long weekend everyone! Office closed Mon. Back Tuesday ready to ship!',
 '2026-07-02 12:00:00+00'),
('f0000211-0000-4000-8000-000000000211', 'c0000001-0000-4000-8000-000000000001', 'a0000016-0000-4000-8000-000000000016',
 'Long weekend security reminder: all systems monitored, on-call rotation active. Enjoy the break — I''ve got the watch. 🫡',
 '2026-07-02 12:30:00+00'),
('f0000212-0000-4000-8000-000000000212', 'c0000002-0000-4000-8000-000000000002', 'a0000016-0000-4000-8000-000000000016',
 'Mid-year security audit complete. 0 critical, 0 high findings. All 18 RBAC permissions verified. Compliance: SOC2 Type II ready. Strong first half for security.',
 '2026-07-15 09:00:00+00')
ON CONFLICT (id) DO NOTHING;

-- July threads (RSVPs and replies)
INSERT INTO public.messages (id, channel_id, user_id, content, parent_id, created_at)
VALUES
('f1000027-0000-4000-8000-000000000027', 'c0000001-0000-4000-8000-000000000001', 'a0000003-0000-4000-8000-000000000003',
 'RSVP: +1 for me and my wife. Looking forward to it!', 'f0000197-0000-4000-8000-000000000197', '2026-07-11 10:10:00+00'),
('f1000028-0000-4000-8000-000000000028', 'c0000001-0000-4000-8000-000000000001', 'a0000017-0000-4000-8000-000000000017',
 'RSVP: Count me in! Will there be a playlist? I''ll bring my speaker.', 'f0000197-0000-4000-8000-000000000197', '2026-07-11 10:15:00+00'),
('f1000029-0000-4000-8000-000000000029', 'c0000001-0000-4000-8000-000000000001', 'a0000020-0000-4000-8000-000000000020',
 'RSVP: Yes! Bringing my partner. Can''t wait!', 'f0000197-0000-4000-8000-000000000197', '2026-07-11 10:20:00+00'),
('f1000030-0000-4000-8000-000000000030', 'c0000001-0000-4000-8000-000000000001', 'a0000001-0000-4000-8000-000000000001',
 'Great idea on the speaker, Olivia! I''ll set up a collaborative playlist.', 'f0000197-0000-4000-8000-000000000197', '2026-07-11 10:25:00+00'),
('f1000031-0000-4000-8000-000000000031', 'c0000009-0000-4000-8000-000000000009', 'a0000013-0000-4000-8000-000000000013',
 'That $250K deal is going to make our Q3 targets easy. Congrats again Ethan!', 'f0000204-0000-4000-8000-000000000204', '2026-07-14 16:10:00+00'),
('f1000032-0000-4000-8000-000000000032', 'c0000004-0000-4000-8000-000000000004', 'a0000012-0000-4000-8000-000000000012',
 'Jamal, you crushed it this internship. The data export feature is production-quality. Come back anytime!', 'f0000205-0000-4000-8000-000000000205', '2026-07-15 09:15:00+00')
ON CONFLICT (id) DO NOTHING;

-- ======================================================================
-- REACTIONS (on various messages)
-- ======================================================================
INSERT INTO public.reactions (message_id, user_id, emoji, created_at)
VALUES
-- Reactions on welcome message
('f0000001-0000-4000-8000-000000000001', 'a0000002-0000-4000-8000-000000000002', '👍', '2025-07-18 09:11:00+00'),
('f0000001-0000-4000-8000-000000000001', 'a0000003-0000-4000-8000-000000000003', '🎉', '2025-07-18 09:12:00+00'),
('f0000001-0000-4000-8000-000000000001', 'a0000004-0000-4000-8000-000000000004', '👋', '2025-07-18 09:13:00+00'),
('f0000001-0000-4000-8000-000000000001', 'a0000005-0000-4000-8000-000000000005', '👍', '2025-07-18 09:14:00+00'),
-- Reactions on code snippet
('f0000007-0000-4000-8000-000000000007', 'a0000003-0000-4000-8000-000000000003', '👍', '2025-07-20 10:35:00+00'),
('f0000007-0000-4000-8000-000000000007', 'a0000001-0000-4000-8000-000000000001', '🔥', '2025-07-20 10:40:00+00'),
-- Reactions on security audit
('f0000014-0000-4000-8000-000000000014', 'a0000001-0000-4000-8000-000000000001', '👀', '2025-09-10 09:35:00+00'),
('f0000014-0000-4000-8000-000000000014', 'a0000003-0000-4000-8000-000000000003', '👍', '2025-09-10 09:40:00+00'),
-- Reactions on funding announcement
('f0000043-0000-4000-8000-000000000043', 'a0000002-0000-4000-8000-000000000002', '🎉', '2025-09-15 09:05:00+00'),
('f0000043-0000-4000-8000-000000000043', 'a0000003-0000-4000-8000-000000000003', '🚀', '2025-09-15 09:06:00+00'),
('f0000043-0000-4000-8000-000000000043', 'a0000004-0000-4000-8000-000000000004', '🎉', '2025-09-15 09:07:00+00'),
('f0000043-0000-4000-8000-000000000043', 'a0000005-0000-4000-8000-000000000005', '🥳', '2025-09-15 09:08:00+00'),
('f0000043-0000-4000-8000-000000000043', 'a0000008-0000-4000-8000-000000000008', '🎉', '2025-09-15 09:10:00+00'),
-- Reactions on game chat
('f0000028-0000-4000-8000-000000000028', 'a0000009-0000-4000-8000-000000000009', '🏒', '2025-07-22 12:05:00+00'),
-- Reactions on hotfix
('f0000058-0000-4000-8000-000000000058', 'a0000013-0000-4000-8000-000000000013', '💪', '2025-10-20 02:10:00+00'),
('f0000058-0000-4000-8000-000000000058', 'a0000012-0000-4000-8000-000000000012', '🙏', '2025-10-20 08:00:00+00'),
-- Reactions on project alpha success
('f0000100-0000-4000-8000-000000000100', 'a0000002-0000-4000-8000-000000000002', '🚀', '2025-10-15 17:05:00+00'),
('f0000100-0000-4000-8000-000000000100', 'a0000003-0000-4000-8000-000000000003', '🎉', '2025-10-15 17:06:00+00'),
('f0000100-0000-4000-8000-000000000100', 'a0000004-0000-4000-8000-000000000004', '🔥', '2025-10-15 17:07:00+00'),
('f0000100-0000-4000-8000-000000000100', 'a0000005-0000-4000-8000-000000000005', '🎊', '2025-10-15 17:08:00+00'),
('f0000100-0000-4000-8000-000000000100', 'a0000008-0000-4000-8000-000000000008', '🚀', '2025-10-15 17:10:00+00'),
-- Reactions on NPS improvement
('f0000084-0000-4000-8000-000000000084', 'a0000001-0000-4000-8000-000000000001', '📈', '2025-11-15 10:05:00+00'),
('f0000084-0000-4000-8000-000000000084', 'a0000002-0000-4000-8000-000000000002', '🎉', '2025-11-15 10:10:00+00'),
-- Reactions on Kernel the puppy
('f0000086-0000-4000-8000-000000000086', 'a0000009-0000-4000-8000-000000000009', '😍', '2025-10-15 12:02:00+00'),
('f0000086-0000-4000-8000-000000000086', 'a0000005-0000-4000-8000-000000000005', '🐕', '2025-10-15 12:03:00+00'),
('f0000086-0000-4000-8000-000000000086', 'a0000008-0000-4000-8000-000000000008', '❤️', '2025-10-15 12:04:00+00'),
-- Reactions on performance update
('f0000093-0000-4000-8000-000000000093', 'a0000001-0000-4000-8000-000000000001', '🎉', '2025-10-15 10:05:00+00'),
('f0000093-0000-4000-8000-000000000093', 'a0000010-0000-4000-8000-000000000010', '🚀', '2025-10-15 10:10:00+00'),
-- Reactions on monthly metrics
('f0000091-0000-4000-8000-000000000091', 'a0000013-0000-4000-8000-000000000013', '📈', '2025-12-01 09:10:00+00'),
-- Reactions on tabs vs spaces
('f0000036-0000-4000-8000-000000000036', 'a0000009-0000-4000-8000-000000000009', '😤', '2025-11-10 12:02:00+00'),
('f0000036-0000-4000-8000-000000000036', 'a0000007-0000-4000-8000-000000000007', '🫡', '2025-11-10 12:03:00+00'),
('f0000037-0000-4000-8000-000000000037', 'a0000014-0000-4000-8000-000000000014', '😂', '2025-11-10 12:07:00+00'),
('f0000037-0000-4000-8000-000000000037', 'a0000010-0000-4000-8000-000000000010', '💯', '2025-11-10 12:08:00+00'),
-- Reactions on Tom's first day
('f0000055-0000-4000-8000-000000000055', 'a0000012-0000-4000-8000-000000000012', '🎉', '2025-10-01 17:05:00+00'),
('f0000055-0000-4000-8000-000000000055', 'a0000013-0000-4000-8000-000000000013', '👋', '2025-10-01 17:06:00+00'),
-- Reactions on BBQ invite
('f0000089-0000-4000-8000-000000000089', 'a0000009-0000-4000-8000-000000000009', '🍖', '2025-12-20 10:05:00+00'),
('f0000089-0000-4000-8000-000000000089', 'a0000001-0000-4000-8000-000000000001', '🍺', '2025-12-20 10:10:00+00'),
('f0000089-0000-4000-8000-000000000089', 'a0000004-0000-4000-8000-000000000004', '✅', '2025-12-20 10:15:00+00'),
-- Reactions on super admin messages
('f0000101-0000-4000-8000-000000000101', 'a0000001-0000-4000-8000-000000000001', '👍', '2026-01-01 09:05:00+00'),
('f0000101-0000-4000-8000-000000000101', 'a0000003-0000-4000-8000-000000000003', '🙏', '2026-01-01 09:10:00+00'),
('f0000102-0000-4000-8000-000000000102', 'a0000011-0000-4000-8000-000000000011', '👀', '2026-01-10 09:05:00+00'),
('f0000103-0000-4000-8000-000000000103', 'a0000008-0000-4000-8000-000000000008', '👍', '2026-01-15 10:10:00+00'),
('f0000103-0000-4000-8000-000000000103', 'a0000002-0000-4000-8000-000000000002', '📊', '2026-01-15 10:15:00+00'),
-- Reactions on quarterly review
('f0000108-0000-4000-8000-000000000108', 'a0000013-0000-4000-8000-000000000013', '🎉', '2025-12-30 09:05:00+00'),
('f0000108-0000-4000-8000-000000000108', 'a0000007-0000-4000-8000-000000000007', '🚀', '2025-12-30 09:10:00+00'),
('f0000108-0000-4000-8000-000000000108', 'a0000015-0000-4000-8000-000000000015', '📈', '2025-12-30 09:15:00+00'),
-- Reactions on responsive audit
('f0000111-0000-4000-8000-000000000111', 'a0000008-0000-4000-8000-000000000008', '💪', '2026-01-10 11:05:00+00'),
('f0000111-0000-4000-8000-000000000111', 'a0000002-0000-4000-8000-000000000002', '🎉', '2026-01-10 11:10:00+00'),
-- Reactions on documentation update
('f0000113-0000-4000-8000-000000000113', 'a0000008-0000-4000-8000-000000000008', '🙌', '2026-01-16 10:05:00+00'),
('f0000113-0000-4000-8000-000000000113', 'a0000005-0000-4000-8000-000000000005', '🔥', '2026-01-16 10:10:00+00'),
-- Reactions on Olivia's welcome
('f0000148-0000-4000-8000-000000000148', 'a0000003-0000-4000-8000-000000000003', '👋', '2026-02-01 09:05:00+00'),
('f0000148-0000-4000-8000-000000000148', 'a0000005-0000-4000-8000-000000000005', '🎉', '2026-02-01 09:06:00+00'),
('f0000148-0000-4000-8000-000000000148', 'a0000007-0000-4000-8000-000000000007', '🙌', '2026-02-01 09:07:00+00'),
-- Reactions on virtualization achievement
('f0000156-0000-4000-8000-000000000156', 'a0000001-0000-4000-8000-000000000001', '🚀', '2026-02-15 11:12:00+00'),
('f0000156-0000-4000-8000-000000000156', 'a0000008-0000-4000-8000-000000000008', '💪', '2026-02-15 11:13:00+00'),
('f0000156-0000-4000-8000-000000000156', 'a0000004-0000-4000-8000-000000000004', '🎉', '2026-02-15 11:14:00+00'),
-- Reactions on Jamal's welcome
('f0000159-0000-4000-8000-000000000159', 'a0000007-0000-4000-8000-000000000007', '👋', '2026-03-01 09:05:00+00'),
('f0000159-0000-4000-8000-000000000159', 'a0000015-0000-4000-8000-000000000015', '🎉', '2026-03-01 09:06:00+00'),
-- Reactions on Jamal's CSV fix
('f0000163-0000-4000-8000-000000000163', 'a0000013-0000-4000-8000-000000000013', '💪', '2026-03-05 09:05:00+00'),
('f0000163-0000-4000-8000-000000000163', 'a0000007-0000-4000-8000-000000000007', '🔥', '2026-03-05 09:06:00+00'),
-- Reactions on Sofia's welcome
('f0000172-0000-4000-8000-000000000172', 'a0000008-0000-4000-8000-000000000008', '👋', '2026-04-01 09:05:00+00'),
('f0000172-0000-4000-8000-000000000172', 'a0000005-0000-4000-8000-000000000005', '🎉', '2026-04-01 09:06:00+00'),
-- Reactions on accessibility audit
('f0000177-0000-4000-8000-000000000177', 'a0000020-0000-4000-8000-000000000020', '✅', '2026-04-20 14:05:00+00'),
('f0000177-0000-4000-8000-000000000177', 'a0000003-0000-4000-8000-000000000003', '💪', '2026-04-20 14:06:00+00'),
-- Reactions on Ethan's deal
('f0000203-0000-4000-8000-000000000203', 'a0000013-0000-4000-8000-000000000013', '🎉', '2026-06-18 16:01:00+00'),
('f0000203-0000-4000-8000-000000000203', 'a0000001-0000-4000-8000-000000000001', '🚀', '2026-06-18 16:02:00+00'),
('f0000203-0000-4000-8000-000000000203', 'a0000021-0000-4000-8000-000000000021', '💰', '2026-06-18 16:03:00+00'),
-- Reactions on mid-year review
('f0000194-0000-4000-8000-000000000194', 'a0000017-0000-4000-8000-000000000017', '🎉', '2026-07-10 09:05:00+00'),
('f0000194-0000-4000-8000-000000000194', 'a0000020-0000-4000-8000-000000000020', '🚀', '2026-07-10 09:06:00+00'),
('f0000194-0000-4000-8000-000000000194', 'a0000012-0000-4000-8000-000000000012', '📈', '2026-07-10 09:07:00+00'),
-- Reactions on long weekend message
('f0000210-0000-4000-8000-000000000210', 'a0000017-0000-4000-8000-000000000017', '🎉', '2026-07-02 12:05:00+00'),
('f0000210-0000-4000-8000-000000000210', 'a0000020-0000-4000-8000-000000000020', '🏖️', '2026-07-02 12:06:00+00'),
('f0000210-0000-4000-8000-000000000210', 'a0000018-0000-4000-8000-000000000018', '🔥', '2026-07-02 12:07:00+00'),
-- Reactions on security audit
('f0000212-0000-4000-8000-000000000212', 'a0000011-0000-4000-8000-000000000011', '🛡️', '2026-07-15 09:05:00+00'),
('f0000212-0000-4000-8000-000000000212', 'a0000001-0000-4000-8000-000000000001', '💪', '2026-07-15 09:06:00+00')
ON CONFLICT (message_id, user_id, emoji) DO NOTHING;

-- ======================================================================
-- MESSAGE EDIT HISTORY
-- ======================================================================
INSERT INTO public.message_edit_history (message_id, previous_content, edited_by, edited_at)
VALUES
('f0000007-0000-4000-8000-000000000007',
 'CREATE TABLE workspaces (id UUID PRIMARY KEY, name TEXT, slug TEXT UNIQUE, owner_id UUID);',
 'a0000004-0000-4000-8000-000000000004', '2025-07-20 10:35:00+00'),
('f0000007-0000-4000-8000-000000000007',
 'CREATE TABLE workspaces (id UUID PRIMARY KEY, name TEXT NOT NULL, slug TEXT UNIQUE, owner_id UUID);',
 'a0000004-0000-4000-8000-000000000004', '2025-07-20 10:40:00+00'),
('f0000019-0000-4000-8000-000000000019',
 'Sprint planning: Q2 priorities are: 1. Real-time notifications 2. Threaded conversations 3. File upload/download',
 'a0000001-0000-4000-8000-000000000001', '2025-09-01 09:10:00+00'),
('f0000067-0000-4000-8000-000000000067',
 'Hey Nkechi, wanted to discuss the partnership.',
 'a0000001-0000-4000-8000-000000000001', '2025-07-20 10:10:00+00')
ON CONFLICT DO NOTHING;

-- Update the edited messages with edited_at timestamp
UPDATE public.messages SET edited_at = '2025-07-20 10:40:00+00' WHERE id = 'f0000007-0000-4000-8000-000000000007';
UPDATE public.messages SET edited_at = '2025-09-01 09:10:00+00', content = 'Sprint planning: Q2 priorities are:\n1. Real-time notifications (Socket.io)\n2. Threaded conversations\n3. File upload/download\n4. Search improvements\n\nLet''s discuss assignments in the standup.' WHERE id = 'f0000019-0000-4000-8000-000000000019';
UPDATE public.messages SET edited_at = '2025-07-20 10:10:00+00', content = 'Hey Nkechi, wanted to discuss the partnership opportunity. Are you free for a call this week?' WHERE id = 'f0000067-0000-4000-8000-000000000067';

-- Super admin multi-edit chain (edited 3 times, shows revision history)
INSERT INTO public.message_edit_history (message_id, previous_content, edited_by, edited_at)
VALUES
('f0000102-0000-4000-8000-000000000102', 'Security scan complete: 1 medium finding in auth middleware.',
 'a0000016-0000-4000-8000-000000000016', '2026-01-10 08:30:00+00'),
('f0000102-0000-4000-8000-000000000102', 'Security scan complete: 2 medium findings. One in auth middleware, one in webhook handler.',
 'a0000016-0000-4000-8000-000000000016', '2026-01-10 08:45:00+00'),
('f0000027-0000-4000-8000-000000000027', 'Q3 planning doc draft.',
 'a0000002-0000-4000-8000-000000000002', '2025-12-14 16:00:00+00'),
-- Olivia's edited messages
('f0000153-0000-4000-8000-000000000153', 'Propose adding WebSocket heartbeat monitoring.',
 'a0000017-0000-4000-8000-000000000017', '2026-02-05 13:00:00+00'),
('f0000199-0000-4000-8000-000000000199', 'H2 2026 tech roadmap: AI search, plugins, edge computing.',
 'a0000017-0000-4000-8000-000000000017', '2026-07-13 09:30:00+00')
ON CONFLICT DO NOTHING;

UPDATE public.messages SET edited_at = '2026-02-05 14:00:00+00', content = 'Done. Proposal: add WebSocket heartbeat with 30s interval, auto-reconnect on 3 missed pings, and expose /ws-health endpoint for monitoring. Priority: HIGH (prevents silent disconnects).' WHERE id = 'f0000153-0000-4000-8000-000000000153';
UPDATE public.messages SET edited_at = '2026-07-13 10:00:00+00' WHERE id = 'f0000199-0000-4000-8000-000000000199';

UPDATE public.messages SET edited_at = '2026-01-10 09:00:00+00' WHERE id = 'f0000102-0000-4000-8000-000000000102';
UPDATE public.messages SET edited_at = '2025-12-15 10:00:00+00', content = 'Q3 planning doc is ready. Major themes: accessibility audit, mobile-first redesign, and performance optimization.' WHERE id = 'f0000027-0000-4000-8000-000000000027';

-- ======================================================================
-- MESSAGE FLAGS (bookmarked/flagged messages)
-- ======================================================================
INSERT INTO public.message_flags (user_id, message_id, created_at)
VALUES
('a0000001-0000-4000-8000-000000000001', 'f0000014-0000-4000-8000-000000000014', '2025-09-10 09:35:00+00'),
('a0000001-0000-4000-8000-000000000001', 'f0000019-0000-4000-8000-000000000019', '2025-09-01 09:05:00+00'),
('a0000002-0000-4000-8000-000000000002', 'f0000021-0000-4000-8000-000000000021', '2025-07-25 09:05:00+00'),
('a0000003-0000-4000-8000-000000000003', 'f0000012-0000-4000-8000-000000000012', '2025-08-15 10:35:00+00'),
('a0000012-0000-4000-8000-000000000012', 'f0000043-0000-4000-8000-000000000043', '2025-09-15 09:05:00+00'),
('a0000004-0000-4000-8000-000000000004', 'f0000049-0000-4000-8000-000000000049', '2025-09-02 10:05:00+00'),
('a0000011-0000-4000-8000-000000000011', 'f0000080-0000-4000-8000-000000000080', '2025-11-15 09:05:00+00'),
('a0000016-0000-4000-8000-000000000016', 'f0000102-0000-4000-8000-000000000102', '2026-01-10 09:05:00+00'),
('a0000016-0000-4000-8000-000000000016', 'f0000103-0000-4000-8000-000000000103', '2026-01-15 10:05:00+00'),
('a0000003-0000-4000-8000-000000000003', 'f0000099-0000-4000-8000-000000000099', '2025-10-01 11:05:00+00'),
('a0000012-0000-4000-8000-000000000012', 'f0000108-0000-4000-8000-000000000108', '2025-12-30 09:05:00+00'),
-- New user flags
('a0000017-0000-4000-8000-000000000017', 'f0000153-0000-4000-8000-000000000153', '2026-02-05 14:05:00+00'),
('a0000017-0000-4000-8000-000000000017', 'f0000199-0000-4000-8000-000000000199', '2026-06-20 10:05:00+00'),
('a0000019-0000-4000-8000-000000000019', 'f0000185-0000-4000-8000-000000000185', '2026-05-03 09:35:00+00'),
('a0000020-0000-4000-8000-000000000020', 'f0000190-0000-4000-8000-000000000190', '2026-05-25 14:05:00+00'),
('a0000021-0000-4000-8000-000000000021', 'f0000203-0000-4000-8000-000000000203', '2026-06-18 16:05:00+00')
ON CONFLICT (user_id, message_id) DO NOTHING;

-- ======================================================================
-- MESSAGE READS (simulating read receipts)
-- ======================================================================
-- MESSAGE READS (simulating read receipts)
-- For each of the first 60 root messages, mark as read by 11 common users (excluding the author)
INSERT INTO public.message_reads (message_id, user_id, channel_id, read_at)
SELECT m.id, r.user_id, m.channel_id, m.created_at + interval '5 minutes'
FROM (
  SELECT id, channel_id, user_id, created_at
  FROM public.messages
  WHERE parent_id IS NULL
  ORDER BY created_at
  LIMIT 60
) m
CROSS JOIN (VALUES
  ('a0000001-0000-4000-8000-000000000001'::uuid),
  ('a0000002-0000-4000-8000-000000000002'::uuid),
  ('a0000003-0000-4000-8000-000000000003'::uuid),
  ('a0000004-0000-4000-8000-000000000004'::uuid),
  ('a0000005-0000-4000-8000-000000000005'::uuid),
  ('a0000006-0000-4000-8000-000000000006'::uuid),
  ('a0000016-0000-4000-8000-000000000016'::uuid),
  ('a0000017-0000-4000-8000-000000000017'::uuid),
  ('a0000018-0000-4000-8000-000000000018'::uuid),
  ('a0000019-0000-4000-8000-000000000019'::uuid),
  ('a0000020-0000-4000-8000-000000000020'::uuid),
  ('a0000021-0000-4000-8000-000000000021'::uuid)
) AS r(user_id)
WHERE r.user_id != m.user_id
ON CONFLICT (message_id, user_id) DO NOTHING;

-- ======================================================================
-- SCHEDULED POSTS (future messages)
-- ======================================================================
INSERT INTO public.scheduled_posts (user_id, channel_id, content, scheduled_at, created_at)
VALUES
('a0000002-0000-4000-8000-000000000002', 'c0000003-0000-4000-8000-000000000003',
 'Weekly product update: 3 new features shipped, 2 bug fixes deployed. See the release notes in #engineering.',
 '2026-01-21 09:00:00+00', '2026-01-18 09:00:00+00'),
('a0000001-0000-4000-8000-000000000001', 'c0000001-0000-4000-8000-000000000001',
 'Reminder: All-hands meeting tomorrow at 2pm EST. Please review the Q3 roadmap beforehand.',
 '2026-01-22 08:00:00+00', '2026-01-18 09:00:00+00'),
('a0000007-0000-4000-8000-000000000007', 'c0000010-0000-4000-8000-000000000010',
 'Infrastructure maintenance complete. All systems nominal. New monitoring dashboard is live at grafana.example.com.',
 '2026-01-25 06:00:00+00', '2026-01-18 09:00:00+00'),
('a0000012-0000-4000-8000-000000000012', 'c0000009-0000-4000-8000-000000000009',
 'Happy Friday team! Great week of progress. Enjoy the weekend. 🎉',
 '2026-01-25 17:00:00+00', '2026-01-18 09:00:00+00'),
-- New user scheduled posts
('a0000017-0000-4000-8000-000000000017', 'c0000002-0000-4000-8000-000000000002',
 'Sprint planning reminder: Please review the backlog before standup tomorrow. Focus items: heartbeat monitoring, virtual list v2 rollout.',
 '2026-02-10 08:00:00+00', '2026-02-08 16:00:00+00'),
('a0000019-0000-4000-8000-000000000019', 'c0000014-0000-4000-8000-000000000014',
 'Q4 OKR review reminder: Please update your key results in the tracking sheet before Friday.',
 '2026-06-01 09:00:00+00', '2026-05-29 10:00:00+00')
ON CONFLICT DO NOTHING;

-- ======================================================================
-- MESSAGE REMINDERS
-- ======================================================================
INSERT INTO public.message_reminders (user_id, message_id, remind_at, created_at, notified)
VALUES
('a0000001-0000-4000-8000-000000000001', 'f0000027-0000-4000-8000-000000000027',
 '2026-01-01 09:00:00+00', '2025-12-15 10:05:00+00', false),
('a0000003-0000-4000-8000-000000000003', 'f0000014-0000-4000-8000-000000000014',
 '2025-09-17 09:00:00+00', '2025-09-10 10:00:00+00', true),
('a0000002-0000-4000-8000-000000000002', 'f0000085-0000-4000-8000-000000000085',
 '2025-12-15 09:00:00+00', '2025-12-01 09:05:00+00', false),
('a0000016-0000-4000-8000-000000000016', 'f0000103-0000-4000-8000-000000000103',
 '2026-01-20 09:00:00+00', '2026-01-15 10:10:00+00', false),
('a0000012-0000-4000-8000-000000000012', 'f0000108-0000-4000-8000-000000000108',
 '2026-01-05 09:00:00+00', '2025-12-30 09:10:00+00', true),
('a0000007-0000-4000-8000-000000000007', 'f0000058-0000-4000-8000-000000000058',
 '2025-10-21 09:00:00+00', '2025-10-20 08:35:00+00', true),
('a0000017-0000-4000-8000-000000000017', 'f0000199-0000-4000-8000-000000000199',
 '2026-07-05 09:00:00+00', '2026-06-20 10:50:00+00', false),
('a0000019-0000-4000-8000-000000000019', 'f0000185-0000-4000-8000-000000000185',
 '2026-05-10 09:00:00+00', '2026-05-03 09:35:00+00', false)
ON CONFLICT DO NOTHING;

-- ======================================================================
-- CHANNEL MEMBER HISTORY (join/leave events)
-- ======================================================================
-- Most joins are logged by the trigger on channel_members INSERT. Add some leave events.
INSERT INTO public.channel_member_history (channel_id, user_id, event, created_at)
VALUES
-- No actual leaves, but the triggers already logged joins. Add a few manual history entries.
('c0000004-0000-4000-8000-000000000004', 'a0000006-0000-4000-8000-000000000006', 'left', '2025-11-01 09:00:00+00'),
('c0000004-0000-4000-8000-000000000004', 'a0000006-0000-4000-8000-000000000006', 'joined', '2025-11-15 09:00:00+00'),
('c0000003-0000-4000-8000-000000000003', 'a0000010-0000-4000-8000-000000000010', 'joined', '2025-08-01 09:00:00+00'),
('c0000008-0000-4000-8000-000000000008', 'a0000006-0000-4000-8000-000000000006', 'joined', '2025-09-05 09:00:00+00'),
('c0000008-0000-4000-8000-000000000008', 'a0000009-0000-4000-8000-000000000009', 'joined', '2025-09-10 09:00:00+00'),
('c0000010-0000-4000-8000-000000000010', 'a0000015-0000-4000-8000-000000000015', 'joined', '2025-10-02 09:00:00+00'),
('c0000011-0000-4000-8000-000000000011', 'a0000007-0000-4000-8000-000000000007', 'joined', '2025-09-01 09:00:00+00'),
('c0000017-0000-4000-8000-000000000017', 'a0000015-0000-4000-8000-000000000015', 'joined', '2025-10-05 09:00:00+00'),
-- New user channel history
('c0000001-0000-4000-8000-000000000001', 'a0000017-0000-4000-8000-000000000017', 'joined', '2026-02-01 09:00:00+00'),
('c0000002-0000-4000-8000-000000000002', 'a0000017-0000-4000-8000-000000000017', 'joined', '2026-02-01 09:00:00+00'),
('c0000009-0000-4000-8000-000000000009', 'a0000018-0000-4000-8000-000000000018', 'joined', '2026-03-01 09:00:00+00'),
('c0000014-0000-4000-8000-000000000014', 'a0000019-0000-4000-8000-000000000019', 'joined', '2026-01-01 09:00:00+00'),
('c0000001-0000-4000-8000-000000000001', 'a0000020-0000-4000-8000-000000000020', 'joined', '2026-04-01 09:00:00+00'),
('c0000005-0000-4000-8000-000000000005', 'a0000020-0000-4000-8000-000000000020', 'joined', '2026-04-01 09:00:00+00'),
('c0000009-0000-4000-8000-000000000009', 'a0000021-0000-4000-8000-000000000021', 'joined', '2026-05-01 09:00:00+00'),
('c0000011-0000-4000-8000-000000000011', 'a0000021-0000-4000-8000-000000000021', 'joined', '2026-05-01 09:00:00+00')
ON CONFLICT DO NOTHING;

-- Re-enable read-only trigger
ALTER TABLE public.messages ENABLE TRIGGER check_read_only_on_insert;

commit;
