"""Check what's left from the comparative audit patch sets."""
import json
from pathlib import Path

# Check all prompt outputs for high-severity items
outputs_dir = Path("tmp_prompt_outputs")
findings = []
for path in sorted(outputs_dir.glob("*.json")):
    data = json.loads(path.read_text(encoding="utf-8"))
    for f in data["findings"]:
        findings.append(f)

# Group by severity
p0 = [f for f in findings if f["severity"] == "P0"]
p1 = [f for f in findings if f["severity"] == "P1"]

print("=== REMAINING P0 FINDINGS ===")
for f in p0:
    print(f"  [{f.get('domain','?')}] {f['issue'][:120]}")

print(f"\n=== REMAINING P1 FINDINGS ({len(p1)}) ===")
for f in p1:
    print(f"  [{f.get('domain','?')}] {f['issue'][:120]}")

print("\n=== REMAINING PATCH SETS FROM AUDIT ===")
print("""
From Phase 6-7, the remaining patch groups are:
1. Emoji expansion (already done ✅)
2. DM multi-select modal (need to check)
3. Channel context menu (need to check)
4. Category management (need to check)
5. MessageList split completion (already done ✅)
6. Resizable sidebar (need to check)
7. Global notification settings (already done ✅)
""")
