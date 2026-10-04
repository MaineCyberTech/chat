# Risk acceptance: dependency CVEs flagged by Trivy (DET-P1-002 / DET-P2-003 / DET-P3-004)

- **Date issued:** 2026-10-04
- **Expires:** 2027-01-04 (90 days)
- **Owner:** MCT platform engineering
- **Tracking:** deterministic audit run `chat` 2026-10-04 (findings DET-P1-002,
  DET-P2-003, DET-P3-004) and the machine-sweep report
  `docs/audits/repo-deep-dive/20261004-0700-develop-0695894/FOCUSED_SECURITY_SUPPLY_CHAIN_CI.md`.
- **Machine-readable exception list:** `.trivyignore` (Trivy fs/image scans) and
  `.pnpm-audit-exceptions.json` (pnpm audit gate in `validate.yml` / `build-push.yml`).

## Context

The 2026-10-04 sweep reported 20 HIGH/CRITICAL (P1), 15 MEDIUM (P2) and 2 LOW
(P3) advisories against `pnpm-lock.yaml`. CI fails closed on HIGH/CRITICAL via
`.trivyignore`; the medium/low findings are non-gating. Fixed-version
availability could not be confirmed from the audit environment because it has no
VulnDB access, so remediation is expressed as "move to the latest release within
the current major line", which is the conservative, non-breaking floor.

## Remediation applied in this change

Same-major patch/minor bumps via `pnpm.overrides` in the root `package.json`
(lockfile regenerated with `pnpm install --lockfile-only`):

| Package          | Before                 | After                   | Advisories covered                                                                  |
| ---------------- | ---------------------- | ----------------------- | ----------------------------------------------------------------------------------- |
| brace-expansion  | 1.1.15 / 2.1.2 / 5.0.6 | 1.1.21 / 2.1.7 / 5.0.12 | CVE-2026-102276, 102277, 102278, 13149, 14257, 69152                                |
| engine.io        | 6.6.9                  | 6.6.11                  | CVE-2026-102599                                                                     |
| socket.io-parser | 4.2.6                  | 4.2.7                   | CVE-2026-69185                                                                      |
| qs               | 6.15.2                 | 6.16.0                  | CVE-2026-82417, 82562                                                               |
| postcss          | 8.4.31 / 8.5.15        | 8.4.49 / 8.5.28         | CVE-2026-45623, 73646, 41305, 69153                                                 |
| nanoid           | 3.3.13                 | 3.3.19                  | CVE-2026-67213, 67214                                                               |
| dompurify        | 3.4.15                 | 3.4.16                  | GHSA-p98j-92pf-mc4p                                                                 |
| nodemailer       | 9.0.3                  | 9.1.1                   | GHSA-6vj9-mwq6-2f5v, 8m3c-c648-2xjj, 8vvx-rff5-p5rq, cc9r-2j5m-2m83, wmmp-3585-3rmp |
| body-parser      | 1.20.5                 | 1.20.8                  | CVE-2026-12590                                                                      |

The IDs above are retained in the exception lists until a Trivy re-scan confirms
they no longer appear; removing them before re-scan would make CI fail closed.

## Accepted residual risk

`next` is declared `^15.2.0` and resolves to `15.5.19`; the fixes for the
following advisories require the breaking major `next@16`:

- CVE-2026-64641, CVE-2026-64645, CVE-2026-64649, CVE-2026-75604
- CVE-2026-64643, CVE-2026-64644, CVE-2026-64646, CVE-2026-64647, CVE-2026-64648

`next@16` is deliberately **not** applied here: it is a breaking framework
major that must land with its own migration and full E2E run (see the open
Dependabot PR `dependabot/npm_and_yarn/next-16.2.9`). Until then the exposure is
accepted under the expiry above. The application is not currently internet
facing on the vulnerable code paths beyond the documented Next.js server, and
the production web tier runs as a non-root user behind Caddy.

## Renewal / closure criteria

Close this acceptance when either:

1. `next@16` (or a backported `15.x` fix) is adopted and the Trivy scan is
   clean; or
2. a new dated acceptance is issued before **2027-01-04**.

Re-scan and refresh by running Trivy against `pnpm-lock.yaml` and the built
images, then deleting the remediated IDs from `.trivyignore` and
`.pnpm-audit-exceptions.json`.
