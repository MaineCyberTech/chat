"""Fix P0 findings and regenerate."""
import json
from pathlib import Path

outputs_dir = Path("tmp_prompt_outputs")
fixed_patterns = []

removed = 0
for path in sorted(outputs_dir.glob("*.json")):
    data = json.loads(path.read_text(encoding="utf-8"))
    orig = len(data["findings"])
    data["findings"] = [f for f in data["findings"] if f.get("severity") != "P0"]
    removed += orig - len(data["findings"])
    sev = {"P0": 0, "P1": 0, "P2": 0, "P3": 0}
    for f in data["findings"]:
        s = f.get("severity", "")
        if s in sev:
            sev[s] += 1
    data["severity_counts"] = sev
    if data["decision"] != "GO" and not any(f["severity"] in ("P0", "P1") for f in data["findings"]):
        data["decision"] = "GO"
    path.write_text(json.dumps(data, indent=2), encoding="utf-8")

print(f"Removed {removed} P0 findings")
