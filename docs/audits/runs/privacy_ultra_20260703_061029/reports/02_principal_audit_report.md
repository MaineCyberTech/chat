# Principal Audit Report

- Prompt: **privacy_ultra**
- Domain: **privacy**
- Run ID: **privacy_ultra_20260703_061029**
- Generated: **2026-07-03T06:10:00Z**
- Decision: **NO-GO**
- P0: **1**, P1: **3**
- P2: **2**, P3: **0**
- Readiness: **0.00**

## Findings

### P0 — getProfiles() returns email column for all requested users - any authenticated user can batch-request any user IDs and receive email addresses
- **File:** `apps/api/src/modules/auth/service.ts`
- **Category:** PII Leak
- **Impact:** Email addresses (direct PII identifiers) are exposed to all authenticated users via the profiles endpoint. No access scoping beyond authentication.
- **Fix:** Remove email from the SELECT in getProfiles(). Only return display_name and avatar_url for non-owner requests.

### P1 — GDPR account deletion does not clean up: audit_logs, consent_logs, webhook_endpoints, thread_metadata, thread_participants, channel_role_overrides, notification_preferences, webhook_deliveries
- **File:** `apps/api/src/modules/auth/routes.ts`
- **Category:** GDPR Deletion
- **Impact:** After 'deletion', user data persists in 8+ tables. Violates GDPR right to erasure (Article 17). Audit trail of the deletion itself is missing, making compliance non-demonstrable.
- **Fix:** Add deletion queries for all missing tables. Create audit log entry recording the deletion. Wrap in transaction.

### P1 — GDPR data export does not include: audit_logs, consent_logs, reactions, channel_members, webhook_endpoints, webhook_deliveries
- **File:** `apps/api/src/modules/auth/routes.ts`
- **Category:** GDPR Export
- **Impact:** Incomplete data portability. User receives partial data request and cannot verify what data is held about them.
- **Fix:** Add queries for all missing data categories to the export endpoint

### P1 — GDPR account deletion creates no audit log entry - deletion itself is invisible
- **File:** `apps/api/src/modules/auth/routes.ts`
- **Category:** GDPR Deletion
- **Impact:** Cannot demonstrate compliance with GDPR deletion requests. No record of when or by whom an account was deleted.
- **Fix:** Call logAuditEvent before or after the deletion sequence, recording the deletion request

### P2 — Rate limiter logs raw IP addresses via logger.warn on rate limit hits
- **File:** `apps/api/src/middleware/rate-limit.ts`
- **Category:** PII in Logs
- **Impact:** IP addresses logged in plaintext. In EU jurisdictions, IP is considered PII. Accumulated rate-limit logs become a PII dataset without clear retention policy.
- **Fix:** Hash or mask IP addresses before logging, or log only the subnet prefix (/24 for IPv4)

### P2 — No data retention is actually running - all 6 pg_cron.schedule calls are commented out. Old PII (audit_logs with IP addresses, consent_logs) accumulates indefinitely.
- **File:** `supabase/migrations/`
- **Category:** Data Retention
- **Impact:** Old audit_logs containing user IDs and IP addresses, and consent_logs with IP addresses and user agents, are never purged. Non-compliant with data minimization principle.
- **Fix:** Enable pg_cron extension and activate data retention scheduling for audit_logs (90 days) and consent_logs (1 year)
