    # Database Integrity and Migration Audit Prompt

    ## Objective
    Assess schema correctness, migration safety, rollback feasibility, RLS posture, indexing, and data integrity risks before release or promotion.

    ## Execution Mode
    You are operating in execution-mode and may inspect the full repository, configuration, build tooling, environment conventions, database definitions, CI/CD wiring, and documentation. Validate findings against actual files and emit repo-grounded findings only.

    ## Required Scope
    - Migration sequence, transaction safety, idempotency, and rollback risk

- Schema drift between environments and compatibility with current application code
- Indexes, foreign keys, constraints, nullable changes, enum drift, and destructive changes
- Row-level security and tenant scoping rules
- Seed data / fixtures / local reset scripts that could contaminate release expectations

  ## Required Special Checks
  - Flag any migration that can orphan data or break older code paths

- Flag any missing index likely to cause major performance regression
- Flag any RLS rule or missing RLS posture that can leak tenant data

  ## Required Deliverables
  - Migration risk matrix

- Destructive-change register
- Rollback / restore prerequisites
- Final release impact statement for DB changes

  ## Severity Model
  - **P0** — blocking production risk or high-confidence exploit / outage path
  - **P1** — major production risk likely to materially impact users, operators, or release confidence
  - **P2** — moderate issue that should be fixed soon but is not immediate release-blocking in isolation
  - **P3** — low-severity cleanup / optimization / documentation issue

  ## Output Format Requirements
  1. Executive summary
  2. Summary table of findings
  3. Detailed findings by category
  4. Remediation plan by urgency
  5. Operator handoff notes
  6. Final domain decision

  ## Final Decision Rule

  Return **NO-GO** for unsafe destructive migrations without rollback protection, major schema drift, or missing tenant-protection controls.
