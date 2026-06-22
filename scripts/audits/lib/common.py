from dataclasses import dataclass
from pathlib import Path
import json

@dataclass
class Paths:
    repo_root: Path

    @property
    def audits_root(self) -> Path:
        return self.repo_root / 'docs' / 'audits'


def load_json(path: Path):
    return json.loads(path.read_text(encoding='utf-8'))
