# master handbook

## purpose

this handbook explains how to use the entire folders-only prompt structure:

- platform prompts
- frontend / uxui prompts
- audits
- operator guidance
- release operator edition

## canonical environment model

development

- `chat.mainecybertech.us`
- `chat-api.mainecybertech.us`

production

- `chat.mainecybertech.com`
- `chat-api.mainecybertech.com`

github environments

- `development`
- `production`

all prompts and generated repo work should preserve this model.

## recommended workflows

### workflow a — brand new or nearly empty repo

1. run `prompts/platform/bootstrap/bootstrap_prompt_empty_repo_execution_mode_strict.md`
2. run a repair/review pass if validation fails
3. run `prompts/platform/phases/phased_prompt_pack_execution_mode.md`
4. run `prompts/platform/audits/final_reconciliation_repo_audit_prompt.md`
5. run `prompts/platform/audits/final_reconciliation_principal_audit_prompt.md`
6. run `prompts/uxui/phases/ux_ui_phase_1_ultra_strict_design_system_prompt.md`
7. run `prompts/uxui/phases/ux_ui_phased_prompt_pack_execution_mode.md`
8. run `prompts/uxui/specializations/chat_ux_specialization_prompt_pack_execution_mode.md`
9. run `prompts/uxui/audits/frontend_ux_release_gate_principal_audit_prompt.md`

### workflow b — repo already scaffolded, platform drift exists

1. run the relevant platform phase
2. if drift is widespread, run final reconciliation
3. run principal audit if you need severity-based release judgment

### workflow c — main platform exists, frontend needs serious work

1. run strict ux/ui phase 1
2. run ux/ui phased pack
3. run chat specialization if communication surfaces need deeper refinement
4. run frontend release gate

## operator principles

- do not treat “files were created” as success
- success means validation ran, repairs were attempted, blockers are explicit, and next steps are clear
- prefer reconciliation over parallel duplicate systems
- treat p0/p1 audit findings as gating issues
