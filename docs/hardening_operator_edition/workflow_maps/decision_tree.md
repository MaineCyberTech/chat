# Decision Tree

## If Phase 1 fails

- Stop
- Remediate
- Re-run affected domain audits

## If Phase 2 fails

- Stop if core user path or release confidence is impaired
- Otherwise downgrade release confidence and re-evaluate policy gate

## If RC gate fails

- Do not create RC
- Remediate or re-scope

## If production promotion gate fails

- Do not promote
- Remediate, hotfix under hotfix policy, or escalate

## If post-release validation fails

- Attempt containment via kill-switch / feature flag
- If insufficient, start rollback decision workflow
