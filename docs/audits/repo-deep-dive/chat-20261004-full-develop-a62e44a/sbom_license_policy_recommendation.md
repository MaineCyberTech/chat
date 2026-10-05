# SBOM / license policy recommendation

- SBOMs are produced for production images (`.github/workflows/deploy-production.yml:213-238`)
  but are **not signed/attested**.
- `LICENSE` is present (proprietary all-rights-reserved); dependency licenses are ungated.

Recommendation:
- Sign/attest SBOMs with cosign and publish build provenance.
- Add a dependency-review action and a license allow-list gate on PRs.
