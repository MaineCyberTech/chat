# Principal Audit Report

- Prompt: **security_principal_audit**
- Domain: **security**
- Run ID: **security_principal_audit_20260703_054832**
- Generated: **2026-07-03T12:00:00Z**
- Decision: **NO-GO**
- P0: **0**, P1: **3**
- P2: **2**, P3: **0**
- Readiness: **45.00**

## Findings

### P1 — requireMessageAccess middleware uses anonymous getSupabase() instead of authenticated req.supabase for initial message lookup

- **File:** `apps/api/src/middleware/require-membership.ts:126`
- **Category:** cross_tenant_isolation
- **Impact:** The initial message existence check uses a Supabase client with anon key + no user context, bypassing RLS. An authenticated user could probe message existence across workspaces/channels they don't belong to.
- **Fix:** Replace getSupabase() with (req as any).supabase and import getSupabaseForUser only for fallback, consistent with the fix pattern applied to messages/routes.ts.

### P1 — Webhook signing secrets stored as plaintext in webhook_endpoints table

- **File:** `apps/api/src/modules/webhooks/service.ts:136`
- **Category:** data_protection_at_rest
- **Impact:** Webhook secrets are stored unencrypted in PostgreSQL. A database compromise exposes all webhook signing keys, allowing attackers to forge valid webhook signatures.
- **Fix:** Use pgcrypto (pgp_sym_encrypt / pgp_sym_decrypt) to encrypt secrets at rest with a server-side encryption key (from env ENCRYPTION_KEY).

### P1 — Socket.io channel:join workspace membership check uses anonymous getSupabase() instead of authenticated client

- **File:** `apps/api/src/lib/socket.ts:92-93`
- **Category:** authorization_bypass
- **Impact:** Workspace membership verification for socket channel joins uses a Supabase client with no user auth context. If RLS is misconfigured, any socket client could join any channel.
- **Fix:** Replace getSupabase() with an authenticated client using getSupabaseForUser(token) from the socket handshake token.

### P2 — doubleSubmitCookieCsrf reads process.env.FRONTEND_URL directly instead of importing validated config

- **File:** `apps/api/src/middleware/csrf.ts:74`
- **Category:** csrf_validation
- **Impact:** The CSRF module reads raw process.env.FRONTEND_URL with fallback to localhost:3000. If initialization order changes, fallback value could allow unintended cross-origin requests in production.
- **Fix:** Import the validated environment config directly and use validated FRONTEND_URL value instead of reading process.env at runtime.

### P2 — Development droplet deployment sets NODE_ENV=development on a publicly accessible domain (chat.mainecybertech.us) behind Cloudflare

- **File:** `.github/workflows/deploy-development.yml:103`
- **Category:** env_configuration
- **Impact:** NODE_ENV=development may enable verbose error stacks, debug middleware, or development-only endpoints on a production-adjacent public domain.
- **Fix:** Set NODE_ENV=production in dev remote deployment. Use ENVIRONMENT variable to differentiate behavior without enabling Node.js debug modes.
