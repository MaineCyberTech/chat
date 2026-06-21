# Bootstrap Prompt — Empty Repo Execution Mode

## Production-Grade Real-Time Workspace Platform

Use this when the repo is empty or nearly empty.

## Required Outcome

Bootstrap a production-grade monorepo with:

- `apps/web`
- `apps/api`
- `packages/ui`
- `packages/db`
- optional `apps/worker`
- `infra/docker`
- `infra/terraform`
- `.github/workflows`
- `docs`

## Required Root Files

- `package.json`
- `pnpm-workspace.yaml`
- `turbo.json`
- `tsconfig.base.json`
- `.gitignore`
- `.editorconfig`
- `README.md`

## Core Requirements

- create missing files and directories directly
- install dependencies if needed
- run validation commands
- repair actionable failures
- leave the repo in a coherent bootstrapped state

## Environment Model

Development:

- `https://chat.mainecybertech.us`
- `https://chat-api.mainecybertech.us`

Production:

- `https://chat.mainecybertech.com`
- `https://chat-api.mainecybertech.com`

GitHub environments:

- `development`
- `production`

## Report Format

- BOOTSTRAP: EMPTY REPO FOUNDATION
- OBJECTIVE
- REPO INSPECTION SUMMARY
- IMPLEMENTATION PLAN
- FILES CREATED
- FILES MODIFIED
- DIRECTORIES CREATED
- DEPENDENCIES ADDED
- COMMANDS RUN
- VALIDATION RESULTS
- BLOCKERS
- NEXT RECOMMENDED STEP
