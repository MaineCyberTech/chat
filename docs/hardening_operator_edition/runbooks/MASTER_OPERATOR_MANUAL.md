# Master Operator Manual

## Purpose

This manual tells the release operator exactly how to execute the hardening process from preflight to promotion or rollback.

## Operating principles

1. Never promote without current artifacts.
2. Never ignore a P0.
3. Treat policy files as the source of truth for gates.
4. Stop when a checkpoint fails — do not improvise promotion.
5. Escalate clearly when decision authority moves beyond the operator.

## Execution phases

- Phase 0: Preflight
- Phase 1: Highest-risk specialized audits
- Phase 2: Release confidence audits
- Phase 3: Resilience and recovery checks
- Phase 4: Governance and release artefact generation
- Phase 5: Release-candidate checkpoint
- Phase 6: Production-promotion checkpoint
- Phase 7: Post-release validation
- Incident branch: rollback / containment path

## Phase 0: Preflight

### Required inputs

- target branch
- target environment
- policy file
- current repo state
- latest audit summary location

### Required outputs

- preflight notes
- selected policy file
- operator owner list
- selected release path (normal / hotfix)

## Phase 1: Highest-risk specialized audits

Run in this order:

1. security
2. database / migration integrity
3. environment drift
4. rollback readiness

### Stop condition

If any domain returns **NO-GO** with unresolved P0, stop here and remediate.

## Phase 2: Release confidence audits

1. API / realtime contract
2. accessibility
3. frontend performance
4. observability / incident readiness

### Stop condition

If release confidence is materially reduced or core user flows are at risk, stop and remediate.

## Phase 3: Resilience and recovery

1. backup / restore verification
2. E2E scenario validation plan
3. visual regression validation plan
4. load/concurrency planning
5. chaos/failure-injection planning

## Phase 4: Governance and release artefacts

1. feature flag / kill-switch review
2. policy-tier selection confirmation
3. release note draft
4. risk register update
5. stakeholder summary update

## Phase 5: Release-candidate checkpoint

Use the release-candidate policy and ensure:

- no P0 findings
- readiness threshold met
- gate artifact exists
- release candidate documentation is ready

## Phase 6: Production-promotion checkpoint

Use the production policy and ensure:

- production gate passes
- rollback decision record is ready even if not used
- branch is authorized for promotion
- sign-offs exist

## Phase 7: Post-release validation

Immediately validate:

- health/readiness state
- sign-in/authentication
- critical user paths
- realtime/chat behavior
- logs/alerts

## Incident branch — rollback / containment

When a release is failing:

1. confirm trigger condition
2. determine whether kill-switch or flag can contain
3. if not, execute rollback decision process
4. record decision in rollback decision record
5. perform post-rollback validation
