# Open Questions and Possible Conflicts

## Direct Conflicts Between Audit Outputs

- Issue: **UI polish vs. a11y priority**
  - Compare audit says: Focus on operational improvements (seeds, config, scripts)
  - UI/UX audit says: Focus on a11y fixes first (aria-labels, focus trap, focus-within)
  - Why this matters: Both can be done in parallel (different files affected)
  - Suggested resolution: P0 a11y fixes (Phase 1 of both roadmaps align)

- Issue: **Reference repo value**
  - Compare audit says: Reference is worth adapting for operational patterns
  - UI/UX audit says: Reference visual design is not worth copying
  - Why this matters: No actual conflict — one focuses on ops, one on UI
  - Suggested resolution: Adopt reference operational patterns, skip visual design

## Soft Conflicts / Possible Drift

- Issue: **Shared config package**
  - Observation: Both audits suggest creating packages/config/, but compare audit prioritizes it higher
  - Why this might conflict later: Low risk — additive change

- Issue: **Build failure on Windows**
  - Observation: Local dev `pnpm build` fails with EPERM, but CI on Linux works
  - Why this might conflict later: Developers on Windows can't verify local builds; CI is the safety net

## High-Value But Risky Recommendations

- Recommendation: **Worker app (BullMQ + Redis)**
  - Why it is attractive: Enables async email, notifications, scheduled tasks
  - Why it is risky: 512MB droplet will OOM with Redis + worker + existing 3 containers
  - What must be true before accepting it: Droplet upgraded to s-2vcpu-2gb minimum

## Unclear / Needs More Evidence

- Topic: **Multi-workspace UX**
  - Missing evidence: How users will switch between workspaces — current auto-redirect assumes single workspace
  - What would resolve it: User research or feature request data

- Topic: **Mobile usage patterns**
  - Missing evidence: Whether users access chat from mobile browsers or only desktop
  - What would resolve it: Analytics data or product requirements

## Questions for Human Owner

- Should `FINAL_RECONCILED_REPO_AUDIT.md` be committed to the repo or kept as a reference document outside version control?
- Is there a preferred toast notification library (sonner, react-hot-toast, react-toastify)?
- When is the droplet upgrade planned? (s-1vcpu-512mb → s-2vcpu-2gb)
