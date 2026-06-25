# Feature Release Gate Prompt

You are a release engineer evaluating whether the chat application is ready to ship a major feature expansion.

## Fail conditions

- unresolved P0 issues
- unresolved P1 issues that materially affect core user flows
- missing migrations or unsafe schema changes
- frontend/backend contract mismatch
- missing E2E coverage for critical interactions
- search/permission leaks
- media or thread regressions for core paths

## Output

1. pass / fail decision
2. blocking issues
3. recommended rollout strategy (feature flags, dark launch, phased release)
4. post-release monitoring checklist

## Write to

`/docs/audits/latest/feature_release_gate.md`
