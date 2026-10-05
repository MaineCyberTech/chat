# 06_security_authz_tenancy_audit — Prompt 06 - Security, Authorization, and Tenancy Audit

- Run: `chat-20261004-full-develop-a62e44a`
- Target: `chat` @ `a62e44a` (branch `develop`)
- Domain: `06_security_authz_tenancy_audit.md` (area SEC, prompt)

## Verification Performed

Security/authz/tenancy pass. Verified the
deploy/seed RLS weakening is gone, the seed workflow's production target is
disabled, admin user directory and audit-log/compliance endpoints are
workspace-scoped, SSH is restricted by CIDR, and webhook secrets are
encrypted at rest. New residual: `WEBHOOK_ENCRYPTION_KEY` is not delivered by
the production compose stack, and webhook SSRF still ignores redirects.

## Findings

| ID | Severity | Title |
|---|---|---|
| SEC-P0-001 | P0 | Production deploy created `users_select USING (true)` exposing all users (fixed) |
| SEC-P1-001 | P1 | Seed workflow could re-open global user RLS / seed shared-password accounts (fixed) |
| SEC-P1-002 | P1 | Tracked credential file `test-signin.json` (fixed) |
| SEC-P1-003 | P1 | Admin user directory / audit logs / compliance exports were not tenant-scoped (fixed) |
| SEC-P1-004 | P1 | SSH was open to the internet by default (fixed) |
| SEC-P2-001 | P2 | `WEBHOOK_ENCRYPTION_KEY` is not delivered by the production compose stack |
| SEC-P2-002 | P2 | Webhook SSRF validation does not constrain redirects or DNS rebinding |
