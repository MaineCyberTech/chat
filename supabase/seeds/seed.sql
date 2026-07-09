-- seed.sql - Minimal E2E test data
-- Run via: supabase db execute --file supabase/seeds/seed.sql

begin;

-- Clean up existing test data (idempotent)
delete from public.webhook_deliveries;
delete from public.webhook_dead_letters;
delete from public.webhook_endpoints;
delete from public.notifications;
delete from public.reactions;
delete from public.message_flags;
delete from public.message_edit_history;
delete from public.messages;
delete from public.channel_members;
delete from public.channel_bookmarks;
delete from public.sidebar_channel_assignments;
delete from public.sidebar_categories;
delete from public.channel_notification_preferences;
delete from public.dm_members;
delete from public.dm_channels;
delete from public.channels;
delete from public.workspace_members;
delete from public.workspaces;
delete from public.users;
delete from auth.identities where user_id in ('6adfefa6-27c2-480e-9881-6514f4e9b708', '817016dc-cc3b-49d1-8ee6-637f880fa0a4');
delete from auth.users where id in ('6adfefa6-27c2-480e-9881-6514f4e9b708', '817016dc-cc3b-49d1-8ee6-637f880fa0a4');

-- Test user 1: admin
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, is_sso_user, is_anonymous)
values ('00000000-0000-0000-0000-000000000000', '6adfefa6-27c2-480e-9881-6514f4e9b708', 'authenticated', 'authenticated', 'admin@e2e.test', '$2a$10$v6eIqtfdO8MPMAg6HEJUU.eHvG1iZ9bIl/apu.boe3WW5wvr2Lr2W', '2026-01-01 00:00:00+00', '{"provider": "email", "providers": ["email"]}'::jsonb, '{"display_name": "E2E Admin"}'::jsonb, '2026-01-01 00:00:00+00', '2026-01-01 00:00:00+00', false, false);

insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
values ('6adfefa6-27c2-480e-9881-6514f4e9b708', '6adfefa6-27c2-480e-9881-6514f4e9b708', '{"sub": "6adfefa6-27c2-480e-9881-6514f4e9b708", "email": "admin@e2e.test", "email_verified": true}'::jsonb, 'email', '6adfefa6-27c2-480e-9881-6514f4e9b708', null, '2026-01-01 00:00:00+00', '2026-01-01 00:00:00+00');

insert into public.users (id, email, display_name, created_at, updated_at)
values ('6adfefa6-27c2-480e-9881-6514f4e9b708', 'admin@e2e.test', 'E2E Admin', '2026-01-01 00:00:00+00', '2026-01-01 00:00:00+00');

-- Test user 2: alice
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, is_sso_user, is_anonymous)
values ('00000000-0000-0000-0000-000000000000', '817016dc-cc3b-49d1-8ee6-637f880fa0a4', 'authenticated', 'authenticated', 'alice@e2e.test', '$2a$10$b.W10DuOIwSngBknhOICauM60fAT3Slmgi11Rmwf5y.Ks5NRCQdd2', '2026-01-01 00:00:00+00', '{"provider": "email", "providers": ["email"]}'::jsonb, '{"display_name": "E2E Alice"}'::jsonb, '2026-01-01 00:00:00+00', '2026-01-01 00:00:00+00', false, false);

insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
values ('817016dc-cc3b-49d1-8ee6-637f880fa0a4', '817016dc-cc3b-49d1-8ee6-637f880fa0a4', '{"sub": "817016dc-cc3b-49d1-8ee6-637f880fa0a4", "email": "alice@e2e.test", "email_verified": true}'::jsonb, 'email', '817016dc-cc3b-49d1-8ee6-637f880fa0a4', null, '2026-01-01 00:00:00+00', '2026-01-01 00:00:00+00');

insert into public.users (id, email, display_name, created_at, updated_at)
values ('817016dc-cc3b-49d1-8ee6-637f880fa0a4', 'alice@e2e.test', 'E2E Alice', '2026-01-01 00:00:00+00', '2026-01-01 00:00:00+00');

-- Test workspace
insert into public.workspaces (id, name, slug, owner_id, created_at, updated_at)
values ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'E2E Workspace', 'e2e-workspace', '6adfefa6-27c2-480e-9881-6514f4e9b708', '2026-01-01 00:00:00+00', '2026-01-01 00:00:00+00');

-- Workspace members
insert into public.workspace_members (workspace_id, user_id, role, joined_at)
values ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '6adfefa6-27c2-480e-9881-6514f4e9b708', 'owner', '2026-01-01 00:00:00+00'),
       ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '817016dc-cc3b-49d1-8ee6-637f880fa0a4', 'member', '2026-01-01 00:00:00+00');

-- Test channels
insert into public.channels (id, workspace_id, name, slug, created_by, is_private, created_at, updated_at)
values ('a1111111-1111-4111-8111-111111111111', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'general', 'general', '6adfefa6-27c2-480e-9881-6514f4e9b708', false, '2026-01-01 00:00:00+00', '2026-01-01 00:00:00+00'),
       ('a2222222-2222-4222-8222-222222222222', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'random', 'random', '6adfefa6-27c2-480e-9881-6514f4e9b708', false, '2026-01-01 00:00:00+00', '2026-01-01 00:00:00+00');

-- Channel members
insert into public.channel_members (channel_id, user_id, joined_at, last_viewed_at)
values ('a1111111-1111-4111-8111-111111111111', '6adfefa6-27c2-480e-9881-6514f4e9b708', '2026-01-01 00:00:00+00', '2026-01-01 00:00:00+00'),
       ('a1111111-1111-4111-8111-111111111111', '817016dc-cc3b-49d1-8ee6-637f880fa0a4', '2026-01-01 00:00:00+00', '2026-01-01 00:00:00+00'),
       ('a2222222-2222-4222-8222-222222222222', '6adfefa6-27c2-480e-9881-6514f4e9b708', '2026-01-01 00:00:00+00', '2026-01-01 00:00:00+00'),
       ('a2222222-2222-4222-8222-222222222222', '817016dc-cc3b-49d1-8ee6-637f880fa0a4', '2026-01-01 00:00:00+00', '2026-01-01 00:00:00+00');

-- Test messages
insert into public.messages (id, channel_id, user_id, content, created_at, updated_at)
values ('b1111111-1111-4111-8111-111111111111', 'a1111111-1111-4111-8111-111111111111', '6adfefa6-27c2-480e-9881-6514f4e9b708', 'Hello from E2E Admin!', '2026-01-01 00:01:00+00', '2026-01-01 00:01:00+00'),
       ('b2222222-2222-4222-8222-222222222222', 'a1111111-1111-4111-8111-111111111111', '817016dc-cc3b-49d1-8ee6-637f880fa0a4', 'Hi from E2E Alice!', '2026-01-01 00:02:00+00', '2026-01-01 00:02:00+00');

commit;
