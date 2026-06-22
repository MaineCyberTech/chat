import argparse
from pathlib import Path
import json
parser = argparse.ArgumentParser(); parser.add_argument('--repo-root', default='.'); parser.add_argument('--out', required=True); args = parser.parse_args()
root = Path(args.repo_root).resolve(); summary = json.loads((root / 'docs' / 'audits' / 'latest_run.json').read_text(encoding='utf-8'))
sev = summary.get('severity_totals', {}); scores = summary.get('category_health_scores', {}); readiness = round(sum(scores.values())/len(scores),2) if scores else 0.0
body = '\n'.join(['## Audit Status','',f"- Latest decision: **{summary.get('decision','UNKNOWN')}**",f"- Latest run: **{summary.get('run_id','UNKNOWN')}**",'', '### Release Readiness Snapshot','', f"- Average category health: **{readiness:.2f} / 100**", f"- Latest severity totals: P0={sev.get('P0',0)}, P1={sev.get('P1',0)}, P2={sev.get('P2',0)}, P3={sev.get('P3',0)}", ''])
out = Path(args.out); out = out if out.is_absolute() else root / out; out.parent.mkdir(parents=True, exist_ok=True); out.write_text(body, encoding='utf-8'); print(out)
