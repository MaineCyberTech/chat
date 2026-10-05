# 25_multi_tenant_isolation_attack_simulation — Prompt 25 - Multi-Tenant Isolation Attack Simulation

- Run: `chat-20261004-full-develop-a62e44a`
- Target: `chat` @ `a62e44a` (branch `develop`)
- Domain: `25_multi_tenant_isolation_attack_simulation.md` (area MT, prompt)

## Verification Performed

Simulated cross-tenant reads
against the admin surface and the auth directory. The historical IDOR and
user-directory findings are fixed; the global `/stats` counters remain.

## Findings

| ID | Severity | Title |
|---|---|---|
| MT-P2-001 | P2 | IDOR: admin dead-letter retry was not tenant-scoped (fixed) |
| MT-P2-002 | P2 | Cross-tenant user directory via auth service (fixed) |
| MT-P3-001 | P3 | Admin `/stats` returns global cross-tenant counts (residual) |
