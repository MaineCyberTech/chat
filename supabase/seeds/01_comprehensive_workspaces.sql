-- 01_comprehensive_workspaces.sql
-- 3 workspaces with diverse membership roles + super admin in all.

begin;

-- Cleanup
DELETE FROM public.sidebar_channel_assignments WHERE category_id IN (
  SELECT id FROM public.sidebar_categories WHERE workspace_id IN (
    'b0000001-0000-4000-8000-000000000001','b0000002-0000-4000-8000-000000000002','b0000003-0000-4000-8000-000000000003'
  )
);
DELETE FROM public.sidebar_categories WHERE workspace_id IN (
  'b0000001-0000-4000-8000-000000000001','b0000002-0000-4000-8000-000000000002','b0000003-0000-4000-8000-000000000003'
);
DELETE FROM public.custom_emoji WHERE workspace_id IN (
  'b0000001-0000-4000-8000-000000000001','b0000002-0000-4000-8000-000000000002','b0000003-0000-4000-8000-000000000003'
);
DELETE FROM public.user_groups WHERE workspace_id IN (
  'b0000001-0000-4000-8000-000000000001','b0000002-0000-4000-8000-000000000002','b0000003-0000-4000-8000-000000000003'
);
DELETE FROM public.announcements WHERE workspace_id IN (
  'b0000001-0000-4000-8000-000000000001','b0000002-0000-4000-8000-000000000002','b0000003-0000-4000-8000-000000000003'
);
DELETE FROM public.auto_responders WHERE workspace_id IN (
  'b0000001-0000-4000-8000-000000000001','b0000002-0000-4000-8000-000000000002','b0000003-0000-4000-8000-000000000003'
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
DELETE FROM public.notifications WHERE workspace_id IN (
  'b0000001-0000-4000-8000-000000000001','b0000002-0000-4000-8000-000000000002','b0000003-0000-4000-8000-000000000003'
);
DELETE FROM public.workspace_members WHERE workspace_id IN (
  'b0000001-0000-4000-8000-000000000001','b0000002-0000-4000-8000-000000000002','b0000003-0000-4000-8000-000000000003'
);
DELETE FROM public.workspaces WHERE id IN (
  'b0000001-0000-4000-8000-000000000001','b0000002-0000-4000-8000-000000000002','b0000003-0000-4000-8000-000000000003'
);

-- 3 Workspaces
-- b0000001 = Acme Corp (13 members, owner=Marcus)
-- b0000002 = TechStart (7 members, owner=Nkechi)
-- b0000003 = DesignHub (5 members, owner=Sarah)
INSERT INTO public.workspaces (id, name, slug, owner_id, created_at, updated_at)
VALUES
('b0000001-0000-4000-8000-000000000001', 'Acme Corp', 'acme-corp',
 'a0000001-0000-4000-8000-000000000001', '2025-07-18 09:00:00+00', '2026-01-18 09:00:00+00'),
('b0000002-0000-4000-8000-000000000002', 'TechStart', 'techstart',
 'a0000012-0000-4000-8000-000000000012', '2025-07-18 08:00:00+00', '2026-01-18 09:00:00+00'),
('b0000003-0000-4000-8000-000000000003', 'DesignHub', 'designhub',
 'a0000002-0000-4000-8000-000000000002', '2025-08-01 09:00:00+00', '2026-01-18 09:00:00+00')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug, updated_at = EXCLUDED.updated_at;

-- Workspace members
-- Acme Corp: 11 members (owner=Marcus, admin=Jake+Aisha, rest=member)
-- Note: on_workspace_created trigger auto-adds owner, but we insert explicitly for idempotency
INSERT INTO public.workspace_members (workspace_id, user_id, role, joined_at)
VALUES
-- Acme Corp members
('b0000001-0000-4000-8000-000000000001', 'a0000001-0000-4000-8000-000000000001', 'owner',  '2025-07-18 09:00:00+00'),
('b0000001-0000-4000-8000-000000000001', 'a0000003-0000-4000-8000-000000000003', 'admin',  '2025-07-19 10:00:00+00'),
('b0000001-0000-4000-8000-000000000001', 'a0000008-0000-4000-8000-000000000008', 'admin',  '2025-08-10 09:30:00+00'),
('b0000001-0000-4000-8000-000000000001', 'a0000004-0000-4000-8000-000000000004', 'member', '2025-07-20 08:30:00+00'),
('b0000001-0000-4000-8000-000000000001', 'a0000005-0000-4000-8000-000000000005', 'member', '2025-07-22 11:00:00+00'),
('b0000001-0000-4000-8000-000000000001', 'a0000006-0000-4000-8000-000000000006', 'member', '2025-08-01 09:00:00+00'),
('b0000001-0000-4000-8000-000000000001', 'a0000007-0000-4000-8000-000000000007', 'member', '2025-08-05 14:00:00+00'),
('b0000001-0000-4000-8000-000000000001', 'a0000009-0000-4000-8000-000000000009', 'member', '2025-08-15 10:00:00+00'),
('b0000001-0000-4000-8000-000000000001', 'a0000010-0000-4000-8000-000000000010', 'member', '2025-09-01 08:00:00+00'),
('b0000001-0000-4000-8000-000000000001', 'a0000011-0000-4000-8000-000000000011', 'member', '2025-09-10 09:00:00+00'),
('b0000001-0000-4000-8000-000000000001', 'a0000014-0000-4000-8000-000000000014', 'member', '2025-09-15 09:00:00+00'),
-- Olivia Foster - Staff Engineer, Acme Corp (joined Aug 2026)
('b0000001-0000-4000-8000-000000000001', 'a0000017-0000-4000-8000-000000000017', 'member', '2026-02-01 09:00:00+00'),
-- Sofia Rodriguez - Designer, Acme Corp (joined Oct 2026)
('b0000001-0000-4000-8000-000000000001', 'a0000020-0000-4000-8000-000000000020', 'member', '2026-04-01 09:00:00+00'),
-- TechStart members (owner=Nkechi, admin=Raj, rest=member)
('b0000002-0000-4000-8000-000000000002', 'a0000012-0000-4000-8000-000000000012', 'owner',  '2025-07-18 08:00:00+00'),
('b0000002-0000-4000-8000-000000000002', 'a0000013-0000-4000-8000-000000000013', 'admin',  '2025-07-25 10:00:00+00'),
('b0000002-0000-4000-8000-000000000002', 'a0000001-0000-4000-8000-000000000001', 'member', '2025-08-01 09:00:00+00'),
('b0000002-0000-4000-8000-000000000002', 'a0000005-0000-4000-8000-000000000005', 'member', '2025-09-01 09:00:00+00'),
('b0000002-0000-4000-8000-000000000002', 'a0000015-0000-4000-8000-000000000015', 'member', '2025-10-01 09:00:00+00'),
-- Jamal Williams - Intern, TechStart (joined Sep 2026)
('b0000002-0000-4000-8000-000000000002', 'a0000018-0000-4000-8000-000000000018', 'member', '2026-03-01 09:00:00+00'),
-- Ethan Kowalski - Sales Engineer, TechStart (joined Nov 2026)
('b0000002-0000-4000-8000-000000000002', 'a0000021-0000-4000-8000-000000000021', 'member', '2026-05-01 09:00:00+00'),
-- DesignHub members (owner=Sarah, admin=Aisha, rest=member)
('b0000003-0000-4000-8000-000000000003', 'a0000002-0000-4000-8000-000000000002', 'owner',  '2025-08-01 09:00:00+00'),
('b0000003-0000-4000-8000-000000000003', 'a0000008-0000-4000-8000-000000000008', 'admin',  '2025-08-10 09:30:00+00'),
('b0000003-0000-4000-8000-000000000003', 'a0000005-0000-4000-8000-000000000005', 'member', '2025-09-01 09:00:00+00'),
('b0000003-0000-4000-8000-000000000003', 'a0000014-0000-4000-8000-000000000014', 'member', '2025-09-20 09:00:00+00'),
-- Chen Wei - Product Manager, DesignHub (joined Jul 2026)
('b0000003-0000-4000-8000-000000000003', 'a0000019-0000-4000-8000-000000000019', 'member', '2026-01-01 09:00:00+00'),
-- Super Admin (Alex Admin) - admin in ALL workspaces
('b0000001-0000-4000-8000-000000000001', 'a0000016-0000-4000-8000-000000000016', 'admin',  '2025-07-15 08:00:00+00'),
('b0000002-0000-4000-8000-000000000002', 'a0000016-0000-4000-8000-000000000016', 'admin',  '2025-07-15 08:00:00+00'),
('b0000003-0000-4000-8000-000000000003', 'a0000016-0000-4000-8000-000000000016', 'admin',  '2025-07-15 08:00:00+00')
ON CONFLICT (workspace_id, user_id) DO UPDATE SET role = EXCLUDED.role;

-- Sidebar categories for all workspace members (default: Channels + Direct Messages)
INSERT INTO public.sidebar_categories (user_id, workspace_id, name, sort_order, is_collapsible)
SELECT wm.user_id, wm.workspace_id, 'Channels', 0, false
FROM public.workspace_members wm
ON CONFLICT (user_id, workspace_id, name) DO NOTHING;

INSERT INTO public.sidebar_categories (user_id, workspace_id, name, sort_order, is_collapsible)
SELECT wm.user_id, wm.workspace_id, 'Direct Messages', 1, true
FROM public.workspace_members wm
ON CONFLICT (user_id, workspace_id, name) DO NOTHING;

-- Additional custom categories for workspace owners
INSERT INTO public.sidebar_categories (user_id, workspace_id, name, sort_order, is_collapsible)
SELECT wm.user_id, wm.workspace_id, 'Starred', 0, false
FROM public.workspace_members wm
WHERE wm.role = 'owner'
ON CONFLICT (user_id, workspace_id, name) DO NOTHING;

INSERT INTO public.sidebar_categories (user_id, workspace_id, name, sort_order, is_collapsible)
SELECT wm.user_id, wm.workspace_id, 'Archived', 5, true
FROM public.workspace_members wm
WHERE wm.role = 'owner'
ON CONFLICT (user_id, workspace_id, name) DO NOTHING;

-- Custom emoji per workspace
INSERT INTO public.custom_emoji (workspace_id, name, image_url, created_by, created_at)
VALUES
('b0000001-0000-4000-8000-000000000001', 'shipit', '/emoji/shipit.png', 'a0000001-0000-4000-8000-000000000001', '2025-08-01 10:00:00+00'),
('b0000001-0000-4000-8000-000000000001', 'partyparrot', '/emoji/partyparrot.gif', 'a0000003-0000-4000-8000-000000000003', '2025-09-15 14:00:00+00'),
('b0000001-0000-4000-8000-000000000001', 'thumbsup-dark', '/emoji/thumbsup-dark.png', 'a0000008-0000-4000-8000-000000000008', '2025-10-01 11:00:00+00'),
('b0000002-0000-4000-8000-000000000002', 'rocket', '/emoji/rocket.png', 'a0000012-0000-4000-8000-000000000012', '2025-08-10 09:00:00+00'),
('b0000002-0000-4000-8000-000000000002', 'fire', '/emoji/fire.png', 'a0000013-0000-4000-8000-000000000013', '2025-09-01 10:00:00+00'),
('b0000003-0000-4000-8000-000000000003', 'palette', '/emoji/palette.png', 'a0000008-0000-4000-8000-000000000008', '2025-08-15 10:00:00+00'),
('b0000003-0000-4000-8000-000000000003', 'art', '/emoji/art.png', 'a0000008-0000-4000-8000-000000000008', '2025-09-10 11:00:00+00')
ON CONFLICT (workspace_id, name) DO NOTHING;

-- User groups
INSERT INTO public.user_groups (id, workspace_id, name, display_name, description, created_by, created_at)
VALUES
('a0f00001-0000-4000-8000-000000000001', 'b0000001-0000-4000-8000-000000000001', 'engineering', 'Engineering', 'All engineering team members', 'a0000001-0000-4000-8000-000000000001', '2025-07-20 10:00:00+00'),
('a0f00002-0000-4000-8000-000000000002', 'b0000001-0000-4000-8000-000000000001', 'leadership', 'Leadership', 'Workspace owners and admins', 'a0000001-0000-4000-8000-000000000001', '2025-07-20 10:05:00+00'),
('a0f00003-0000-4000-8000-000000000003', 'b0000002-0000-4000-8000-000000000002', 'founders', 'Founders', 'Company founders', 'a0000012-0000-4000-8000-000000000012', '2025-07-20 09:00:00+00'),
('a0f00004-0000-4000-8000-000000000004', 'b0000003-0000-4000-8000-000000000003', 'designers', 'Designers', 'Design team', 'a0000002-0000-4000-8000-000000000002', '2025-08-05 10:00:00+00')
ON CONFLICT (workspace_id, name) DO UPDATE SET display_name = EXCLUDED.display_name;

-- Group members
INSERT INTO public.user_group_members (group_id, user_id) VALUES
('a0f00001-0000-4000-8000-000000000001', 'a0000001-0000-4000-8000-000000000001'),
('a0f00001-0000-4000-8000-000000000001', 'a0000003-0000-4000-8000-000000000003'),
('a0f00001-0000-4000-8000-000000000001', 'a0000004-0000-4000-8000-000000000004'),
('a0f00001-0000-4000-8000-000000000001', 'a0000005-0000-4000-8000-000000000005'),
('a0f00001-0000-4000-8000-000000000001', 'a0000006-0000-4000-8000-000000000006'),
('a0f00001-0000-4000-8000-000000000001', 'a0000007-0000-4000-8000-000000000007'),
('a0f00001-0000-4000-8000-000000000001', 'a0000009-0000-4000-8000-000000000009'),
('a0f00001-0000-4000-8000-000000000001', 'a0000011-0000-4000-8000-000000000011'),
('a0f00001-0000-4000-8000-000000000001', 'a0000013-0000-4000-8000-000000000013'),
('a0f00001-0000-4000-8000-000000000001', 'a0000016-0000-4000-8000-000000000016'),
('a0f00001-0000-4000-8000-000000000001', 'a0000017-0000-4000-8000-000000000017'),
('a0f00002-0000-4000-8000-000000000002', 'a0000001-0000-4000-8000-000000000001'),
('a0f00002-0000-4000-8000-000000000002', 'a0000003-0000-4000-8000-000000000003'),
('a0f00002-0000-4000-8000-000000000002', 'a0000008-0000-4000-8000-000000000008'),
('a0f00003-0000-4000-8000-000000000003', 'a0000012-0000-4000-8000-000000000012'),
('a0f00003-0000-4000-8000-000000000003', 'a0000013-0000-4000-8000-000000000013'),
('a0f00004-0000-4000-8000-000000000004', 'a0000002-0000-4000-8000-000000000002'),
('a0f00004-0000-4000-8000-000000000004', 'a0000008-0000-4000-8000-000000000008'),
('a0f00004-0000-4000-8000-000000000004', 'a0000014-0000-4000-8000-000000000014'),
('a0f00004-0000-4000-8000-000000000004', 'a0000019-0000-4000-8000-000000000019')
ON CONFLICT (group_id, user_id) DO NOTHING;

-- Announcements
INSERT INTO public.announcements (workspace_id, title, body, active, created_by, created_at)
VALUES
('b0000001-0000-4000-8000-000000000001', 'Q3 Planning Kickoff',
 'Please review the Q3 roadmap doc before our all-hands on Monday. Priority areas: performance, mobile, and accessibility.',
 true, 'a0000001-0000-4000-8000-000000000001', '2025-12-30 09:00:00+00'),
('b0000001-0000-4000-8000-000000000001', 'Office Closed July 4th',
 'The office will be closed on Friday July 4th for Independence Day. Enjoy the long weekend!',
 true, 'a0000001-0000-4000-8000-000000000001', '2025-12-25 10:00:00+00'),
('b0000002-0000-4000-8000-000000000002', 'New Hire Onboarding',
 'Welcome Tom Nguyen starting April 1st as our new intern! Please say hi.',
 true, 'a0000012-0000-4000-8000-000000000012', '2025-09-28 09:00:00+00'),
('b0000003-0000-4000-8000-000000000003', 'Design System v2 Launch',
 'The new design system is live! Check the #brand-assets channel for updated component libraries.',
 true, 'a0000008-0000-4000-8000-000000000008', '2025-11-01 09:00:00+00'),
-- Inactive/expired announcements (for testing dismiss/hide logic)
('b0000001-0000-4000-8000-000000000001', 'Q2 Retrospective Notes',
 'Thanks for a great Q2! The retrospective notes are pinned in #engineering. Key wins: 100% uptime, 3x message volume, NPS 58.',
 false, 'a0000001-0000-4000-8000-000000000001', '2025-12-30 09:00:00+00'),
('b0000002-0000-4000-8000-000000000002', 'Server Migration Complete',
 'The production database has been migrated to the new cluster. All services are healthy. No action required.',
 false, 'a0000013-0000-4000-8000-000000000013', '2025-11-15 14:00:00+00'),
('b0000003-0000-4000-8000-000000000003', 'Summer Team BBQ',
 'Team BBQ this Friday at 5pm on the rooftop. Plus-ones welcome. Please RSVP by Thursday.',
 false, 'a0000002-0000-4000-8000-000000000002', '2026-07-11 10:00:00+00')
ON CONFLICT DO NOTHING;

-- Auto responders (2 users with away messages)
INSERT INTO public.auto_responders (user_id, workspace_id, message, enabled, trigger_status)
VALUES
('a0000007-0000-4000-8000-000000000007', 'b0000001-0000-4000-8000-000000000001',
 'I am currently handling a production incident. Will respond after the fire is out. 🔥', true, ARRAY['dnd']::text[]),
('a0000010-0000-4000-8000-000000000010', 'b0000001-0000-4000-8000-000000000001',
 'I am away from my desk. Please tag @marcus for urgent requests.', true, ARRAY['away','dnd']::text[]),
('a0000005-0000-4000-8000-000000000005', 'b0000002-0000-4000-8000-000000000002',
 'In a design review session. Will respond after 3pm EST.', true, ARRAY['away']::text[]),
('a0000014-0000-4000-8000-000000000014', 'b0000003-0000-4000-8000-000000000003',
 'Writing documentation. Available for urgent design questions only.', true, ARRAY['dnd']::text[])
ON CONFLICT (user_id, workspace_id) DO UPDATE SET
  message = EXCLUDED.message, enabled = EXCLUDED.enabled, trigger_status = EXCLUDED.trigger_status;

commit;
