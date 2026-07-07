import json
d = json.load(open("docs/audits/latest_run.json"))
p1 = [f for f in d["findings"] if f["severity"] == "P1"]
p2 = [f for f in d["findings"] if f["severity"] == "P2"]
p3 = [f for f in d["findings"] if f["severity"] == "P3"]

print(f"=== REMAINING FINDINGS ===")
print(f"P1: {len(p1)}, P2: {len(p2)}, P3: {len(p3)}, Total: {len(d['findings'])}")
print()

if p1:
    print("--- P1 FINDINGS ---")
    for i, f in enumerate(p1, 1):
        print(f"{i}. [{f['domain']}] {f['issue'][:120]}")
        print(f"   Fix: {f['fix'][:120]}")
        print()

print(f"--- AREAS WITH LOWEST SCORES ---")
scores = d["category_health_scores"]
sorted_scores = sorted(scores.items(), key=lambda x: x[1])
for cat, score in sorted_scores[:15]:
    print(f"  {cat}: {score}")
