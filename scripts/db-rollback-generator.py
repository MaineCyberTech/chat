#!/usr/bin/env python3
"""Rollback script generator for Supabase migrations.

Scans supabase/migrations/ for all SQL migration files and generates
corresponding down (rollback) SQL files in supabase/rollback/.

Usage:
    python scripts/db-rollback-generator.py
    python scripts/db-rollback-generator.py --dry-run
"""

import argparse
import os
import re
import sys

MIGRATIONS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "supabase", "migrations")
ROLLBACK_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "supabase", "rollback")

REVERSAL_MAP = [
    (re.compile(r'CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\S+)', re.IGNORECASE),
     lambda m: f"DROP TABLE IF EXISTS {m.group(1)} CASCADE;"),

    (re.compile(r'CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?(\S+)', re.IGNORECASE),
     lambda m: f"DROP INDEX IF EXISTS {m.group(1)};"),

    (re.compile(r'CREATE\s+TRIGGER\s+(\S+)', re.IGNORECASE),
     lambda m: f"DROP TRIGGER IF EXISTS {m.group(1)};"),

    (re.compile(r'CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+(\S+)', re.IGNORECASE),
     lambda m: f"DROP FUNCTION IF EXISTS {m.group(1)};"),

    (re.compile(r'ALTER\s+TABLE\s+(\S+)\s+ADD\s+COLUMN\s+(?:IF\s+NOT\s+EXISTS\s+)?(\S+)', re.IGNORECASE),
     lambda m: f"ALTER TABLE {m.group(1)} DROP COLUMN IF EXISTS {m.group(2)};"),

    (re.compile(r'ALTER\s+TABLE\s+(\S+)\s+ADD\s+(?:CONSTRAINT\s+(\S+).+?|(FOREIGN\s+KEY)\s)', re.IGNORECASE),
     lambda m: f"ALTER TABLE {m.group(1)} DROP CONSTRAINT IF EXISTS {m.group(2)};" if m.group(2)
               else f"-- Manual rollback needed: ALTER TABLE {m.group(1)} DROP CONSTRAINT requires constraint name"),

    (re.compile(r'CREATE\s+POLICY\s+(\S+)', re.IGNORECASE),
     lambda m: f"DROP POLICY IF EXISTS {m.group(1)};"),

    (re.compile(r'INSERT\s+INTO\s+(\S+)(?:\s*\(.*?\))?\s*VALUES\s*(.*?);', re.IGNORECASE | re.DOTALL),
     lambda m: f"DELETE FROM {m.group(1)} WHERE FALSE; -- Manual WHERE clause needed for seed data"),

    (re.compile(r'UPDATE\s+(\S+)', re.IGNORECASE),
     lambda m: f"-- Manual rollback needed: UPDATE on {m.group(1)}"),
]

EXTENSION_RE = re.compile(r'CREATE\s+EXTENSION\s+(?:IF\s+NOT\s+EXISTS\s+)?(\S+)', re.IGNORECASE)
ENABLE_RLS_RE = re.compile(r'ALTER\s+TABLE\s+(\S+)\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY', re.IGNORECASE)
DISABLE_RLS_RE = re.compile(r'ALTER\s+TABLE\s+(\S+)\s+DISABLE\s+ROW\s+LEVEL\s+SECURITY', re.IGNORECASE)


def parse_args():
    parser = argparse.ArgumentParser(description="Generate rollback SQL scripts for Supabase migrations")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be generated without writing files")
    parser.add_argument("--migrations-dir", default=MIGRATIONS_DIR, help="Path to migrations directory")
    parser.add_argument("--rollback-dir", default=ROLLBACK_DIR, help="Path to rollback output directory")
    return parser.parse_args()


def reverse_create_extension(match, line):
    return f"-- Extension {match.group(1)} cannot be removed via DROP; skip manual removal if unused"


def reverse_enable_rls(match, line):
    return f"ALTER TABLE {match.group(1)} DISABLE ROW LEVEL SECURITY;"


def reverse_disable_rls(match, line):
    return f"ALTER TABLE {match.group(1)} ENABLE ROW LEVEL SECURITY;"


def reverse_line(line):
    stripped = line.strip()

    if stripped.startswith("--") or stripped == "":
        return None

    for pattern, replacer in REVERSAL_MAP:
        match = pattern.search(stripped)
        if match:
            return replacer(match)

    match = EXTENSION_RE.search(stripped)
    if match:
        return reverse_create_extension(match, stripped)

    match = ENABLE_RLS_RE.search(stripped)
    if match:
        return reverse_enable_rls(match, stripped)

    match = DISABLE_RLS_RE.search(stripped)
    if match:
        return reverse_disable_rls(match, stripped)

    return None


def generate_rollback(filename, dry_run=False):
    migration_path = os.path.join(MIGRATIONS_DIR, filename)
    base, _ = os.path.splitext(filename)
    rollback_filename = f"{base}_down.sql"
    rollback_path = os.path.join(ROLLBACK_DIR, rollback_filename)

    with open(migration_path, "r", encoding="utf-8") as f:
        lines = f.readlines()

    rollback_lines = []
    rollback_lines.append(f"-- Rollback for: {filename}")
    rollback_lines.append(f"-- Generated on: ...")
    rollback_lines.append("")
    rollback_lines.append("BEGIN;")
    rollback_lines.append("")

    manual_count = 0
    for line in lines:
        reversal = reverse_line(line)
        if reversal is None:
            continue
        rollback_lines.append(reversal)
        if reversal.startswith("-- Manual"):
            manual_count += 1

    rollback_lines.append("")
    rollback_lines.append("COMMIT;")

    if dry_run:
        print(f"[DRY-RUN] Would create: {rollback_path}")
        print(f"          Lines: {len(rollback_lines)} (manual: {manual_count})")
        return

    os.makedirs(ROLLBACK_DIR, exist_ok=True)
    with open(rollback_path, "w", encoding="utf-8") as f:
        f.write("\n".join(rollback_lines) + "\n")

    print(f"  Created: {rollback_path} ({len(rollback_lines)} lines, {manual_count} manual)")


def main():
    args = parse_args()

    if not os.path.isdir(args.migrations_dir):
        print(f"Error: Migrations directory not found: {args.migrations_dir}", file=sys.stderr)
        sys.exit(1)

    migrations = sorted([
        f for f in os.listdir(args.migrations_dir)
        if f.endswith(".sql") and not f.endswith("_down.sql")
    ])

    if not migrations:
        print("No migration files found.")
        return

    print(f"Found {len(migrations)} migration(s) in {args.migrations_dir}")
    if args.dry_run:
        print("Running in DRY-RUN mode - no files will be written")
    print()

    for filename in migrations:
        generate_rollback(filename, dry_run=args.dry_run)

    if not args.dry_run:
        print(f"\nDone. Rollback scripts written to {args.rollback_dir}")
        print("Run the rollback scripts in reverse order via: psql -f <file>")
        print("Or use: cat supabase/rollback/*_down.sql | psql")


if __name__ == "__main__":
    main()
