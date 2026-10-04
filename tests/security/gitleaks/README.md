# gitleaks allowlist verification

`.gitleaks.toml` at the repository root allowlists two reviewed false
positives (DET-P2-006, DET-P2-007). This directory holds the controls that keep
the allowlist honest.

## Files

- `fixtures/negative-jwt.fixture` — a synthetic JWT split across two lines. As
  committed it is inert (only one `.` on the first line), so it does not create
  a new finding in the repository itself.
- `fixtures/negative-generic-api-key.fixture` — a synthetic `api_key:` value
  with the value on the following line, inert as committed.
- `verify-gitleaks-allowlist.sh` — assembles the fixtures into real-shaped
  secrets in a scratch directory and asserts:
  1. a repository scan with `.gitleaks.toml` is clean (allowlisted false
     positives suppressed), and
  2. gitleaks still fires `jwt` and `generic-api-key` on the assembled
     *different-valued* fixtures.

## Run

```bash
bash tests/security/gitleaks/verify-gitleaks-allowlist.sh
# or: GITLEAKS_BIN=/path/to/gitleaks bash tests/security/gitleaks/verify-gitleaks-allowlist.sh
```

The script skips cleanly (exit 0) when gitleaks or jq is unavailable.
