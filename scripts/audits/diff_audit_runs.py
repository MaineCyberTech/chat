import argparse, sys
from pathlib import Path
SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path: sys.path.insert(0, str(SCRIPT_DIR))
from lib.common import Paths, load_json

def main():
    parser=argparse.ArgumentParser(); parser.add_argument('--repo-root', default='.'); parser.add_argument('--previous-run-id', required=True); parser.add_argument('--current-run-id', required=True); args=parser.parse_args()
    paths=Paths(Path(args.repo_root).resolve()); prev=load_json(paths.runs_root/args.previous_run_id/'run_summary.json'); curr=load_json(paths.runs_root/args.current_run_id/'run_summary.json')
    out=paths.runs_root/args.current_run_id/'diff_from_previous.md'
    lines=['# Audit Diff','', '| Severity | Delta |', '|---|---:|']
    for sev in ['P0','P1','P2','P3']:
        d=int(curr.get('severity_totals',{}).get(sev,0))-int(prev.get('severity_totals',{}).get(sev,0)); lines.append(f'| {sev} | {d:+d} |')
    out.write_text('\n'.join(lines)+'\n', encoding='utf-8'); print(out)
if __name__=='__main__': main()
