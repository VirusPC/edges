#!/usr/bin/env bash
# One-time sudo: serve generated knowledge/tasks/_site at /tasks/ on the
# existing teaching.conf :80 server. Does not replace /teaching/.
# Does not call this from deploy.yml — Action only generates HTML.
#
# teaching.conf must contain /teaching/. If the live box still has leftover
# teach.conf / /teach/, rename to teaching.conf and run
# migrate-teaching-nginx-prefix.py first, then re-run this script.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CONF_SRC="$SCRIPT_DIR/nginx-tasks.conf"
CONF_DST="/etc/nginx/snippets/edges-tasks.conf"
TEACHING_CONF="${TEACHING_CONF:-/etc/nginx/conf.d/teaching.conf}"
INCLUDE_LINE="include /etc/nginx/snippets/edges-tasks.conf;"

die() {
  printf '%s\n' "$*" >&2
  exit 1
}

[ "$(id -u)" -eq 0 ] || die "run with sudo: sudo bash $SCRIPT_DIR/setup-nginx-tasks.sh"
[ -f "$CONF_SRC" ] || die "missing $CONF_SRC"
command -v nginx >/dev/null 2>&1 || die "nginx not found"
[ -f "$TEACHING_CONF" ] || die "missing $TEACHING_CONF — teaching.conf must contain /teaching/; leftover teach.conf / /teach/ must be migrated first"

if [ -n "${EDGES_REPO:-}" ]; then
  REPO_ROOT="$(cd "$EDGES_REPO" && pwd)"
else
  REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
fi
SITE_DIR="${REPO_ROOT}/knowledge/tasks/_site"
SITE_DIR="${SITE_DIR%/}"

install -d -m 755 /etc/nginx/snippets
umask 022
sed "s|__SITE_DIR__|${SITE_DIR}|g" "$CONF_SRC" > "$CONF_DST"
chmod 644 "$CONF_DST"

stamp="$(date +%Y%m%d%H%M%S)"
cp -a "$TEACHING_CONF" "${TEACHING_CONF}.bak.tasks.${stamp}"

python3 "$SCRIPT_DIR/inject_nginx_tasks_include.py" "$TEACHING_CONF" "$INCLUDE_LINE"

if ! nginx -t; then
  mv "${TEACHING_CONF}.bak.tasks.${stamp}" "$TEACHING_CONF"
  die "nginx -t failed; restored $TEACHING_CONF from backup"
fi

if command -v systemctl >/dev/null 2>&1; then
  systemctl reload nginx
else
  nginx -s reload
fi

printf 'nginx /tasks/ installed. Public checks:\n'
printf '  curl -fsS -o /dev/null -w '"'"'%%{http_code}\\n'"'"' http://127.0.0.1/teaching/\n'
printf '  curl -fsS -o /dev/null -w '"'"'%%{http_code}\\n'"'"' http://127.0.0.1/tasks/\n'
printf '  curl -fsS http://127.0.0.1/health\n'
printf 'Public origin example: https://edges.viruspc.tech/tasks/\n'
