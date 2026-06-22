    # Frontend Performance and Bundle Audit Prompt

    ## Objective
    Audit rendering cost, route chunking, bundle size, client/server boundary decisions, hydration cost, and memory/performance behaviors in long chat sessions.

    ## Execution Mode
    You are operating in execution-mode and may inspect the full repository, configuration, build tooling, environment conventions, database definitions, CI/CD wiring, and documentation. Validate findings against actual files and emit repo-grounded findings only.

    ## Required Scope
    - Bundle composition and route chunk sizes

- Hydration-heavy routes and unnecessary client components
- Long transcript rendering, virtualization need, and event storm rendering cost
- Image/font loading, layout shift, and mobile responsiveness under load

  ## Required Special Checks
  - Flag any path likely to degrade badly on mobile or low-power devices

- Flag any obvious memory leak or long-session state buildup risk
- Flag routes likely to feel sluggish due to oversized client bundles

  ## Required Deliverables
  - Performance hotspot table

- Bundle optimization recommendations
- Critical path rendering recommendations
- Final performance risk decision

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

  Return **NO-GO** if performance defects make core chat/navigation flows unreliable for normal user usage patterns.
