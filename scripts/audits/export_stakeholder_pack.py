import argparse, sys
from pathlib import Path
from string import Template
SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path: sys.path.insert(0, str(SCRIPT_DIR))
from lib.common import Paths, load_json

def main():
    parser=argparse.ArgumentParser(); parser.add_argument('--repo-root', default='.'); parser.add_argument('--run-id', required=True); args=parser.parse_args(); paths=Paths(Path(args.repo_root).resolve())
    run_dir=paths.runs_root/args.run_id; summary=load_json(run_dir/'run_summary.json'); sev=summary.get('severity_totals',{}); decision=summary.get('decision','UNKNOWN')
    export_dir=run_dir/'stakeholder_export'; export_dir.mkdir(parents=True, exist_ok=True)
    overview=f"Audit run {args.run_id} completed with decision: {decision}."
    stakeholder_summary=f"The current repository posture is {decision}. Latest severity counts are P0={sev.get('P0',0)}, P1={sev.get('P1',0)}, P2={sev.get('P2',0)}, P3={sev.get('P3',0)}."
    top=[f for f in summary.get('findings',[]) if f.get('severity') in {'P0','P1'}][:8]
    risk_lines=[f"- {f.get('id','UNKNOWN')}: {f.get('description','')} ({f.get('severity','')})" for f in top] or ['- No material P0/P1 risks recorded.']
    next_steps='- Review the release candidate report.\n- Confirm ownership of remaining P1 risks.\n- Re-run the audit after any major remediation.'
    st=(paths.audits_root/'templates'/'sharepoint_release_brief.template.md').read_text(encoding='utf-8')
    et=(paths.audits_root/'templates'/'stakeholder_email_summary.template.md').read_text(encoding='utf-8')
    brief=Template(st).safe_substitute(overview=overview, decision=decision, run_id=args.run_id, generated_at=summary.get('generated_at',''), p0_count=sev.get('P0',0), p1_count=sev.get('P1',0), p2_count=sev.get('P2',0), p3_count=sev.get('P3',0), stakeholder_summary=stakeholder_summary, top_risks='\n'.join(risk_lines), next_steps=next_steps)
    email=Template(et).safe_substitute(release_candidate_id=f'RC-{args.run_id}', decision=decision, summary=stakeholder_summary, key_risks='\n'.join(risk_lines), recommended_action='Review the attached release certification materials and approve or request remediation.')
    (export_dir/'sharepoint_release_brief.md').write_text(brief, encoding='utf-8')
    (export_dir/'stakeholder_email_summary.md').write_text(email, encoding='utf-8')
    (export_dir/'stakeholder_index.md').write_text('# Stakeholder Export Pack\n\n- sharepoint_release_brief.md\n- stakeholder_email_summary.md\n- ../release_candidate_report.md\n', encoding='utf-8')
    print(export_dir)
if __name__=='__main__': main()
