import argparse, json, sys
from datetime import datetime
from pathlib import Path
SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path: sys.path.insert(0, str(SCRIPT_DIR))
from lib.common import Paths, STAGES, now_iso, ensure_json, load_json, DECISION_ORDER

def build_run_id(prefix=None):
    ts = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
    return f'{prefix}_{ts}' if prefix else ts

def cmd_init(args):
    paths = Paths(Path(args.repo_root).resolve())
    run_id = args.run_id or build_run_id(args.prefix)
    run_dir = paths.runs_root / run_id
    reports = run_dir / 'reports'; summaries = run_dir / 'summaries'
    reports.mkdir(parents=True, exist_ok=True); summaries.mkdir(parents=True, exist_ok=True)
    for stage, report_name, summary_name in STAGES:
        (reports/report_name).write_text('# ' + stage.replace('_',' ').title() + ' Report\n', encoding='utf-8')
        ensure_json(summaries/summary_name, {'stage': stage, 'run_id': run_id, 'decision':'UNKNOWN', 'generated_at': now_iso(), 'severity_counts': {'P0':0,'P1':0,'P2':0,'P3':0}, 'category_scores': {}, 'findings': []})
    ensure_json(run_dir/'run_manifest.json', {'run_id': run_id, 'created_at': now_iso(), 'status': 'initialized'})
    print(json.dumps({'run_id': run_id}, indent=2))

def cmd_finalize(args):
    paths = Paths(Path(args.repo_root).resolve())
    run_dir = paths.runs_root / args.run_id
    summaries = [load_json(p) for p in sorted((run_dir/'summaries').glob('*.json'))]
    totals={'P0':0,'P1':0,'P2':0,'P3':0}; findings=[]; scores={}; decision='GO'
    for s in summaries:
        for sev, count in s.get('severity_counts', {}).items(): totals[sev]+=int(count)
        if DECISION_ORDER.get(s.get('decision','UNKNOWN'), -1) < DECISION_ORDER.get(decision, -1): decision = s.get('decision','UNKNOWN')
        findings.extend(s.get('findings', []))
        for k,v in s.get('category_scores', {}).items(): scores.setdefault(k, []).append(float(v))
    avg={k: round(sum(v)/len(v),2) for k,v in scores.items() if v}
    summary={'run_id': args.run_id, 'generated_at': now_iso(), 'decision': decision, 'severity_totals': totals, 'category_health_scores': avg, 'finding_count': len(findings), 'findings': findings}
    ensure_json(run_dir/'run_summary.json', summary)
    ensure_json(paths.audits_root/'latest_run.json', summary)
    print(json.dumps(summary, indent=2))

def main():
    parser=argparse.ArgumentParser(); sub=parser.add_subparsers(dest='cmd', required=True)
    p1=sub.add_parser('init'); p1.add_argument('--repo-root', default='.'); p1.add_argument('--run-id'); p1.add_argument('--prefix'); p1.set_defaults(func=cmd_init)
    p2=sub.add_parser('finalize'); p2.add_argument('--repo-root', default='.'); p2.add_argument('--run-id', required=True); p2.set_defaults(func=cmd_finalize)
    args=parser.parse_args(); args.func(args)
if __name__=='__main__': main()
