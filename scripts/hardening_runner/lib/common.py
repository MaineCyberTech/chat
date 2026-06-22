from dataclasses import dataclass
from pathlib import Path
import json
from datetime import datetime, timezone

@dataclass
class Paths:
    repo_root: Path

    @property
    def runs_root(self):
        return self.repo_root / 'docs' / 'hardening_runs'

    @property
    def audits_root(self):
        return self.repo_root / 'docs' / 'audits'


def load_json(path: Path):
    return json.loads(path.read_text(encoding='utf-8'))


def ensure_json(path: Path, data):
    path.write_text(json.dumps(data, indent=2) + '\n', encoding='utf-8')


def now_iso():
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()
