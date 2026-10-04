#!/bin/bash
# check-sensitive-data.sh
# Scans committed files for sensitive data: API keys, tokens, passwords, private keys, .env files.
# Usage: ./scripts/check-sensitive-data.sh [--ci]
#   --ci   Exit with code 1 on any finding (for CI pipelines)

set -euo pipefail

CI_MODE=false
if [[ "${1:-}" == "--ci" ]]; then
  CI_MODE=true
fi

echo "=== Sensitive Data Scanner ==="
echo ""

HAS_ISSUES=false

check_patterns() {
  local file="$1"
  local findings=0

  # Check for AWS access keys
  if grep -qP '(?<![A-Za-z0-9/+])AKIA[0-9A-Z]{16}(?![A-Za-z0-9/+])' "$file" 2>/dev/null; then
    echo "  ⚠ AWS Access Key ID found"
    findings=$((findings + 1))
  fi

  # Check for AWS secret keys
  if grep -qP '(?<![A-Za-z0-9/+=])[A-Za-z0-9/+=]{40}(?![A-Za-z0-9/+=])' "$file" 2>/dev/null; then
    # Heuristic: only flag if it looks like a secret key near an AWS-related line
    if grep -qiP '(aws.?secret|aws.?access|secret.?access)' "$file" 2>/dev/null; then
      echo "  ⚠ Potential AWS Secret Access Key found"
      findings=$((findings + 1))
    fi
  fi

  # Check for GitHub tokens
  if grep -qP 'gh[ps]_[A-Za-z0-9]{36,}' "$file" 2>/dev/null; then
    echo "  ⚠ GitHub token found"
    findings=$((findings + 1))
  fi

  # Check for generic API keys (heuristic: long base64-ish strings near key-like names)
  if grep -qiP '(api.?key|api.?secret|apikey|secret.?key).{0,10}["'"'"']?[A-Za-z0-9_\-]{20,}' "$file" 2>/dev/null; then
    echo "  ⚠ Potential API key or secret found"
    findings=$((findings + 1))
  fi

  # Check for private key headers
  if grep -qP '-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----' "$file" 2>/dev/null; then
    echo "  ⚠ Private key block found"
    findings=$((findings + 1))
  fi

  # Check for .env file references
  if [[ "$(basename "$file")" == ".env" ]] || [[ "$file" == *".env."* ]] || [[ "$file" == *".env" ]]; then
    echo "  ⚠ .env file tracked in repository"
    findings=$((findings + 1))
  fi

  # Check for password/credential variables
  if grep -qiP '(password|passwd|pwd|credentials?)\s*[:=]\s*["'"'"']?[^"'"'"'\s]{6,}' "$file" 2>/dev/null; then
    # Skip obvious false positives like documentation or schema definitions
    if ! grep -qiP '(example|placeholder|your_password|schema|column|field)' <<< "$(head -5 "$file")" 2>/dev/null; then
      echo "  ⚠ Potential credential variable assignment found"
      findings=$((findings + 1))
    fi
  fi

  # Check for JWT tokens (eyJ... long base64 strings)
  if grep -qP 'eyJ[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}' "$file" 2>/dev/null; then
    echo "  ⚠ Potential JWT token found"
    findings=$((findings + 1))
  fi

  return "$findings"
}

# Check files tracked by git
echo "Scanning git-tracked files..."
while IFS= read -r -d '' file; do
  # Skip binary files
  if [[ "$(file -b --mime-type "$file" 2>/dev/null)" == application/octet-stream ]]; then
    continue
  fi

  # Skip common non-sensitive file types
  case "$file" in
    *.png|*.jpg|*.jpeg|*.gif|*.svg|*.ico|*.woff2|*.woff|*.ttf|*.eot|*.mp4|*.mp3|*.zip|*.tar.gz|*.gz|*.lockb|*.jar|*.dll|*.exe|*.wasm)
      continue
      ;;
    pnpm-lock.yaml|yarn.lock|package-lock.json)
      continue
      ;;
  esac

  findings=$(check_patterns "$file")
  if [ "$findings" -gt 0 ]; then
    echo "  Found in: $file"
    HAS_ISSUES=true
  fi
done < <(git ls-files -z)

echo ""
if [ "$HAS_ISSUES" = true ]; then
  echo "❌ Sensitive data detected in repository files."
  echo "   Review findings above and remove sensitive data."
  echo "   Consider using git-secrets or .gitignore to prevent future leaks."
  if [ "$CI_MODE" = true ]; then
    exit 1
  fi
else
  echo "✅ No sensitive data detected in tracked files."
fi

# Check for untracked .env files
echo ""
echo "Checking for untracked .env files..."
untracked_env=$(git ls-files --others --exclude-standard -- '*/.env' '.env' '*.env.*' 2>/dev/null || true)
if [ -n "$untracked_env" ]; then
  echo "  ⚠ Untracked .env file(s) found (not committed, but present):"
  echo "    $untracked_env" | tr '\n' '\n'
else
  echo "  ✅ No untracked .env files found."
fi

echo ""
echo "=== Scan Complete ==="
