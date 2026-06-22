    # Frontend Performance and Bundle Audit Prompt

    ## Objective
    Audit rendering cost, route chunking, hydration burden, long-session memory behavior, and mobile performance.

    ## Execution Mode
    Operate in execution mode. Inspect the repository, configuration, infrastructure conventions, documentation, and runtime assumptions. Emit repo-grounded findings only.

    ## Required Scope
    - Route chunk sizes and client bundle composition

- Hydration-heavy routes and unnecessary client components
- Long transcript rendering / virtualization needs
- Layout shift, image/font loading, and mobile responsiveness

  ## Required Special Checks
  - Mobile or low-power performance degradation risk

- Long-session memory/state buildup risk
- Oversized client bundle issues

  ## Required Deliverables
  - Performance hotspot table

- Bundle optimization recommendations
- Critical path rendering recommendations
- Final performance risk decision

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

  Return **NO-GO** if performance defects make core chat/navigation unreliable for normal usage.
