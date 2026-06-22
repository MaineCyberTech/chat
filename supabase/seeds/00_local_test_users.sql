-- 00_local_test_users.sql
-- LOCAL / DEV ONLY.
-- Seeds test users for local development.

begin;

-- Clean up existing test users to allow re-runs
delete from auth.identities
where user_id in ('6adfefa6-27c2-480e-9881-6514f4e9b708', '817016dc-cc3b-49d1-8ee6-637f880fa0a4', 'ef0370d6-0da8-43a1-8f24-d8c4f19448a0', 'b0a65dea-16c7-4f54-8192-d9267a4219d1')
   or provider_id in ('6adfefa6-27c2-480e-9881-6514f4e9b708', '817016dc-cc3b-49d1-8ee6-637f880fa0a4', 'ef0370d6-0da8-43a1-8f24-d8c4f19448a0', 'b0a65dea-16c7-4f54-8192-d9267a4219d1')
   or id in ('6adfefa6-27c2-480e-9881-6514f4e9b708', '817016dc-cc3b-49d1-8ee6-637f880fa0a4', 'ef0370d6-0da8-43a1-8f24-d8c4f19448a0', 'b0a65dea-16c7-4f54-8192-d9267a4219d1');

delete from auth.users
where id in ('6adfefa6-27c2-480e-9881-6514f4e9b708', '817016dc-cc3b-49d1-8ee6-637f880fa0a4', 'ef0370d6-0da8-43a1-8f24-d8c4f19448a0', 'b0a65dea-16c7-4f54-8192-d9267a4219d1');

-- Insert test users into auth.users
-- Passwords (all bcrypt hash of "password123"):
insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  invited_at,
  confirmation_token,
  confirmation_sent_at,
  recovery_token,
  recovery_sent_at,
  email_change_token_new,
  email_change,
  email_change_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  phone,
  phone_confirmed_at,
  phone_change,
  phone_change_token,
  phone_change_sent_at,
  email_change_token_current,
  email_change_confirm_status,
  banned_until,
  reauthentication_token,
  reauthentication_sent_at,
  is_sso_user,
  deleted_at,
  is_anonymous
)
values
('00000000-0000-0000-0000-000000000000', '6adfefa6-27c2-480e-9881-6514f4e9b708', 'authenticated', 'authenticated', 'admin@chat.example', '$2a$10$v6eIqtfdO8MPMAg6HEJUU.eHvG1iZ9bIl/apu.boe3WW5wvr2Lr2W', '2026-05-29 04:51:28.631509+00', NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}'::jsonb, '{"display_name": "Admin User"}'::jsonb, NULL, '2026-05-29 04:51:28.625592+00', '2026-05-29 04:51:28.632516+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
('00000000-0000-0000-0000-000000000000', '817016dc-cc3b-49d1-8ee6-637f880fa0a4', 'authenticated', 'authenticated', 'alice@chat.example', '$2a$10$b.W10DuOIwSngBknhOICauM60fAT3Slmgi11Rmwf5y.Ks5NRCQdd2', '2026-05-29 04:50:23.211405+00', NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}'::jsonb, '{"display_name": "Alice Johnson"}'::jsonb, NULL, '2026-05-29 04:50:23.1972+00', '2026-05-29 04:50:23.212608+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
('00000000-0000-0000-0000-000000000000', 'ef0370d6-0da8-43a1-8f24-d8c4f19448a0', 'authenticated', 'authenticated', 'bob@chat.example', '$2a$10$vAOpRfZIMclV.pkfh3WbBO.toV0OMU7tx9s1G1mNbtcghwb9y/7Nq', '2026-05-29 04:50:33.572375+00', NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}'::jsonb, '{"display_name": "Bob Smith"}'::jsonb, NULL, '2026-05-29 04:50:33.565766+00', '2026-05-29 04:50:33.573458+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
('00000000-0000-0000-0000-000000000000', 'b0a65dea-16c7-4f54-8192-d9267a4219d1', 'authenticated', 'authenticated', 'carol@chat.example', '$2a$10$kKjHUF0GigeXQNk9BUxz9u4K3a0uJn80ze0zcBA3yH/NewpiUUND6', '2026-05-29 04:50:44.239967+00', NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}'::jsonb, '{"display_name": "Carol Davis"}'::jsonb, NULL, '2026-05-29 04:50:44.23072+00', '2026-05-29 04:50:44.240893+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false)
on conflict (id) do update
set
  aud = excluded.aud,
  role = excluded.role,
  email = excluded.email,
  encrypted_password = excluded.encrypted_password,
  email_confirmed_at = excluded.email_confirmed_at,
  invited_at = excluded.invited_at,
  confirmation_token = excluded.confirmation_token,
  confirmation_sent_at = excluded.confirmation_sent_at,
  recovery_token = excluded.recovery_token,
  recovery_sent_at = excluded.recovery_sent_at,
  email_change_token_new = excluded.email_change_token_new,
  email_change = excluded.email_change,
  email_change_sent_at = excluded.email_change_sent_at,
  last_sign_in_at = excluded.last_sign_in_at,
  raw_app_meta_data = excluded.raw_app_meta_data,
  raw_user_meta_data = excluded.raw_user_meta_data,
  is_super_admin = excluded.is_super_admin,
  updated_at = excluded.updated_at,
  phone = excluded.phone,
  phone_confirmed_at = excluded.phone_confirmed_at,
  phone_change = excluded.phone_change,
  phone_change_token = excluded.phone_change_token,
  phone_change_sent_at = excluded.phone_change_sent_at,
  email_change_token_current = excluded.email_change_token_current,
  email_change_confirm_status = excluded.email_change_confirm_status,
  banned_until = excluded.banned_until,
  reauthentication_token = excluded.reauthentication_token,
  reauthentication_sent_at = excluded.reauthentication_sent_at,
  is_sso_user = excluded.is_sso_user,
  deleted_at = excluded.deleted_at,
  is_anonymous = excluded.is_anonymous;

-- Insert identities so Supabase auth recognizes these users
insert into auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
)
values
('6adfefa6-27c2-480e-9881-6514f4e9b708', '6adfefa6-27c2-480e-9881-6514f4e9b708', '{"sub": "6adfefa6-27c2-480e-9881-6514f4e9b708", "email": "admin@chat.example", "email_verified": true}'::jsonb, 'email', '6adfefa6-27c2-480e-9881-6514f4e9b708', NULL, '2026-05-29 04:51:28.625592+00', '2026-05-29 04:51:28.632516+00'),
('817016dc-cc3b-49d1-8ee6-637f880fa0a4', '817016dc-cc3b-49d1-8ee6-637f880fa0a4', '{"sub": "817016dc-cc3b-49d1-8ee6-637f880fa0a4", "email": "alice@chat.example", "email_verified": true}'::jsonb, 'email', '817016dc-cc3b-49d1-8ee6-637f880fa0a4', NULL, '2026-05-29 04:50:23.1972+00', '2026-05-29 04:50:23.212608+00'),
('ef0370d6-0da8-43a1-8f24-d8c4f19448a0', 'ef0370d6-0da8-43a1-8f24-d8c4f19448a0', '{"sub": "ef0370d6-0da8-43a1-8f24-d8c4f19448a0", "email": "bob@chat.example", "email_verified": true}'::jsonb, 'email', 'ef0370d6-0da8-43a1-8f24-d8c4f19448a0', NULL, '2026-05-29 04:50:33.565766+00', '2026-05-29 04:50:33.573458+00'),
('b0a65dea-16c7-4f54-8192-d9267a4219d1', 'b0a65dea-16c7-4f54-8192-d9267a4219d1', '{"sub": "b0a65dea-16c7-4f54-8192-d9267a4219d1", "email": "carol@chat.example", "email_verified": true}'::jsonb, 'email', 'b0a65dea-16c7-4f54-8192-d9267a4219d1', NULL, '2026-05-29 04:50:44.23072+00', '2026-05-29 04:50:44.240893+00');

commit;