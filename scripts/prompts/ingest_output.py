"""
Ingest AI prompt output into the audit pipeline.

Reads a JSON output file from any execution-mode prompt (conforming to
docs/prompts/_contracts/output_schema.json), creates a matching stage summary
in the audit run structure, and makes it available for run_audit_cycle.py.

Usage:
    python scripts/prompts/ingest_output.py \\
        --prompt-name security_principal_audit \\
        --output-file /tmp/output.json \\
        --run-id <optional, auto-generated if omitted>

Pipeline:
    ingest_output.py -> docs/audits/runs/<run_id>/summaries/<stage>_summary.json
                        -> run_audit_cycle.py finalize
                        -> docs/audits/latest_run.json
                        -> evaluate_gate.py, generate_dashboard.py, etc.
"""

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parent.parent

sys.path.insert(0, str(REPO_ROOT / 'scripts' / 'audits'))
from lib.common import Paths, ensure_json, now_iso

SCHEMA_PATH = REPO_ROOT / 'docs' / 'prompts' / '_contracts' / 'output_schema.json'


STAGE_MAP = {
    'reconciliation': ('01_reconciliation_report.md', '01_reconciliation_summary.json'),
    'principal_audit': ('02_principal_audit_report.md', '02_principal_audit_summary.json'),
    'quality_confirmation': ('03_quality_confirmation_report.md', '03_quality_confirmation_summary.json'),
    'frontend_release_gate': ('04_frontend_release_gate_report.md', '04_frontend_release_gate_summary.json'),
}


def build_run_id(prompt_name: str) -> str:
    ts = datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')
    return f'{prompt_name}_{ts}'


def validate_output(data: dict) -> None:
    required = ['prompt_name', 'domain', 'stage', 'decision', 'generated_at', 'severity_counts', 'findings']
    for field in required:
        if field not in data:
            raise ValueError(f'Missing required field: {field}')
    if data['stage'] not in STAGE_MAP:
        raise ValueError(f"Unknown stage '{data['stage']}'. Must be one of: {list(STAGE_MAP.keys())}")
    for sev in ['P0', 'P1', 'P2', 'P3']:
        if sev not in data.get('severity_counts', {}):
            raise ValueError(f'Missing severity count: {sev}')

    # Validate against canonical schema if available
    if SCHEMA_PATH.exists():
        try:
            schema = json.loads(SCHEMA_PATH.read_text(encoding='utf-8'))
            schema_props = schema.get('properties', {})
            schema_required = schema.get('required', [])

            # Check all schema-required fields
            for field in schema_required:
                if field not in data:
                    raise ValueError(f'Schema violation: missing required field "{field}" from output_schema.json')

            # Validate types for known properties
            type_map = {
                'prompt_name': str, 'domain': str, 'stage': str, 'decision': str, 'generated_at': str,
                'readiness': (int, float),
                'severity_counts': dict, 'category_scores': dict, 'findings': list,
            }
            for field, expected_type in type_map.items():
                if field in data and data[field] is not None and not isinstance(data[field], expected_type):
                    raise ValueError(f"Schema violation: field '{field}' should be {expected_type.__name__}, got {type(data[field]).__name__}")

            # Validate severity counts structure
            sc = data.get('severity_counts', {})
            for sev in ['P0', 'P1', 'P2', 'P3']:
                count = sc.get(sev, 0)
                if not isinstance(count, int) or count < 0:
                    raise ValueError(f"Schema violation: severity_counts.{sev} must be a non-negative integer")

            # Validate each finding
            for i, f in enumerate(data.get('findings', [])):
                for field in ['severity', 'domain', 'category', 'file', 'issue', 'impact', 'fix']:
                    if field not in f:
                        raise ValueError(f"Schema violation: findings[{i}] missing required field '{field}'")
                if f.get('severity') not in ('P0', 'P1', 'P2', 'P3'):
                    raise ValueError(f"Schema violation: findings[{i}].severity must be P0/P1/P2/P3")

        except ValueError:
            raise
        except Exception as e:
            print(f'Warning: schema validation skipped ({e})', file=sys.stderr)


def to_stage_summary(data: dict) -> dict:
    """Convert prompt output JSON to a stage summary compatible with run_audit_cycle.py finalize."""
    scores = data.get('category_scores', {})
    readiness = data.get('readiness', round(sum(scores.values()) / len(scores), 2) if scores else 0.0)

    return {
        'stage': data['stage'],
        'prompt_name': data['prompt_name'],
        'decision': data['decision'],
        'generated_at': data['generated_at'],
        'severity_counts': {
            'P0': int(data['severity_counts'].get('P0', 0)),
            'P1': int(data['severity_counts'].get('P1', 0)),
            'P2': int(data['severity_counts'].get('P2', 0)),
            'P3': int(data['severity_counts'].get('P3', 0)),
        },
        'category_scores': scores,
        'readiness': readiness,
        'findings': data.get('findings', []),
    }


def main():
    parser = argparse.ArgumentParser(description='Ingest prompt output into audit pipeline')
    parser.add_argument('--prompt-name', required=True, help='Name of the prompt (e.g. security_principal_audit)')
    parser.add_argument('--output-file', required=True, help='Path to the prompt output JSON file')
    parser.add_argument('--run-id', help='Audit run ID (auto-generated if omitted)')
    parser.add_argument('--repo-root', default='.', help='Repository root path')
    parser.add_argument('--validate-schema', action=argparse.BooleanOptionalAction, default=True,
                        help='Validate against output_schema.json (default: enabled)')
    args = parser.parse_args()

    # Read and validate output
    output_path = Path(args.output_file).resolve()
    if not output_path.exists():
        print(f'Error: output file not found: {output_path}', file=sys.stderr)
        sys.exit(1)

    try:
        data = json.loads(output_path.read_text(encoding='utf-8'))
    except json.JSONDecodeError as e:
        print(f'Error: invalid JSON in output file: {e}', file=sys.stderr)
        sys.exit(1)

    try:
        validate_output(data)
    except ValueError as e:
        print(f'Error: output validation failed: {e}', file=sys.stderr)
        sys.exit(1)

    # Set up paths
    paths = Paths(Path(args.repo_root).resolve())
    run_id = args.run_id or build_run_id(args.prompt_name)

    # Create run directory if it doesn't exist
    run_dir = paths.runs_root / run_id
    summaries_dir = run_dir / 'summaries'
    reports_dir = run_dir / 'reports'
    summaries_dir.mkdir(parents=True, exist_ok=True)
    reports_dir.mkdir(parents=True, exist_ok=True)

    # Write run manifest if not exists
    manifest_path = run_dir / 'run_manifest.json'
    if not manifest_path.exists():
        ensure_json(manifest_path, {
            'run_id': run_id,
            'created_at': now_iso(),
            'prompt_name': args.prompt_name,
            'domain': data['domain'],
            'status': 'initialized',
        })

    # Write stage summary
    stage = data['stage']
    report_name, summary_name = STAGE_MAP[stage]
    summary = to_stage_summary(data)
    summary['run_id'] = run_id
    ensure_json(summaries_dir / summary_name, summary)

    # Write report markdown (derived from findings)
    report_lines = [
        f'# {stage.replace("_", " ").title()} Report',
        '',
        f'- Prompt: **{args.prompt_name}**',
        f'- Domain: **{data["domain"]}**',
        f'- Run ID: **{run_id}**',
        f'- Generated: **{data["generated_at"]}**',
        f'- Decision: **{data["decision"]}**',
        f'- P0: **{summary["severity_counts"]["P0"]}**, P1: **{summary["severity_counts"]["P1"]}**',
        f'- P2: **{summary["severity_counts"]["P2"]}**, P3: **{summary["severity_counts"]["P3"]}**',
        f'- Readiness: **{summary["readiness"]:.2f}**',
        '',
        '## Findings',
        '',
    ]
    for f in data.get('findings', []):
        report_lines.append(f'### {f["severity"]} — {f["issue"]}')
        report_lines.append(f'- **File:** `{f["file"]}`')
        report_lines.append(f'- **Category:** {f.get("category", "N/A")}')
        report_lines.append(f'- **Impact:** {f["impact"]}')
        report_lines.append(f'- **Fix:** {f["fix"]}')
        report_lines.append('')

    (reports_dir / report_name).write_text('\n'.join(report_lines), encoding='utf-8')

    print(json.dumps({
        'status': 'ok',
        'run_id': run_id,
        'stage': stage,
        'summary_path': str(summaries_dir / summary_name),
        'report_path': str(reports_dir / report_name),
        'finding_count': len(data.get('findings', [])),
    }, indent=2))


if __name__ == '__main__':
    main()
