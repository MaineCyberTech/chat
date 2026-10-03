#!/usr/bin/env python3
"""Rollback script generator for Supabase migrations.

Scans supabase/migrations/ for all SQL migration files and generates
corresponding down (rollback) SQL files in supabase/rollback/.

The generated scripts are written so they can actually be *executed* in
reverse order: statements are emitted in reverse order of appearance and all
DROP/ALTER operations are guarded with IF EXISTS + CASCADE where needed.

Hand-written rollback scripts (those without the generated header) are
preserved unless --force is passed.

Usage:
    python scripts/db-rollback-generator.py
    python scripts/db-rollback-generator.py --dry-run
    python scripts/db-rollback-generator.py --force
"""

import argparse
import os
import re
import sys

MIGRATIONS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "supabase", "migrations")
ROLLBACK_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "supabase", "rollback")

GENERATED_HEADER = "-- Rollback for:"

# Reverse of the forward DDL statements we can safely undo. Order matters only
# for readability; matches are collected independently and sorted by position.
STATEMENT_PATTERNS = [
    (re.compile(r'create\s+(?:or\s+replace\s+)?policy\s+("[^"]+"|\'[^\']+\'|[^\s(;]+)\s+on\s+([^\s(;]+)', re.IGNORECASE),
     lambda m: f"DROP POLICY IF EXISTS {m.group(1)} ON {m.group(2)};"),

    (re.compile(r'create\s+(?:or\s+replace\s+)?(?:constraint\s+)?trigger\s+("[^"]+"|\'[^\']+\'|[^\s(;]+)[\s\S]*?\son\s+([^\s(;]+)', re.IGNORECASE),
     lambda m: f"DROP TRIGGER IF EXISTS {m.group(1)} ON {m.group(2)};"),

    (re.compile(r'create\s+(?:or\s+replace\s+)?function\s+([^\s(]+)\s*\(', re.IGNORECASE),
     lambda m: f"DROP FUNCTION IF EXISTS {m.group(1)} CASCADE;"),

    (re.compile(r'create\s+table\s+(?:if\s+not\s+exists\s+)?([^\s(;]+)', re.IGNORECASE),
     lambda m: f"DROP TABLE IF EXISTS {m.group(1)} CASCADE;"),

    (re.compile(r'create\s+(?:unique\s+)?index\s+(?:concurrently\s+)?(?:if\s+not\s+exists\s+)?([^\s(;]+)', re.IGNORECASE),
     lambda m: f"DROP INDEX IF EXISTS {m.group(1)};"),

    (re.compile(r'alter\s+table\s+(?:if\s+exists\s+)?([^\s]+)\s+add\s+column\s+(?:if\s+not\s+exists\s+)?([^\s;]+)', re.IGNORECASE),
     lambda m: f"ALTER TABLE IF EXISTS {m.group(1)} DROP COLUMN IF EXISTS {m.group(2)};"),

    (re.compile(r'alter\s+table\s+(?:if\s+exists\s+)?([^\s]+)\s+add\s+constraint\s+([^\s;]+)', re.IGNORECASE),
     lambda m: f"ALTER TABLE IF EXISTS {m.group(1)} DROP CONSTRAINT IF EXISTS {m.group(2)};"),

    (re.compile(r'alter\s+table\s+(?:if\s+exists\s+)?([^\s]+)\s+enable\s+row\s+level\s+security', re.IGNORECASE),
     lambda m: f"ALTER TABLE IF EXISTS {m.group(1)} DISABLE ROW LEVEL SECURITY;"),

    (re.compile(r'alter\s+table\s+(?:if\s+exists\s+)?([^\s]+)\s+disable\s+row\s+level\s+security', re.IGNORECASE),
     lambda m: f"ALTER TABLE IF EXISTS {m.group(1)} ENABLE ROW LEVEL SECURITY;"),
]

EXTENSION_RE = re.compile(r'create\s+extension\s+(?:if\s+not\s+exists\s+)?(\S+)', re.IGNORECASE)
MANUAL_RE = re.compile(r'^\s*(update\s+\S+|insert\s+into\s+\S+)', re.IGNORECASE)


def parse_args():
    parser = argparse.ArgumentParser(description="Generate rollback SQL scripts for Supabase migrations")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be generated without writing files")
    parser.add_argument("--force", action="store_true", help="Overwrite hand-written rollback scripts too")
    parser.add_argument("--migrations-dir", default=MIGRATIONS_DIR, help="Path to migrations directory")
    parser.add_argument("--rollback-dir", default=ROLLBACK_DIR, help="Path to rollback output directory")
    return parser.parse_args()


def collect_reversals(text):
    """Return reversal statements ordered by the position of the forward statement."""
    matches = []
    for pattern, replacer in STATEMENT_PATTERNS:
        for m in pattern.finditer(text):
            matches.append((m.start(), replacer(m)))
    for m in EXTENSION_RE.finditer(text):
        matches.append((m.start(), f"-- Extension {m.group(1)} cannot be removed via DROP; skip manual removal if unused"))
    # Manual (non-reversible) statements are recorded as comments, never executed.
    for m in MANUAL_RE.finditer(text):
        matches.append((m.start(), f"-- Manual rollback needed: {m.group(1).split()[0].upper()} on {m.group(1).split()[-1]}"))
    # Reverse order of appearance: last change is undone first.
    matches.sort(key=lambda item: item[0], reverse=True)
    return [stmt for _, stmt in matches]


def is_hand_written(path):
    if not os.path.isfile(path):
        return False
    with open(path, "r", encoding="utf-8", errors="replace") as f:
        first = f.readline()
    return not first.startswith(GENERATED_HEADER)


def generate_rollback(filename, args):
    migration_path = os.path.join(args.migrations_dir, filename)
    base, _ = os.path.splitext(filename)
    rollback_filename = f"{base}_down.sql"
    rollback_path = os.path.join(args.rollback_dir, rollback_filename)

    if is_hand_written(rollback_path) and not args.force:
        print(f"  Preserved (hand-written): {rollback_path}")
        return

    with open(migration_path, "r", encoding="utf-8") as f:
        text = f.read()

    statements = collect_reversals(text)

    lines = [f"{GENERATED_HEADER} {filename}", "-- Generated on: ...", "", "BEGIN;", ""]
    lines.extend(statements)
    lines += ["", "COMMIT;"]

    if args.dry_run:
        print(f"[DRY-RUN] Would create: {rollback_path}")
        print(f"          Lines: {len(lines)}")
        return

    os.makedirs(args.rollback_dir, exist_ok=True)
    with open(rollback_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")

    print(f"  Created: {rollback_path} ({len(lines)} lines)")


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
        generate_rollback(filename, args)

    if not args.dry_run:
        print(f"\nDone. Rollback scripts written to {args.rollback_dir}")
        print("Run the rollback scripts in reverse order via: psql -f <file>")


if __name__ == "__main__":
    main()
