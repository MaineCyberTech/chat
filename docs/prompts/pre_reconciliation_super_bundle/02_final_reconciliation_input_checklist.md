# Final Reconciliation Input Checklist

## Inputs

- [ ] compare audit output
- [ ] ux/ui audit output
- [ ] security/authz/tenancy audit output (if run)
- [ ] api/worker/integrations audit output (if run)
- [ ] database/schema/data lifecycle audit output (if run)
- [ ] infra/deployment/resilience audit output (if run)
- [ ] testing/qa/ci-cd audit output (if run)
- [ ] docs/devex/operations audit output (if run)

## Constraints to restate

- [ ] preserve currently working behavior unless unsafe by design
- [ ] prefer alignment with the reference repo without regressions
- [ ] keep development and production concerns separate
- [ ] emit file-targeted, implementation-ready recommendations
- [ ] resolve contradictions explicitly
