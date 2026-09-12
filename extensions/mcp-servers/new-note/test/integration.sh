#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$(dirname "$(dirname "$(dirname "$SCRIPT_DIR")")")")"
CLI=(node --import tsx "$REPO_ROOT/extensions/clis/src/index.ts")

ISOLATED="$(mktemp -d "${TMPDIR:-/tmp}/edges-mcp-note-XXXXXX")"
cleanup() { rm -rf "$ISOLATED"; }
trap cleanup EXIT

git init -b main "$ISOLATED" >/dev/null
git -C "$ISOLATED" config user.email "tester@example.com"
git -C "$ISOLATED" config user.name "Tester"
export EDGES_REPO="$ISOLATED"

echo "Starting integration tests via edges note"

TITLE="Test Direct Mode $(date +%s)"
OUTPUT="$(
  EDGES_DRY_RUN=true EDGES_MODE=direct EDGES_AUTH_TOKEN= \
    "${CLI[@]}" note \
      --title "$TITLE" \
      --content "Integration test content for direct mode." \
      --co-author "Tester <tester@example.com>" \
      --dry-run --json
)"
echo "$OUTPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); assert d['status']=='success'; assert d['prStatus']=='direct_commit'"

TITLE="Test PR Mode $(date +%s)"
OUTPUT_PR="$(
  EDGES_DRY_RUN=true EDGES_MODE=pr EDGES_AUTH_TOKEN= \
    "${CLI[@]}" note \
      --title "$TITLE" \
      --content "Integration test content for PR mode." \
      --co-author "Tester <tester@example.com>" \
      --mode pr --dry-run --json
)"
echo "$OUTPUT_PR" | python3 -c "import sys,json; d=json.load(sys.stdin); assert d['status']=='success'; assert d['prStatus'] in ('created','unavailable'); assert d['branch'].startswith('ingest/')"

echo "Integration tests passed"
