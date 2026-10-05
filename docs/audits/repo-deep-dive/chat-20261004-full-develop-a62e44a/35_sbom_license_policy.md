# 35_sbom_license_policy — Prompt 35 - SBOM and License Policy Audit

- Run: `chat-20261004-full-develop-a62e44a`
- Target: `chat` @ `a62e44a` (branch `develop`)
- Domain: `35_sbom_license_policy.md` (area SBOM, prompt)

## Verification Performed

SBOMs are produced for production images (deploy
workflow) but not signed/attested; no dependency-review or license policy gate
is wired.

## Findings

| ID | Severity | Title |
|---|---|---|
| SBOM-P3-001 | P3 | SBOMs are generated but not signed or attested |
| SBOM-P3-002 | P3 | No license policy / dependency-review gate |
