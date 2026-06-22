    # Release Note Generator Prompt

    ## Objective
    Design a generator that composes technical and stakeholder-friendly release notes from audit results, severity diffs, readiness changes, and operator summaries.

    ## Execution Mode
    You are operating in execution-mode and may inspect the full repository, configuration, build tooling, environment conventions, database definitions, CI/CD wiring, and documentation. Validate findings against actual files and emit repo-grounded findings only.

    ## Required Scope
    - Inputs from audit summaries, release reports, and change summaries

- Executive-friendly tone for stakeholder release notes
- Technical delta section for engineering readers
- Rollback notes and post-release validation sections

  ## Required Special Checks
  - Separate executive summary from engineering detail

- Include risk posture and audit decision explicitly
- Make post-release validation actionable rather than generic

  ## Required Deliverables
  - Release note schema

- Template guidance
- Required metadata fields
- Recommendations for automatic generation in CI/CD

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

  This upgrade should improve change communication quality and release transparency.
