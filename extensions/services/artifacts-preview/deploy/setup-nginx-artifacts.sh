#!/usr/bin/env bash
# Thin script called by: edges artifacts server setup-nginx
# Install the /health + /artifacts/ proxy into the existing teaching :80
# server. Does not replace /teaching/. Idempotent.
#
# teaching.conf must contain /teaching/. If the live box still has a leftover
# site file under the old name, rename/replace it to teaching.conf first, then:
#   sudo python3 …/deploy/migrate-teaching-nginx-prefix.py /etc/nginx/conf.d/teaching.conf
#   nginx -t && systemctl reload nginx
# then re-run this script / edges artifacts server setup-nginx.
#
# If this is run without root, the CLI prints:
#   sudo bash …/deploy/setup-nginx-artifacts.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CONF_SRC="$SCRIPT_DIR/nginx-artifacts.conf"
CONF_DST="/etc/nginx/snippets/edges-artifacts.conf"
TEACHING_CONF="${TEACHING_CONF:-/etc/nginx/conf.d/teaching.conf}"
INCLUDE_LINE="include /etc/nginx/snippets/edges-artifacts.conf;"
TARGET_USER="${SUDO_USER:-cheng-dev}"

die() {
  printf '%s\n' "$*" >&2
  exit 1
}

[ "$(id -u)" -eq 0 ] || die "run with sudo: sudo bash $SCRIPT_DIR/setup-nginx-artifacts.sh"
[ -f "$CONF_SRC" ] || die "missing $CONF_SRC"
command -v nginx >/dev/null 2>&1 || die "nginx not found"
[ -f "$TEACHING_CONF" ] || die "missing $TEACHING_CONF — teaching.conf must contain /teaching/; add $INCLUDE_LINE inside that server {}, then nginx -t && systemctl reload nginx. See $SCRIPT_DIR/migrate-teaching-nginx-prefix.py"

install -d -m 755 /etc/nginx/snippets
install -m 644 "$CONF_SRC" "$CONF_DST"

stamp="$(date +%Y%m%d%H%M%S)"
cp -a "$TEACHING_CONF" "${TEACHING_CONF}.bak.artifacts.${stamp}"

python3 "$SCRIPT_DIR/inject_nginx_include.py" "$TEACHING_CONF" "$INCLUDE_LINE"

if ! nginx -t; then
  mv "${TEACHING_CONF}.bak.artifacts.${stamp}" "$TEACHING_CONF"
  die "nginx -t failed; restored $TEACHING_CONF from backup"
fi

if command -v systemctl >/dev/null 2>&1; then
  systemctl reload nginx
else
  nginx -s reload
fi

if command -v loginctl >/dev/null 2>&1; then
  loginctl enable-linger "$TARGET_USER"
  printf 'linger enabled for %s (user systemd units survive SSH logout)\n' "$TARGET_USER"
else
  printf 'loginctl not found; enable linger yourself so the user unit stays up after deploy SSH\n' >&2
fi

printf 'nginx proxy installed. /teaching/ is unchanged. Public checks:\n'
printf '  curl -fsS http://127.0.0.1:8787/health   # after: edges artifacts server start\n'
printf '  curl -fsS http://182.92.131.89/health    # via :80, no extra port\n'
