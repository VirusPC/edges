#!/usr/bin/env bash
# Apply the physical-layout migration to installed configs during deploy.
# Run with permission to edit nginx config and reload nginx (sudo on ECS).
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TEACHING_CONF="${TEACHING_CONF:-/etc/nginx/conf.d/teaching.conf}"
TASKS_CONF="${TASKS_CONF:-/etc/nginx/snippets/edges-tasks.conf}"
[ -f "$TEACHING_CONF" ] || { echo "missing $TEACHING_CONF" >&2; exit 1; }
backup="$(mktemp -d)"
cp -p "$TEACHING_CONF" "$backup/teaching.conf"
has_tasks=false
if [ -f "$TASKS_CONF" ]; then
  cp -p "$TASKS_CONF" "$backup/tasks.conf"
  has_tasks=true
fi
committed=false
cleanup() {
  status=$?
  if [ "$committed" = false ]; then
    cp -p "$backup/teaching.conf" "$TEACHING_CONF"
    if [ "$has_tasks" = true ]; then cp -p "$backup/tasks.conf" "$TASKS_CONF"; fi
    echo "site layout migration failed; restored nginx configs" >&2
  fi
  rm -rf "$backup"
  exit "$status"
}
trap cleanup EXIT
python3 "$SCRIPT_DIR/migrate-teaching-nginx-prefix.py" "$TEACHING_CONF"
if [ "$has_tasks" = true ]; then
  python3 - "$TASKS_CONF" <<'PY'
import pathlib
import re
import sys
path = pathlib.Path(sys.argv[1])
text = path.read_text()
# The installed snippet is dedicated to /tasks/. Leave comments and other roots alone.
updated = re.sub(r"(\balias\s+)([^;\s]+?)/knowledge/tasks/_site(?=/|\s*;)", r"\1\2/tasks/_site", text)
if updated != text:
    path.write_text(updated)
PY
fi
if ! cmp -s "$backup/teaching.conf" "$TEACHING_CONF" ||
   { [ "$has_tasks" = true ] && ! cmp -s "$backup/tasks.conf" "$TASKS_CONF"; }; then
  nginx -t
  nginx -s reload
fi
committed=true
