#!/usr/bin/env bash
set -e

# Integration Test for new-note modes
# This script tests both 'direct' and 'pr' modes of the bin/new-note script.

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
# SCRIPT_DIR is extensions/mcp-servers/new-note/test
# Need to go up 4 levels to get to repo root
REPO_ROOT="$(dirname "$(dirname "$(dirname "$(dirname "$SCRIPT_DIR")")")")"
NEW_NOTE_BIN="$REPO_ROOT/bin/new-note"

echo "🚀 Starting Integration Tests for new-note..."
echo "📍 Repo Root: $REPO_ROOT"
echo "📍 Script: $NEW_NOTE_BIN"

# Ensure we're on main for the start of the test
cd "$REPO_ROOT"
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
  echo "⚠️  Switching to main branch for testing..."
  git checkout main
fi

# Test 1: Direct Mode (Default)
echo -e "\n--- Test 1: Direct Mode (Default) ---"
TITLE="Test Direct Mode $(date +%s)"
CONTENT="Integration test content for direct mode."
CO_AUTHOR="Tester <tester@example.com>"

OUTPUT=$( EDGES_DRY_RUN=true "$NEW_NOTE_BIN" "$TITLE" "$CONTENT" "$CO_AUTHOR" )

echo "$OUTPUT" | grep -q "📝 Mode: Direct commit to main" && echo "✅ Correct mode detected" || (echo "❌ Wrong mode detected"; exit 1)
echo "$OUTPUT" | grep -q "✅ Ingested:" && echo "✅ File ingested successfully" || (echo "❌ Ingestion failed"; exit 1)
echo "$OUTPUT" | grep -q "__EDGES_PR_STATUS__=direct_commit" && echo "✅ Correct PR status returned" || (echo "❌ Wrong PR status"; exit 1)

# Test 2: PR Mode
echo -e "\n--- Test 2: PR Mode ---"
TITLE="Test PR Mode $(date +%s)"
CONTENT="Integration test content for PR mode."
# Export to ensure it reaches the subshell
export EDGES_MODE=pr
export EDGES_DRY_RUN=true
OUTPUT_PR=$( "$NEW_NOTE_BIN" "$TITLE" "$CONTENT" "$CO_AUTHOR" )
# Reset after test
unset EDGES_MODE
unset EDGES_DRY_RUN

echo "$OUTPUT_PR" | grep -q "🌿 Mode: Create branch and PR" && echo "✅ Correct mode detected" || (echo "❌ Wrong mode detected"; exit 1)
echo "$OUTPUT_PR" | grep -q "✅ Ingested:" && echo "✅ File ingested successfully" || (echo "❌ Ingestion failed"; exit 1)
echo "$OUTPUT_PR" | grep -q "__EDGES_PR_STATUS__=" && echo "✅ PR status markers found" || (echo "❌ PR markers missing"; exit 1)

# Cleanup: Switch back to main and delete the test branch
echo -e "\n--- Cleanup ---"
git checkout main
TEST_BRANCH=$(echo "$OUTPUT_PR" | grep "__EDGES_BRANCH__=" | cut -d'=' -f2)
if [ -n "$TEST_BRANCH" ] && [ "$TEST_BRANCH" != "main" ]; then
  echo "🧹 Deleting test branch: $TEST_BRANCH"
  git branch -D "$TEST_BRANCH"
fi

echo -e "\n✨ Integration Tests Passed!"
