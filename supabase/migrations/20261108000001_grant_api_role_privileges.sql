-- Grant the Supabase API roles the privileges they need on the public schema.
--
-- Supabase's hosted project template installs default privileges for anon /
-- authenticated / service_role, but a local `supabase db reset` recreates the
-- public schema and drops them. Without explicit grants the API roles cannot
-- read even tables whose RLS policies allow them, which breaks the real-database
-- RLS tier (TEST-P2-003) and local E2E runs.
--
-- Keep anon read-only: DATA-P2-001 requires no blanket anon DML grant. Row
-- visibility is still decided by the RLS policies on each table.

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO anon, authenticated, service_role;
