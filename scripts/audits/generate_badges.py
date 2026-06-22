import argparse
from pathlib import Path
import json

def badge(label, value, color):
    lw=max(40,8*len(label)+12); vw=max(40,8*len(value)+12); total=lw+vw
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{total}" height="20"><rect width="{lw}" height="20" fill="#555"/><rect x="{lw}" width="{vw}" height="20" fill="{color}"/><g fill="#fff" font-family="DejaVu Sans,Verdana" font-size="11" text-anchor="middle"><text x="{lw/2}" y="14">{label}</text><text x="{lw+vw/2}" y="14">{value}</text></g></svg>'
parser = argparse.ArgumentParser(); parser.add_argument('--repo-root', default='.'); args = parser.parse_args(); root = Path(args.repo_root).resolve(); summary = json.loads((root/'docs'/'audits'/'latest_run.json').read_text(encoding='utf-8'))
sev=summary.get('severity_totals',{}); scores=summary.get('category_health_scores',{}); readiness=round(sum(scores.values())/len(scores),2) if scores else 0.0; decision=summary.get('decision','UNKNOWN')
color={'GO':'#2ea44f','GO WITH RISKS':'#dbab09','NO-GO':'#cf222e'}.get(decision,'#6e7781'); out_dir=root/'docs'/'hardening_super_bundle'/'examples'/'dashboard'; out_dir.mkdir(parents=True, exist_ok=True)
(out_dir/'latest-decision.svg').write_text(badge('audit decision', decision, color), encoding='utf-8')
(out_dir/'p0-count.svg').write_text(badge('p0 count', str(sev.get('P0',0)), '#555' if sev.get('P0',0)==0 else '#cf222e'), encoding='utf-8')
(out_dir/'release-readiness.svg').write_text(badge('release readiness', f'{readiness:.2f}', '#2ea44f' if readiness>=85 else '#dbab09' if readiness>=70 else '#cf222e'), encoding='utf-8')
print(out_dir)
