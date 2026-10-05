# 01_repository_inventory — Prompt 01 - Comprehensive Repository Inventory

- Run: `chat-20261004-full-develop-a62e44a`
- Target: `chat` @ `a62e44a` (branch `develop`)
- Domain: `01_repository_inventory.md` (area INV, prompt)

## Verification Performed

Inventory via `git ls-files` (1049 files), workflow
count (22), migrations (78). Confirmed the historical stale-artifact set is
still tracked and the two credential artefacts (`test-signin.json`,
`hardening/exceptions`) are resolved to examples only.

## Findings

| ID | Severity | Title |
|---|---|---|
| INV-P2-001 | P2 | Stale generated reconciliation artifacts remain tracked at the repository root |
| INV-P3-001 | P3 | Committed audit/hardening bundles inflate the repository tree |
| INV-P3-002 | P3 | Character-encoding (mojibake) artifacts remain in workflow/log text |
