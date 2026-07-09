# Principal Audit Report

- Prompt: **security_principal_audit**
- Domain: **security**
- Run ID: **security_principal_audit_20260709_070758**
- Generated: **2026-07-09T12:00:00.000Z**
- Decision: **GO WITH RISKS**
- P0: **0**, P1: **1**
- P2: **3**, P3: **1**
- Readiness: **72.00**

## Findings

### P1 — WEBHOOK_ENCRYPTION_KEY falls back to JWT_SECRET for AES-256-GCM encryption

- **File:** `apps/api/src/modules/webhooks/service.ts`
- **Category:** secret_handling
- **Impact:** If WEBHOOK_ENCRYPTION_KEY is not configured, getEncryptionKey() derives AES key from JWT_SECRET via SHA-256. JWT_SECRET is designed for JWT signing, not encryption. Compromise of JWT_SECRET reveals all encrypted webhook secrets. No key rotation mechanism exists.
- **Fix:** Make WEBHOOK_ENCRYPTION_KEY required in env schema. Remove JWT_SECRET fallback. Add key rotation support with version-prefixed encrypted values.

### P2 — Reactions SELECT policy uses using(true) allowing all authenticated users cross-tenant access

- **File:** `supabase/policies/06_reactions.sql`
- **Category:** rls
- **Impact:** Any authenticated user can enumerate reactions (emoji + user_id pairs) on any message across all workspaces. Leaks user activity patterns and workspace relationships.
- **Fix:** Replace with scoped policy checking workspace membership via messages -> channels -> workspace_members join chain

### P2 — CSP script-src 'self' without nonce or hash blocks Next.js inline hydration scripts

- **File:** `apps/api/src/middleware/security-headers.ts`
- **Category:** csp
- **Impact:** Next.js production builds inject inline script elements for page hydration. Current CSP blocks these, causing frontend JavaScript failure. Forces CSP to be disabled, negating XSS protection.
- **Fix:** Add nonce generation in middleware or use 'strict-dynamic' for Next.js compatibility

### P2 — GET /reactions/batch endpoint lacks message access validation

- **File:** `apps/api/src/modules/reactions/routes.ts`
- **Category:** authorization
- **Impact:** Batch reactions endpoint accepts arbitrary message_ids without checking user's workspace/channel membership. User can fetch reactions for messages in channels they don't belong to.
- **Fix:** Add requireMessageAccess validation or verify each message_id against accessible channels server-side before returning reactions.

### P3 — In-memory error buffer may expose sensitive data via admin logs endpoint

- **File:** `apps/api/src/modules/admin/error-buffer.ts`
- **Category:** logging
- **Impact:** Error buffer stores unredacted error messages containing user IDs, IPs, paths. Any admin user can read GET /admin/logs. Buffer limited to 200 entries but sensitive data may accumulate.
- **Fix:** Add PII redaction before pushError(). Filter sensitive fields from error entries. Consider time-based TTL.
