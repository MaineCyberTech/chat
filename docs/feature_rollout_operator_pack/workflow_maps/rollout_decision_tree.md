# Rollout Decision Tree

## If a wave plan is incomplete

- do not implement
- refine prompt outputs first

## If migrations are risky

- dark launch backend primitives first
- do not expose UI broadly

## If permission visibility is uncertain

- stop and resolve before search, notifications, or threads progress

## If frontend interaction changes are high risk

- use feature flags and allowlist rollout

## If release gate fails

- stop rollout
- remediate
- regenerate decision package
