# Prompt Pack Bundle

This bundle contains the core execution-mode prompt packs and audit prompts for building and refining a production-grade real-time collaboration platform.

## Included Core Files

- `PHASED_PROMPT_PACK_EXECUTION_MODE.md`
- `BOOTSTRAP_PROMPT_EMPTY_REPO_EXECUTION_MODE.md`
- `BOOTSTRAP_PROMPT_EMPTY_REPO_EXECUTION_MODE_STRICT.md`
- `FINAL_RECONCILIATION_REPO_AUDIT_PROMPT.md`
- `FINAL_RECONCILIATION_PRINCIPAL_AUDIT_PROMPT.md`
- `UX_UI_MASTER_PROMPT_EXECUTION_MODE.md`
- `UX_UI_PHASED_PROMPT_PACK_EXECUTION_MODE.md`

## Usage Order

### Platform / Repo Build-Out

1. strict bootstrap
2. platform phased prompt pack
3. final reconciliation repo audit
4. final principal audit

### UX/UI Workstream

1. UX/UI master prompt or phased prompt pack
2. optional chat specialization
3. release-gate frontend UX audit

All prompts assume the downstream AI has full filesystem access and can modify the repo directly.
