#!/usr/bin/env bash
set -euo pipefail

# Accessibility audit script
# Uses Pa11y CI to audit the frontend for accessibility violations.
# Usage: ./scripts/accessibility-audit.sh [base_url]
# Default base URL: http://localhost:3000

BASE_URL="${1:-http://localhost:3000}"
TMP_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_DIR"' EXIT

echo "🔍 Running accessibility audit against $BASE_URL..."

if ! command -v npx &>/dev/null; then
  echo "❌ npx is required but not installed."
  exit 1
fi

CONFIG_FILE="$TMP_DIR/.pa11yci"
cat > "$CONFIG_FILE" <<CONFIG
{
  "defaults": {
    "timeout": 30000,
    "runners": ["axe"],
    "standard": "WCAG2AA",
    "hideElements": "",
    "ignore": []
  },
  "urls": [
    "${BASE_URL}/",
    "${BASE_URL}/login",
    "${BASE_URL}/settings"
  ]
}
CONFIG

echo "📋 Audit configuration:"
cat "$CONFIG_FILE"

TOTAL_VIOLATIONS=0
OUTPUT_FILE="$TMP_DIR/results.json"

set +e
npx --yes pa11y-ci --config "$CONFIG_FILE" --json > "$OUTPUT_FILE" 2>&1
EXIT_CODE=$?
set -e

if [ -f "$OUTPUT_FILE" ]; then
  VIOLATIONS=$(cat "$OUTPUT_FILE" | python3 -c "import sys,json; data=json.load(sys.stdin); urls=data.get('urlResults',{}); print(sum(urls[u].get('passes',0) for u in urls))" 2>/dev/null || echo "0")
  ERRORS=$(cat "$OUTPUT_FILE" | python3 -c "import sys,json; data=json.load(sys.stdin); urls=data.get('urlResults',{}); print(sum(urls[u].get('errors',0) for u in urls))" 2>/dev/null || echo "0")
  TOTAL_VIOLATIONS=$((ERRORS))
  echo "Results: $VIOLATIONS passed, $ERRORS violations"
fi

if [ "$TOTAL_VIOLATIONS" -gt 0 ]; then
  echo "❌ $TOTAL_VIOLATIONS accessibility violation(s) found."
  cat "$OUTPUT_FILE" | python3 -m json.tool 2>/dev/null || true
  exit 1
fi

if [ $EXIT_CODE -ne 0 ] && [ "$TOTAL_VIOLATIONS" -eq 0 ]; then
  echo "⚠️  Audit tool exited with code $EXIT_CODE but no violations detected."
  echo "Check output above for configuration/connection issues."
  exit $EXIT_CODE
fi

echo "✅ No accessibility violations found."
