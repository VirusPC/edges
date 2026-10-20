#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$(dirname "$(dirname "$(dirname "$SCRIPT_DIR")")")")"
CLI=(node --import tsx "$REPO_ROOT/extensions/cli/src/index.ts")

ISOLATED="$(mktemp -d "${TMPDIR:-/tmp}/edges-mcp-note-XXXXXX")"
cleanup() { rm -rf "$ISOLATED"; }
trap cleanup EXIT

git init -b main "$ISOLATED" >/dev/null
cat > "$ISOLATED/AGENTS.md" <<'EOF'
# Isolated

<!-- project-harness-local:start -->
## 本层系统维护信息

<!-- project-harness-local:end -->

<!-- project-harness-descendants:start -->
## 下层系统维护信息

<!-- project-harness-descendants:end -->
EOF

echo "Starting integration tests via edges notes"

TITLE="Test Local Note $(date +%s)"
OUTPUT="$(
  "${CLI[@]}" --scope "$ISOLATED" notes create \
    --title "$TITLE" \
    --body "Integration test content." \
    --json
)"
echo "$OUTPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); assert d['status']=='success'; assert d['command']=='notes.create'; assert d['path'].endswith('/INDEX.md'); assert d['title']"

if git -C "$ISOLATED" rev-parse --verify HEAD >/dev/null 2>&1; then
  echo "notes create must not commit" >&2
  exit 1
fi

echo "Integration tests passed"
