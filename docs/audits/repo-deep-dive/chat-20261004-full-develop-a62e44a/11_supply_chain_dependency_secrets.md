# 11_supply_chain_dependency_secrets — Prompt 11 - Supply Chain, Dependency, and Secrets Audit

- Run: `chat-20261004-full-develop-a62e44a`
- Target: `chat` @ `a62e44a` (branch `develop`)
- Domain: `11_supply_chain_dependency_secrets.md` (area SC, prompt)

## Verification Performed

Secret/dependency/action supply-chain
review. The committed credential and the service-role key in the web container
are fixed; GitHub Actions are SHA-pinned; Trivy HIGH/CRITICAL is blocking.
Residuals are advisory-expiry and large binaries.

## Findings

| ID | Severity | Title |
|---|---|---|
| SC-P1-001 | P1 | Credential committed to the repository (fixed) |
| SC-P2-001 | P2 | Production web container received the Supabase service-role key (fixed) |
| SC-P2-002 | P2 | GitHub Actions were not pinned to commit SHAs (fixed) |
| SC-P2-003 | P2 | Dependency vulnerability scanning was advisory-only (fixed) |
| SC-P2-004 | P2 | Dependency risk-acceptances expire 2027-01-04 |
| SC-P3-001 | P3 | Large binary archives committed to the repository |
