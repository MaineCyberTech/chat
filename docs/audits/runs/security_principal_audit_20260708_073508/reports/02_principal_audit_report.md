# Principal Audit Report

- Prompt: **security_principal_audit**
- Domain: **security**
- Run ID: **security_principal_audit_20260708_073508**
- Generated: **2026-07-08T12:00:00.000Z**
- Decision: **GO WITH RISKS**
- P0: **2**, P1: **4**
- P2: **5**, P3: **2**
- Readiness: **79.00**

## Findings

### P0 — requireMessageAccess middleware uses global getSupabase() instead of per-request client for initial message lookup
- **File:** `apps/api/src/middleware/require-membership.ts`
- **Category:** authorization
- **Impact:** The anon client (no user JWT) can't satisfy 'to authenticated' RLS policies, so message lookups always fail with 404 for users behind RLS, breaking message operations (edit, delete, pin, flag, forward)
- **Fix:** Replace getSupabase() with req.supabase (the per-user client) on line 159 of require-membership.ts to ensure RLS policies see auth.uid()

### P0 — Double-submit CSRF cookie lacks __Host- prefix, vulnerable to subdomain-based cookie injection
- **File:** `apps/api/src/middleware/csrf.ts`
- **Category:** csfr
- **Impact:** An attacker controlling a subdomain of the app's origin can set a csrf_token cookie for the parent domain, bypassing CSRF protection on state-changing requests
- **Fix:** Set cookie name to __Host-csrf_token (requires Secure flag + cookie set from HTTPS), and validate SameSite=Strict ensures cookie isolation

### P1 — CORS config allows requests with null origin (non-browser origins bypass origin check)
- **File:** `apps/api/src/app.ts`
- **Category:** cors
- **Impact:** Non-browser clients, desktop apps, curl, or browser extensions can bypass CORS origin validation because null origin is permitted
- **Fix:** Remove the 'if (!origin) return callback(null, true)' branch and require origin to always match frontendUrl

### P1 — Consent GET endpoint returns all consent_logs without user_id filter — RLS restricts to own records but query pattern invites future mistakes
- **File:** `apps/api/src/modules/consent/routes.ts`
- **Category:** authorization
- **Impact:** While RLS prevents cross-user data leak, the code pattern selects all rows without explicit filtering, making it fragile if RLS is ever disabled or bypassed
- **Fix:** Add explicit .eq('user_id', req.userId) filter to the consent_logs query on line 11 of consent/routes.ts

### P1 — GDPR account deletion does not clean up all user data — consent_logs, sidebar_categories, channel_bookmarks, audit_logs may leak
- **File:** `apps/api/src/modules/auth/routes.ts`
- **Category:** data_lifecycle
- **Impact:** User account deletion via DELETE /account leaves orphaned PII in consent_logs, sidebar data, bookmarks, and audit log actor references, violating GDPR right to erasure
- **Fix:** Add deletes for consent_logs, sidebar_categories, sidebar_channel_assignments, channel_bookmarks, and message_reminders before deleting the user in auth/routes.ts

### P1 — Admin compliance export uses getSupabaseAdmin() which bypasses RLS with no workspace-level filtering
- **File:** `apps/api/src/modules/admin/routes.ts`
- **Category:** authorization
- **Impact:** Admin compliance export returns ALL user PII, messages, channels, and audit logs for all workspaces in a single downloadable JSON — a compromised admin token leaks all tenant data
- **Fix:** If workspace_id is specified, scope all queries to that workspace; otherwise paginate the export and add audit logging for every compliance export. For full-workspace exports, require explicit admin confirmation or second-factor

### P2 — Status routes use global getSupabase() instead of per-request req.supabase client
- **File:** `apps/api/src/modules/status/routes.ts`
- **Category:** authentication
- **Impact:** GET, PUT, DELETE /status and batch endpoints use the global anon client, bypassing RLS user-scoping and potentially leaking user status data across tenants
- **Fix:** Replace all getSupabase() calls in status/routes.ts with req.supabase from the per-user client

### P2 — Input sanitizer SQL injection patterns have high false-positive rate blocking legitimate content with common words
- **File:** `apps/api/src/middleware/input-sanitizer.ts`
- **Category:** input_validation
- **Impact:** SQL injection pattern matching blocks words like 'select', 'insert', 'union', 'drop', 'alter' and sequences like '--', blocking legitimate messages about SQL or database topics
- **Fix:** Remove SQL injection pattern matching from the global middleware; Supabase's parameterized queries are immune to SQL injection. Keep XSS pattern detection for non-content fields

### P2 — CSRF cookie is set with httpOnly: true but read by client JS — httpOnly prevents JS access, breaking the double-submit pattern
- **File:** `apps/api/src/middleware/csrf.ts`
- **Category:** cors_csrf
- **Impact:** The CSRF cookie is set as httpOnly (line 87), which prevents client-side JavaScript from reading it via document.cookie. The frontend cannot include the x-csrf-token header matching the cookie, making CSRF protection non-functional
- **Fix:** Remove httpOnly: true from the CSRF cookie on line 87, or use a non-httpOnly cookie for the CSRF token sent to the client

### P2 — Notification preference routes use global getSupabase() instead of per-request client
- **File:** `apps/api/src/modules/notifications/routes.ts`
- **Category:** authentication
- **Impact:** GET/PUT/DELETE /channels/:id/notification-preference use global anon client, bypassing RLS user context — could leak or allow modification of other users' preferences
- **Fix:** Replace getSupabase() with req.supabase in notifications/routes.ts

### P3 — SHOW_STACK_TRACES env var conditionally exposes stack traces in error responses
- **File:** `apps/api/src/middleware/error-handler.ts`
- **Category:** observability
- **Impact:** If SHOW_STACK_TRACES is accidentally set to 'true' in production, full stack traces with internal paths may be returned to API consumers
- **Fix:** Consider removing stack trace exposure entirely in non-development environments, or gate it behind NODE_ENV check in addition to the env var

### P3 — DOMPurify sanitization strips all HTML tags from content including safe formatting
- **File:** `apps/api/src/modules/messages/routes.ts`
- **Category:** dependency
- **Impact:** DOMPurify is configured with ALLOWED_TAGS: [] and ALLOWED_ATTR: [], stripping ALL HTML from message content — users cannot use any rich text including bold, lists, or links
- **Fix:** Allow safe HTML tags (b, i, a, code, pre, blockquote, ul, ol, li) through DOMPurify to support rich text while preventing XSS
