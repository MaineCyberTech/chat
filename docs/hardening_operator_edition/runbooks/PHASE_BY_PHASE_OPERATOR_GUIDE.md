# Phase-by-Phase Operator Guide

## Phase 0 — Preflight

### Run

- confirm branch and environment
- select policy file
- confirm latest audit summary exists
- identify sign-off owners

### Expected artifacts

- selected policy file path
- preflight notes
- current/latest run summary path

### Proceed only if

- the operator can point to the current audit evidence set

## Phase 1 — Specialized risk audits

### Run

- security principal audit
- database integrity / migration audit
- environment drift audit
- rollback readiness audit

### Expected artifacts

- domain audit reports
- updated risk register
- remediation plan for any blocking issues

### Stop if

- any unresolved P0 exists
- rollback is not credible
- environment drift can break auth or routing

## Phase 2 — Release confidence audits

### Run

- API / realtime contract review
- accessibility audit
- frontend performance review
- observability readiness review

### Stop if

- critical flows lack confidence
- operators cannot observe failure modes adequately

## Phase 3 — Resilience planning

### Run

- backup / restore verification
- test suite coverage review
- load/failure strategy review

### Stop if

- recovery confidence is insufficient for production risk tolerance

## Phase 4 — Governance

### Run

- select policy tier
- review flags / kill switches
- prepare release notes and stakeholder summary

## Phase 5 — RC checkpoint

### Run

- apply RC policy
- generate gate result
- confirm stakeholder outputs exist

## Phase 6 — Production checkpoint

### Run

- apply production policy
- generate promotion gate result
- confirm branch eligibility
- confirm rollback readiness and sign-off

## Phase 7 — Post-release

### Run

- smoke-test critical flows
- confirm health state
- confirm no major alert spike
- issue stakeholder update
