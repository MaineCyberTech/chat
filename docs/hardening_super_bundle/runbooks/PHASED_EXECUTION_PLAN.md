# Phased Execution Plan

## Phase 1 — Highest production risk reduction

- `prompts/security/security_principal_audit_prompt.md`
- `prompts/database/database_integrity_migration_audit_prompt.md`
- `prompts/environment/environment_drift_audit_prompt.md`
- `prompts/release/rollback_readiness_audit_prompt.md`

## Phase 2 — Product and release confidence

- `prompts/api/api_realtime_contract_audit_prompt.md`
- `prompts/frontend/frontend_accessibility_release_audit_prompt.md`
- `prompts/frontend/frontend_performance_bundle_audit_prompt.md`
- `prompts/ops/observability_incident_readiness_audit_prompt.md`

## Phase 3 — Resilience and recovery

- `prompts/ops/backup_restore_verification_audit_prompt.md`
- `prompts/testing/e2e_scenario_suite_prompt.md`
- `prompts/testing/visual_regression_test_pack_prompt.md`
- `prompts/testing/load_concurrency_test_pack_prompt.md`
- `prompts/testing/failure_injection_chaos_pack_prompt.md`

## Phase 4 — Governance and product rollout discipline

- `prompts/features/feature_flag_kill_switch_framework_prompt.md`
- `prompts/features/release_note_generator_prompt.md`
- `prompts/governance/policy_tiers_upgrade_prompt.md`

## Gate integration phase

- configure `policies/gate-policy.dev.json`
- configure `policies/gate-policy.rc.json`
- configure `policies/gate-policy.prod.json`
- configure `policies/gate-policy.hotfix.json`
- wire `.github/workflows/audit-pr-gate.yml`
- wire `.github/workflows/environment-promotion-audit.yml`
