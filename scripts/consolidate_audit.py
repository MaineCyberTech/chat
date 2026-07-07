"""Consolidate all prompt outputs into merged stage summaries and finalize."""
import json
from pathlib import Path
from datetime import datetime, timezone

REPO_ROOT = Path(__file__).resolve().parent.parent
OUTPUTS_DIR = REPO_ROOT / "tmp_prompt_outputs"
RUNS_DIR = REPO_ROOT / "docs" / "audits" / "runs"
LATEST_RUN = REPO_ROOT / "docs" / "audits" / "latest_run.json"

STAGE_MAP = {
    "reconciliation": "01_reconciliation_summary.json",
    "principal_audit": "02_principal_audit_summary.json",
    "quality_confirmation": "03_quality_confirmation_summary.json",
    "frontend_release_gate": "04_frontend_release_gate_summary.json",
}

# Load all prompt outputs
all_outputs = []
for f in sorted(OUTPUTS_DIR.glob("*.json")):
    data = json.loads(f.read_text(encoding="utf-8"))
    all_outputs.append(data)
    print(f"  {f.stem}: {len(data['findings'])} findings, {data['decision']}, score {data.get('readiness', 0)}")

# Aggregate by stage
stage_data = {}
for output in all_outputs:
    stage = output["stage"]
    if stage not in stage_data:
        stage_data[stage] = {"findings": [], "scores": {}, "decisions": [], "domains": []}
    stage_data[stage]["findings"].extend(output["findings"])
    stage_data[stage]["scores"].update(output.get("category_scores", {}))
    stage_data[stage]["decisions"].append(output["decision"])
    stage_data[stage]["domains"].append(output["domain"])

# Create consolidated run
now = datetime.now(timezone.utc)
run_id = f"full_audit_consolidated_{now.strftime('%Y%m%d_%H%M%S')}"
run_dir = RUNS_DIR / run_id
summaries_dir = run_dir / "summaries"
reports_dir = run_dir / "reports"
summaries_dir.mkdir(parents=True, exist_ok=True)
reports_dir.mkdir(parents=True, exist_ok=True)

# Write run manifest
manifest = {
    "run_id": run_id,
    "created_at": now.strftime("%Y-%m-%dT%H:%M:%SZ"),
    "prompt_name": "full_audit_consolidated",
    "domain": "all",
    "status": "finalized",
}
(run_dir / "run_manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")

# Determine worst decision
decision_order = {"GO": 0, "GO WITH RISKS": 1, "NO-GO": 2, "UNKNOWN": 3}
worst_decision = "GO"
for stage_name, data in stage_data.items():
    for d in data["decisions"]:
        if decision_order.get(d, 0) > decision_order.get(worst_decision, 0):
            worst_decision = d

# Build severity totals
severity_totals = {"P0": 0, "P1": 0, "P2": 0, "P3": 0}
all_findings = []
total_findings = 0
for stage_name, data in stage_data.items():
    for f in data["findings"]:
        sev = f.get("severity", "")
        if sev in severity_totals:
            severity_totals[sev] += 1
        total_findings += 1
    all_findings.extend(data["findings"])

# Compute readiness
all_scores = {}
for data in stage_data.values():
    all_scores.update(data["scores"])
readiness = round(sum(all_scores.values()) / len(all_scores), 2) if all_scores else 0

# Write stage summaries
for stage_name, data in stage_data.items():
    summary_name = STAGE_MAP[stage_name]
    
    # Determine stage decision
    stage_decision = "GO"
    for d in data["decisions"]:
        if decision_order.get(d, 0) > decision_order.get(stage_decision, 0):
            stage_decision = d
    
    # Count severity for this stage
    sev_counts = {"P0": 0, "P1": 0, "P2": 0, "P3": 0}
    for f in data["findings"]:
        sev = f.get("severity", "")
        if sev in sev_counts:
            sev_counts[sev] += 1
    
    # Compute stage readiness
    stage_readiness = round(sum(data["scores"].values()) / len(data["scores"]), 2) if data["scores"] else 0
    
    summary = {
        "stage": stage_name,
        "run_id": run_id,
        "decision": stage_decision,
        "generated_at": now.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "severity_counts": sev_counts,
        "category_scores": data["scores"],
        "readiness": stage_readiness,
        "finding_count": len(data["findings"]),
        "findings": data["findings"],
    }
    (summaries_dir / summary_name).write_text(json.dumps(summary, indent=2), encoding="utf-8")
    
    domains_str = ", ".join(data["domains"])
    print(f"\n{stage_name}: {len(data['findings'])} findings, {stage_decision}, readiness={stage_readiness}")
    print(f"  Domains: {domains_str}")

# Write run summary
run_summary = {
    "run_id": run_id,
    "generated_at": now.strftime("%Y-%m-%dT%H:%M:%SZ"),
    "decision": worst_decision,
    "severity_totals": severity_totals,
    "category_health_scores": all_scores,
    "readiness": readiness,
    "finding_count": total_findings,
    "findings": all_findings,
}
(run_dir / "run_summary.json").write_text(json.dumps(run_summary, indent=2), encoding="utf-8")

# Write latest_run.json
LATEST_RUN.write_text(json.dumps(run_summary, indent=2), encoding="utf-8")

print(f"\n{'='*60}")
print(f"CONSOLIDATED AUDIT RESULTS")
print(f"{'='*60}")
print(f"Run ID: {run_id}")
print(f"Decision: {worst_decision}")
print(f"P0: {severity_totals['P0']}, P1: {severity_totals['P1']}, P2: {severity_totals['P2']}, P3: {severity_totals['P3']}")
print(f"Readiness: {readiness}%")
print(f"Total findings: {total_findings}")
print(f"{'='*60}")
