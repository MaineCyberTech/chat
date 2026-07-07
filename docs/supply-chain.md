# Supply Chain Security

## Current State

| Practice                | Status                 | Tool / Method                                                      |
| ----------------------- | ---------------------- | ------------------------------------------------------------------ |
| **Lockfile**            | ✅ Active              | `pnpm-lock.yaml` (committed, immutable)                            |
| **Dependabot**          | ✅ Active              | Weekly npm + Docker + GHA ecosystem scans (`.github/dependabot.yml`) |
| **Vulnerability Scanning** | ✅ Active          | Trivy on container images (`HIGH`, `CRITICAL`) in build-push.yml   |
| **SBOM Generation**     | ✅ Active              | Anchore SBOM action → SPDX JSON (CycloneDX) in build-push.yml      |
| **Code Signing**        | ❌ Missing             | No image signing (cosign)                                          |
| **License Compliance**  | ❌ Missing             | No automated license checking (FOSSA, ORT, or similar)             |
| **SLSA Levels**         | ❌ Not documented      | No SLSA level targets defined                                      |

## Gaps & Recommendations

### 1. Image Signing (cosign)

Add a step after image build to sign images with cosign using the GitHub OIDC token:

```yaml
- name: Sign images with cosign
  env:
    COSIGN_EXPERIMENTAL: "1"
  run: |
    cosign sign --yes ghcr.io/${{ env.REPO_LC }}/api:${{ github.sha }}
    cosign sign --yes ghcr.io/${{ env.REPO_LC }}/worker:${{ github.sha }}
    cosign sign --yes ghcr.io/${{ env.REPO_LC }}/web:${{ github.sha }}
```

Requires: `cosign-installer` GitHub Action, `id-token: write` permission in workflow.

### 2. License Compliance

Integrate a license checker (e.g., FOSSA, ORT, or `pnpm licenses list`):

- Run on every PR to detect new dependencies with restricted licenses
- Fail on GPL/AGPL license introduction if policy requires permissive-only
- Recommended: FOSSA CLI in a CI step, or `license-checker` npm package

### 3. SLSA Levels

| Level | Target | Current | Gap                        |
| ----- | ------ | ------- | -------------------------- |
| SLSA 1 | ✅     | ✅      | Build script defined (GitHub Actions) |
| SLSA 2 | ✅     | ✅      | Build as code, provenance attestations |
| SLSA 3 | 🚧     | ❌      | Requires hermetic builds + cosign signing |
| SLSA 4 | ❌     | ❌      | Requires two-party review + reproducible builds |

**Short-term target**: SLSA 2 with cosign signing (image provenance).

**Long-term target**: SLSA 3 (hermetic builds via Docker, signed provenance attestations).

## Existing SBOM Generation

The `build-push.yml` workflow already generates SPDX SBOMs using Anchore SBOM Action:

- `sbom-api.spdx.json` — dependencies from `apps/api`
- `sbom-web.spdx.json` — dependencies from `apps/web`

These are uploaded as build artifacts and can be published to GHCR alongside images.
