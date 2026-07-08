"""List P2/P3 findings that haven't been addressed yet."""
import json
from pathlib import Path

# Load the latest prompt outputs to find what's still open
outputs_dir = Path("tmp_prompt_outputs")
all_findings = []
for path in sorted(outputs_dir.glob("*.json")):
    data = json.loads(path.read_text(encoding="utf-8"))
    for f in data["findings"]:
        # Skip if this finding pattern has been fixed
        all_findings.append(f)

# Deduplicate by issue text
seen = set()
unique = []
for f in all_findings:
    key = f["issue"][:80]
    if key not in seen:
        seen.add(key)
        unique.append(f)

p2 = [f for f in unique if f["severity"] == "P2"]
p3 = [f for f in unique if f["severity"] == "P3"]

print(f"Total unique findings across all outputs: {len(unique)}")
print(f"P2: {len(p2)}, P3: {len(p3)}")
print()

print("=== P2 FINDINGS (first 20) ===")
for i, f in enumerate(p2[:20], 1):
    print(f"{i}. [{f.get('domain','?')}] {f['issue'][:120]}")
    print(f"   File: {f.get('file','?')}")
    print()
