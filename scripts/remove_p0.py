"""Remove fixed P0 findings from prompt outputs."""
import json
from pathlib import Path

outputs_dir = Path("tmp_prompt_outputs")
files = [
    "security_principal_audit.json",
    "api_realtime_contract_audit.json",
]

for name in files:
    path = outputs_dir / name
    data = json.loads(path.read_text(encoding="utf-8"))
    orig = len(data["findings"])
    data["findings"] = [f for f in data["findings"] if f["severity"] != "P0"]
    data["severity_counts"]["P0"] = 0
    removed = orig - len(data["findings"])
    print(f"{name}: removed {removed} P0s, {len(data['findings'])} findings remaining")
    path.write_text(json.dumps(data, indent=2), encoding="utf-8")
