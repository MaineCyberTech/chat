# Visible Diff Areas From the Repomix Snapshots

This file lists **only the differences that were directly visible** in the supplied evidence.

## 1) Workflow trigger and execution style differences

- The develop snapshot visibly includes `workflow_dispatch` in multiple workflows.
- The develop snapshot visibly uses Corepack-based pnpm enablement in multiple workflows.
- The main snapshot visibly uses `pnpm/action-setup@v4` and `actions/setup-node@v4` caching patterns in multiple workflows.

## 2) Terraform workflow handling differences

- The develop snapshot visibly creates tfvars files from secrets in Terraform workflows.
- The develop snapshot visibly includes stale lock cleanup logic in at least one Terraform workflow.
- The main snapshot visibly uses `terraform apply -auto-approve -var-file=${{ vars.TF_VAR_FILE }}` style workflows without the same visible stale-lock section in the opened excerpt.

## 3) Vercel deployment workflow differences

- The develop snapshot visibly references project-specific Vercel deploy commands such as `--project mainecybertech-portal-dev` and `--project mainecybertech-portal-prod`.
- The main snapshot visibly uses `vercel pull`, `vercel build`, and `vercel deploy --prebuilt` patterns.

## 4) Repo tooling and policy files visible in develop but not in the opened main excerpt

- `.github/dependabot.yml`
- `.husky/pre-commit`
- `.playwright-results/`
- `scripts/load-testing/README.md`

## 5) Docs/content differences

- The develop snapshot visibly contains `docs/portal_platform_formal_handoff_bundle/` and associated handoff/diagram artifacts.
- The main snapshot visibly contains additional docs including domain completion, environment matrix, provisioning/promotion, cutover checklist, zero-downtime notes, and Vercel assignment checklist files.

## 6) Supabase visible drift

- The develop snapshot visibly shows additional migration files beyond those visible in the main excerpt, including `5302034_ticket_comment_editing.sql` and `5302035_bootstrap_portal_access.sql`.

## 7) Package/config shape differences

- The develop snapshot visibly uses `.mjs` naming in several config files (for example `eslint.config.mjs`, `jest.config.mjs`, `packages/config/eslint.mjs`).
- The main snapshot visibly includes `.js` naming in some comparable locations (for example `eslint.config.js`, `jest.config.js`, `packages/config/eslint.js`).

## 8) Web app visible differences

- The develop snapshot visibly includes `instrumentation.ts`, Sentry config files, `vercel.json`, and some component naming differences in the opened directory structure.
- The main snapshot visibly includes `FileDropzone.tsx`, `SentryErrorBoundary.tsx`, and some docs/ops files not visible in the develop excerpt.

## Reconciliation recommendation

Do not assume every visible difference should be merged. First classify each as:

- additive improvement
- environment-specific implementation
- generated artifact / should be excluded
- historical drift / likely stale
- high-risk operational difference
