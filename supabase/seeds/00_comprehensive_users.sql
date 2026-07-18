-- 00_comprehensive_users.sql
-- 21 test users across 3 organizations with diverse roles + 1 super admin.
-- Super admin (Alex Admin) has owner-level access to ALL workspaces.
-- Password for all users: password123
-- Bcrypt hash: $2a$10$v6eIqtfdO8MPMAg6HEJUU.eHvG1iZ9bIl/apu.boe3WW5wvr2Lr2W

begin;

-- Cleanup: remove identities and auth users for our test emails
DELETE FROM auth.identities
WHERE user_id IN (
  'a0000001-0000-4000-8000-000000000001','a0000002-0000-4000-8000-000000000002',
  'a0000003-0000-4000-8000-000000000003','a0000004-0000-4000-8000-000000000004',
  'a0000005-0000-4000-8000-000000000005','a0000006-0000-4000-8000-000000000006',
  'a0000007-0000-4000-8000-000000000007','a0000008-0000-4000-8000-000000000008',
  'a0000009-0000-4000-8000-000000000009','a0000010-0000-4000-8000-000000000010',
  'a0000011-0000-4000-8000-000000000011','a0000012-0000-4000-8000-000000000012',
  'a0000013-0000-4000-8000-000000000013','a0000014-0000-4000-8000-000000000014',
  'a0000015-0000-4000-8000-000000000015','a0000016-0000-4000-8000-000000000016',
  'a0000017-0000-4000-8000-000000000017','a0000018-0000-4000-8000-000000000018',
  'a0000019-0000-4000-8000-000000000019','a0000020-0000-4000-8000-000000000020',
  'a0000021-0000-4000-8000-000000000021'
);

DELETE FROM auth.users WHERE id IN (
  'a0000001-0000-4000-8000-000000000001','a0000002-0000-4000-8000-000000000002',
  'a0000003-0000-4000-8000-000000000003','a0000004-0000-4000-8000-000000000004',
  'a0000005-0000-4000-8000-000000000005','a0000006-0000-4000-8000-000000000006',
  'a0000007-0000-4000-8000-000000000007','a0000008-0000-4000-8000-000000000008',
  'a0000009-0000-4000-8000-000000000009','a0000010-0000-4000-8000-000000000010',
  'a0000011-0000-4000-8000-000000000011','a0000012-0000-4000-8000-000000000012',
  'a0000013-0000-4000-8000-000000000013','a0000014-0000-4000-8000-000000000014',
  'a0000015-0000-4000-8000-000000000015','a0000016-0000-4000-8000-000000000016',
  'a0000017-0000-4000-8000-000000000017','a0000018-0000-4000-8000-000000000018',
  'a0000019-0000-4000-8000-000000000019','a0000020-0000-4000-8000-000000000020',
  'a0000021-0000-4000-8000-000000000021'
);

-- Insert auth.users (trigger auto-creates public.users)
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, is_sso_user, is_anonymous
) VALUES
-- 1. Marcus Chen - Workspace Owner, Engineering Director
('00000000-0000-0000-0000-000000000000', 'a0000001-0000-4000-8000-000000000001',
 'authenticated', 'authenticated', 'marcus@seed.test',
 '$2a$10$v6eIqtfdO8MPMAg6HEJUU.eHvG1iZ9bIl/apu.boe3WW5wvr2Lr2W',
 '2025-07-18 09:00:00+00', '{"provider":"email","providers":["email"]}'::jsonb,
 '{"email_verified":true,"display_name":"Marcus Chen"}'::jsonb,
 '2025-07-18 09:00:00+00', '2026-01-18 09:00:00+00', false, false),

-- 2. Sarah Patel - Workspace Owner, Product Lead
('00000000-0000-0000-0000-000000000000', 'a0000002-0000-4000-8000-000000000002',
 'authenticated', 'authenticated', 'sarah@seed.test',
 '$2a$10$v6eIqtfdO8MPMAg6HEJUU.eHvG1iZ9bIl/apu.boe3WW5wvr2Lr2W',
 '2025-07-18 09:05:00+00', '{"provider":"email","providers":["email"]}'::jsonb,
 '{"email_verified":true,"display_name":"Sarah Patel"}'::jsonb,
 '2025-07-18 09:05:00+00', '2026-01-18 09:00:00+00', false, false),

-- 3. Jake Morrison - Workspace Admin, Senior Engineer
('00000000-0000-0000-0000-000000000000', 'a0000003-0000-4000-8000-000000000003',
 'authenticated', 'authenticated', 'jake@seed.test',
 '$2a$10$v6eIqtfdO8MPMAg6HEJUU.eHvG1iZ9bIl/apu.boe3WW5wvr2Lr2W',
 '2025-07-19 10:00:00+00', '{"provider":"email","providers":["email"]}'::jsonb,
 '{"email_verified":true,"display_name":"Jake Morrison"}'::jsonb,
 '2025-07-19 10:00:00+00', '2026-01-18 09:00:00+00', false, false),

-- 4. Elena Volkov - Workspace Member, Backend Engineer
('00000000-0000-0000-0000-000000000000', 'a0000004-0000-4000-8000-000000000004',
 'authenticated', 'authenticated', 'elena@seed.test',
 '$2a$10$v6eIqtfdO8MPMAg6HEJUU.eHvG1iZ9bIl/apu.boe3WW5wvr2Lr2W',
 '2025-07-20 08:30:00+00', '{"provider":"email","providers":["email"]}'::jsonb,
 '{"email_verified":true,"display_name":"Elena Volkov"}'::jsonb,
 '2025-07-20 08:30:00+00', '2026-01-18 09:00:00+00', false, false),

-- 5. Tyler Brooks - Workspace Member, Frontend Engineer
('00000000-0000-0000-0000-000000000000', 'a0000005-0000-4000-8000-000000000005',
 'authenticated', 'authenticated', 'tyler@seed.test',
 '$2a$10$v6eIqtfdO8MPMAg6HEJUU.eHvG1iZ9bIl/apu.boe3WW5wvr2Lr2W',
 '2025-07-22 11:00:00+00', '{"provider":"email","providers":["email"]}'::jsonb,
 '{"email_verified":true,"display_name":"Tyler Brooks"}'::jsonb,
 '2025-07-22 11:00:00+00', '2026-01-18 09:00:00+00', false, false),

-- 6. Priya Sharma - Workspace Member, QA Engineer
('00000000-0000-0000-0000-000000000000', 'a0000006-0000-4000-8000-000000000006',
 'authenticated', 'authenticated', 'priya@seed.test',
 '$2a$10$v6eIqtfdO8MPMAg6HEJUU.eHvG1iZ9bIl/apu.boe3WW5wvr2Lr2W',
 '2025-08-01 09:00:00+00', '{"provider":"email","providers":["email"]}'::jsonb,
 '{"email_verified":true,"display_name":"Priya Sharma"}'::jsonb,
 '2025-08-01 09:00:00+00', '2026-01-18 09:00:00+00', false, false),

-- 7. Carlos Rivera - Workspace Member, DevOps
('00000000-0000-0000-0000-000000000000', 'a0000007-0000-4000-8000-000000000007',
 'authenticated', 'authenticated', 'carlos@seed.test',
 '$2a$10$v6eIqtfdO8MPMAg6HEJUU.eHvG1iZ9bIl/apu.boe3WW5wvr2Lr2W',
 '2025-08-05 14:00:00+00', '{"provider":"email","providers":["email"]}'::jsonb,
 '{"email_verified":true,"display_name":"Carlos Rivera"}'::jsonb,
 '2025-08-05 14:00:00+00', '2026-01-18 09:00:00+00', false, false),

-- 8. Aisha Johnson - Workspace Admin, Design Lead
('00000000-0000-0000-0000-000000000000', 'a0000008-0000-4000-8000-000000000008',
 'authenticated', 'authenticated', 'aisha@seed.test',
 '$2a$10$v6eIqtfdO8MPMAg6HEJUU.eHvG1iZ9bIl/apu.boe3WW5wvr2Lr2W',
 '2025-08-10 09:30:00+00', '{"provider":"email","providers":["email"]}'::jsonb,
 '{"email_verified":true,"display_name":"Aisha Johnson"}'::jsonb,
 '2025-08-10 09:30:00+00', '2026-01-18 09:00:00+00', false, false),

-- 9. Liam O'Brien - Workspace Member, Junior Engineer
('00000000-0000-0000-0000-000000000000', 'a0000009-0000-4000-8000-000000000009',
 'authenticated', 'authenticated', 'liam@seed.test',
 '$2a$10$v6eIqtfdO8MPMAg6HEJUU.eHvG1iZ9bIl/apu.boe3WW5wvr2Lr2W',
 '2025-08-15 10:00:00+00', '{"provider":"email","providers":["email"]}'::jsonb,
 '{"email_verified":true,"display_name":"Liam O''Brien"}'::jsonb,
 '2025-08-15 10:00:00+00', '2026-01-18 09:00:00+00', false, false),

-- 10. Mei Lin - Workspace Member, Data Analyst
('00000000-0000-0000-0000-000000000000', 'a0000010-0000-4000-8000-000000000010',
 'authenticated', 'authenticated', 'mei@seed.test',
 '$2a$10$v6eIqtfdO8MPMAg6HEJUU.eHvG1iZ9bIl/apu.boe3WW5wvr2Lr2W',
 '2025-09-01 08:00:00+00', '{"provider":"email","providers":["email"]}'::jsonb,
 '{"email_verified":true,"display_name":"Mei Lin"}'::jsonb,
 '2025-09-01 08:00:00+00', '2026-01-18 09:00:00+00', false, false),

-- 11. Dmitri Petrov - Workspace Member, Security Engineer
('00000000-0000-0000-0000-000000000000', 'a0000011-0000-4000-8000-000000000011',
 'authenticated', 'authenticated', 'dmitri@seed.test',
 '$2a$10$v6eIqtfdO8MPMAg6HEJUU.eHvG1iZ9bIl/apu.boe3WW5wvr2Lr2W',
 '2025-09-10 09:00:00+00', '{"provider":"email","providers":["email"]}'::jsonb,
 '{"email_verified":true,"display_name":"Dmitri Petrov"}'::jsonb,
 '2025-09-10 09:00:00+00', '2026-01-18 09:00:00+00', false, false),

-- 12. Nkechi Adeyemi - Workspace Owner, CEO
('00000000-0000-0000-0000-000000000000', 'a0000012-0000-4000-8000-000000000012',
 'authenticated', 'authenticated', 'nkechi@seed.test',
 '$2a$10$v6eIqtfdO8MPMAg6HEJUU.eHvG1iZ9bIl/apu.boe3WW5wvr2Lr2W',
 '2025-07-18 08:00:00+00', '{"provider":"email","providers":["email"]}'::jsonb,
 '{"email_verified":true,"display_name":"Nkechi Adeyemi"}'::jsonb,
 '2025-07-18 08:00:00+00', '2026-01-18 09:00:00+00', false, false),

-- 13. Raj Gupta - Workspace Member, Full Stack
('00000000-0000-0000-0000-000000000000', 'a0000013-0000-4000-8000-000000000013',
 'authenticated', 'authenticated', 'raj@seed.test',
 '$2a$10$v6eIqtfdO8MPMAg6HEJUU.eHvG1iZ9bIl/apu.boe3WW5wvr2Lr2W',
 '2025-07-25 10:00:00+00', '{"provider":"email","providers":["email"]}'::jsonb,
 '{"email_verified":true,"display_name":"Raj Gupta"}'::jsonb,
 '2025-07-25 10:00:00+00', '2026-01-18 09:00:00+00', false, false),

-- 14. Fatima Al-Rashid - Workspace Member, Technical Writer
('00000000-0000-0000-0000-000000000000', 'a0000014-0000-4000-8000-000000000014',
 'authenticated', 'authenticated', 'fatima@seed.test',
 '$2a$10$v6eIqtfdO8MPMAg6HEJUU.eHvG1iZ9bIl/apu.boe3WW5wvr2Lr2W',
 '2025-09-15 09:00:00+00', '{"provider":"email","providers":["email"]}'::jsonb,
 '{"email_verified":true,"display_name":"Fatima Al-Rashid"}'::jsonb,
 '2025-09-15 09:00:00+00', '2026-01-18 09:00:00+00', false, false),

-- 15. Tom Nguyen - Workspace Member, Intern
('00000000-0000-0000-0000-000000000000', 'a0000015-0000-4000-8000-000000000015',
 'authenticated', 'authenticated', 'tom@seed.test',
 '$2a$10$v6eIqtfdO8MPMAg6HEJUU.eHvG1iZ9bIl/apu.boe3WW5wvr2Lr2W',
 '2025-10-01 09:00:00+00', '{"provider":"email","providers":["email"]}'::jsonb,
 '{"email_verified":true,"display_name":"Tom Nguyen"}'::jsonb,
 '2025-10-01 09:00:00+00', '2026-01-18 09:00:00+00', false, false),

-- 16. Alex Admin - Super Admin, Platform Administrator (access to ALL workspaces)
('00000000-0000-0000-0000-000000000000', 'a0000016-0000-4000-8000-000000000016',
 'authenticated', 'authenticated', 'admin@seed.test',
 '$2a$10$v6eIqtfdO8MPMAg6HEJUU.eHvG1iZ9bIl/apu.boe3WW5wvr2Lr2W',
 '2025-07-15 08:00:00+00', '{"provider":"email","providers":["email"]}'::jsonb,
 '{"email_verified":true,"display_name":"Alex Admin","role":"super_admin"}'::jsonb,
 '2025-07-15 08:00:00+00', '2026-01-18 09:00:00+00', false, false),

-- 17. Olivia Foster - Staff Engineer, Acme Corp (joined Feb 2026)
('00000000-0000-0000-0000-000000000000', 'a0000017-0000-4000-8000-000000000017',
 'authenticated', 'authenticated', 'olivia@seed.test',
 '$2a$10$v6eIqtfdO8MPMAg6HEJUU.eHvG1iZ9bIl/apu.boe3WW5wvr2Lr2W',
 '2026-02-01 09:00:00+00', '{"provider":"email","providers":["email"]}'::jsonb,
 '{"email_verified":true,"display_name":"Olivia Foster"}'::jsonb,
 '2026-02-01 09:00:00+00', '2026-01-18 09:00:00+00', false, false),

-- 18. Jamal Williams - Intern, TechStart (joined Mar 2026)
('00000000-0000-0000-0000-000000000000', 'a0000018-0000-4000-8000-000000000018',
 'authenticated', 'authenticated', 'jamal@seed.test',
 '$2a$10$v6eIqtfdO8MPMAg6HEJUU.eHvG1iZ9bIl/apu.boe3WW5wvr2Lr2W',
 '2026-03-01 09:00:00+00', '{"provider":"email","providers":["email"]}'::jsonb,
 '{"email_verified":true,"display_name":"Jamal Williams"}'::jsonb,
 '2026-03-01 09:00:00+00', '2026-01-18 09:00:00+00', false, false),

-- 19. Chen Wei - Product Manager, DesignHub (joined Jan 2026)
('00000000-0000-0000-0000-000000000000', 'a0000019-0000-4000-8000-000000000019',
 'authenticated', 'authenticated', 'chen@seed.test',
 '$2a$10$v6eIqtfdO8MPMAg6HEJUU.eHvG1iZ9bIl/apu.boe3WW5wvr2Lr2W',
 '2026-01-01 09:00:00+00', '{"provider":"email","providers":["email"]}'::jsonb,
 '{"email_verified":true,"display_name":"Chen Wei"}'::jsonb,
 '2026-01-01 09:00:00+00', '2026-01-18 09:00:00+00', false, false),

-- 20. Sofia Rodriguez - Designer, Acme Corp (joined Apr 2026)
('00000000-0000-0000-0000-000000000000', 'a0000020-0000-4000-8000-000000000020',
 'authenticated', 'authenticated', 'sofia@seed.test',
 '$2a$10$v6eIqtfdO8MPMAg6HEJUU.eHvG1iZ9bIl/apu.boe3WW5wvr2Lr2W',
 '2026-04-01 09:00:00+00', '{"provider":"email","providers":["email"]}'::jsonb,
 '{"email_verified":true,"display_name":"Sofia Rodriguez"}'::jsonb,
 '2026-04-01 09:00:00+00', '2026-01-18 09:00:00+00', false, false),

-- 21. Ethan Kowalski - Sales Engineer, TechStart (joined May 2026)
('00000000-0000-0000-0000-000000000000', 'a0000021-0000-4000-8000-000000000021',
 'authenticated', 'authenticated', 'ethan@seed.test',
 '$2a$10$v6eIqtfdO8MPMAg6HEJUU.eHvG1iZ9bIl/apu.boe3WW5wvr2Lr2W',
 '2026-05-01 09:00:00+00', '{"provider":"email","providers":["email"]}'::jsonb,
 '{"email_verified":true,"display_name":"Ethan Kowalski"}'::jsonb,
 '2026-05-01 09:00:00+00', '2026-01-18 09:00:00+00', false, false)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email, encrypted_password = EXCLUDED.encrypted_password,
  email_confirmed_at = EXCLUDED.email_confirmed_at,
  raw_app_meta_data = EXCLUDED.raw_app_meta_data,
  raw_user_meta_data = EXCLUDED.raw_user_meta_data,
  updated_at = EXCLUDED.updated_at;

-- Insert identities
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
SELECT u.id, u.id,
  jsonb_build_object('sub', u.id, 'email', u.email, 'email_verified', true),
  'email', u.id, u.created_at, u.updated_at
FROM auth.users u
WHERE u.email LIKE '%@seed.test'
ON CONFLICT DO NOTHING;

-- Upsert public.users profiles with rich data
INSERT INTO public.users (id, email, display_name, avatar_url, created_at, updated_at)
VALUES
('a0000001-0000-4000-8000-000000000001', 'marcus@seed.test', 'Marcus Chen', NULL, '2025-07-18 09:00:00+00', '2026-01-18 09:00:00+00'),
('a0000002-0000-4000-8000-000000000002', 'sarah@seed.test', 'Sarah Patel', NULL, '2025-07-18 09:05:00+00', '2026-01-18 09:00:00+00'),
('a0000003-0000-4000-8000-000000000003', 'jake@seed.test', 'Jake Morrison', NULL, '2025-07-19 10:00:00+00', '2026-01-18 09:00:00+00'),
('a0000004-0000-4000-8000-000000000004', 'elena@seed.test', 'Elena Volkov', NULL, '2025-07-20 08:30:00+00', '2026-01-18 09:00:00+00'),
('a0000005-0000-4000-8000-000000000005', 'tyler@seed.test', 'Tyler Brooks', NULL, '2025-07-22 11:00:00+00', '2026-01-18 09:00:00+00'),
('a0000006-0000-4000-8000-000000000006', 'priya@seed.test', 'Priya Sharma', NULL, '2025-08-01 09:00:00+00', '2026-01-18 09:00:00+00'),
('a0000007-0000-4000-8000-000000000007', 'carlos@seed.test', 'Carlos Rivera', NULL, '2025-08-05 14:00:00+00', '2026-01-18 09:00:00+00'),
('a0000008-0000-4000-8000-000000000008', 'aisha@seed.test', 'Aisha Johnson', NULL, '2025-08-10 09:30:00+00', '2026-01-18 09:00:00+00'),
('a0000009-0000-4000-8000-000000000009', 'liam@seed.test', 'Liam O''Brien', NULL, '2025-08-15 10:00:00+00', '2026-01-18 09:00:00+00'),
('a0000010-0000-4000-8000-000000000010', 'mei@seed.test', 'Mei Lin', NULL, '2025-09-01 08:00:00+00', '2026-01-18 09:00:00+00'),
('a0000011-0000-4000-8000-000000000011', 'dmitri@seed.test', 'Dmitri Petrov', NULL, '2025-09-10 09:00:00+00', '2026-01-18 09:00:00+00'),
('a0000012-0000-4000-8000-000000000012', 'nkechi@seed.test', 'Nkechi Adeyemi', NULL, '2025-07-18 08:00:00+00', '2026-01-18 09:00:00+00'),
('a0000013-0000-4000-8000-000000000013', 'raj@seed.test', 'Raj Gupta', NULL, '2025-07-25 10:00:00+00', '2026-01-18 09:00:00+00'),
('a0000014-0000-4000-8000-000000000014', 'fatima@seed.test', 'Fatima Al-Rashid', NULL, '2025-09-15 09:00:00+00', '2026-01-18 09:00:00+00'),
('a0000015-0000-4000-8000-000000000015', 'tom@seed.test', 'Tom Nguyen', NULL, '2025-10-01 09:00:00+00', '2026-01-18 09:00:00+00'),
('a0000016-0000-4000-8000-000000000016', 'admin@seed.test', 'Alex Admin', NULL, '2025-07-15 08:00:00+00', '2026-01-18 09:00:00+00'),
('a0000017-0000-4000-8000-000000000017', 'olivia@seed.test', 'Olivia Foster', NULL, '2026-02-01 09:00:00+00', '2026-01-18 09:00:00+00'),
('a0000018-0000-4000-8000-000000000018', 'jamal@seed.test', 'Jamal Williams', NULL, '2026-03-01 09:00:00+00', '2026-01-18 09:00:00+00'),
('a0000019-0000-4000-8000-000000000019', 'chen@seed.test', 'Chen Wei', NULL, '2026-01-01 09:00:00+00', '2026-01-18 09:00:00+00'),
('a0000020-0000-4000-8000-000000000020', 'sofia@seed.test', 'Sofia Rodriguez', NULL, '2026-04-01 09:00:00+00', '2026-01-18 09:00:00+00'),
('a0000021-0000-4000-8000-000000000021', 'ethan@seed.test', 'Ethan Kowalski', NULL, '2026-05-01 09:00:00+00', '2026-01-18 09:00:00+00')
ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name, updated_at = EXCLUDED.updated_at;

-- User preferences for all users
INSERT INTO public.user_preferences (user_id, theme, notification_prefs, clock_format, message_display, sidebar_show_display_name, sidebar_sort_alphabetical)
SELECT u.id, 'system', '{}'::jsonb, '12h', 'standard', true, false
FROM public.users u WHERE u.email LIKE '%@seed.test'
ON CONFLICT (user_id) DO NOTHING;

-- Override specific preferences to show variety
UPDATE public.user_preferences SET theme = 'dark', clock_format = '24h'
WHERE user_id = 'a0000001-0000-4000-8000-000000000001';
UPDATE public.user_preferences SET theme = 'light', message_display = 'compact'
WHERE user_id = 'a0000004-0000-4000-8000-000000000004';
UPDATE public.user_preferences SET theme = 'dark', sidebar_sort_alphabetical = true
WHERE user_id = 'a0000007-0000-4000-8000-000000000007';
UPDATE public.user_preferences SET clock_format = '24h', message_display = 'compact'
WHERE user_id = 'a0000011-0000-4000-8000-000000000011';

-- Super admin: system theme, 24h, all defaults
UPDATE public.user_preferences SET theme = 'dark', clock_format = '24h', sidebar_show_display_name = true
WHERE user_id = 'a0000016-0000-4000-8000-000000000016';

-- User statuses (custom status messages)
INSERT INTO public.user_statuses (user_id, emoji, text, created_at, updated_at)
VALUES
('a0000001-0000-4000-8000-000000000001', 'laptop', 'Working on v2.0 release', '2026-01-18 08:00:00+00', '2026-01-18 08:00:00+00'),
('a0000002-0000-4000-8000-000000000002', 'meeting', 'In sprint planning', '2026-01-18 09:00:00+00', '2026-01-18 09:00:00+00'),
('a0000003-0000-4000-8000-000000000003', 'coffee', 'BRB - coffee run', '2026-01-18 07:30:00+00', '2026-01-18 07:30:00+00'),
('a0000006-0000-4000-8000-000000000006', 'bug', 'Testing regression suite', '2026-01-17 14:00:00+00', '2026-01-17 14:00:00+00'),
('a0000007-0000-4000-8000-000000000007', 'fire', 'Deploying hotfix to prod', '2026-01-18 06:00:00+00', '2026-01-18 06:00:00+00'),
('a0000012-0000-4000-8000-000000000012', 'house', 'Working from home', '2026-01-18 08:30:00+00', '2026-01-18 08:30:00+00'),
('a0000015-0000-4000-8000-000000000015', 'books', 'Reading docs', '2026-01-18 10:00:00+00', '2026-01-18 10:00:00+00'),
('a0000016-0000-4000-8000-000000000016', 'wrench', 'Platform maintenance', '2026-01-18 07:00:00+00', '2026-01-18 07:00:00+00'),
('a0000017-0000-4000-8000-000000000017', 'rocket', 'Shipping v3 features', '2026-01-18 08:00:00+00', '2026-01-18 08:00:00+00'),
('a0000019-0000-4000-8000-000000000019', 'clipboard', 'Writing sprint goals', '2026-01-18 08:30:00+00', '2026-01-18 08:30:00+00'),
('a0000020-0000-4000-8000-000000000020', 'art', 'Designing new onboarding flow', '2026-01-18 09:00:00+00', '2026-01-18 09:00:00+00')
ON CONFLICT (user_id) DO UPDATE SET emoji = EXCLUDED.emoji, text = EXCLUDED.text, updated_at = EXCLUDED.updated_at;

-- User presence (online status tracking)
INSERT INTO public.user_presence (user_id, status, last_seen_at, updated_at)
VALUES
('a0000001-0000-4000-8000-000000000001', 'online',  '2026-01-18 09:00:00+00', '2026-01-18 09:00:00+00'),
('a0000002-0000-4000-8000-000000000002', 'online',  '2026-01-18 09:05:00+00', '2026-01-18 09:05:00+00'),
('a0000003-0000-4000-8000-000000000003', 'away',   '2026-01-18 07:30:00+00', '2026-01-18 07:30:00+00'),
('a0000004-0000-4000-8000-000000000004', 'online',  '2026-01-18 08:45:00+00', '2026-01-18 08:45:00+00'),
('a0000005-0000-4000-8000-000000000005', 'online',  '2026-01-18 09:00:00+00', '2026-01-18 09:00:00+00'),
('a0000006-0000-4000-8000-000000000006', 'dnd',    '2026-01-17 14:00:00+00', '2026-01-17 14:00:00+00'),
('a0000007-0000-4000-8000-000000000007', 'online',  '2026-01-18 06:00:00+00', '2026-01-18 06:00:00+00'),
('a0000008-0000-4000-8000-000000000008', 'online',  '2026-01-18 09:10:00+00', '2026-01-18 09:10:00+00'),
('a0000009-0000-4000-8000-000000000009', 'online',  '2026-01-18 08:55:00+00', '2026-01-18 08:55:00+00'),
('a0000010-0000-4000-8000-000000000010', 'away',   '2026-01-18 07:00:00+00', '2026-01-18 07:00:00+00'),
('a0000011-0000-4000-8000-000000000011', 'online',  '2026-01-18 09:02:00+00', '2026-01-18 09:02:00+00'),
('a0000012-0000-4000-8000-000000000012', 'online',  '2026-01-18 08:30:00+00', '2026-01-18 08:30:00+00'),
('a0000013-0000-4000-8000-000000000013', 'online',  '2026-01-18 09:00:00+00', '2026-01-18 09:00:00+00'),
('a0000014-0000-4000-8000-000000000014', 'offline', '2026-01-17 17:00:00+00', '2026-01-17 17:00:00+00'),
('a0000015-0000-4000-8000-000000000015', 'online',  '2026-01-18 09:00:00+00', '2026-01-18 09:00:00+00'),
('a0000016-0000-4000-8000-000000000016', 'online',  '2026-01-18 09:05:00+00', '2026-01-18 09:05:00+00'),
('a0000017-0000-4000-8000-000000000017', 'online',  '2026-01-18 09:00:00+00', '2026-01-18 09:00:00+00'),
('a0000018-0000-4000-8000-000000000018', 'offline', '2026-01-17 17:00:00+00', '2026-01-17 17:00:00+00'),
('a0000019-0000-4000-8000-000000000019', 'online',  '2026-01-18 08:30:00+00', '2026-01-18 08:30:00+00'),
('a0000020-0000-4000-8000-000000000020', 'online',  '2026-01-18 09:00:00+00', '2026-01-18 09:00:00+00'),
('a0000021-0000-4000-8000-000000000021', 'away',   '2026-01-18 07:00:00+00', '2026-01-18 07:00:00+00')
ON CONFLICT (user_id) DO UPDATE SET status = EXCLUDED.status, last_seen_at = EXCLUDED.last_seen_at, updated_at = EXCLUDED.updated_at;

-- Trigger words
INSERT INTO public.trigger_words (user_id, word)
VALUES
('a0000001-0000-4000-8000-000000000001', 'urgent'),
('a0000001-0000-4000-8000-000000000001', 'deploy'),
('a0000002-0000-4000-8000-000000000002', 'deadline'),
('a0000003-0000-4000-8000-000000000003', 'PR'),
('a0000003-0000-4000-8000-000000000003', 'review'),
('a0000006-0000-4000-8000-000000000006', 'bug'),
('a0000006-0000-4000-8000-000000000006', 'regression'),
('a0000011-0000-4000-8000-000000000011', 'CVE'),
('a0000011-0000-4000-8000-000000000011', 'vulnerability'),
('a0000017-0000-4000-8000-000000000017', 'breaking'),
('a0000017-0000-4000-8000-000000000017', 'migration'),
('a0000019-0000-4000-8000-000000000019', 'release'),
('a0000021-0000-4000-8000-000000000021', 'demo')
ON CONFLICT (user_id, word) DO NOTHING;

-- Consent logs (showing some users have given consent)
INSERT INTO public.consent_logs (user_id, consent_type, granted, ip_address, user_agent, created_at)
VALUES
('a0000001-0000-4000-8000-000000000001', 'analytics', true, '192.168.1.10'::inet, 'Mozilla/5.0 Chrome/120', '2025-07-18 09:00:00+00'),
('a0000001-0000-4000-8000-000000000001', 'cookies', true, '192.168.1.10'::inet, 'Mozilla/5.0 Chrome/120', '2025-07-18 09:00:00+00'),
('a0000002-0000-4000-8000-000000000002', 'analytics', true, '192.168.1.20'::inet, 'Mozilla/5.0 Firefox/121', '2025-07-18 09:05:00+00'),
('a0000002-0000-4000-8000-000000000002', 'marketing', false, '192.168.1.20'::inet, 'Mozilla/5.0 Firefox/121', '2025-07-18 09:05:00+00'),
('a0000003-0000-4000-8000-000000000003', 'analytics', true, '192.168.1.30'::inet, 'Mozilla/5.0 Chrome/120', '2025-07-19 10:00:00+00'),
('a0000003-0000-4000-8000-000000000003', 'cookies', true, '192.168.1.30'::inet, 'Mozilla/5.0 Chrome/120', '2025-07-19 10:00:00+00'),
('a0000012-0000-4000-8000-000000000012', 'analytics', true, '10.0.0.5'::inet, 'Mozilla/5.0 Safari/17', '2025-07-18 08:00:00+00'),
('a0000012-0000-4000-8000-000000000012', 'cookies', true, '10.0.0.5'::inet, 'Mozilla/5.0 Safari/17', '2025-07-18 08:00:00+00'),
('a0000012-0000-4000-8000-000000000012', 'marketing', true, '10.0.0.5'::inet, 'Mozilla/5.0 Safari/17', '2025-07-18 08:00:00+00'),
('a0000015-0000-4000-8000-000000000015', 'analytics', true, '10.0.0.15'::inet, 'Mozilla/5.0 Chrome/125', '2025-10-01 09:00:00+00'),
-- Super admin consent
('a0000016-0000-4000-8000-000000000016', 'analytics', true, '10.0.0.1'::inet, 'Mozilla/5.0 Chrome/125', '2025-07-15 08:00:00+00'),
('a0000016-0000-4000-8000-000000000016', 'cookies', true, '10.0.0.1'::inet, 'Mozilla/5.0 Chrome/125', '2025-07-15 08:00:00+00'),
('a0000016-0000-4000-8000-000000000016', 'marketing', true, '10.0.0.1'::inet, 'Mozilla/5.0 Chrome/125', '2025-07-15 08:00:00+00'),
-- Additional consent logs for other users
('a0000004-0000-4000-8000-000000000004', 'analytics', true, '192.168.1.40'::inet, 'Mozilla/5.0 Firefox/122', '2025-07-20 08:30:00+00'),
('a0000004-0000-4000-8000-000000000004', 'cookies', true, '192.168.1.40'::inet, 'Mozilla/5.0 Firefox/122', '2025-07-20 08:30:00+00'),
('a0000005-0000-4000-8000-000000000005', 'analytics', true, '192.168.1.50'::inet, 'Mozilla/5.0 Chrome/121', '2025-07-22 11:00:00+00'),
('a0000005-0000-4000-8000-000000000005', 'marketing', false, '192.168.1.50'::inet, 'Mozilla/5.0 Chrome/121', '2025-07-22 11:00:00+00'),
('a0000008-0000-4000-8000-000000000008', 'analytics', true, '10.0.0.8'::inet, 'Mozilla/5.0 Safari/17', '2025-08-10 09:30:00+00'),
('a0000009-0000-4000-8000-000000000009', 'cookies', true, '192.168.1.90'::inet, 'Mozilla/5.0 Chrome/122', '2025-08-15 10:00:00+00'),
('a0000011-0000-4000-8000-000000000011', 'analytics', true, '10.0.0.11'::inet, 'Mozilla/5.0 Firefox/123', '2025-09-10 09:00:00+00'),
('a0000011-0000-4000-8000-000000000011', 'cookies', false, '10.0.0.11'::inet, 'Mozilla/5.0 Firefox/123', '2025-09-10 09:00:00+00'),
-- New user consent logs
('a0000017-0000-4000-8000-000000000017', 'analytics', true, '10.0.0.17'::inet, 'Mozilla/5.0 Chrome/128', '2026-02-01 09:00:00+00'),
('a0000017-0000-4000-8000-000000000017', 'cookies', true, '10.0.0.17'::inet, 'Mozilla/5.0 Chrome/128', '2026-02-01 09:00:00+00'),
('a0000018-0000-4000-8000-000000000018', 'analytics', true, '10.0.0.18'::inet, 'Mozilla/5.0 Chrome/129', '2026-03-01 09:00:00+00'),
('a0000018-0000-4000-8000-000000000018', 'marketing', false, '10.0.0.18'::inet, 'Mozilla/5.0 Chrome/129', '2026-03-01 09:00:00+00'),
('a0000019-0000-4000-8000-000000000019', 'analytics', true, '10.0.0.19'::inet, 'Mozilla/5.0 Firefox/130', '2026-01-01 09:00:00+00'),
('a0000019-0000-4000-8000-000000000019', 'cookies', true, '10.0.0.19'::inet, 'Mozilla/5.0 Firefox/130', '2026-01-01 09:00:00+00'),
('a0000020-0000-4000-8000-000000000020', 'analytics', true, '10.0.0.20'::inet, 'Mozilla/5.0 Safari/18', '2026-04-01 09:00:00+00'),
('a0000020-0000-4000-8000-000000000020', 'cookies', true, '10.0.0.20'::inet, 'Mozilla/5.0 Safari/18', '2026-04-01 09:00:00+00'),
('a0000021-0000-4000-8000-000000000021', 'analytics', true, '10.0.0.21'::inet, 'Mozilla/5.0 Chrome/131', '2026-05-01 09:00:00+00'),
('a0000021-0000-4000-8000-000000000021', 'cookies', true, '10.0.0.21'::inet, 'Mozilla/5.0 Chrome/131', '2026-05-01 09:00:00+00')
ON CONFLICT DO NOTHING;

commit;
