# Principal Audit Report

- Prompt: **privacy_ultra**
- Domain: **privacy**
- Run ID: **privacy_ultra_20260709_070726**
- Generated: **2026-07-09T03:06:59Z**
- Decision: **GO WITH RISKS**
- P0: **0**, P1: **1**
- P2: **3**, P3: **2**
- Readiness: **78.00**

## Findings

### P1 — PII columns (email, phone, full_name, avatar_url) in profiles table stored without explicit encryption-at-rest annotation or column-level encryption

- **File:** `supabase/migrations/`
- **Category:** pii_storage
- **Impact:** PII readable by anyone with database access (service_role key compromise would expose all PII)
- **Fix:** Document that Supabase provides encryption at rest (AWS KMS); add column-level encryption for email/phone using pgcrypto or Vault, or document compensating controls (RLS, admin-only access)

### P2 — No documented PII access review mechanism â€” no audit of who reads PII columns and when

- **File:** `apps/api/src/`
- **Category:** pii_access_review
- **Impact:** Cannot detect unauthorized PII access by internal users or compromised accounts
- **Fix:** Add audit trigger on profiles table for SELECT on email/phone columns, log to audit_logs; create PII access review runbook

### P2 — Data retention job exists but retention periods are hardcoded in processor (audit_logs=90d, consent_logs=730d, etc.) â€” not configurable via env vars

- **File:** `apps/worker/src/processors/data-retention.ts`
- **Category:** retention_policy
- **Impact:** Retention periods cannot be adjusted without code deploy; no way to comply with varying jurisdictional requirements
- **Fix:** Extract retention periods to env vars: AUDIT_LOG_RETENTION_DAYS=90, CONSENT_LOG_RETENTION_DAYS=730, etc.

### P2 — No automated PII redaction in structured logging â€” logger allows any field to be logged without filtering

- **File:** `apps/api/src/lib/logger.ts : apps/worker/src/`
- **Category:** pii_logging
- **Impact:** Developer error could log PII fields (email, phone) to production logs with no guardrail
- **Fix:** Add PII field allowlist/blocklist to logger that redacts known PII field patterns from log output

### P3 — No GDPR data export endpoint â€” user data export requires direct DB queries

- **File:** `apps/api/src/modules/`
- **Category:** gdpr_export
- **Impact:** Cannot fulfill data subject access requests without operator intervention
- **Fix:** Add GET /v1/users/:id/export endpoint that collects all user data (profile, messages, channels, sessions) in JSON format

### P3 — No GDPR right-to-erasure endpoint that cascades deletes across all user data

- **File:** `apps/api/src/modules/`
- **Category:** gdpr_delete
- **Impact:** Cannot programmatically fulfill deletion requests; manual DB cleanup required
- **Fix:** Add DELETE /v1/users/:id/erase endpoint that cascades: messages (anonymize), channels (remove member), profiles (delete), sessions (revoke)
