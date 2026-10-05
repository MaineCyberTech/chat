# Secret rotation runbook (audit summary)

Existing docs: `docs/security/secrets-rotation.md`, `docs/runbooks/jwks_rotation.md`,
`docs/runbooks/ssl-certificate-renewal.md`, `docs/security/jwks_rotation.md`.

Inventory to rotate (owners TBD): Supabase service-role + anon keys, JWT/JWKS signing
keys, `WEBHOOK_ENCRYPTION_KEY`, `METRICS_TOKEN`, `DO_API_TOKEN`, Terraform state keys,
ntfy credentials, LiveKit keys.

Gap: no scheduled rotation or overdue alert (see SECRET-P3 finding). Add last-rotated
dates + an alert when overdue.
