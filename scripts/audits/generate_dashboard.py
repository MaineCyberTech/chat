import argparse, sys
from pathlib import Path
import matplotlib.pyplot as plt
import numpy as np
SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path: sys.path.insert(0, str(SCRIPT_DIR))
from lib.common import Paths, load_json, latest_run_dirs, DECISION_ORDER

def load_runs(paths):
    runs=[]
    for d in latest_run_dirs(paths.runs_root):
        s=d/'run_summary.json'
        if s.exists(): runs.append(load_json(s))
    return runs

def main():
    parser=argparse.ArgumentParser(); parser.add_argument('--repo-root', default='.'); args=parser.parse_args(); paths=Paths(Path(args.repo_root).resolve()); paths.dashboard_root.mkdir(parents=True, exist_ok=True)
    runs=load_runs(paths)
    if not runs: raise SystemExit(0)
    labels=[r['run_id'] for r in runs]; p0=[r.get('severity_totals',{}).get('P0',0) for r in runs]; p1=[r.get('severity_totals',{}).get('P1',0) for r in runs]; p2=[r.get('severity_totals',{}).get('P2',0) for r in runs]; p3=[r.get('severity_totals',{}).get('P3',0) for r in runs]; ds=[DECISION_ORDER.get(r.get('decision','UNKNOWN'),-1) for r in runs]
    fig,ax=plt.subplots(figsize=(10,4),dpi=150); ax.plot(labels,p0,marker='o',label='P0'); ax.plot(labels,p1,marker='o',label='P1'); ax.legend(); ax.set_title('P0 / P1 Trends Over Time'); ax.tick_params(axis='x',rotation=30); fig.tight_layout(); fig.savefig(paths.dashboard_root/'p0_p1_trends.png'); plt.close(fig)
    fig,ax=plt.subplots(figsize=(10,4),dpi=150); ax.plot(labels,ds,marker='o'); ax.set_title('Decision History'); ax.set_yticks([0,1,2]); ax.set_yticklabels(['NO-GO','GO WITH RISKS','GO']); ax.tick_params(axis='x',rotation=30); fig.tight_layout(); fig.savefig(paths.dashboard_root/'decision_history.png'); plt.close(fig)
    x=np.arange(len(labels)); fig,ax=plt.subplots(figsize=(10,4.5),dpi=150); ax.bar(x,p0,label='P0'); ax.bar(x,p1,bottom=p0,label='P1'); b2=np.array(p0)+np.array(p1); ax.bar(x,p2,bottom=b2,label='P2'); ax.bar(x,p3,bottom=b2+np.array(p2),label='P3'); ax.set_xticks(x); ax.set_xticklabels(labels,rotation=30,ha='right'); ax.legend(); ax.set_title('Stacked Severity Bars'); fig.tight_layout(); fig.savefig(paths.dashboard_root/'severity_stacked_bars.png'); plt.close(fig)
    cats=sorted({k for r in runs for k in r.get('category_health_scores',{}).keys()})
    if cats:
        fig,ax=plt.subplots(figsize=(12,5),dpi=150)
        for cat in cats: ax.plot(labels,[r.get('category_health_scores',{}).get(cat,np.nan) for r in runs],marker='o',label=cat)
        ax.set_ylim(0,100); ax.set_title('Category Health Trend Lines'); ax.tick_params(axis='x',rotation=30); ax.legend(fontsize=7); fig.tight_layout(); fig.savefig(paths.dashboard_root/'category_health_trends.png'); plt.close(fig)
    latest=runs[-1]; scores=latest.get('category_health_scores',{}); avg=round(sum(scores.values())/len(scores),2) if scores else 0.0
    fig,ax=plt.subplots(figsize=(10,4),dpi=150); ax.barh(['Average Readiness'], [avg]); ax.set_xlim(0,100); ax.set_title('Release Readiness Scorecard (Latest Run)'); fig.tight_layout(); fig.savefig(paths.dashboard_root/'release_readiness_scorecard.png'); plt.close(fig)
    if scores:
        fig,ax=plt.subplots(figsize=(10,4),dpi=150); k=list(scores.keys()); v=list(scores.values()); ax.bar(k,v); ax.set_ylim(0,100); ax.set_title('Latest Run Category Health Scores'); fig.tight_layout(); fig.savefig(paths.dashboard_root/'category_health_scores.png'); plt.close(fig)
    prev=runs[-2] if len(runs)>1 else None; latest=runs[-1]; sev=latest.get('severity_totals',{})
    lines=['# Audit Dashboard','','## Current Release Posture','',f"- Latest run: **{latest['run_id']}**",f"- Latest decision: **{latest.get('decision','UNKNOWN')}**",f"- Latest severity totals: P0={sev.get('P0',0)}, P1={sev.get('P1',0)}, P2={sev.get('P2',0)}, P3={sev.get('P3',0)}",'','## Risk Trend Callouts','']
    if prev:
        psev=prev.get('severity_totals',{})
        lines.append(f"- P0 delta vs previous run: {sev.get('P0',0)-psev.get('P0',0):+d}")
        lines.append(f"- P1 delta vs previous run: {sev.get('P1',0)-psev.get('P1',0):+d}")
    else: lines.append('- No previous run is available yet for trend deltas.')
    lines += ['','## Last 5 Audit Runs','','| Run ID | Decision | P0 | P1 | P2 | P3 |','|---|---|---:|---:|---:|---:|']
    for r in runs[-5:]:
        s=r.get('severity_totals',{})
        lines.append(f"| {r['run_id']} | {r.get('decision','UNKNOWN')} | {s.get('P0',0)} | {s.get('P1',0)} | {s.get('P2',0)} | {s.get('P3',0)} |")
    counts={}
    for r in runs:
        for f in r.get('findings',[]): counts[f.get('category','UNKNOWN')]=counts.get(f.get('category','UNKNOWN'),0)+1
    top=sorted(counts.items(), key=lambda kv:(-kv[1],kv[0]))[:5]
    lines += ['','## Top Recurring Categories','']
    if top:
        for cat,count in top: lines.append(f"- **{cat}** — {count} finding(s)")
    else: lines.append('- No findings recorded yet.')
    (paths.dashboard_root/'index.md').write_text('\n'.join(lines)+'\n', encoding='utf-8')
    print('dashboard generated')
if __name__=='__main__': main()
