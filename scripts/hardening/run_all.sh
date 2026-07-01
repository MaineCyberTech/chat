#!/bin/bash
# Hardening pipeline runner (bash version)
# Usage: bash scripts/hardening/run_all.sh
# Must be run from repo root

set -e
cd "$(cd "$(dirname "$0")/../.." && pwd)"

echo '[Hardening] Syncing baseline from latest audit...'
python scripts/hardening/sync_baseline.py --repo-root .

echo '[Hardening] Evaluating gate...'
python scripts/audits/evaluate_gate.py --repo-root . --policy-file docs/hardening_super_bundle/policies/gate-policy.dev.json

if [ $? -eq 0 ]; then
    echo '[Hardening] Gate: PASS'
else
    echo '[Hardening] Gate: FAIL'
    exit 1
fi

echo '[Hardening] Generating dashboard...'
python scripts/audits/generate_dashboard.py --repo-root . 2>/dev/null || true

echo '[Hardening] Done'
