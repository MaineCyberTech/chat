"""List P2 and P3 findings by domain."""
import json
from collections import Counter

d = json.load(open("docs/audits/latest_run.json"))
p2 = [f for f in d["findings"] if f["severity"] == "P2"]
p3 = [f for f in d["findings"] if f["severity"] == "P3"]

domains_p2 = Counter(f.get("domain", "?") for f in p2)
domains_p3 = Counter(f.get("domain", "?") for f in p3)

print("=== P2 BY DOMAIN ===")
for dom, count in domains_p2.most_common():
    print(f"  {dom}: {count}")

print("\n=== P3 BY DOMAIN ===")
for dom, count in domains_p3.most_common():
    print(f"  {dom}: {count}")

print("\n=== SAMPLE P2 FINDINGS ===")
for f in p2[:10]:
    print(f"  [{f.get('domain','?')}] {f['issue'][:120]}")
    print(f"    Fix: {f['fix'][:120]}")
    print()

print("\n=== SAMPLE P3 FINDINGS ===")
for f in p3[:10]:
    print(f"  [{f.get('domain','?')}] {f['issue'][:120]}")
    print(f"    Fix: {f['fix'][:120]}")
    print()
