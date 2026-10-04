# Audit Run Index

## Metadata

- Name: chat
- Run: 20261003-0018-develop-a72b8cc
- Profile: base
- Target repo: C:\temp\chat
- Branch: develop
- Commit: a72b8cc
- Release gate: **GO WITH CONDITIONS**
- Findings: 63 total — 1 P0, 24 P1, 31 P2, 7 P3

## Reports

| Order | Report | Status |
|---:|---|---|
| 1 | 00_audit_orchestrator.md | N/A (subagent brief used) |
| 2 | 01_repository_inventory.md | done |
| 3 | 02_architecture_runtime_topology.md | done |
| 4 | 03_feature_implementation_map.md | done |
| 5 | 06_security_authz_tenancy_audit.md | done |
| 6 | 24_access_control_matrix_audit.md | covered by 06 |
| 7 | 25_multi_tenant_isolation_attack_simulation.md | covered by 06 |
| 8 | 26_admin_console_abuse_case_audit.md | covered by 06 |
| 9 | 07_data_schema_migration_runtime_validation.md | done |
| 10 | 37_supabase_rls_policy_deep_dive.md | covered by 06/07 |
| 11 | 08_api_contracts_realtime_integrations.md | done |
| 12 | 27_webhook_delivery_replay_idempotency_audit.md | covered by 03/08 |
| 13 | 28_file_upload_download_security_audit.md | covered by 06 |
| 14 | 29_billing_payments_reconciliation_audit.md | not applicable |
| 15 | 30_notification_email_push_delivery_audit.md | covered by 03/08 |
| 16 | 31_search_indexing_privacy_audit.md | covered by 08 |
| 17 | 10_github_actions_cicd_governance.md | done |
| 18 | 34_branch_protection_required_checks.md | covered by 10 |
| 19 | 11_supply_chain_dependency_secrets.md | done |
| 20 | 35_sbom_license_policy.md | covered by 11 |
| 21 | 36_container_runtime_security.md | covered by 02/11 |
| 22 | 38_env_secret_rotation.md | covered by 01/11 |
| 23 | 12_infra_deployment_environment_drift.md | covered by 02/10 |
| 24 | 09_testing_quality_release_confidence.md | done |
| 25 | 13_resilience_recovery_failure_modes.md | covered by 02/07 |
| 26 | 32_backup_restore_drill.md | covered by 07 |
| 27 | 33_incident_tabletop_exercise.md | covered by 14 |
| 28 | 14_observability_monitoring_incident_readiness.md | done |
| 29 | 15_performance_scalability_cost.md | covered by 02 |
| 30 | 04_usability_workflow_audit.md | not in scope (base profile brief) |
| 31 | 05_ui_ux_accessibility_audit.md | not in scope |
| 32 | 17_mobile_pwa_responsive_access.md | not in scope |
| 33 | 18_privacy_compliance_data_governance.md | covered by 06/07 |
| 34 | 39_analytics_tracking_privacy.md | not in scope |
| 35 | 16_documentation_devex_operator_readiness.md | covered by 01/23 |
| 36 | 19_platform_evolution_extensibility.md | not in scope |
| 37 | 20_ai_automation_agent_readiness.md | not in scope |
| 38 | 21_repo_hygiene_maintainability.md | done |
| 39 | 45_exploit_chain_attack_path_audit.md | covered by 06 |
| 40 | 22_final_risk_register_roadmap.md | done |
| 41 | 23_executive_summary_release_gate.md | done |
| 42 | 40_release_notes_changelog_generator.md | not in scope |

## Key Outputs

- Executive summary: `EXECUTIVE_SUMMARY.md` (done)
- Risk register: `risk_register.md` (done)
- Roadmap: `roadmap.md` (done)
- Patch plan: `patch_plan.md` (done)
- Release gate: `RELEASE_GATE.md` — **GO WITH CONDITIONS**

## Top Risks

1. SEC-P0-001 — production deploy sets `users_select USING (true)` → all users' PII readable by any authenticated user.
2. DATA-P1-001 — deploy seeds production with `%@seed.test` accounts sharing a known password.
3. SEC-P1-003/004/005/006 — unscoped admin/export/import endpoints leak cross-tenant data.
4. ARCH-P1-001/002 — webhooks/socket/push use the anonymous Supabase client → broken/unauthorized under RLS.
5. SEC-P1-007 — SSH open to `0.0.0.0/0` by Terraform default.

## Next Actions

1. Apply `patch_plan.md` PATCH-01..07 (immediate/week).
2. Re-audit SEC and CI domains at the remediated commit; capture verification artifacts.
3. Validate: `python3 tools/run_toolchain.py C:\temp\proxmox-vm\audits\runs\chat\20261003-0018-develop-a72b8cc --write --dashboard`
