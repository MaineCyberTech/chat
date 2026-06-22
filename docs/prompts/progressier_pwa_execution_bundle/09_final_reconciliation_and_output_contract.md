# Final Reconciliation and Output Contract

You must now reconcile all prior phases into a final, precise implementation report.

## Required final sections

### 1. Executive summary

- what was implemented
- what was intentionally deferred
- whether the requested Progressier-style feature family is now covered

### 2. Exact changed files

List every modified file.

### 3. Exact new files

List every newly created file.

### 4. Schema / migration changes

List:

- new tables
- new columns
- new indexes
- new policies
- new migration files

### 5. Route / API changes

List every new or changed route and its contract.

### 6. Frontend behavior changes

List every user-visible change:

- install prompts
- install page
- notification prompt
- settings/preferences changes
- fallback flows

### 7. Validation evidence

Report exact results for:

- install
- lint
- typecheck
- test
- build
- e2e if run

### 8. Regression assessment

State whether auth, socket, existing messaging, and deployment behavior remain intact.

### 9. Operator follow-up

List:

- env vars to set
- secrets to configure
- deployment notes
- browser-specific caveats
- manual QA checklist

### 10. Rollback plan

Provide a safe rollback outline:

- which new files can be removed
- which migrations are additive
- what to disable first if push causes issues

## Formatting rules

Be exact.
Do not summarize loosely.
Do not omit files.
Do not claim validation that was not actually run.
If something could not be validated, say so explicitly.
