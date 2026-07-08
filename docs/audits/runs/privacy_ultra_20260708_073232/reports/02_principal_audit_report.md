# Principal Audit Report

- Prompt: **privacy_ultra**
- Domain: **privacy**
- Run ID: **privacy_ultra_20260708_073232**
- Generated: **2026-07-07T03:42:00Z**
- Decision: **GO WITH RISKS**
- P0: **0**, P1: **0**
- P2: **4**, P3: **3**
- Readiness: **70.00**

## Findings

### P2 — Cookie banner offers only binary choice (Accept all / Essential only) with no granular per-category opt-in
- **File:** `apps/web/components/cookie-banner.tsx`
- **Category:** consent_management
- **Impact:** Users cannot individually control analytics vs. marketing vs. functional cookies, which may violate GDPR ePrivacy Directive requirements for granular consent.
- **Fix:** Implement a tiered consent dialog allowing separate toggles for 'essential', 'analytics', and 'marketing' categories. Store each consent_type independently.

### P2 — Marketing consent type is accepted and stored but no marketing functionality exists to honor the preference
- **File:** `apps/api/src/modules/consent/routes.ts`
- **Category:** consent_management
- **Impact:** Consent is collected for 'marketing' purposes without any marketing feature (emails, ads) to respect that preference, creating an audit gap if marketing features are added later without consent re-collection.
- **Fix:** Either remove the 'marketing' consent_type until marketing features exist, or add a consent usage audit that maps consent types to actual data processing activities.

### P2 — No data subject access request (DSAR) workflow for individual user data export or deletion
- **File:** `apps/api/src/modules/admin/routes.ts`
- **Category:** data_subject_rights
- **Impact:** Users cannot request a copy of their personal data or request deletion under GDPR Article 15/17. The compliance export is admin-only and workspace-scoped.
- **Fix:** Implement a user-facing 'Export my data' and 'Delete my account' flow in the settings page. Add a DSAR queue endpoint that collects user data across all tables.

### P2 — Consent log data retention deletes records but does not anonymize them first for audit chain integrity
- **File:** `apps/worker/src/processors/data-retention.ts`
- **Category:** pii_handling
- **Impact:** Hard-deleting consent logs destroys the audit trail proving consent was given, which may be required by GDPR Article 7(1).
- **Fix:** Implement anonymization (nullify IP, user_agent, user_id) before hard-deleting consent logs. Retain a minimal anonymized record permanently.

### P3 — IP address and user agent stored in plain text in consent_logs without anonymization
- **File:** `apps/api/src/modules/consent/routes.ts`
- **Category:** pii_handling
- **Impact:** PII (IP address, user-agent string) is stored in the database. While useful for security audits, it creates additional GDPR data minimization risk.
- **Fix:** Hash or truncate the IP address (e.g., store /24 prefix only). User agent can be stored but should be flagged as PII in data inventory.

### P3 — No consent revocation UI — once accepted, users cannot change or withdraw consent
- **File:** `apps/web/components/cookie-banner.tsx`
- **Category:** cookie_compliance
- **Impact:** GDPR requires that withdrawing consent be as easy as giving it. Users have no way to revoke analytics or cookies consent after initial acceptance.
- **Fix:** Add a 'Privacy settings' link in the sidebar or settings page that re-opens the consent dialog. Also clear server-side consent when revoked.

### P3 — Consent acceptance silently fails on network error; user sees banner dismissed even if server-side record fails
- **File:** `apps/web/components/cookie-banner.tsx`
- **Category:** consent_management
- **Impact:** If the POST to /consent fails, the banner disappears but the server has no record of consent. User believes consent was recorded when it was not.
- **Fix:** Show an error state or retry mechanism if consent persistence fails. Only dismiss the banner after server confirms the consent record.
