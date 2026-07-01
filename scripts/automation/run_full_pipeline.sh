#!/bin/bash
# Full hardening pipeline runner (bash)
set -e
echo '[Pipeline] Starting full hardening pipeline...'

# Step 1: Sync baseline from latest audit
echo '[Pipeline] Step 1/3: Syncing baseline...'
python scripts/hardening/sync_baseline.py --repo-root .

# Step 2: Run hardening analysis
echo '[Pipeline] Step 2/3: Running hardening analysis...'
RUN_ID="auto_$(date +%Y%m%d_%H%M%S)"
python scripts/hardening_runner/run_hardening_pipeline.py init --repo-root . --run-id "$RUN_ID"
python scripts/hardening_runner/run_hardening_pipeline.py execute --repo-root . --run-id "$RUN_ID"
python scripts/hardening_runner/run_hardening_pipeline.py finalize --repo-root . --run-id "$RUN_ID"

# Step 3: Evaluate gate
echo '[Pipeline] Step 3/3: Evaluating gate...'
python scripts/audits/evaluate_gate.py --repo-root . --policy-file docs/hardening_super_bundle/policies/gate-policy.dev.json

echo '[Pipeline] Done'
