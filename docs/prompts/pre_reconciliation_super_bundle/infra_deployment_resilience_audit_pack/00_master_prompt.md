# Infra / Deployment / Resilience Master Prompt

Project context assumed by these audit folders:

- Monorepo / Turborepo style repository
- Frontend: Next.js application(s)
- API: Express or similar Node service
- Data layer: Supabase/PostgreSQL
- Background processing: Node worker(s)/jobs
- Environments must stay strictly separated:
  - Development: chat.mainecybertech.us / chat-api.mainecybertech.us
  - Production: chat.mainecybertech.com / chat-api.mainecybertech.com
- Preserve existing working behavior. Prefer similarity and improvement without regressions
- Output must be repo-ready, explicit, and file-targeted

Universal rules for the AI running these audits:

1. Do not break currently working functionality.
2. Prefer evidence from the repo over assumptions.
3. Explicitly separate development vs production concerns.
4. Use severities: P0, P1, P2, P3.
5. For every issue include: why it matters, impacted files, risk, safest remediation, and validation.
6. End with a prioritized implementation roadmap.

## Focus

- environment separation and correctness
- deploy safety, repeatability, rollback readiness
- observability, health checks, alerting hooks, operational runbooks
- drift and hidden production failure modes
