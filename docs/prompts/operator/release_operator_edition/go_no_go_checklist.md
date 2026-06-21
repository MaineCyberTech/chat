# go / no-go checklist

## repo-wide gate

- [ ] final reconciliation was run
- [ ] principal audit was run
- [ ] no unresolved p0 repo findings remain
- [ ] p1 repo findings are either fixed or explicitly accepted
- [ ] build/typecheck/test status is understood
- [ ] env/domain model is consistent across code/docs/workflows

## frontend gate

- [ ] frontend release gate audit was run
- [ ] no unresolved p0 frontend findings remain
- [ ] accessibility readiness is at least pass with risks
- [ ] visual consistency readiness is at least pass with risks
- [ ] responsive readiness is at least pass with risks
- [ ] chat experience readiness is understood
- [ ] residual risks are documented

## no-go indicators

- [ ] unresolved p0 findings
- [ ] broken validation on core paths with no justified blocker
- [ ] inconsistent dev/prod domain usage
- [ ] severe accessibility gaps on primary user journeys
- [ ] severe mobile/responsive failures on primary surfaces
- [ ] broken release automation assumptions
