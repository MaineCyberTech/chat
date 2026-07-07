"""Check for missing .js extensions in relative imports."""
import re
from pathlib import Path

pattern = re.compile(r'^import .+ from "([^"]+)"')
missing = []

for f in sorted(Path("apps/api/src").rglob("*.ts")):
    if f.name.endswith(".d.ts"):
        continue
    content = f.read_text(encoding="utf-8")
    for i, line in enumerate(content.splitlines(), 1):
        m = pattern.match(line.strip())
        if m:
            import_path = m.group(1)
            if import_path.startswith(".") and not import_path.endswith(".js"):
                missing.append((f, i, line.strip()))

if missing:
    print(f"Found {len(missing)} missing .js extensions:")
    for f, i, line in missing:
        print(f"  {f}:{i}: {line}")
else:
    print("All imports have .js extensions - clean!")
