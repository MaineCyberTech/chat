# Branch protection recommendation

Observed from source at `a62e44a`: default branch is `develop` (no `main`);
the in-repo gate `.github/workflows/validate.yml:273-292` checks **only `main`**.

Recommendation:
- Protect `develop` with required status checks (validate, audit-pr-gate) and PR review.
- Require at least one approving review and disallow direct pushes to `develop`.
- Record the live ruleset/environment reviewers as an evidence snapshot; server-side
  state is `Unknown` from a clone and was not faked.
