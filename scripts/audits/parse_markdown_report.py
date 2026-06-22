import argparse, json, re, sys
from pathlib import Path
from datetime import datetime, timezone
SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path: sys.path.insert(0, str(SCRIPT_DIR))
from lib.common import Paths, STAGES, ensure_json, load_json

def parse_findings(text):
    findings=[]; counts={'P0':0,'P1':0,'P2':0,'P3':0}
    lines=text.splitlines()
    for i,line in enumerate(lines):
        if 'Finding ID' in line and 'Severity' in line and 'Category' in line:
            j=i+2
            while j < len(lines) and lines[j].strip().startswith('|'):
                cols=[c.strip() for c in lines[j].strip('|').split('|')]
                if len(cols)>=6:
                    f={'id':cols[0],'severity':cols[1],'category':cols[2],'description':cols[3],'status':cols[4],'release_impact':cols[5]}
                    findings.append(f)
                    if f['severity'] in counts: counts[f['severity']] += 1
                j += 1
    return counts, findings

def parse_decision(text):
    u=text.upper()
    if 'NO-GO' in u: return 'NO-GO'
    if 'GO WITH RISKS' in u: return 'GO WITH RISKS'
    if re.search(r'\bGO\b', u): return 'GO'
    return 'UNKNOWN'

def main():
    parser=argparse.ArgumentParser(); parser.add_argument('--repo-root', default='.'); parser.add_argument('--run-id', required=True); parser.add_argument('--stage', required=True); args=parser.parse_args()
    paths=Paths(Path(args.repo_root).resolve())
    stage_map={name:(report,summary) for name,report,summary in STAGES}
    report_file=paths.runs_root/args.run_id/'reports'/stage_map[args.stage][0]
    summary_file=paths.runs_root/args.run_id/'summaries'/stage_map[args.stage][1]
    text=report_file.read_text(encoding='utf-8')
    counts, findings = parse_findings(text)
    decision = parse_decision(text)
    base_score=max(0, 100-(counts['P0']*35 + counts['P1']*15 + counts['P2']*5 + counts['P3']))
    summary=load_json(summary_file) if summary_file.exists() else {}
    summary.update({'stage': args.stage, 'run_id': args.run_id, 'decision': decision, 'generated_at': datetime.now(timezone.utc).replace(microsecond=0).isoformat(), 'severity_counts': counts, 'category_scores': {args.stage: base_score}, 'findings': findings})
    ensure_json(summary_file, summary)
    print(json.dumps(summary, indent=2))
if __name__=='__main__': main()
