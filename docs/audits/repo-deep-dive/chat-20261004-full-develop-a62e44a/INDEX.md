# Audit Run Index

## Metadata

- Name: chat
- Run: `chat-20261004-full-develop-a62e44a`
- Mode: full
- Profile: base
- Target repo: `/var/lib/lab-repos/chat`
- Branch: `develop`
- Commit: `a62e44a`
- Release gate: **GO WITH CONDITIONS**
- Findings: 99 total — P0 1, P1 16, P2 43, P3 39

## Domains

| Domain | Area | Findings | Status |
|---|---|---:|---|
| deterministic | DET | 3 | done |
| 00_audit_orchestrator | ORCH | 0 | done |
| 01_repository_inventory | INV | 3 | done |
| 02_architecture_runtime_topology | ARCH | 3 | done |
| 03_feature_implementation_map | FEAT | 4 | done |
| 06_security_authz_tenancy_audit | SEC | 7 | done |
| 24_access_control_matrix_audit | ACM | 2 | done |
| 25_multi_tenant_isolation_attack_simulation | MT | 3 | done |
| 26_admin_console_abuse_case_audit | ADMIN | 2 | done |
| 07_data_schema_migration_runtime_validation | DATA | 4 | done |
| 37_supabase_rls_policy_deep_dive | RLS | 2 | done |
| 08_api_contracts_realtime_integrations | API | 4 | done |
| 27_webhook_delivery_replay_idempotency_audit | WH | 3 | done |
| 28_file_upload_download_security_audit | FILE | 2 | done |
| 29_billing_payments_reconciliation_audit | BILL | 0 | done |
| 30_notification_email_push_delivery_audit | NOTIF | 2 | done |
| 31_search_indexing_privacy_audit | SEARCH | 1 | done |
| 10_github_actions_cicd_governance | CI | 7 | done |
| 34_branch_protection_required_checks | BP | 2 | done |
| 11_supply_chain_dependency_secrets | SC | 6 | done |
| 35_sbom_license_policy | SBOM | 2 | done |
| 36_container_runtime_security | CTR | 2 | done |
| 38_env_secret_rotation | SECRET | 2 | done |
| 12_infra_deployment_environment_drift | INFRA | 2 | done |
| 09_testing_quality_release_confidence | TEST | 4 | done |
| 13_resilience_recovery_failure_modes | RES | 2 | done |
| 32_backup_restore_drill | DR | 1 | done |
| 33_incident_tabletop_exercise | IR | 1 | done |
| 14_observability_monitoring_incident_readiness | OBS | 3 | done |
| 15_performance_scalability_cost | PERF | 1 | done |
| 04_usability_workflow_audit | USE | 1 | done |
| 05_ui_ux_accessibility_audit | UX | 1 | done |
| 17_mobile_pwa_responsive_access | MOB | 1 | done |
| 18_privacy_compliance_data_governance | PRIV | 2 | done |
| 39_analytics_tracking_privacy | AN | 0 | done |
| 16_documentation_devex_operator_readiness | DOC | 2 | done |
| 19_platform_evolution_extensibility | EVOL | 1 | done |
| 20_ai_automation_agent_readiness | AI | 1 | done |
| 21_repo_hygiene_maintainability | HYGIENE | 3 | done |
| 45_exploit_chain_attack_path_audit | CHAIN | 2 | done |
| 22_final_risk_register_roadmap | FINAL | 2 | done |
| 23_executive_summary_release_gate | EXEC | 2 | done |
| 40_release_notes_changelog_generator | REL | 1 | done |

## Key Outputs

- Executive summary: `EXECUTIVE_SUMMARY.md`
- Risk register: `risk_register.md`
- Follow-up register: `follow_up_register.md`
- Coverage: `coverage.md`
- Roadmap: `roadmap.md`
- Patch plan: `patch_plan.md`
- Release gate: `RELEASE_GATE.md` — **GO WITH CONDITIONS**

## Next Actions

1. Validate: `tools/check_run.sh chat-20261004-full-develop-a62e44a`.
2. Publish: `tools/publish_audit.py --repo chat ...` (see runbook).
3. Remediate unresolved P0/P1/P2 per `patch_plan.md`.

