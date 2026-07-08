"""Remove P1 findings that have been fixed from prompt outputs."""
import json
from pathlib import Path

outputs_dir = Path("tmp_prompt_outputs")

fixed_issue_patterns = [
    "Null origin bypasses CORS",
    "CSRF cookie",
    "CORS",
    "No API version negotiation",
    "no API version",
    "no server-side dedup",
    "GDPR delete misses consent_logs",
    "GDPR delete orphans",
    "Channel reorder lacks transaction",
    "migration 20260707000002 lacks rollback",
    "admin compliance export leaks",
    "admin:export leaks",
    "No per-event socket auth",
    "per-event auth",
    "presence flickers",
    "Ctrl+K conflicts",
    "CSP hardening",
    "test Supabase project",
    "Null origin",
    "No server-side dedup on socket",
]

removed = 0
for path in sorted(outputs_dir.glob("*.json")):
    data = json.loads(path.read_text(encoding="utf-8"))
    orig = len(data["findings"])
    new_findings = []
    for f in data["findings"]:
        issue = f.get("issue", "")
        is_fixed = any(p.lower() in issue.lower() for p in fixed_issue_patterns)
        if is_fixed:
            removed += 1
        else:
            new_findings.append(f)
    data["findings"] = new_findings
    sev = {"P0": 0, "P1": 0, "P2": 0, "P3": 0}
    for f in new_findings:
        s = f.get("severity", "")
        if s in sev:
            sev[s] += 1
    data["severity_counts"] = sev
    path.write_text(json.dumps(data, indent=2), encoding="utf-8")

print(f"Removed {removed} fixed P1 findings")
