# Principal Audit Report

- Prompt: **security_ultra**
- Domain: **security**
- Run ID: **security_ultra_20260701_074118**
- Generated: **2026-07-01T07:41:18Z**
- Decision: **NO-GO**
- P0: **4**, P1: **4**
- P2: **3**, P3: **2**
- Readiness: **38.00**

## Findings

### P0 — Reaction routes have no workspace/channel membership check — any authed user can access any message's reactions

- **File:** `apps/api/src/modules/reactions/routes.ts`
- **Category:** IDOR
- **Impact:** Direct cross-tenant data access: User A can add/remove reactions on any message in any workspace
- **Fix:** Add requireChannelAccess middleware to all reaction routes

### P0 — Feature-flag routes have broken requireWorkspaceMembership('workspaceId') on paths without :workspaceId param — always returns 400

- **File:** `apps/api/src/modules/feature-flags/routes.ts`
- **Category:** Auth bypass
- **Impact:** Feature flags are completely non-functional; no workspace can manage or evaluate feature flags
- **Fix:** Remove requireWorkspaceMembership from feature-flag routes or add workspaceId as a body/query parameter

### P0 — Message search uses getSupabase() (anon client) instead of req.supabase — auth.uid() is NULL in SECURITY INVOKER search RPC

- **File:** `apps/api/src/modules/messages/routes.ts`
- **Category:** Missing validation
- **Impact:** search_messages function cannot verify user workspace membership — cross-tenant message content leak
- **Fix:** Replace getSupabase() with req.supabase on messages/routes.ts line 38

### P0 — 4 SECURITY DEFINER functions missing SET search_path — search_path injection vulnerability

- **File:** `supabase/migrations/20260625000020_auto_create_user_profile.sql`
- **Category:** Injection vectors
- **Impact:** User with CREATE privilege can create malicious objects to hijack functions running with elevated privileges
- **Fix:** Add SET search_path = 'public' to all SECURITY DEFINER function definitions

### P1 — Auth and search rate limiters key by IP only — not user+IP composite. No per-email rate limiting on auth endpoints.

- **File:** `apps/api/src/middleware/rate-limit.ts`
- **Category:** Rate limiting
- **Impact:** Multiple users behind same NAT share rate limit bucket; single attacker with rotating IPs bypasses limits; no brute-force protection on email-based auth
- **Fix:** Use composite key {userId + ip} when authenticated; add per-email rate limiting for magic link sign-in

### P1 — Workspace member management (add/remove/update role) lacks admin/owner role check — any workspace member can modify members

- **File:** `apps/api/src/modules/workspaces/routes.ts`
- **Category:** Privilege escalation
- **Impact:** Any workspace member can escalate their own role to admin, add/remove other members, or change roles
- **Fix:** Add admin/owner role verification in POST/PATCH/DELETE workspace member routes

### P1 — Webhook secret stored in plaintext and returned in API responses to all workspace members

- **File:** `apps/api/src/modules/webhooks/service.ts`
- **Category:** Secrets handling
- **Impact:** Any workspace member can read other webhook secrets — if webhook is used for CI/CD, full pipeline access
- **Fix:** Encrypt webhook secret at rest using pgcrypto; mask secret in API responses with last 4 chars only

### P1 — Socket.io has allowEIO3: true enabling Engine.IO v3 legacy protocol with known vulnerabilities

- **File:** `apps/api/src/lib/socket.ts`
- **Category:** Auth flows
- **Impact:** Expanded attack surface — Engine.IO v3 has known vulnerabilities and fewer security features than v4
- **Fix:** Set allowEIO3: false unless backward compatibility is proven necessary

### P2 — No per-event Socket.io rate limiting — channel:join, typing:start/stop events not rate-limited

- **File:** `apps/api/src/lib/socket.ts`
- **Category:** Defense-in-depth
- **Impact:** Malicious client can flood socket events, degrading service for all users
- **Fix:** Add per-socket event rate limiting with configurable window and max count

### P2 — CSRF cookie has httpOnly: false — any XSS can exfiltrate the double-submit token

- **File:** `apps/api/src/middleware/csrf.ts`
- **Category:** Defense-in-depth
- **Impact:** If XSS exists, CSRF protection is completely bypassed as the token is readable by JavaScript
- **Fix:** Add additional CSRF layer (origin/referer checking) on top of double-submit cookie pattern

### P2 — CSP allows cdn.jsdelivr.net for scripts — broad CDN allowlist enables script injection from any package on that CDN

- **File:** `apps/api/src/middleware/security-headers.ts`
- **Category:** Headers/Middleware
- **Impact:** If an attacker finds an XSS vector, they can load malicious scripts from jsdelivr
- **Fix:** Remove CDN wildcard; use specific integrity-hashed URLs for required external scripts

### P3 — CSP lacks nonce-based protection for inline scripts

- **File:** `apps/api/src/middleware/security-headers.ts`
- **Category:** Best practice
- **Impact:** Any injected <script> tag executes in browsers that don't support strict-dynamic or if CSP is not properly enforced
- **Fix:** Implement nonce-based CSP for all inline script tags

### P3 — wget installed in production Docker image — unnecessary package expands attack surface

- **File:** `apps/api/Dockerfile`
- **Category:** Best practice
- **Impact:** Extra package in runtime image can be used as attack vector if other vulnerabilities exist
- **Fix:** Remove wget; use built-in health check mechanism or curl if needed
