#!/usr/bin/env bash
# Apply the physical-layout migration to the two nginx files named on the
# command line. Config paths are positional arguments only.
# The root-owned entry is /usr/local/sbin/edges-migrate-site-layout, which
# passes the system paths. Do not grant sudo on this repository copy.
set -euo pipefail
if [ "$#" -ne 2 ]; then
  echo "usage: migrate-site-layout.sh <teaching.conf> <tasks-snippet>" >&2
  exit 2
fi
teaching_conf=$1
tasks_conf=$2
script_dir="$(cd "$(dirname "$0")" && pwd)"
[ -f "$teaching_conf" ] || { echo "missing $teaching_conf" >&2; exit 1; }
backup="$(mktemp -d)"
cp -p "$teaching_conf" "$backup/teaching.conf"
has_tasks=false
if [ -f "$tasks_conf" ]; then
  cp -p "$tasks_conf" "$backup/tasks.conf"
  has_tasks=true
fi
committed=false
cleanup() {
  status=$?
  if [ "$committed" = false ]; then
    cp -p "$backup/teaching.conf" "$teaching_conf"
    if [ "$has_tasks" = true ]; then cp -p "$backup/tasks.conf" "$tasks_conf"; fi
    echo "site layout migration failed; restored nginx configs" >&2
  fi
  rm -rf "$backup"
  exit "$status"
}
trap cleanup EXIT
python3 "$script_dir/migrate-teaching-nginx-prefix.py" "$teaching_conf"
if [ "$has_tasks" = true ]; then
  python3 - "$tasks_conf" <<'PY'
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
if ! cmp -s "$backup/teaching.conf" "$teaching_conf" ||
   { [ "$has_tasks" = true ] && ! cmp -s "$backup/tasks.conf" "$tasks_conf"; }; then
  nginx -t
  nginx -s reload
fi
committed=true
