# Reconciliation Report

- Prompt: **final_reconciliation_repo_audit**
- Domain: **reconciliation**
- Run ID: **final_reconciliation_repo_audit_20260709_070726**
- Generated: **2026-07-09T03:06:59Z**
- Decision: **GO WITH RISKS**
- P0: **0**, P1: **2**
- P2: **3**, P3: **4**
- Readiness: **80.00**

## Findings

### P1 — web .env.example missing NEXT*PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY as required vars (listed as NEXT_PUBLIC*\* prefix â€” schema mismatch with root .env.example)

- **File:** `apps/web/.env.example`
- **Category:** env_drift
- **Impact:** Developers may miss required Supabase client-side vars when setting up frontend locally
- **Fix:** Ensure apps/web/.env.example includes NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY as required (documented) â€” they exist but should be clearly marked

### P1 — 4 files reference 'traefik' naming (legacy reverse proxy) â€” all Caddy references should be clean

- **File:** `FINAL_RECONCILED_REPO_AUDIT.md, docs/audits/compare/01_INVENTORY.md, FINAL_RECONCILIATION_REPO_AUDIT_PROMPT.md, docs/audits/docs_devex_operations_audit_summary.md`
- **Category:** naming
- **Impact:** Stale documentation references cause operator confusion about actual infrastructure
- **Fix:** Replace 'traefik' references with 'Caddy' in all documentation files â€” infra/docker/ uses Caddy, not Traefik

### P2 — Backup restore audit prompt exists but no backup/restore is configured in any compose file or workflow

- **File:** `docs/prompts/ops/backup_restore_verification_audit_prompt.md`
- **Category:** dead_files
- **Impact:** Out-of-date prompt documents a capability that doesn't exist â€” operators may falsely assume backup is in place
- **Fix:** Either implement backup/restore (PG dump to S3/SCP) or update prompt to reflect current state â€” no automated backup exists

### P2 — Supabase client initialization references config/env.js but route-registry.ts references modules directly â€” no centralized service locator pattern mismatch

- **File:** `apps/api/src/lib/supabase.ts`
- **Category:** import_errors
- **Impact:** Refactoring risk â€” changing module locations requires updating imports across multiple files
- **Fix:** Consider adding barrel exports index.ts per module directory to reduce fragile import paths

### P2 — Admin UI references GET /admin/health endpoint which is behind authenticate+requireAdmin middleware â€” route exists but no client-side error handling if non-admin accesses

- **File:** `apps/web/app/(workspace)/[workspaceSlug]/admin/page.tsx`
- **Category:** phase_contracts
- **Impact:** Non-admin users may see blank or broken admin page instead of proper access-denied message
- **Fix:** Add client-side role check on admin page with fallback to 'Access Denied' message before API call

### P3 — Comment references 'Health check at GET /health (for LB / DO monitoring)' but actual path is /health AND /healthz

- **File:** `apps/api/src/server.ts:16`
- **Category:** comment_drift
- **Impact:** Minor documentation inconsistency â€” operators could miss /healthz endpoint
- **Fix:** Update comment to document both /health (readiness) and /healthz (full check with DB)

### P3 — API .env.example lists FRONTEND_URL=http://localhost:3000 but root .env.example also has FRONTEND_URL â€” no indication which takes precedence

- **File:** `apps/api/.env.example`
- **Category:** env_drift
- **Impact:** Developers may set conflicting values in different .env files
- **Fix:** Document precedence order (per-app .env overrides root .env) in both .env.example files

### P3 — Config env loader references environment.ts pattern but file is .js â€” import paths use .js extension for TS files

- **File:** `apps/api/src/config/env.js`
- **Category:** naming
- **Impact:** Minor consistency issue â€” mixed .ts/.js extension patterns in a TS codebase
- **Fix:** Standardize on .ts extension for TypeScript source files or document that .js is used for ESM output compatibility

### P3 — Multiple deprecated/superseded prompt files exist (governance.yml v5, old audit prompt versions) without clear deprecation markers

- **File:** `docs/prompts/`
- **Category:** dead_files
- **Impact:** Operators may run stale prompts and get outdated results
- **Fix:** Add OBSOLETE.md or deprecation header to superseded prompt directories referencing the replacement
