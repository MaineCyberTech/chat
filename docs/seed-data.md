# Seed Data Reference

## Test User Login Info

All seed users share the same password: **`password123`**

Quick access: **[/test-accounts](/test-accounts)** — auto-login page for all test accounts.

| #   | Email            | Name             | Role                        | Workspaces                      | Joined   |
| --- | ---------------- | ---------------- | --------------------------- | ------------------------------- | -------- |
| 1   | marcus@seed.test | Marcus Chen      | Product Manager             | Acme Corp (owner)               | Jul 2025 |
| 2   | sarah@seed.test  | Sarah Patel      | UX Researcher               | Acme Corp, DesignHub            | Jul 2025 |
| 3   | jake@seed.test   | Jake Morrison    | DevOps Engineer             | Acme Corp (admin)               | Jul 2025 |
| 4   | elena@seed.test  | Elena Volkov     | Backend Engineer            | Acme Corp                       | Jul 2025 |
| 5   | tyler@seed.test  | Tyler Brooks     | Frontend Engineer           | Acme Corp, DesignHub            | Jul 2025 |
| 6   | priya@seed.test  | Priya Sharma     | QA Engineer                 | Acme Corp                       | Jul 2025 |
| 7   | carlos@seed.test | Carlos Rivera    | Site Reliability Engineer   | TechStart (admin)               | Jul 2025 |
| 8   | aisha@seed.test  | Aisha Johnson    | Design Lead                 | Acme Corp, DesignHub            | Jul 2025 |
| 9   | liam@seed.test   | Liam O'Brien     | CI/CD Engineer              | Acme Corp                       | Jul 2025 |
| 10  | mei@seed.test    | Mei Lin          | Data Engineer               | Acme Corp                       | Jul 2025 |
| 11  | dmitri@seed.test | Dmitri Petrov    | Security Engineer           | Acme Corp                       | Jul 2025 |
| 12  | nkechi@seed.test | Nkechi Adeyemi   | Business Development        | TechStart (owner), Acme Corp    | Jul 2025 |
| 13  | raj@seed.test    | Raj Gupta        | Engineering Manager         | TechStart                       | Jul 2025 |
| 14  | fatima@seed.test | Fatima Al-Rashid | Product Designer            | DesignHub (admin)               | Jul 2025 |
| 15  | tom@seed.test    | Tom Nguyen       | Marketing Intern            | TechStart                       | Oct 2025 |
| 16  | admin@seed.test  | Alex Admin       | Super Admin                 | Acme Corp, TechStart, DesignHub | Jul 2025 |
| 17  | olivia@seed.test | Olivia Foster    | Staff Engineer              | Acme Corp                       | Feb 2026 |
| 18  | jamal@seed.test  | Jamal Williams   | Software Engineering Intern | TechStart                       | Mar 2026 |
| 19  | chen@seed.test   | Chen Wei         | Product Manager             | DesignHub                       | Jan 2026 |
| 20  | sofia@seed.test  | Sofia Rodriguez  | Product Designer            | Acme Corp                       | Apr 2026 |
| 21  | ethan@seed.test  | Ethan Kowalski   | Sales Engineer              | TechStart                       | May 2026 |

## Workspaces

| Workspace | Slug      | Owner          | Members | Created  |
| --------- | --------- | -------------- | ------- | -------- |
| Acme Corp | acme-corp | Marcus Chen    | 13      | Jul 2025 |
| TechStart | techstart | Nkechi Adeyemi | 7       | Jul 2025 |
| DesignHub | designhub | Sarah Patel    | 5       | Aug 2025 |

## Key User IDs

```
Marcus Chen:     a0000001-0000-4000-8000-000000000001
Sarah Patel:     a0000002-0000-4000-8000-000000000002
Jake Morrison:   a0000003-0000-4000-8000-000000000003
Elena Volkov:    a0000004-0000-4000-8000-000000000004
Tyler Brooks:    a0000005-0000-4000-8000-000000000005
Priya Sharma:    a0000006-0000-4000-8000-000000000006
Carlos Rivera:   a0000007-0000-4000-8000-000000000007
Aisha Johnson:   a0000008-0000-4000-8000-000000000008
Liam O'Brien:    a0000009-0000-4000-8000-000000000009
Mei Lin:         a0000010-0000-4000-8000-000000000010
Dmitri Petrov:   a0000011-0000-4000-8000-000000000011
Nkechi Adeyemi:  a0000012-0000-4000-8000-000000000012
Raj Gupta:       a0000013-0000-4000-8000-000000000013
Fatima Al-Rashid:a0000014-0000-4000-8000-000000000014
Tom Nguyen:      a0000015-0000-4000-8000-000000000015
Alex Admin:      a0000016-0000-4000-8000-000000000016
Olivia Foster:   a0000017-0000-4000-8000-000000000017
Jamal Williams:  a0000018-0000-4000-8000-000000000018
Chen Wei:        a0000019-0000-4000-8000-000000000019
Sofia Rodriguez: a0000020-0000-4000-8000-000000000020
Ethan Kowalski:  a0000021-0000-4000-8000-000000000021
```

## Workspace IDs

```
Acme Corp:  b0000001-0000-4000-8000-000000000001
TechStart:  b0000002-0000-4000-8000-000000000002
DesignHub:  b0000003-0000-4000-8000-000000000003
```

## Timeline

All seed data spans **July 2025 – July 2026**:

- **Jul–Sep 2025**: Workspace creation, initial team onboarding, early conversations
- **Oct–Dec 2025**: Tom joins as intern, feature development, first quarterly review
- **Jan 2026**: Chen joins DesignHub as PM
- **Feb 2026**: Olivia joins Acme Corp as Staff Engineer
- **Mar 2026**: Jamal joins TechStart as SWE intern
- **Apr 2026**: Sofia joins Acme Corp as Designer, v2.4 launch, production incident, sprint retros
- **May 2026**: Ethan joins TechStart as Sales Engineer, Globex deal, SOC2 audit
- **Jun 2026**: Performance sprint, DR drill, summer Friday schedule, H1 retrospective
- **Jul 2026**: Mid-year review, summer BBQ, $250K Acme Corp deal, Q3 kickoff, RICE scoring

## Database Stats (after all seeds)

| Table                | Count | Source File |
| -------------------- | ----- | ----------- |
| users                | 21    | 00          |
| auth.users           | 21    | 00          |
| workspaces           | 3     | 01          |
| workspace_members    | 25    | 01          |
| channels             | 24    | 02          |
| channel_members      | ~150  | 02          |
| messages             | 320   | 03, 05      |
| thread replies       | 49    | 03, 05      |
| reactions            | 153   | 03, 05      |
| message_reads        | 834   | 05          |
| message_flags        | 36    | 03, 05      |
| message_edit_history | 13    | 03, 05      |
| channel_bookmarks    | 27    | 02, 05      |
| user_groups          | 9     | 01, 05      |
| user_group_members   | 36    | 01, 05      |
| feature_flags        | 14    | 04, 05      |
| custom_emoji         | 12    | 05          |
| notifications        | 42    | 04          |
| audit_logs           | 15+   | 04          |
| scheduled_posts      | 5     | 03          |
| auto_responders      | 3     | 03          |

## Email Configuration

For local development with Inbucket, all emails go to `localhost:54324`:

```
Magic link auth emails → check Inbucket at http://localhost:54324
Verification emails    → check Inbucket at http://localhost:54324
Password reset emails  → check Inbucket at http://localhost:54324
```

## How Seeds Work

Seeds are loaded in order by Supabase CLI based on the `sql_paths` config in `supabase/config.toml`:

1. `00_comprehensive_users.sql` — Auth users, public users, preferences, statuses, presence, triggers, consent logs
2. `01_comprehensive_workspaces.sql` — Workspaces, memberships, groups, group memberships
3. `02_comprehensive_channels.sql` — Channels, memberships, notification preferences, bookmarks, DMs
4. `03_comprehensive_messages.sql` — Messages (Jul 2025–Jul 2026), reactions, threads, read receipts, flags, pins, scheduled posts
5. `04_comprehensive_features.sql` — Notifications, webhooks, audit logs, compliance exports, push subscriptions, feature flags
6. `05_comprehensive_expansion.sql` — Additional messages (Apr–Jul 2026), thread replies, reactions, read receipts, bookmarks, user groups, feature flags, custom emoji, message flags, edit history

### Key Behaviors

- All user UUIDs use hex-valid format `xxxx0000-0000-4000-8000-xxxxxxxxxxxx`
- Passwords are bcrypt-hashed `password123`
- `handle_new_user()` trigger auto-creates `public.users` from `auth.users`
- Channel creator trigger auto-adds the creator as a member
- Thread reply trigger auto-creates `thread_metadata` and `thread_participants`
- `prevent_read_only_message()` trigger is disabled during seeding
- All seeds use `ON CONFLICT DO NOTHING` for idempotency
- Cleanup deletes existing data before inserting to allow re-running
