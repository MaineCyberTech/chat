from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
import json

STAGES = [
    {"name": "reconciliation", "prompt_path": "docs/prompts/platform/audits/final_reconciliation_repo_audit_prompt.md", "report_filename": "01_reconciliation_report.md", "summary_filename": "01_reconciliation_summary.json"},
    {"name": "principal_audit", "prompt_path": "docs/prompts/platform/audits/final_reconciliation_principal_audit_prompt.md", "report_filename": "02_principal_audit_report.md", "summary_filename": "02_principal_audit_summary.json"},
    {"name": "quality_confirmation", "prompt_path": "docs/prompts/platform/audits/final_full_repo_deep_dive_quality_confirmation_prompt.md", "report_filename": "03_quality_confirmation_report.md", "summary_filename": "03_quality_confirmation_summary.json"},
    {"name": "frontend_release_gate", "prompt_path": "docs/prompts/uxui/audits/frontend_ux_release_gate_principal_audit_prompt.md", "report_filename": "04_frontend_release_gate_report.md", "summary_filename": "04_frontend_release_gate_summary.json"},
]

DECISION_ORDER = {"GO": 2, "GO WITH RISKS": 1, "NO-GO": 0, "UNKNOWN": -1}

SYSTEM_CATEGORIES = [
    "A Monorepo Workspace Package Governance",
    "B TypeScript Build Import Integrity",
    "C Frontend Backend Database Contract Alignment",
    "D Authentication Authorization Security Surface",
    "E Environment Domain Consistency",
    "F API Realtime Socket Correctness",
    "G Frontend Routing UX State Provider Integrity",
    "H UXUI Design Quality",
    "I Accessibility Readiness",
    "J Responsive Readiness",
    "K Quality Tooling Test Validation Infrastructure",
    "L CICD GitHub Environments Release Automation",
    "M Docker Traefik Runtime Orchestration",
    "N Terraform Cloud-Init Host Provisioning",
    "O Documentation Runbooks Contributor Guidance",
    "P Dead Files Duplicate Systems Stale Artifacts",
]

FRONTEND_CATEGORIES = [
    "F1 Design System Integrity",
    "F2 Layout and Navigation",
    "F3 Chat UX",
    "F4 State Management and Data Flow",
    "F5 Accessibility",
    "F6 Responsive Design",
    "F7 Performance",
    "F8 Interaction Quality",
    "F9 Visual Consistency",
    "F10 Component Architecture",
]

CATEGORY_MAP = {
    "reconciliation": SYSTEM_CATEGORIES,
    "principal_audit": SYSTEM_CATEGORIES,
    "quality_confirmation": SYSTEM_CATEGORIES,
    "frontend_release_gate": FRONTEND_CATEGORIES,
}

READINESS_GROUPS = {
    "Repo Integrity": ["A Monorepo Workspace Package Governance", "B TypeScript Build Import Integrity"],
    "Contract Integrity": ["C Frontend Backend Database Contract Alignment", "F API Realtime Socket Correctness"],
    "Security and Environment": ["D Authentication Authorization Security Surface", "E Environment Domain Consistency"],
    "Frontend and UX": ["G Frontend Routing UX State Provider Integrity", "H UXUI Design Quality", "I Accessibility Readiness", "J Responsive Readiness"],
    "Tooling and Delivery": ["K Quality Tooling Test Validation Infrastructure", "L CICD GitHub Environments Release Automation", "M Docker Traefik Runtime Orchestration", "N Terraform Cloud-Init Host Provisioning"],
    "Docs and Cleanup": ["O Documentation Runbooks Contributor Guidance", "P Dead Files Duplicate Systems Stale Artifacts"],
}

@dataclass
class Paths:
    repo_root: Path
    @property
    def audits_root(self) -> Path:
        return self.repo_root / 'docs' / 'audits'
    @property
    def runs_root(self) -> Path:
        return self.audits_root / 'runs'
    @property
    def dashboard_root(self) -> Path:
        return self.audits_root / 'dashboard'

def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()

def ensure_json(path: Path, data: dict) -> None:
    path.write_text(json.dumps(data, indent=2) + '\n', encoding='utf-8')

def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding='utf-8'))

def latest_run_dirs(runs_root: Path):
    return sorted([p for p in runs_root.iterdir() if p.is_dir()], key=lambda p: p.name)

def decision_rank(decision: str) -> int:
    return DECISION_ORDER.get(decision, -1)
