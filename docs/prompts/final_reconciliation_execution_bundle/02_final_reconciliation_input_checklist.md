# Final Reconciliation Input Checklist

## expected inputs

- [ ] compare audit summary
- [ ] ux_ui audit summary
- [ ] security_authz_tenancy audit summary (if run)
- [ ] api_worker_integrations audit summary (if run)
- [ ] database_schema_data_lifecycle audit summary (if run)
- [ ] infra_deployment_resilience audit summary (if run)
- [ ] testing_qa_cicd audit summary (if run)
- [ ] docs_devex_operations audit summary (if run)

## constraints to restate in final reconciliation

- [ ] preserve currently working behavior unless unsafe by design
- [ ] prefer alignment with the reference repo without regressions
- [ ] keep development and production concerns separate
- [ ] emit file-targeted, implementation-ready recommendations
- [ ] explicitly resolve contradictions across audits
- [ ] identify unknowns requiring manual verification
