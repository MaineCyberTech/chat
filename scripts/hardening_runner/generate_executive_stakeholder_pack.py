import argparse, sys, csv
from pathlib import Path
SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path: sys.path.insert(0, str(SCRIPT_DIR))
from lib.common import Paths, load_json, ensure_json, now_iso

def main():
    parser=argparse.ArgumentParser(); parser.add_argument('--repo-root', default='.'); parser.add_argument('--run-id', required=True); args=parser.parse_args()
    paths = Paths(Path(args.repo_root).resolve()); rd = paths.runs_root/args.run_id; ep = rd/'executive_pack'; ep.mkdir(parents=True, exist_ok=True)
    summary = load_json(paths.audits_root/'latest_run.json'); sev=summary.get('severity_totals',{}); scores=summary.get('category_health_scores',{}); readiness=round(sum(scores.values())/len(scores),2) if scores else 0.0; decision=summary.get('decision','UNKNOWN')
    (ep/'release_certification_output.md').write_text('\n'.join(['# Release Certification Output','',f'- Run ID: **{args.run_id}**',f'- Decision: **{decision}**',f'- P0: **{sev.get("P0",0)}**',f'- P1: **{sev.get("P1",0)}**',f'- Readiness: **{readiness:.2f}**','', '## Recommended Action','', 'Proceed only if policy thresholds are satisfied and sign-offs are complete.'])+'\n', encoding='utf-8')
    (ep/'management_summary.md').write_text('\n'.join(['# Management Summary','',f'- Current decision: **{decision}**',f'- P0 / P1 snapshot: **{sev.get("P0",0)} / {sev.get("P1",0)}**',f'- Readiness score: **{readiness:.2f}**','', '## Top Risks','', '- Review P0/P1 findings before approving promotion.','- Review rollback readiness and branch eligibility.'])+'\n', encoding='utf-8')
    (ep/'stakeholder_brief.md').write_text('\n'.join(['# Stakeholder Brief','',f'- Release posture: **{decision}**',f'- Current run: **{args.run_id}**','', '## Business Impact Summary','', 'This package summarizes current hardening posture and whether the release should proceed.'])+'\n', encoding='utf-8')
    (ep/'decision_package.md').write_text('\n'.join(['# Decision Package','',f'- Decision: **{decision}**',f'- Readiness: **{readiness:.2f}**',f'- P0: **{sev.get("P0",0)}**, P1: **{sev.get("P1",0)}**','', '## Decision Notes','', 'Use this package for non-engineering review and sign-off discussion.'])+'\n', encoding='utf-8')
    (ep/'audit_dashboard.md').write_text('\n'.join(['# Executive Audit Dashboard','',f'- Current decision: **{decision}**',f'- Readiness score: **{readiness:.2f}**',f'- P0 / P1 / P2 / P3: **{sev.get("P0",0)} / {sev.get("P1",0)} / {sev.get("P2",0)} / {sev.get("P3",0)}**','', '## Management Callouts','', '- Validate whether policy thresholds are satisfied.','- Confirm rollback readiness before final approval.'])+'\n', encoding='utf-8')
    html = ''.join(['<!DOCTYPE html><html><head><meta charset="utf-8"><title>Executive Audit Dashboard</title>','<style>body{font-family:Segoe UI,Arial,sans-serif;margin:24px;color:#111}.card{border:1px solid #ddd;border-radius:12px;padding:16px;margin:12px 0}</style></head><body>','<h1>Executive Audit Dashboard</h1>','<div class="card"><h2>Current Posture</h2>',f'<p><strong>Decision:</strong> {decision}</p>',f'<p><strong>Readiness:</strong> {readiness:.2f}</p>',f'<p><strong>P0/P1:</strong> {sev.get("P0",0)} / {sev.get("P1",0)}</p></div>','<div class="card"><h2>Recommended Action</h2><p>Proceed only if gate and sign-off requirements are satisfied.</p></div>','</body></html>'])
    (ep/'executive_dashboard.html').write_text(html, encoding='utf-8')
    with (ep/'powerbi_dataset.csv').open('w', newline='', encoding='utf-8') as f:
        writer=csv.writer(f); writer.writerow(['run_id','decision','readiness','p0','p1','p2','p3']); writer.writerow([args.run_id,decision,readiness,sev.get('P0',0),sev.get('P1',0),sev.get('P2',0),sev.get('P3',0)])
    ensure_json(ep/'executive_summary.json', {'run_id': args.run_id, 'generated_at': now_iso(), 'decision': decision, 'readiness': readiness, 'severity_snapshot': sev})
    print(ep)
if __name__=='__main__': main()
