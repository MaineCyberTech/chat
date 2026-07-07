import json
d = json.load(open("docs/audits/latest_run.json"))
p1s = [f for f in d["findings"] if f["severity"] == "P1"]
print(f"Total P1: {len(p1s)}\n")
for i, f in enumerate(p1s, 1):
    print(f"{i}. [{f.get('domain','?')}] {f.get('issue','?')[:120]}")
    print(f"   File: {f.get('file','?')}")
    print()
