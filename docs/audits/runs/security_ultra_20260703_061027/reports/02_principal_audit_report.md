# Principal Audit Report

- Prompt: **security_ultra**
- Domain: **security**
- Run ID: **security_ultra_20260703_061027**
- Generated: **2026-07-03T06:10:00Z**
- Decision: **NO-GO**
- P0: **1**, P1: **3**
- P2: **3**, P3: **1**
- Readiness: **0.00**

## Findings

### P0 — Webhook secrets stored in plaintext in webhook_endpoints table - no encryption at rest

- **File:** `apps/api/src/modules/webhooks/service.ts`
- **Category:** Secrets at Rest
- **Impact:** DB compromise leaks all webhook secrets. Any actor with DB read access (e.g. via SQL injection, backup exposure) obtains secrets for outgoing webhooks.
- **Fix:** Encrypt secrets using pgcrypto at insert time, decrypt only at delivery time

### P1 — GET /consent returns ALL consent records across all users - no user_id filter

- **File:** `apps/api/src/modules/consent/routes.ts`
- **Category:** IDOR
- **Impact:** Any authenticated user can read other users' cookie/analytics/marketing consent choices. Direct PII exposure of consent preferences.
- **Fix:** Add .eq('user_id', req.userId) filter to the query

### P1 — Thread participants, join, and leave endpoints have no channel membership check. Thread data accessible to any authenticated user.

- **File:** `apps/api/src/modules/threads/routes.ts`
- **Category:** IDOR
- **Impact:** Any authenticated user can enumerate thread participants, join threads in any channel, and view thread membership without being a workspace member.
- **Fix:** Add requireChannelAccess middleware to thread routes

### P1 — Feature flag CRUD endpoints have no admin role check - any authenticated user can create/update/delete feature flags

- **File:** `apps/api/src/modules/feature-flags/routes.ts`
- **Category:** Privilege Escalation
- **Impact:** Any user can modify feature flags affecting all workspaces. Can enable/disable features globally without authorization.
- **Fix:** Add requireAdmin or requireWorkspaceOwner middleware to feature-flag mutation endpoints

### P2 — General API rate limiter uses IP-only key, not composite user+IP key like auth and search limiters

- **File:** `apps/api/src/middleware/rate-limit.ts`
- **Category:** Rate Limiting
- **Impact:** Attacker can rotate IP addresses to bypass the 100 req/min limit. IP-only keys are trivial to circumvent with botnets.
- **Fix:** Change keyGenerator from default to compositeKey (same as authLimiter)

### P2 — requireMessageAccess middleware uses getSupabase() (anon client) for message lookup instead of req.supabase (user JWT client)

- **File:** `apps/api/src/middleware/require-membership.ts`
- **Category:** Auth Bypass
- **Impact:** Initial message lookup bypasses RLS policies. Though later checks add membership validation, the first query runs without user context.
- **Fix:** Replace getSupabase() with req.supabase for the initial message lookup

### P2 — SSRF IP-blocking does not filter 0.0.0.0 or IPv6 [::] addresses

- **File:** `apps/api/src/modules/webhooks/service.ts`
- **Category:** SSRF Prevention
- **Impact:** Attacker pointing webhook URL to 0.0.0.0:PORT may bypass SSRF protection on some systems. IPv6 localhost not filtered.
- **Fix:** Add '0.' and '[::]' to blocked IP prefixes list, and resolve IPv6 addresses

### P3 — CSP style-src uses 'unsafe-inline' instead of nonce-based approach

- **File:** `apps/api/src/middleware/security-headers.ts`
- **Category:** CSP
- **Impact:** Inline styles permitted broadly. Nonce-based CSP would provide stronger protection against CSS injection attacks.
- **Fix:** Replace 'unsafe-inline' with nonce-based style loading where feasible
