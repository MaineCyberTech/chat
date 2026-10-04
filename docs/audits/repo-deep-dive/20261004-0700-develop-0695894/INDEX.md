# Audit run 20261004-0700-develop-0695894 - chat

Focused security / supply-chain / CI deep-dive (`develop` @ `0695894`).

Counts: P0 x0, P1 x2, P2 x10, P3 x10

| File | Contents |
|---|---|
| FOCUSED_SECURITY_SUPPLY_CHAIN_CI.md | Full findings write-up |
| findings.json | Machine-readable findings |
| EXECUTIVE_SUMMARY.md | Summary |
| risk_register.md / follow_up_register.md | Findings register |
| RELEASE_GATE.md | Gate verdict |
| roadmap.md / patch_plan.md | Remediation plan |
| audit_manifest.json | Run manifest |

## P0/P1
- **SEC-P1-001** (P1) Seed workflow can re-open global user RLS (USING true) in production and seed shared-password accounts
- **CI-P1-001** (P1) Production provision job runs destructive Terraform with no environment approval

