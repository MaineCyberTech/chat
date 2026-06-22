    # Database Integrity and Migration Audit Prompt

    ## Objective
    Assess schema correctness, migration safety, rollback feasibility, RLS posture, indexing, and data integrity risks.

    ## Execution Mode
    Operate in execution mode. Inspect the repository, configuration, infrastructure conventions, documentation, and runtime assumptions. Emit repo-grounded findings only.

    ## Required Scope
    - Migration order, transaction safety, and rollback risk

- Schema drift and compatibility with app code
- Indexes, constraints, nullable changes, enum drift, and destructive changes
- RLS and tenant scoping rules
- Seed/fixture contamination risks

  ## Required Special Checks
  - Unsafe destructive migrations or orphaning risk

- Missing indexes likely to cause major regression
- Missing or incorrect RLS posture

  ## Required Deliverables
  - Migration risk matrix

- Destructive-change register
- Rollback and restore prerequisites
- Final DB release impact statement

  ## Severity Model
  - **P0** — blocking production risk, exploit path, or outage path
  - **P1** — major production risk with material user/operator impact
  - **P2** — moderate issue that should be remediated soon
  - **P3** — low-severity cleanup or optimization issue

  ## Required Output Structure
  1. Executive summary
  2. Findings summary table
  3. Detailed findings by category
  4. Remediation plan by urgency
  5. Operator handoff notes
  6. Final domain decision

  ## Final Decision Rule

  Return **NO-GO** for unsafe destructive migrations, major schema drift, or missing tenant protections.
