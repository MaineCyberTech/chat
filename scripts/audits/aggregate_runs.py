"""
Aggregate all audit run summaries into a single latest_run.json for gate evaluation.
"""
import json, sys
from datetime import datetime, timezone
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent.parent
RUNS_DIR = REPO / "docs" / "audits" / "runs"
LATEST = REPO / "docs" / "audits" / "latest_run.json"

now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

# Collect all stage summaries from all runs
all_findings = []
all_decisions = []
all_scores = {}
summary_count = 0

import glob as g
for f in sorted(RUNS_DIR.glob("*/summaries/*_summary.json")):
    try:
        data = json.loads(f.read_text(encoding="utf-8"))
        findings = data.get("findings", [])
        all_findings.extend(findings)
        all_decisions.append(data.get("decision", "UNKNOWN"))
        scores = data.get("category_scores", {})
        all_scores.update(scores)
        summary_count += 1
    except Exception as e:
        print(f"  Skipping {f}: {e}", file=sys.stderr)

severity_counts = {"P0": 0, "P1": 0, "P2": 0, "P3": 0}
for f in all_findings:
    sev = f.get("severity", "")
    if sev in severity_counts:
        severity_counts[sev] += 1

# Compute overall readiness from category_scores
readiness = 0.0
if all_scores:
    readiness = round(sum(all_scores.values()) / len(all_scores), 2)

# Determine overall decision (worst wins)
severity_order = {"P0": 0, "P1": 1, "P2": 2, "P3": 3}
decision_rank = {"UNKNOWN": 0, "NO-GO": 1, "GO WITH RISKS": 2, "GO": 3}

overall_decision = "GO"
for d in all_decisions:
    if decision_rank.get(d, 0) < decision_rank.get(overall_decision, 3):
        overall_decision = d

combined = {
    "run_id": f"combined_audits_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}",
    "generated_at": now,
    "decision": overall_decision,
    "severity_totals": severity_counts,
    "category_health_scores": all_scores,
    "readiness": readiness,
    "finding_count": len(all_findings),
    "summaries_aggregated": summary_count,
    "findings": all_findings,
}

LATEST.write_text(json.dumps(combined, indent=2, default=str), encoding="utf-8")
print(f"Aggregated {summary_count} summaries -> {len(all_findings)} findings")
print(f"Severity: {severity_counts}")
print(f"Decision: {overall_decision}")
print(f"Readiness: {readiness}")
