import argparse
import sys
from pathlib import Path
SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))
from lib.common import Paths, load_json
ORDER = {'UNKNOWN': 0, 'NO-GO': 1, 'GO WITH RISKS': 2, 'GO': 3}

def branch_allowed(branch: str, allowed_patterns):
    for pattern in allowed_patterns:
        if pattern.endswith('/*'):
            if branch.startswith(pattern[:-1]):
                return True
        elif branch == pattern:
            return True
    return False

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--repo-root', default='.')
    parser.add_argument('--source-branch', default='')
    parser.add_argument('--target-environment', required=True, choices=['development', 'production'])
    parser.add_argument('--policy-file', default='docs/hardening_super_bundle/policies/gate-policy.prod.json')
    parser.add_argument('--out', default='docs/hardening_super_bundle/examples/results/generated_promotion_gate_result.md')
    args = parser.parse_args()
    paths = Paths(Path(args.repo_root).resolve())
    summary = load_json(paths.audits_root / 'latest_run.json')
    policy_path = Path(args.policy_file)
    if not policy_path.is_absolute():
        policy_path = paths.repo_root / policy_path
    policy = load_json(policy_path)
    sev = summary.get('severity_totals', {})
    scores = summary.get('category_health_scores', {})
    readiness = round(sum(scores.values()) / len(scores), 2) if scores else 0.0
    decision = summary.get('decision', 'UNKNOWN')
    max_p0 = int(policy.get('max_p0', 0))
    max_p1 = int(policy.get('max_p1', 0))
    min_readiness = float(policy.get('min_readiness', 85.0))
    require_decision = str(policy.get('require_decision', 'GO'))
    allowed_source_branches = policy.get('allowed_source_branches', [])
    failures = []
    if sev.get('P0', 0) > max_p0:
        failures.append(f'P0 count {sev.get("P0", 0)} exceeds max {max_p0}')
    if sev.get('P1', 0) > max_p1:
        failures.append(f'P1 count {sev.get("P1", 0)} exceeds max {max_p1}')
    if readiness < min_readiness:
        failures.append(f'Average readiness {readiness:.2f} is below minimum {min_readiness:.2f}')
    if ORDER.get(decision, 0) < ORDER.get(require_decision, 3):
        failures.append(f'Decision {decision} is below required threshold {require_decision}')
    if allowed_source_branches and args.source_branch and not branch_allowed(args.source_branch, allowed_source_branches):
        failures.append(f'Source branch {args.source_branch} is not allowed by promotion policy')
    out_path = Path(args.out)
    if not out_path.is_absolute():
        out_path = paths.repo_root / out_path
    out_path.parent.mkdir(parents=True, exist_ok=True)
    lines = ['# Environment Promotion Gate Result', '', f'- Policy file: **{policy_path}**', f'- Source branch: **{args.source_branch or "UNKNOWN"}**', f'- Target environment: **{args.target_environment}**', f'- Decision: **{decision}**', f'- P0: **{sev.get("P0", 0)}**, P1: **{sev.get("P1", 0)}**', f'- Average readiness: **{readiness:.2f}**', '']
    if failures:
        lines.append('## Gate Status: FAIL'); lines.append(''); lines.extend([f'- {f}' for f in failures]); out_path.write_text('\n'.join(lines)+'\n', encoding='utf-8'); raise SystemExit(1)
    lines.append('## Gate Status: PASS'); out_path.write_text('\n'.join(lines)+'\n', encoding='utf-8'); print('pass')
if __name__ == '__main__':
    main()
