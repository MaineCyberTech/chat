import argparse, sys
from pathlib import Path
from string import Template
SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path: sys.path.insert(0, str(SCRIPT_DIR))
from lib.common import Paths, load_json

def main():
    parser=argparse.ArgumentParser(); parser.add_argument('--repo-root', default='.'); parser.add_argument('--run-id', required=True); args=parser.parse_args(); paths=Paths(Path(args.repo_root).resolve())
    summary=load_json(paths.runs_root/args.run_id/'run_summary.json'); sev=summary.get('severity_totals',{})
    template=(paths.audits_root/'templates'/'release_candidate_report.template.md').read_text(encoding='utf-8')
    executive={'GO':'The latest audit run indicates the repository is fit to advance without blocking issues.','GO WITH RISKS':'The latest audit run indicates the repository may advance with caution; known risks remain.','NO-GO':'The latest audit run indicates blocking issues remain and release progression should pause.'}.get(summary.get('decision','UNKNOWN'),'Decision unknown.')
    eng=f"Severity totals: P0={sev.get('P0',0)}, P1={sev.get('P1',0)}, P2={sev.get('P2',0)}, P3={sev.get('P3',0)}. Total findings recorded: {summary.get('finding_count',0)}."
    risks=['| ID | Severity | Category | Description | Status | Release Impact |','|---|---|---|---|---|---|']
    top=[f for f in summary.get('findings',[]) if f.get('severity') in {'P0','P1'}][:12]
    if not top: risks.append('| None | None | None | No material P0/P1 risks recorded. | N/A | Low |')
    else:
        for f in top: risks.append(f"| {f.get('id','UNKNOWN')} | {f.get('severity','')} | {f.get('category','')} | {f.get('description','')} | {f.get('status','')} | {f.get('release_impact','')} |")
    rendered=Template(template).safe_substitute(executive_summary=executive, engineering_summary=eng, risk_register='\n'.join(risks), release_candidate_id=f'RC-{args.run_id}', run_id=args.run_id, generated_at=summary.get('generated_at',''), decision=summary.get('decision','UNKNOWN'), p0_count=sev.get('P0',0), p1_count=sev.get('P1',0), p2_count=sev.get('P2',0), p3_count=sev.get('P3',0), release_readiness_summary='See dashboard.', next_actions='Resolve blocking risks and rerun the audit.')
    out=paths.runs_root/args.run_id/'release_candidate_report.md'; out.write_text(rendered, encoding='utf-8'); print(out)
if __name__=='__main__': main()
