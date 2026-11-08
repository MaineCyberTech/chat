-- Rollback: revoke the explicit API-role grants added by
-- 20261108000001_grant_api_role_privileges.sql.

ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE USAGE, SELECT ON SEQUENCES FROM authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLES FROM authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE SELECT ON TABLES FROM anon;

REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated, service_role;
REVOKE USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public FROM authenticated, service_role;
REVOKE SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public FROM authenticated, service_role;
REVOKE SELECT ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE USAGE ON SCHEMA public FROM anon, authenticated, service_role;
