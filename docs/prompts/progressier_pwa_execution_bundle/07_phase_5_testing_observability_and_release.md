# Phase 5 — Testing, Observability, and Release Hardening

Harden the implementation and verify that nothing critical regressed.

## Objective

Validate the new PWA / install / push features against the repo’s existing quality gates.

## Required outcomes

1. Build must pass
2. Lint must pass
3. Typecheck must pass
4. Existing tests must pass
5. Add tests where practical for new logic
6. Document residual manual validation steps clearly

## Preferred additions

Add or extend:

- unit tests for new utilities
- frontend component tests for install and push UI where practical
- API tests for new notification endpoints where practical
- e2e / smoke additions if low-cost and stable

## Observability expectations

If new push flows are introduced:

- log delivery failures safely
- avoid crashing message pipelines on notification failures
- surface validation and fallback states clearly

## Deployment awareness

If new environment variables are required:

- update example env files
- update docs
- avoid speculative deploy workflow rewrites unless required
- document exactly what operators must configure

## Required output

Emit:

- all commands run
- pass/fail for each command
- manual validation checklist
- operator notes for development and production
- unresolved known issues if any
