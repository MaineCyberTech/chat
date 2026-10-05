# Incident tabletop scenarios

Runbook: `docs/runbooks/incident-response.md`. No dated tabletop artifact exists
at `a62e44a` (see IR-P3 finding). Proposed scenarios:
1. Single droplet loss (API+worker+Redis co-resident).
2. Supabase/Postgres outage + migration drift.
3. Webhook SSRF/abuse via a malicious tenant URL.
4. Secret compromise (JWT/JWKS, service-role, metrics token).
