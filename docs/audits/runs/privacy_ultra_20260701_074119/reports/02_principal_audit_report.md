# Principal Audit Report

- Prompt: **privacy_ultra**
- Domain: **privacy**
- Run ID: **privacy_ultra_20260701_074119**
- Generated: **2026-07-01T07:41:18Z**
- Decision: **NO-GO**
- P0: **1**, P1: **3**
- P2: **2**, P3: **1**
- Readiness: **37.00**

## Findings

### P0 — Workspace member list returns email field in API response — all workspace members can see each other's email addresses

- **File:** `apps/api/src/modules/workspaces/service.ts`
- **Category:** PII exposure
- **Impact:** PII (email addresses) exposed to all workspace members unnecessarily; email enumeration across workspace membership
- **Fix:** Remove email from getMembers() SELECT query; return only display_name and avatar_url; log access for audit

### P1 — GDPR delete route does not clean up audit_logs or consent_logs — user's data remains after account deletion

- **File:** `apps/api/src/modules/auth/routes.ts`
- **Category:** Compliance basics
- **Impact:** GDPR Right to Erasure not fully implemented; user's audit trail and consent records persist after deletion
- **Fix:** Add explicit deletion of audit_logs and consent_logs entries for the user in the GDPR delete endpoint

### P1 — User email logged in workspace list operations via userEmail in authenticate middleware — PII in structured logs

- **File:** `apps/api/src/modules/workspaces/routes.ts`
- **Category:** PII in logs
- **Impact:** Email addresses flow into production log aggregation services where retention may be long and access broad
- **Fix:** Log only userId, not userEmail; if email is needed for debugging, mask it (e.g., j\*\*\*@example.com)

### P1 — User search endpoint returns email in search results — GET /v1/auth/search?q= partial email search enabled

- **File:** `apps/api/src/modules/auth/service.ts`
- **Category:** Access controls
- **Impact:** Email enumeration via search — attacker can probe if specific email addresses have accounts on the platform
- **Fix:** Exclude email from search results entirely; search only by display_name; rate-limit search to 10 queries/min/user

### P2 — No data retention policy enforced — audit_logs and notifications grow unbounded; no scheduled purge exists

- **File:** ``
- **Category:** Retention
- **Impact:** User data retained indefinitely; GDPR 'right to be forgotten' lifecycle not implemented; storage grows without bound
- **Fix:** Implement pg_cron scheduled job to purge audit_logs > 90 days, notifications > 30 days, consent_logs > 1 year; document retention periods

### P2 — avatar_url stored as raw TEXT with no validation — could contain tracking pixels or external references that leak user activity

- **File:** ``
- **Category:** PII handling
- **Impact:** Third-party tracking via avatar URLs: when email clients load avatars, referer headers leak workspace context
- **Fix:** Proxy avatar images through API server; add Content-Security-Policy: img-src 'self'; validate avatar URLs against allowlist

### P3 — No data processing register or GDPR compliance documentation in repository

- **File:** ``
- **Category:** Compliance basics
- **Impact:** Cannot demonstrate GDPR compliance without documented data processing activities
- **Fix:** Create docs/compliance/gdpr-data-processing-register.md listing all PII fields, processing purposes, retention periods, and lawful bases
