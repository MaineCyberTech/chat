# Principal Audit Report

- Prompt: **security_principal_audit**
- Domain: **security**
- Run ID: **security_principal_audit_20260701_071112**
- Generated: **2026-07-01T07:11:05Z**
- Decision: **NO-GO**
- P0: **5**, P1: **7**
- P2: **8**, P3: **5**
- Readiness: **38.00**

## Findings

### P0 — /metrics endpoint is completely unauthenticated — exposes request counts, durations, WS connections, DB query durations

- **File:** `apps/api/src/app.ts`
- **Category:** authorization
- **Impact:** Anyone can access internal metrics — information disclosure of system topology, traffic patterns, and performance data
- **Fix:** Add authenticate middleware to /metrics route or restrict to internal network

### P0 — Reaction service uses getSupabase() (anon client) — bypasses RLS entirely for all reaction CRUD

- **File:** `apps/api/src/modules/reactions/service.ts`
- **Category:** authorization
- **Impact:** Any authenticated user can add/remove reactions on any message in any workspace — no tenant isolation
- **Fix:** Replace getSupabase() with req.supabase (JWT client) in reactions/service.ts for all operations

### P0 — 4 SECURITY DEFINER functions missing SET search_path — search_path injection vulnerability

- **File:** `supabase/migrations/20260625000020_auto_create_user_profile.sql`
- **Category:** authentication
- **Impact:** User with CREATE privilege can create malicious objects that hijack these functions' elevated privileges
- **Fix:** Add SET search_path = 'public' to all SECURITY DEFINER function definitions

### P0 — Message search uses getSupabase() (anon client) — auth.uid() is NULL in SECURITY INVOKER search function

- **File:** `apps/api/src/modules/messages/routes.ts`
- **Category:** authentication
- **Impact:** Search function cannot verify user membership — cross-tenant data leakage or no results returned
- **Fix:** Replace getSupabase() with req.supabase on messages/routes.ts line 38

### P0 — Webhook HMAC signature uses JSON.stringify with non-deterministic property ordering

- **File:** `apps/api/src/modules/webhooks/service.ts`
- **Category:** authorization
- **Impact:** Receivers cannot verify the HMAC signature as JSON.stringify property order is not guaranteed
- **Fix:** Use a deterministic serialization method (e.g., object key sorting) before HMAC computation

### P1 — CI/CD secrets written to disk via inline echo commands — GitHub Actions masking can fail

- **File:** `.github/workflows/deploy-development.yml`
- **Category:** authentication
- **Impact:** If shell fails in specific ways, secrets (origin TLS cert, private key, etc.) could appear in logs
- **Fix:** Use GitHub Actions environment file ($GITHUB_ENV) or secret files instead of echo; or use docker secret injection

### P1 — Workspace member management (add/remove/update role) lacks admin/owner role check — any member can manage members

- **File:** `apps/api/src/modules/workspaces/routes.ts`
- **Category:** authorization
- **Impact:** Any workspace member can add, remove, or change roles of other members — privilege escalation
- **Fix:** Add admin/owner role check in POST/PATCH/DELETE workspace member routes

### P1 — Webhook secret stored in plaintext in database and returned in API responses to all workspace members

- **File:** `apps/api/src/modules/webhooks/service.ts`
- **Category:** secret_handling
- **Impact:** Workspace members can read webhook secrets — if a webhook is used for CI/CD triggers, full CI pipeline access
- **Fix:** Encrypt webhook secret at rest (pgcrypto); mask secret in API responses

### P1 — Socket.io has allowEIO3: true enabling Engine.IO v3 legacy protocol

- **File:** `apps/api/src/lib/socket.ts`
- **Category:** defense_in_depth
- **Impact:** Expanded attack surface — Engine.IO v3 has known vulnerabilities and fewer security features
- **Fix:** Set allowEIO3: false unless backward compatibility is required

### P1 — Auth redirect URL uses window.location.origin without validation or allowlist

- **File:** `apps/web/components/auth/auth-context.tsx`
- **Category:** authentication
- **Impact:** Open redirect vulnerability — attacker could craft a login URL that redirects to a malicious site after auth
- **Fix:** Validate redirectTo against an allowlist of known origins before using

### P1 — isWorkspaceMember helper uses getSupabase() (anon client) without user JWT context

- **File:** `apps/api/src/lib/membership.ts`
- **Category:** authorization
- **Impact:** Membership check bypasses RLS — could return incorrect results or be bypassed
- **Fix:** Pass per-request Supabase client to isWorkspaceMember instead of using global anon client

### P1 — User email logged in workspace list operations — PII exposure in logs

- **File:** `apps/api/src/modules/workspaces/routes.ts`
- **Category:** logging
- **Impact:** User email addresses exposed in structured logs — potential PII breach in log aggregation
- **Fix:** Remove userEmail from log metadata; log only userId where needed

### P2 — Auth and search rate limiters key by IP only — not user+IP composite

- **File:** `apps/api/src/middleware/rate-limit.ts`
- **Category:** defense_in_depth
- **Impact:** Multiple users behind same NAT share rate limit bucket; single attacker with rotating IPs bypasses limits
- **Fix:** Use composite key {userId + ip} when user is authenticated, fall back to IP only for unauthenticated

### P2 — CSP includes 'unsafe-inline' for styles and allows cdn.jsdelivr.net for scripts

- **File:** `apps/api/src/middleware/security-headers.ts`
- **Category:** defense_in_depth
- **Impact:** Inline styles enable CSS-based data exfiltration; jsdelivr CDN allows any script from that domain
- **Fix:** Use nonce-based CSP for inline styles; restrict CDN allowlist to specific known script paths

### P2 — CSRF cookie has httpOnly: false (by design for SPA) — any XSS can exfiltrate the token

- **File:** `apps/api/src/middleware/csrf.ts`
- **Category:** defense_in_depth
- **Impact:** If XSS is present, CSRF protection is completely bypassed
- **Fix:** Consider additional CSRF measures like origin/referer header checking alongside double-submit cookie

### P2 — No Socket.io rate limiting — channel:join, typing:start/stop events not rate-limited

- **File:** `apps/api/src/lib/socket.ts`
- **Category:** defense_in_depth
- **Impact:** Malicious client can flood server with socket events, impacting all users
- **Fix:** Add per-socket rate limiting for chat events (e.g., max 10 typing events per 5 seconds)

### P2 — Avatar upload and retrieval routes use getSupabase() (anon client) — storage RLS bypassed

- **File:** `apps/api/src/modules/auth/routes.ts`
- **Category:** authorization
- **Impact:** Storage operations may not have proper RLS context — potential unauthorized access
- **Fix:** Use getSupabaseAdmin() for avatar upload, req.supabase for avatar retrieval

### P2 — Feature flag service uses getSupabaseAdmin() for all operations including reads

- **File:** `apps/api/src/lib/feature-flags.ts`
- **Category:** authorization
- **Impact:** Regular users cannot be prevented from accessing feature flags at DB level — overprivileged reads
- **Fix:** Use req.supabase for reads, getSupabaseAdmin() only for writes

### P2 — GDPR delete does not clean up audit_logs or consent_logs for the deleted user

- **File:** `apps/api/src/modules/auth/routes.ts`
- **Category:** compliance
- **Impact:** User's audit trail and consent records remain after GDPR deletion request — compliance gap
- **Fix:** Add cascade or explicit deletion of audit_logs and consent_logs in the GDPR delete endpoint

### P2 — Trivy vulnerability scanner uses @master tag — mutable reference

- **File:** `.github/workflows/validate.yml`
- **Category:** compliance
- **Impact:** Supply chain risk — unpinned action version could introduce breaking changes or malicious code
- **Fix:** Pin trivy-action to a specific SHA or semver tag

### P3 — CSP lacks nonce-based protection for inline scripts

- **File:** `apps/api/src/middleware/security-headers.ts`
- **Category:** defense_in_depth
- **Impact:** Any injected <script> tag executes in older browsers without CSP enforcement
- **Fix:** Implement nonce-based CSP for inline script tags

### P3 — wget installed in production Docker image — unnecessary package increases attack surface

- **File:** `apps/api/Dockerfile`
- **Category:** defense_in_depth
- **Impact:** Extra package in runtime image could be used as attack vector
- **Fix:** Remove wget from production Dockerfile; use curl or built-in health check mechanism

### P3 — console.error in auth callback exposes errors client-side in browser console

- **File:** `apps/web/components/auth/callback/page.tsx`
- **Category:** logging
- **Impact:** Auth errors visible to end users in browser dev tools
- **Fix:** Replace console.error with silent logging or Sentry capture

### P3 — No webhook event type allowlist — any event string accepted

- **File:** `apps/api/src/modules/webhooks/routes.ts`
- **Category:** defense_in_depth
- **Impact:** Invalid or unexpected event types could trigger webhooks unnecessarily
- **Fix:** Add Zod enum validation for supported event types

### P3 — pnpm audit threshold set to moderate — high/critical advisories below threshold won't block CI

- **File:** `.github/workflows/validate.yml`
- **Category:** compliance
- **Impact:** High-severity dependency vulnerabilities may not block deployment
- **Fix:** Raise pnpm audit threshold to high to at minimum block high-severity issues
