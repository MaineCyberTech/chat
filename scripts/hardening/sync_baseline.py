"""
Synchronize the hardening/ data store with the audit pipeline.

Reads latest_run.json and populates:
  - hardening/baselines/current.json  -> current findings baseline
  - hardening/history/history.json    -> append snapshot for trend tracking
  - hardening/rules/core.rules.json   -> update rules from known check patterns

Usage:
    python scripts/hardening/sync_baseline.py --repo-root .
"""

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path


def load_json(path):
    return json.loads(path.read_text(encoding='utf-8'))


def write_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2) + '\n', encoding='utf-8')


def now_iso():
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def main():
    parser = argparse.ArgumentParser(description='Sync hardening data store with audit pipeline')
    parser.add_argument('--repo-root', default='.')
    args = parser.parse_args()

    repo_root = Path(args.repo_root).resolve()
    hardening_dir = repo_root / 'hardening'
    audits_root = repo_root / 'docs' / 'audits'
    latest_run_path = audits_root / 'latest_run.json'

    if not latest_run_path.exists():
        print('No latest_run.json found. Run an audit first.')
        sys.exit(1)

    # Read current audit state
    summary = load_json(latest_run_path)
    sev = summary.get('severity_totals', {})
    findings = summary.get('findings', [])
    decision = summary.get('decision', 'UNKNOWN')
    run_id = summary.get('run_id', 'unknown')

    # --- Update baselines ---
    baseline_path = hardening_dir / 'baselines' / 'current.json'
    baseline = {
        'run_id': run_id,
        'generated_at': now_iso(),
        'decision': decision,
        'severity_totals': sev,
        'finding_count': len(findings),
        'findings': findings,
    }
    write_json(baseline_path, baseline)
    print(f'Updated baseline: {len(findings)} findings from run {run_id}')

    # --- Update history ---
    history_path = hardening_dir / 'history' / 'history.json'
    if history_path.exists():
        history = load_json(history_path)
    else:
        history = []
    history.append({
        'run_id': run_id,
        'timestamp': now_iso(),
        'decision': decision,
        'severity_totals': sev,
        'finding_count': len(findings),
    })
    write_json(history_path, history)
    print(f'Updated history: {len(history)} snapshots')

    # --- Update rules from known check patterns ---
    rules_path = hardening_dir / 'rules' / 'core.rules.json'
    rules = [
        {'id': 'AUTH-001', 'severity': 'P0',
         'desc': 'All route files have requireAuth middleware',
         'grep': 'requireAuth', 'path': 'apps/api/src/routes/',
         'expect': 'present in every .ts except health.ts, docs.ts, public.ts'},
        {'id': 'AUTH-002', 'severity': 'P0',
         'desc': 'All entity routes have requireOrgAccess',
         'grep': 'requireOrgAccess', 'path': 'apps/api/src/routes/',
         'expect': 'present in all entity CRUD routes'},
        {'id': 'SEC-001', 'severity': 'P1',
         'desc': 'Cookie has httpOnly+secure+sameSite flags',
         'grep': 'httpOnly|secure|sameSite', 'path': 'apps/api/src/lib/auth.ts',
         'expect': 'httpOnly=true, secure=true, sameSite=strict|lax'},
        {'id': 'SEC-002', 'severity': 'P1',
         'desc': 'No hardcoded secrets in .env.example',
         'grep': '<your-|placeholder|changeme', 'path': 'apps/*/.env.example',
         'expect': 'all sensitive values use placeholder tokens'},
        {'id': 'INFRA-001', 'severity': 'P1',
         'desc': 'Health endpoint returns 200',
         'grep': 'health', 'path': 'apps/api/src/',
         'expect': 'health route returns 200 with service status'},
        {'id': 'DATA-001', 'severity': 'P1',
         'desc': 'All user-data tables have RLS enabled',
         'grep': 'alter publication supabase_realtime', 'path': 'supabase/migrations/',
         'expect': 'RLS enabled on all user-owned tables'},
    ]
    write_json(rules_path, rules)
    print(f'Updated rules: {len(rules)} rules defined')

    # --- Update governance policy if missing ---
    policy_path = hardening_dir / 'policies' / 'governance.json'
    if not policy_path.exists() or policy_path.stat().st_size < 10:
        policy = {
            'block_on': ['P0', 'P1'],
            'auto_fix': True,
            'pr_comments': True,
            'compliance_export': True,
            'max_p0': 0,
            'max_p1': 5,
            'min_readiness': 70,
        }
        write_json(policy_path, policy)
        print('Created governance policy with defaults')

    # --- Update exceptions (create if not exists) ---
    exceptions_path = hardening_dir / 'exceptions' / 'exceptions.json'
    if not exceptions_path.exists() or exceptions_path.stat().st_size < 10:
        write_json(exceptions_path, [])
        print('Created empty exceptions list')

    print('Hardening data store sync complete.')


if __name__ == '__main__':
    main()
