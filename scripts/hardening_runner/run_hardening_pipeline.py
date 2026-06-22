import argparse, sys
from pathlib import Path
SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path: sys.path.insert(0, str(SCRIPT_DIR))
from lib.common import Paths, load_json, ensure_json, now_iso
PHASES = ['00_preflight','01_phase1_high_risk','02_phase2_release_confidence','03_phase3_resilience','04_phase4_governance','05_rc_checkpoint','06_prod_checkpoint','07_post_release_validation','incident_rollback']

def get_run(paths, run_id): return paths.runs_root / run_id

def cmd_init(args):
    paths = Paths(Path(args.repo_root).resolve())
    rd = get_run(paths, args.run_id)
    for phase in PHASES: (rd/phase).mkdir(parents=True, exist_ok=True)
    (rd/'executive_pack').mkdir(parents=True, exist_ok=True)
    ensure_json(rd/'run_manifest.json', {'run_id': args.run_id, 'created_at': now_iso(), 'status': 'initialized'})
    print(rd)

def cmd_execute(args):
    paths = Paths(Path(args.repo_root).resolve())
    rd = get_run(paths, args.run_id)
    summary = load_json(paths.audits_root/'latest_run.json')
    sev = summary.get('severity_totals', {}); scores = summary.get('category_health_scores', {}); readiness = round(sum(scores.values())/len(scores),2) if scores else 0.0; decision = summary.get('decision','UNKNOWN')
    for phase in PHASES:
        phase_decision = decision
        if phase == '05_rc_checkpoint' and (sev.get('P0',0)>0 or readiness<80): phase_decision = 'NO-GO'
        if phase == '06_prod_checkpoint' and (sev.get('P0',0)>0 or sev.get('P1',0)>0 or readiness<85 or decision!='GO'): phase_decision = 'NO-GO'
        ensure_json(rd/phase/'status.json', {'phase': phase, 'decision': phase_decision, 'severity_snapshot': sev, 'readiness': readiness, 'generated_at': now_iso()})
        (rd/phase/'checkpoint.md').write_text('\n'.join(['# Phase Checkpoint','',f'- Phase: **{phase}**',f'- Decision: **{phase_decision}**',f'- P0: **{sev.get("P0",0)}**',f'- P1: **{sev.get("P1",0)}**',f'- Readiness: **{readiness:.2f}**'])+'\n', encoding='utf-8')
    ensure_json(rd/'execution_summary.json', {'run_id': args.run_id, 'decision': decision, 'severity_snapshot': sev, 'readiness': readiness, 'executed_at': now_iso()})
    print(rd/'execution_summary.json')

def cmd_finalize(args):
    paths = Paths(Path(args.repo_root).resolve())
    rd = get_run(paths, args.run_id)
    phase_decisions = {}
    for phase in PHASES:
        sp = rd/phase/'status.json'
        if sp.exists(): phase_decisions[phase] = load_json(sp).get('decision','UNKNOWN')
    ensure_json(rd/'master_summary.json', {'run_id': args.run_id, 'finalized_at': now_iso(), 'phase_decisions': phase_decisions, 'phase_count': len(phase_decisions)})
    (rd/'phase_index.md').write_text('# Hardening Run Index\n\n' + '\n'.join([f'- **{k}** — {v}' for k,v in phase_decisions.items()]) + '\n', encoding='utf-8')
    manifest = load_json(rd/'run_manifest.json'); manifest['status']='finalized'; manifest['finalized_at']=now_iso(); ensure_json(rd/'run_manifest.json', manifest)
    print(rd/'master_summary.json')

def main():
    parser=argparse.ArgumentParser(); sub=parser.add_subparsers(dest='cmd', required=True)
    p1=sub.add_parser('init'); p1.add_argument('--repo-root', default='.'); p1.add_argument('--run-id', required=True); p1.set_defaults(func=cmd_init)
    p2=sub.add_parser('execute'); p2.add_argument('--repo-root', default='.'); p2.add_argument('--run-id', required=True); p2.set_defaults(func=cmd_execute)
    p3=sub.add_parser('finalize'); p3.add_argument('--repo-root', default='.'); p3.add_argument('--run-id', required=True); p3.set_defaults(func=cmd_finalize)
    args=parser.parse_args(); args.func(args)
if __name__=='__main__': main()
