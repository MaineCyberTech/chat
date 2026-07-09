# Hotfix Process

## When to Use a Hotfix

A hotfix branch is warranted only for:

- **Production outage** — core functionality (messaging, auth, real-time) is unavailable
- **P0 security vulnerability** — active exploit or data exposure in production
- **Data loss** — messages, files, or user data being corrupted or deleted

All other fixes follow the normal develop → PR → main flow.

## Step-by-Step Process

### 1. Create Hotfix Branch

```bash
git checkout main
git pull origin main
git checkout -b hotfix/<issue-id>-<short-description>
```

### 2. Apply Minimal Fix

- Change only the code necessary to resolve the issue
- Do not refactor, rename, or upgrade dependencies
- Include a regression test if feasible within the urgency window
- Commit with message format: `hotfix: <description> (#<issue-id>)`

### 3. Approval (Skip Tests Only with Approval)

- Open a PR against `main` with label `hotfix`
- CI runs automatically (lint, typecheck, build, E2E)
- **Skip tests only with explicit written approval** from a second maintainer
- Required approvers: at least 1 owner/admin
- If tests are skipped, note the reason and approval in the PR description

### 4. Deploy with Manual Approval

- Merge the PR into `main`
- The `deploy-production.yml` workflow deploys automatically on `main` push
- Monitor the health endpoint (`/healthz`) and Sentry for 10 minutes post-deploy
- If issues arise, initiate rollback (see below)

### 5. Merge Back to Develop

```bash
git checkout develop
git merge --no-ff main
git push origin develop
```

This ensures the hotfix is included in the next regular release.

### 6. Post-Mortem Within 24 Hours

Create a post-mortem document covering:

| Item             | Details                                                      |
| ---------------- | ------------------------------------------------------------ |
| **Timeline**     | When was the issue introduced? When detected? When resolved? |
| **Root cause**   | What allowed the issue to reach production?                  |
| **Impact**       | Which users were affected? Any data loss?                    |
| **Action items** | Prevent recurrence (tests, monitoring, process)              |
| **Owner**        | Who is responsible for each action item                      |

File as `docs/post-mortems/<date>-<issue-id>.md`.

## Rollback Procedure

If a hotfix causes regressions:

1. **Revert the hotfix commit** on `main`:
   ```bash
   git checkout main
   git revert <hotfix-commit-hash>
   git push origin main
   ```
2. Deployment happens automatically — confirm the rollback at `/healthz`
3. If the revert conflicts, use `git revert --mainline 1 -m 1 <merge-commit-hash>` for the merge commit
4. Create a new hotfix branch from the reverted state with the corrected fix

## Communication Template

When a hotfix is underway, post to the `#operations` channel:

```
🚨 HOTFIX IN PROGRESS
Issue: {link to GitHub issue}
Branch: hotfix/{issue-id}-{description}
Impact: {summary of the outage/vulnerability}
Deployed by: {name}
Monitoring: {link to Sentry / health dashboard}
Post-mortem scheduled: {time within 24h}
```

After resolution, post:

```
✅ HOTFIX RESOLVED
Issue: {link to GitHub issue}
Fix deployed at: {timestamp}
Root cause: {one-line summary}
Post-mortem: {link to doc}
```

## Approvers

| Role   | Can approve hotfix PR? | Can approve test skip? |
| ------ | ---------------------- | ---------------------- |
| Owner  | ✅ Yes                 | ✅ Yes                 |
| Admin  | ✅ Yes                 | ❌ No                  |
| Member | ❌ No                  | ❌ No                  |
