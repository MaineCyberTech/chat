import json, subprocess, sys
from datetime import datetime, timezone
from pathlib import Path

REPO = Path(r"C:\temp\chat")
OUTPUTS = REPO / "tmp_prompt_outputs"
INGEST = REPO / "scripts" / "prompts" / "ingest_output.py"
now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

output = {
    "prompt_name": "release_gate",
    "domain": "release_gate",
    "stage": "quality_confirmation",
    "decision": "NO-GO",
    "generated_at": now,
    "severity_counts": {"P0": 105, "P1": 192, "P2": 199, "P3": 124},
    "readiness": 44.06,
    "category_scores": {},
    "findings": [
        {"severity": "P0", "domain": "release_gate", "category": "p0_check", "file": "docs/audits/latest_run.json",
         "issue": "P0 count 105 far exceeds production policy maximum of 0",
         "impact": "Cannot release to production with 105 unresolved P0 issues",
         "fix": "Resolve all P0 findings. Priority: SECURITY DEFINER search_path, reaction routes middleware, search client swap, feature-flag routes, socket per-event auth."},
        {"severity": "P0", "domain": "release_gate", "category": "p1_check", "file": "docs/audits/latest_run.json",
         "issue": "P1 count 192 far exceeds production policy maximum of 0",
         "impact": "192 unresolved P1 issues represent major production risks",
         "fix": "Resolve all P1 findings before production release."},
        {"severity": "P0", "domain": "release_gate", "category": "readiness_check", "file": "docs/audits/latest_run.json",
         "issue": "Readiness score 44.06% is well below production policy minimum of 85%",
         "impact": "Platform not ready for production release",
         "fix": "Address infrastructure hardening, security fixes, and test coverage."},
        {"severity": "P0", "domain": "release_gate", "category": "decision_check", "file": "docs/audits/latest_run.json",
         "issue": "Overall decision is NO-GO — production gate requires GO",
         "impact": "All gate criteria must pass before production release",
         "fix": "Execute reconciled roadmap. Re-evaluate gate after each phase."}
    ],
    "gate_results": {
        "p0_check": "FAIL (105 exceeds max 0)",
        "p1_check": "FAIL (192 exceeds max 0)",
        "readiness_check": "FAIL (44.06% below min 85%)",
        "decision_check": "FAIL (NO-GO below required GO)",
        "branch_check": "SKIP (develop, not target for prod gate)"
    }
}

path = OUTPUTS / "release_gate.json"
path.write_text(json.dumps(output, indent=2), encoding="utf-8")
print(f"Written: {path.name} ({len(output['findings'])} findings)")

r = subprocess.run([sys.executable, str(INGEST), "--prompt-name", "release_gate", "--output-file", str(path)], capture_output=True, text=True, cwd=str(REPO))
if r.returncode == 0:
    parsed = json.loads(r.stdout)
    print(f"Ingested: OK (run_id={parsed['run_id']}, findings={parsed['finding_count']})")
else:
    print(f"Ingested: FAILED - {r.stderr.strip()}")
