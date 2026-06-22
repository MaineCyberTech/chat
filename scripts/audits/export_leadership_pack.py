import argparse, csv, json, sys
from pathlib import Path
SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path: sys.path.insert(0, str(SCRIPT_DIR))
from lib.common import Paths, load_json, latest_run_dirs

def load_runs(paths):
    runs=[]
    for d in latest_run_dirs(paths.runs_root):
        s=d/'run_summary.json'
        if s.exists(): runs.append(load_json(s))
    return runs

def main():
    parser=argparse.ArgumentParser(); parser.add_argument('--repo-root', default='.'); args=parser.parse_args(); paths=Paths(Path(args.repo_root).resolve()); runs=load_runs(paths); paths.exports_root.mkdir(parents=True, exist_ok=True)
    if not runs: raise SystemExit(0)
    with (paths.exports_root/'powerbi_audit_dataset.csv').open('w', newline='', encoding='utf-8') as f:
        w=csv.writer(f); w.writerow(['run_id','generated_at','decision','p0','p1','p2','p3','finding_count'])
        for r in runs:
            s=r.get('severity_totals',{})
            w.writerow([r.get('run_id',''), r.get('generated_at',''), r.get('decision','UNKNOWN'), s.get('P0',0), s.get('P1',0), s.get('P2',0), s.get('P3',0), r.get('finding_count',0)])
    (paths.exports_root/'audit_dataset.json').write_text(json.dumps({'runs': runs}, indent=2), encoding='utf-8')
    latest=runs[-1]; sev=latest.get('severity_totals',{}); scores=latest.get('category_health_scores',{}); readiness=round(sum(scores.values())/len(scores),2) if scores else 0.0
    rows=[]
    for r in runs[-10:]:
        s=r.get('severity_totals',{})
        rows.append('<tr><td>{}</td><td>{}</td><td>{}</td><td>{}</td><td>{}</td><td>{}</td></tr>'.format(r.get('run_id',''), r.get('decision','UNKNOWN'), s.get('P0',0), s.get('P1',0), s.get('P2',0), s.get('P3',0)))
    html_parts = [
        '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Leadership Audit Dashboard</title>',
        '<style>body{font-family:Segoe UI,Arial,sans-serif;margin:24px;color:#111}h1,h2{margin-bottom:8px}.card{border:1px solid #ddd;border-radius:12px;padding:16px;margin:12px 0}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f3f3f3}</style></head><body>',
        '<h1>Leadership Audit Dashboard</h1>',
        '<div class="card"><h2>Current Release Posture</h2>',
        f'<p><strong>Decision:</strong> {latest.get("decision","UNKNOWN")}</p>',
        f'<p><strong>Average Readiness:</strong> {readiness:.2f} / 100</p>',
        f'<p><strong>P0/P1:</strong> {sev.get("P0",0)} / {sev.get("P1",0)}</p></div>',
        '<div class="card"><h2>Last 10 Audit Runs</h2><table><tr><th>Run ID</th><th>Decision</th><th>P0</th><th>P1</th><th>P2</th><th>P3</th></tr>',
        ''.join(rows),
        '</table></div><div class="card"><h2>Artifacts</h2><ul><li>Use <code>powerbi_audit_dataset.csv</code> for Power BI import.</li><li>Use <code>audit_dataset.json</code> for downstream integrations.</li></ul></div></body></html>'
    ]
    (paths.exports_root/'leadership_dashboard.html').write_text(''.join(html_parts), encoding='utf-8')
    print(paths.exports_root)
if __name__=='__main__': main()
