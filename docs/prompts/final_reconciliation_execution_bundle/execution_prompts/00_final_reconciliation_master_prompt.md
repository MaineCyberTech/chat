# Final Reconciliation Master Prompt

You are performing the final reconciliation pass for this repository.

Project context assumed by this execution bundle:

- Monorepo / Turborepo style repository
- Frontend: Next.js application(s)
- API: Express or similar Node service
- Data layer: Supabase/PostgreSQL
- Background processing: Node worker(s)/jobs)
- Environments must stay strictly separated:
  - development: chat.mainecybertech.us / chat-api.mainecybertech.us
  - production: chat.mainecybertech.com / chat-api.mainecybertech.com
- Preserve existing working behavior. Prefer similarity and improvement without regressions.
- Output must be repo-ready, explicit, and file-targeted.

Universal rules for the AI running final reconciliation:

1. Do not break currently working functionality.
2. Prefer evidence from the repo and completed audit artifacts over assumptions.
3. Explicitly separate development vs production concerns.
4. Use severities: p0, p1, p2, p3.
5. For every issue include: why it matters, impacted files, risk, safest remediation, and validation.
6. Resolve contradictions explicitly instead of silently choosing one finding.
7. If an audit claim cannot be verified, mark it as unverified.
8. End with a prioritized implementation roadmap and safe rollout order.

## objective

Merge the findings from all available audit artifacts into one implementation-ready source of truth.

## mandatory behavior

- inventory every supplied artifact before drawing conclusions
- preserve currently working behavior unless unsafe by design
- resolve contradictions explicitly
- separate confirmed findings from unverified claims
- produce file-targeted remediation guidance
- preserve development vs production separation

## required final outputs

1. executive summary
2. artifact inventory
3. contradictions resolved
4. merged confirmed findings by severity
5. unknowns requiring manual verification
6. file-by-file action plan
7. validation checklist
8. safe rollout order
9. deferred improvements / watchlist
