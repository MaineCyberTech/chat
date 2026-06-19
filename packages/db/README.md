# @chat/db

Database package for Supabase/PostgreSQL integration.

## Directory Layout

```
sql/
  migrations/   SQL migration files (run sequentially)
  functions/    PostgreSQL functions / stored procedures
  policies/     Row-Level Security (RLS) policy definitions
  seeds/        Seed data for development and testing
src/
  config.ts     Supabase client factory
  index.ts      Package entry point
```

## Current Status

All schema files written across 5 migrations, 4 RLS policies, and 2 functions:

- `sql/migrations/001_users.sql` — `public.users` table linked to `auth.users`
- `sql/functions/handle_new_user.sql` — Auto-create user profile on signup
- `sql/policies/users_rls.sql` — RLS for users table
- `sql/migrations/002_workspaces.sql` — Workspaces + workspace_members tables
- `sql/policies/workspaces_rls.sql` — RLS for workspaces
- `sql/migrations/003_channels.sql` — Channels + channel_members tables
- `sql/policies/channels_rls.sql` — RLS for channels
- `sql/migrations/004_messages.sql` — Messages table with GIN index
- `sql/policies/messages_rls.sql` — RLS for messages
- `sql/migrations/005_search.sql` — Full-text search via tsvector
- `sql/policies/storage_rls.sql` — RLS for Supabase Storage bucket

To apply, run the SQL files in numerical order via the Supabase SQL Editor.

## Usage

```ts
import { createSupabaseClient } from "@chat/db";

const client = createSupabaseClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);
```
