# Evidence Summary

This bundle is grounded in the following visible evidence:

1. An internal Repomix snapshot for the main codebase showing a monorepo-style structure with:
   - `.github/workflows/*`
   - `apps/api`, `apps/web`, `apps/worker`
   - `docs/`
   - `infra/terraform/`
   - `packages/config`, `packages/sdk`, `packages/ui`
   - `scripts/`
   - `supabase/`
   - root files such as `README.md`, `README.dev.md`, `SECURITY.md`, `turbo.json`

2. An internal Repomix snapshot for the develop codebase showing a very similar monorepo structure, but with visible differences such as:
   - `.github/dependabot.yml`
   - `.husky/pre-commit`
   - `.playwright-results/`
   - `docs/portal_platform_formal_handoff_bundle/`
   - `scripts/load-testing/README.md`
   - additional Supabase migrations in the develop snapshot

3. A public GitHub organization page result that states the organization has no public repositories visible from anonymous/public access.

## Practical implication

Treat this bundle as a **reconciliation aid based on internal snapshots**, not as a direct live scrape of the provided repository URLs.

## Important guardrails

- Preserve working behavior in the current repo unless a change is explicitly approved.
- Prefer additive reconciliation over destructive replacement.
- Require evidence before claiming parity, drift, or regression.
- Use the chat repo only after its contents are available to the reviewer or AI.
