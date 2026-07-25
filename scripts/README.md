# Scripts

## Development

| Script | Purpose |
|--------|---------|
| `setup-dev.ps1` / `setup-dev.sh` | One-time local development environment setup |
| `teardown-dev.ps1` / `teardown-dev.sh` | Tear down local development stack |
| `start-local-stack.ps1` | Start local Supabase, Redis, and services |
| `help.ps1` | Print available commands and descriptions |

## Code Generation

| Script | Purpose |
|--------|---------|
| `generate-emoji-data.py` | Generate emoji data from Unicode sources |
| `generate-livekit-keys.py` | Generate LiveKit API key pair |
| `db-rollback-generator.py` | Auto-generate down migration scripts |

## CI / Audit Pipeline

| Script | Purpose |
|--------|---------|
| `verify-migrations.js` | Validate migration and rollback consistency |
| `check-sensitive-data.sh` | Scan for secrets and sensitive data in repo |
| `check_imports.py` | Detect circular or invalid imports |
| `accessibility-audit.sh` | Run automated a11y checks |

## Audit & Hardening

| Directory | Purpose |
|-----------|---------|
| `audits/` | Audit execution scripts and prompts |
| `hardening/` | Hardening baseline sync and policy enforcement |
| `hardening_runner/` | Automated hardening analysis runner |
| `engine/` | Full audit/hardening engine |
| `prompts/` | Audit prompt templates and ingestion |

## Maintenance

| Script | Purpose |
|--------|---------|
| `consolidate_audit.py` | Merge and deduplicate audit findings |
| `update_scores.py` | Recalculate audit risk scores |
| `list_current_p1.py` | List outstanding P1 findings |
| `list_remaining_findings.py` | List all unresolved audit findings |
| `generate_prompt_outputs.py` | Generate structured prompt outputs |
