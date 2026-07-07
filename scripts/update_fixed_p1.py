"""Remove fixed P1 findings from prompt outputs."""
import json
from pathlib import Path

# P1 issue patterns that have been fixed
fixed_patterns = [
    "Feature flags service uses admin client",
    "User groups API missing workspace membership",
    "Full page reload on DM",
    "Full page reload on channel",
    "full page reload",
    "window.location.href",
    "Duplicate user_groups table creation",
    "Truncated DROP POLICY statements in rollback",
    "Truncated function signature in DROP FUNCTION",
    "No ARIA live region",
    "Empty catch blocks with silent failures",
    "All admin endpoints use only authenticate middleware",
    "Dockerfile.dev built with same tags",
    "Mobile bottom navigation bar fixed at bottom",
    "channel_member_history INSERT policy",
    "Empty catch blocks",
    "LiveKit API keys read directly from process.env",
    "VAPID keys and SMTP credentials read from process.env",
    "Production deployment workflow lacks mandatory manual approval",
    "No incident response runbook",
    "Data retention worker does not process consent_logs",
    "Cookie consent stored only in localStorage",
    "Webhook secret stored in plaintext",
    "Dual response format",
    "Inconsistent success response shapes",
    "Idempotency only implemented for message creation",
    "Workspace membership middleware",
    "BullMQ queues require Redis and have no fallback",
    "No alerting mechanism configured",
    "Reactions (add/remove) do not broadcast via Socket.io",
    "Channel mutations (create, update, delete, member add/remove) do not broadcast via Socket.io",
    "Majority of E2E test scenarios are skipped",
    "CI E2E job has no Supabase local instance",
    "Raw CSS variables used inline instead of Tailwind classes",
]

outputs_dir = Path("tmp_prompt_outputs")
removed_total = 0

for path in sorted(outputs_dir.glob("*.json")):
    data = json.loads(path.read_text(encoding="utf-8"))
    orig = len(data["findings"])
    new_findings = []
    for f in data["findings"]:
        issue = f.get("issue", "")
        is_fixed = any(pattern.lower() in issue.lower() for pattern in fixed_patterns)
        if is_fixed:
            removed_total += 1
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
    if orig - len(new_findings) > 0:
        print(f"{path.stem}: removed {orig - len(new_findings)} fixed, {len(new_findings)} remaining")

print(f"\nTotal removed: {removed_total}")
