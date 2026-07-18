-- 02_comprehensive_channels.sql
-- 18 channels across 3 workspaces: public, private, DM, and group.
-- Includes channel members, notification prefs, bookmarks, and role overrides.

begin;

-- Cleanup (in dependency order)
DELETE FROM public.channel_role_overrides WHERE channel_id IN (
  SELECT id FROM public.channels WHERE workspace_id IN (
    'b0000001-0000-4000-8000-000000000001','b0000002-0000-4000-8000-000000000002','b0000003-0000-4000-8000-000000000003'
  )
);
DELETE FROM public.channel_bookmarks WHERE channel_id IN (
  SELECT id FROM public.channels WHERE workspace_id IN (
    'b0000001-0000-4000-8000-000000000001','b0000002-0000-4000-8000-000000000002','b0000003-0000-4000-8000-000000000003'
  )
);
DELETE FROM public.channel_notification_preferences WHERE channel_id IN (
  SELECT id FROM public.channels WHERE workspace_id IN (
    'b0000001-0000-4000-8000-000000000001','b0000002-0000-4000-8000-000000000002','b0000003-0000-4000-8000-000000000003'
  )
);
DELETE FROM public.message_reads WHERE channel_id IN (
  SELECT id FROM public.channels WHERE workspace_id IN (
    'b0000001-0000-4000-8000-000000000001','b0000002-0000-4000-8000-000000000002','b0000003-0000-4000-8000-000000000003'
  )
);
DELETE FROM public.channel_member_history WHERE channel_id IN (
  SELECT id FROM public.channels WHERE workspace_id IN (
    'b0000001-0000-4000-8000-000000000001','b0000002-0000-4000-8000-000000000002','b0000003-0000-4000-8000-000000000003'
  )
);
DELETE FROM public.scheduled_posts WHERE channel_id IN (
  SELECT id FROM public.channels WHERE workspace_id IN (
    'b0000001-0000-4000-8000-000000000001','b0000002-0000-4000-8000-000000000002','b0000003-0000-4000-8000-000000000003'
  )
);
DELETE FROM public.dm_members WHERE channel_id IN (
  SELECT id FROM public.channels WHERE channel_type IN ('dm','group')
);
DELETE FROM public.dm_channels WHERE channel_id IN (
  SELECT id FROM public.channels WHERE channel_type IN ('dm','group')
);
DELETE FROM public.channel_members WHERE channel_id IN (
  SELECT id FROM public.channels WHERE workspace_id IN (
    'b0000001-0000-4000-8000-000000000001','b0000002-0000-4000-8000-000000000002','b0000003-0000-4000-8000-000000000003'
  )
);
DELETE FROM public.channels WHERE workspace_id IN (
  'b0000001-0000-4000-8000-000000000001','b0000002-0000-4000-8000-000000000002','b0000003-0000-4000-8000-000000000003'
);

-- ======================================================================
-- CHANNELS (18 total)
-- ======================================================================
-- Acme Corp (8 channels): general, engineering, product, random, design, announcements, leadership (private), project-alpha (private)
-- TechStart (5 channels): general, devops, standup, marketing, leadership (private)
-- DesignHub (5 channels): general, design-reviews (private), brand-assets, ui-components, freelance-chat

INSERT INTO public.channels (id, workspace_id, name, slug, topic, channel_type, is_private, is_read_only, created_by, sort_order, created_at, updated_at)
VALUES
-- Acme Corp channels
('c0000001-0000-4000-8000-000000000001', 'b0000001-0000-4000-8000-000000000001', 'general', 'general',
 'Company-wide updates and discussions', 'public', false, false,
 'a0000001-0000-4000-8000-000000000001', 0, '2025-07-18 09:01:00+00', '2025-07-18 09:01:00+00'),
('c0000002-0000-4000-8000-000000000002', 'b0000001-0000-4000-8000-000000000001', 'engineering', 'engineering',
 'Technical discussions, architecture decisions, code reviews', 'public', false, false,
 'a0000001-0000-4000-8000-000000000001', 1, '2025-07-18 09:02:00+00', '2025-07-18 09:02:00+00'),
('c0000003-0000-4000-8000-000000000003', 'b0000001-0000-4000-8000-000000000001', 'product', 'product',
 'Product roadmap, feature requests, user feedback', 'public', false, false,
 'a0000002-0000-4000-8000-000000000002', 2, '2025-07-18 09:03:00+00', '2025-07-18 09:03:00+00'),
('c0000004-0000-4000-8000-000000000004', 'b0000001-0000-4000-8000-000000000001', 'random', 'random',
 'Off-topic conversations, memes, water cooler chat', 'public', false, false,
 'a0000001-0000-4000-8000-000000000001', 3, '2025-07-18 09:04:00+00', '2025-07-18 09:04:00+00'),
('c0000005-0000-4000-8000-000000000005', 'b0000001-0000-4000-8000-000000000001', 'design', 'design',
 'Design system, UI/UX reviews, mockups', 'public', false, false,
 'a0000008-0000-4000-8000-000000000008', 4, '2025-08-10 09:31:00+00', '2025-08-10 09:31:00+00'),
('c0000006-0000-4000-8000-000000000006', 'b0000001-0000-4000-8000-000000000001', 'announcements', 'announcements',
 'Important company announcements - admins only post', 'public', false, true,
 'a0000001-0000-4000-8000-000000000001', 5, '2025-07-18 09:05:00+00', '2025-07-18 09:05:00+00'),
('c0000007-0000-4000-8000-000000000007', 'b0000001-0000-4000-8000-000000000001', 'leadership', 'leadership',
 'Private channel for leadership team discussions', 'private', true, false,
 'a0000001-0000-4000-8000-000000000001', 6, '2025-07-20 10:00:00+00', '2025-07-20 10:00:00+00'),
('c0000008-0000-4000-8000-000000000008', 'b0000001-0000-4000-8000-000000000001', 'project-alpha', 'project-alpha',
 'Project Alpha - Q2/Q3 launch initiative', 'private', true, false,
 'a0000001-0000-4000-8000-000000000001', 7, '2025-09-01 09:00:00+00', '2025-09-01 09:00:00+00'),
-- TechStart channels
('c0000009-0000-4000-8000-000000000009', 'b0000002-0000-4000-8000-000000000002', 'general', 'general',
 'General discussion for TechStart', 'public', false, false,
 'a0000012-0000-4000-8000-000000000012', 0, '2025-07-18 08:01:00+00', '2025-07-18 08:01:00+00'),
('c0000010-0000-4000-8000-000000000010', 'b0000002-0000-4000-8000-000000000002', 'devops', 'devops',
 'Infrastructure, deployments, monitoring', 'public', false, false,
 'a0000013-0000-4000-8000-000000000013', 1, '2025-07-18 08:02:00+00', '2025-07-18 08:02:00+00'),
('c0000011-0000-4000-8000-000000000011', 'b0000002-0000-4000-8000-000000000002', 'standup', 'standup',
 'Daily standup updates - post your updates here', 'public', false, false,
 'a0000012-0000-4000-8000-000000000012', 2, '2025-07-18 08:03:00+00', '2025-07-18 08:03:00+00'),
('c0000012-0000-4000-8000-000000000012', 'b0000002-0000-4000-8000-000000000002', 'marketing', 'marketing',
 'Marketing campaigns, content strategy', 'public', false, false,
 'a0000012-0000-4000-8000-000000000012', 3, '2025-08-01 09:00:00+00', '2025-08-01 09:00:00+00'),
('c0000013-0000-4000-8000-000000000013', 'b0000002-0000-4000-8000-000000000002', 'leadership', 'leadership',
 'TechStart leadership private channel', 'private', true, false,
 'a0000012-0000-4000-8000-000000000012', 4, '2025-07-18 08:04:00+00', '2025-07-18 08:04:00+00'),
-- DesignHub channels
('c0000014-0000-4000-8000-000000000014', 'b0000003-0000-4000-8000-000000000003', 'general', 'general',
 'DesignHub general discussion', 'public', false, false,
 'a0000002-0000-4000-8000-000000000002', 0, '2025-08-01 09:01:00+00', '2025-08-01 09:01:00+00'),
('c0000015-0000-4000-8000-000000000015', 'b0000003-0000-4000-8000-000000000003', 'design-reviews', 'design-reviews',
 'Share designs for feedback and critique', 'private', true, false,
 'a0000008-0000-4000-8000-000000000008', 1, '2025-08-10 09:32:00+00', '2025-08-10 09:32:00+00'),
('c0000016-0000-4000-8000-000000000016', 'b0000003-0000-4000-8000-000000000003', 'brand-assets', 'brand-assets',
 'Logos, brand guidelines, marketing materials', 'public', false, false,
 'a0000002-0000-4000-8000-000000000002', 2, '2025-08-01 09:02:00+00', '2025-08-01 09:02:00+00'),
('c0000017-0000-4000-8000-000000000017', 'b0000003-0000-4000-8000-000000000003', 'ui-components', 'ui-components',
 'Shared component library discussions', 'public', false, false,
 'a0000008-0000-4000-8000-000000000008', 3, '2025-09-01 09:00:00+00', '2025-09-01 09:00:00+00')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, slug = EXCLUDED.slug, topic = EXCLUDED.topic,
  channel_type = EXCLUDED.channel_type, is_private = EXCLUDED.is_private,
  is_read_only = EXCLUDED.is_read_only, sort_order = EXCLUDED.sort_order,
  updated_at = EXCLUDED.updated_at;

-- ======================================================================
-- DM CHANNELS (3 DMs + 1 group DM)
-- ======================================================================
-- First create the DM channels as regular channels (required by dm_channels FK)
INSERT INTO public.channels (id, workspace_id, name, slug, channel_type, is_private, created_by, created_at, updated_at)
VALUES
('d0000001-0000-4000-8000-000000000001', 'b0000001-0000-4000-8000-000000000001', 'dm-marcus-nkechi', 'dm-marcus-nkechi', 'dm', true, 'a0000001-0000-4000-8000-000000000001', '2025-07-20 10:00:00+00', '2025-07-20 10:00:00+00'),
('d0000002-0000-4000-8000-000000000002', 'b0000001-0000-4000-8000-000000000001', 'dm-elena-jake', 'dm-elena-jake', 'dm', true, 'a0000004-0000-4000-8000-000000000004', '2025-08-01 09:00:00+00', '2025-08-01 09:00:00+00'),
('d0000003-0000-4000-8000-000000000003', 'b0000001-0000-4000-8000-000000000001', 'dm-tyler-aisha', 'dm-tyler-aisha', 'dm', true, 'a0000005-0000-4000-8000-000000000005', '2025-09-01 09:00:00+00', '2025-09-01 09:00:00+00'),
-- TechStart DMs
('d0000005-0000-4000-8000-000000000005', 'b0000002-0000-4000-8000-000000000002', 'dm-raj-nkechi', 'dm-raj-nkechi', 'dm', true, 'a0000013-0000-4000-8000-000000000013', '2025-08-10 09:00:00+00', '2025-08-10 09:00:00+00'),
('d0000006-0000-4000-8000-000000000006', 'b0000002-0000-4000-8000-000000000002', 'dm-carlos-raj', 'dm-carlos-raj', 'dm', true, 'a0000007-0000-4000-8000-000000000007', '2025-09-15 10:00:00+00', '2025-09-15 10:00:00+00'),
-- DesignHub DM
('d0000007-0000-4000-8000-000000000007', 'b0000003-0000-4000-8000-000000000003', 'dm-sarah-aisha', 'dm-sarah-aisha', 'dm', true, 'a0000002-0000-4000-8000-000000000002', '2025-08-15 11:00:00+00', '2025-08-15 11:00:00+00')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.dm_channels (channel_id, user1_id, user2_id, created_at)
VALUES
-- DM: Marcus <-> Nkechi (cross-workspace)
('d0000001-0000-4000-8000-000000000001', 'a0000001-0000-4000-8000-000000000001', 'a0000012-0000-4000-8000-000000000012', '2025-07-20 10:00:00+00'),
-- DM: Elena <-> Jake
('d0000002-0000-4000-8000-000000000002', 'a0000004-0000-4000-8000-000000000004', 'a0000003-0000-4000-8000-000000000003', '2025-08-01 09:00:00+00'),
-- DM: Tyler <-> Aisha (design sync)
('d0000003-0000-4000-8000-000000000003', 'a0000005-0000-4000-8000-000000000005', 'a0000008-0000-4000-8000-000000000008', '2025-09-01 09:00:00+00'),
-- DM: Raj <-> Nkechi (TechStart internal)
('d0000005-0000-4000-8000-000000000005', 'a0000013-0000-4000-8000-000000000013', 'a0000012-0000-4000-8000-000000000012', '2025-08-10 09:00:00+00'),
-- DM: Carlos <-> Raj (TechStart devops)
('d0000006-0000-4000-8000-000000000006', 'a0000007-0000-4000-8000-000000000007', 'a0000013-0000-4000-8000-000000000013', '2025-09-15 10:00:00+00'),
-- DM: Sarah <-> Aisha (DesignHub design sync)
('d0000007-0000-4000-8000-000000000007', 'a0000002-0000-4000-8000-000000000002', 'a0000008-0000-4000-8000-000000000008', '2025-08-15 11:00:00+00')
ON CONFLICT DO NOTHING;

-- DM channel members
INSERT INTO public.dm_members (channel_id, user_id, created_at)
VALUES
('d0000001-0000-4000-8000-000000000001', 'a0000001-0000-4000-8000-000000000001', '2025-07-20 10:00:00+00'),
('d0000001-0000-4000-8000-000000000001', 'a0000012-0000-4000-8000-000000000012', '2025-07-20 10:00:00+00'),
('d0000002-0000-4000-8000-000000000002', 'a0000004-0000-4000-8000-000000000004', '2025-08-01 09:00:00+00'),
('d0000002-0000-4000-8000-000000000002', 'a0000003-0000-4000-8000-000000000003', '2025-08-01 09:00:00+00'),
('d0000003-0000-4000-8000-000000000003', 'a0000005-0000-4000-8000-000000000005', '2025-09-01 09:00:00+00'),
('d0000003-0000-4000-8000-000000000003', 'a0000008-0000-4000-8000-000000000008', '2025-09-01 09:00:00+00'),
('d0000005-0000-4000-8000-000000000005', 'a0000013-0000-4000-8000-000000000013', '2025-08-10 09:00:00+00'),
('d0000005-0000-4000-8000-000000000005', 'a0000012-0000-4000-8000-000000000012', '2025-08-10 09:00:00+00'),
('d0000006-0000-4000-8000-000000000006', 'a0000007-0000-4000-8000-000000000007', '2025-09-15 10:00:00+00'),
('d0000006-0000-4000-8000-000000000006', 'a0000013-0000-4000-8000-000000000013', '2025-09-15 10:00:00+00'),
('d0000007-0000-4000-8000-000000000007', 'a0000002-0000-4000-8000-000000000002', '2025-08-15 11:00:00+00'),
('d0000007-0000-4000-8000-000000000007', 'a0000008-0000-4000-8000-000000000008', '2025-08-15 11:00:00+00')
ON CONFLICT DO NOTHING;

-- Group DM channel (DM type but with >2 members stored via channel_members)
-- Create as a group channel type
INSERT INTO public.channels (id, workspace_id, name, slug, channel_type, is_private, created_by, created_at, updated_at)
VALUES ('d0000004-0000-4000-8000-000000000004', 'b0000001-0000-4000-8000-000000000001',
  'Marcus, Sarah, Jake', 'gm-marcus-sarah-jake', 'group', true,
  'a0000001-0000-4000-8000-000000000001', '2025-10-01 09:00:00+00', '2025-10-01 09:00:00+00')
ON CONFLICT (id) DO NOTHING;

-- ======================================================================
-- CHANNEL MEMBERS (all workspace channels)
-- ======================================================================
-- For each non-DM channel, add appropriate members based on workspace membership.
-- Non-leadership channels: all workspace members
INSERT INTO public.channel_members (channel_id, user_id, joined_at, last_viewed_at)
SELECT ch.id, wm.user_id, wm.joined_at, '2026-01-18 09:00:00+00'
FROM public.channels ch
JOIN public.workspace_members wm ON wm.workspace_id = ch.workspace_id
WHERE ch.workspace_id IN ('b0000001-0000-4000-8000-000000000001','b0000002-0000-4000-8000-000000000002','b0000003-0000-4000-8000-000000000003')
  AND ch.channel_type NOT IN ('dm')
  AND ch.name != 'leadership'
ON CONFLICT DO NOTHING;

-- Leadership channels: only owners and admins
INSERT INTO public.channel_members (channel_id, user_id, joined_at, last_viewed_at)
SELECT ch.id, wm.user_id, wm.joined_at, '2026-01-18 09:00:00+00'
FROM public.channels ch
JOIN public.workspace_members wm ON wm.workspace_id = ch.workspace_id
WHERE ch.workspace_id IN ('b0000001-0000-4000-8000-000000000001','b0000002-0000-4000-8000-000000000002','b0000003-0000-4000-8000-000000000003')
  AND ch.channel_type NOT IN ('dm')
  AND ch.name = 'leadership'
  AND wm.role IN ('owner', 'admin')
ON CONFLICT DO NOTHING;

-- Group DM members
INSERT INTO public.channel_members (channel_id, user_id, joined_at, last_viewed_at)
VALUES
('d0000004-0000-4000-8000-000000000004', 'a0000001-0000-4000-8000-000000000001', '2025-10-01 09:00:00+00', '2026-01-18 09:00:00+00'),
('d0000004-0000-4000-8000-000000000004', 'a0000002-0000-4000-8000-000000000002', '2025-10-01 09:00:00+00', '2026-01-18 09:00:00+00'),
('d0000004-0000-4000-8000-000000000004', 'a0000003-0000-4000-8000-000000000003', '2025-10-01 09:00:00+00', '2026-01-18 09:00:00+00')
ON CONFLICT DO NOTHING;

-- ======================================================================
-- CHANNEL NOTIFICATION PREFERENCES (varied across users/channels)
-- ======================================================================
-- Default: all notifications enabled for all members
INSERT INTO public.channel_notification_preferences (user_id, channel_id, notify, notify_sound, notify_everyone)
SELECT cm.user_id, cm.channel_id, true, true, true
FROM public.channel_members cm
ON CONFLICT (user_id, channel_id) DO NOTHING;

-- Override: some users mute certain channels
UPDATE public.channel_notification_preferences SET notify = false, notify_sound = false
WHERE user_id = 'a0000001-0000-4000-8000-000000000001'
  AND channel_id = 'c0000004-0000-4000-8000-000000000004';
UPDATE public.channel_notification_preferences SET notify = false
WHERE user_id = 'a0000006-0000-4000-8000-000000000006'
  AND channel_id = 'c0000001-0000-4000-8000-000000000001';
UPDATE public.channel_notification_preferences SET notify_everyone = false
WHERE user_id = 'a0000009-0000-4000-8000-000000000009'
  AND channel_id = 'c0000002-0000-4000-8000-000000000002';
UPDATE public.channel_notification_preferences SET notify = false, notify_sound = false
WHERE user_id = 'a0000015-0000-4000-8000-000000000015'
  AND channel_id = 'c0000013-0000-4000-8000-000000000013';
UPDATE public.channel_notification_preferences SET notify_everyone = false
WHERE user_id = 'a0000017-0000-4000-8000-000000000017'
  AND channel_id = 'c0000004-0000-4000-8000-000000000004';
UPDATE public.channel_notification_preferences SET notify = false, notify_sound = false
WHERE user_id = 'a0000021-0000-4000-8000-000000000021'
  AND channel_id = 'c0000011-0000-4000-8000-000000000011';

-- ======================================================================
-- CHANNEL BOOKMARKS (pinned links/resources in channels)
-- ======================================================================
INSERT INTO public.channel_bookmarks (channel_id, title, url, emoji, created_by, sort_order, created_at)
VALUES
('c0000002-0000-4000-8000-000000000002', 'Architecture Decision Records', 'https://docs.example.com/adr', '📐', 'a0000001-0000-4000-8000-000000000001', 0, '2025-08-01 10:00:00+00'),
('c0000002-0000-4000-8000-000000000002', 'API Documentation', 'https://api.example.com/docs', '📘', 'a0000003-0000-4000-8000-000000000003', 1, '2025-08-15 14:00:00+00'),
('c0000002-0000-4000-8000-000000000002', 'Coding Standards', 'https://wiki.example.com/coding-standards', '✅', 'a0000001-0000-4000-8000-000000000001', 2, '2025-09-01 09:00:00+00'),
('c0000003-0000-4000-8000-000000000003', 'Q3 Roadmap', 'https://docs.example.com/q3-roadmap', '🗺️', 'a0000002-0000-4000-8000-000000000002', 0, '2025-12-15 10:00:00+00'),
('c0000003-0000-4000-8000-000000000003', 'User Research Findings', 'https://figma.example.com/research', '🔍', 'a0000002-0000-4000-8000-000000000002', 1, '2025-11-01 09:00:00+00'),
('c0000005-0000-4000-8000-000000000005', 'Design System v2', 'https://design.example.com/v2', '🎨', 'a0000008-0000-4000-8000-000000000008', 0, '2025-09-01 09:00:00+00'),
('c0000010-0000-4000-8000-000000000010', 'Runbook', 'https://wiki.example.com/runbook', '📖', 'a0000013-0000-4000-8000-000000000013', 0, '2025-07-20 09:00:00+00'),
('c0000010-0000-4000-8000-000000000010', 'On-Call Schedule', 'https://pager.example.com/schedule', '📟', 'a0000013-0000-4000-8000-000000000013', 1, '2025-07-20 09:05:00+00'),
('c0000011-0000-4000-8000-000000000011', 'Standup Bot', 'https://standup.example.com', '🤖', 'a0000012-0000-4000-8000-000000000012', 0, '2025-08-01 09:00:00+00'),
('c0000014-0000-4000-8000-000000000014', 'Figma Workspace', 'https://figma.com/team/designhub', '🎨', 'a0000002-0000-4000-8000-000000000002', 0, '2025-08-01 09:15:00+00'),
('c0000015-0000-4000-8000-000000000015', 'Review Guidelines', 'https://wiki.example.com/design-review', '📋', 'a0000008-0000-4000-8000-000000000008', 0, '2025-09-01 09:00:00+00'),
('c0000017-0000-4000-8000-000000000017', 'Component Roadmap', 'https://roadmap.example.com/components', '🗺️', 'a0000008-0000-4000-8000-000000000008', 0, '2025-10-01 09:00:00+00')
ON CONFLICT DO NOTHING;

-- ======================================================================
-- CHANNEL ROLE OVERRIDES (permission restrictions)
-- ======================================================================
INSERT INTO public.channel_role_overrides (channel_id, role, permission, scope, created_at)
VALUES
-- Announcements: only admin can write
('c0000006-0000-4000-8000-000000000006', 'member', 'deny', 'write', '2025-07-18 09:05:00+00'),
('c0000006-0000-4000-8000-000000000006', 'admin', 'allow', 'write', '2025-07-18 09:05:00+00'),
-- Leadership: members cannot access at all
('c0000007-0000-4000-8000-000000000007', 'member', 'deny', 'read', '2025-07-20 10:00:00+00'),
('c0000007-0000-4000-8000-000000000007', 'admin', 'allow', 'admin', '2025-07-20 10:00:00+00')
ON CONFLICT DO NOTHING;

-- Sidebar channel assignments (put channels in the Channels category)
INSERT INTO public.sidebar_channel_assignments (category_id, channel_id, sort_order)
SELECT cat.id, ch.id,
  ROW_NUMBER() OVER (PARTITION BY cat.id ORDER BY ch.sort_order)
FROM public.sidebar_categories cat
JOIN public.channels ch ON ch.workspace_id = cat.workspace_id AND ch.channel_type NOT IN ('dm')
WHERE cat.name = 'Channels'
ON CONFLICT (category_id, channel_id) DO NOTHING;

-- Create Starred and Archived categories for workspace owners
INSERT INTO public.sidebar_categories (user_id, workspace_id, name, sort_order)
VALUES
('a0000001-0000-4000-8000-000000000001', 'b0000001-0000-4000-8000-000000000001', 'Starred', -1),
('a0000001-0000-4000-8000-000000000001', 'b0000001-0000-4000-8000-000000000001', 'Archived', 99),
('a0000012-0000-4000-8000-000000000012', 'b0000002-0000-4000-8000-000000000002', 'Starred', -1),
('a0000002-0000-4000-8000-000000000002', 'b0000003-0000-4000-8000-000000000003', 'Starred', -1),
('a0000002-0000-4000-8000-000000000002', 'b0000001-0000-4000-8000-000000000001', 'Starred', -1)
ON CONFLICT (user_id, workspace_id, name) DO NOTHING;

-- Star channels for owners
-- Marcus stars #engineering and #leadership
INSERT INTO public.sidebar_channel_assignments (category_id, channel_id, sort_order)
SELECT cat.id, vals.channel_id, vals.sort_order
FROM public.sidebar_categories cat
CROSS JOIN (VALUES ('c0000002-0000-4000-8000-000000000002'::uuid, 0), ('c0000007-0000-4000-8000-000000000007'::uuid, 1)) AS vals(channel_id, sort_order)
WHERE cat.user_id = 'a0000001-0000-4000-8000-000000000001' AND cat.name = 'Starred' AND cat.workspace_id = 'b0000001-0000-4000-8000-000000000001'
ON CONFLICT (category_id, channel_id) DO NOTHING;

-- Sarah stars #product and #design-reviews
INSERT INTO public.sidebar_channel_assignments (category_id, channel_id, sort_order)
SELECT cat.id, vals.channel_id, vals.sort_order
FROM public.sidebar_categories cat
CROSS JOIN (VALUES ('c0000003-0000-4000-8000-000000000003'::uuid, 0), ('c0000015-0000-4000-8000-000000000015'::uuid, 1)) AS vals(channel_id, sort_order)
WHERE cat.user_id = 'a0000002-0000-4000-8000-000000000002' AND cat.name = 'Starred' AND cat.workspace_id = 'b0000003-0000-4000-8000-000000000003'
ON CONFLICT (category_id, channel_id) DO NOTHING;

-- Sarah stars #product in Acme Corp
INSERT INTO public.sidebar_channel_assignments (category_id, channel_id, sort_order)
SELECT cat.id, 'c0000003-0000-4000-8000-000000000003', 0
FROM public.sidebar_categories cat
WHERE cat.user_id = 'a0000002-0000-4000-8000-000000000002' AND cat.name = 'Starred' AND cat.workspace_id = 'b0000001-0000-4000-8000-000000000001'
ON CONFLICT (category_id, channel_id) DO NOTHING;

-- Nkechi stars #devops
INSERT INTO public.sidebar_channel_assignments (category_id, channel_id, sort_order)
SELECT cat.id, 'c0000010-0000-4000-8000-000000000010', 0
FROM public.sidebar_categories cat
WHERE cat.user_id = 'a0000012-0000-4000-8000-000000000012' AND cat.name = 'Starred' AND cat.workspace_id = 'b0000002-0000-4000-8000-000000000002'
ON CONFLICT (category_id, channel_id) DO NOTHING;

commit;
