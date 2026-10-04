#!/usr/bin/env bash
# Verification for .gitleaks.toml (DET-P2-006 generic-api-key, DET-P2-007 jwt).
#
#   1. Positive control: the reviewed false positives are allowlisted, so a scan
#      of the repository with .gitleaks.toml reports zero findings.
#   2. Negative control: the fixtures under fixtures/ assemble into real-shaped
#      secrets with different values; gitleaks must still detect them. This
#      proves the allowlists are value-scoped and not a blanket suppression.
#
# Usage: bash tests/security/gitleaks/verify-gitleaks-allowlist.sh
# Env:   GITLEAKS_BIN  path/name of the gitleaks binary (default: gitleaks)
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$HERE/../../.." && pwd)"
GITLEAKS="${GITLEAKS_BIN:-gitleaks}"

if ! command -v "$GITLEAKS" >/dev/null 2>&1; then
  echo "SKIP: gitleaks not found (set GITLEAKS_BIN)"; exit 0
fi
if ! command -v jq >/dev/null 2>&1; then
  echo "SKIP: jq not found"; exit 0
fi

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# 1. Positive control: the repository must be clean under the allowlist.
"$GITLEAKS" detect --no-git --source "$ROOT" --config "$ROOT/.gitleaks.toml" \
  --exit-code 0 --report-format json --report-path "$TMP/repo.json" >/dev/null 2>&1
repo_findings="$(jq 'length' "$TMP/repo.json")"
if [ "$repo_findings" -ne 0 ]; then
  echo "FAIL: repo scan produced $repo_findings finding(s) despite allowlist:"
  jq -r '.[] | "  \(.RuleID) \(.File):\(.StartLine)"' "$TMP/repo.json"
  exit 1
fi
echo "PASS: repository scan clean under .gitleaks.toml"

# 2. Negative control: assemble the fixtures into a scratch tree and scan it.
# Each fixture stores the secret split so the committed file itself is inert.
mkdir -p "$TMP/negative"
paste -sd. "$HERE/fixtures/negative-jwt.fixture" > "$TMP/negative/jwt.txt"
paste -s -d '' "$HERE/fixtures/negative-generic-api-key.fixture" \
  > "$TMP/negative/generic-api-key.txt"

"$GITLEAKS" detect --no-git --source "$TMP/negative" --config "$ROOT/.gitleaks.toml" \
  --exit-code 0 --report-format json --report-path "$TMP/negative.json" >/dev/null 2>&1

rules="$(jq -r '.[].RuleID' "$TMP/negative.json" | sort -u | tr '\n' ' ')"
echo "negative-control rules detected: ${rules:-<none>}"

for expected in jwt generic-api-key; do
  if ! printf '%s\n' "$rules" | grep -q "$expected"; then
    echo "FAIL: expected rule '$expected' did not fire on the negative fixture"
    exit 1
  fi
done
echo "PASS: real-shaped secrets with different values are still detected"
