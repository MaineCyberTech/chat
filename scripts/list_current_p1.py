"""List current P1 findings from latest audit."""
import json
d = json.load(open("docs/audits/latest_run.json"))
p1 = [f for f in d["findings"] if f["severity"] == "P1"]
print(f"Found {len(p1)} P1 findings\n")
for i, f in enumerate(p1, 1):
    print(f"{i}. [{f.get('domain','?')}] {f.get('issue','?')}")
    print(f"   File: {f.get('file','?')}")
    print(f"   Fix: {f.get('fix','?')[:150]}")
    print()
