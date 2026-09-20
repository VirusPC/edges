#!/usr/bin/env bash
# One-time, human-run with sudo: install the /health + /artifacts/ proxy
# into the existing teach :80 server. Does not replace /teaching/.
#
# Same pattern as ~/setup-teach-nginx80.sh — assistants historically cannot
# inject a sudo password, so a person runs this once on the box.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SNIPPET_SRC="$SCRIPT_DIR/nginx-artifacts-proxy.conf"
SNIPPET_DST="/etc/nginx/snippets/edges-artifacts-proxy.conf"
TEACH_CONF="${TEACH_CONF:-/etc/nginx/conf.d/teach.conf}"
INCLUDE_LINE="include /etc/nginx/snippets/edges-artifacts-proxy.conf;"
TARGET_USER="${SUDO_USER:-cheng-dev}"

die() {
  printf '%s\n' "$*" >&2
  exit 1
}

[ "$(id -u)" -eq 0 ] || die "run with sudo: sudo bash $SCRIPT_DIR/setup-nginx-artifacts.sh"
[ -f "$SNIPPET_SRC" ] || die "missing $SNIPPET_SRC"
command -v nginx >/dev/null 2>&1 || die "nginx not found"
[ -f "$TEACH_CONF" ] || die "missing $TEACH_CONF — add $INCLUDE_LINE inside the server {} that already serves /teaching/, then nginx -t && systemctl reload nginx"

install -d -m 755 /etc/nginx/snippets
install -m 644 "$SNIPPET_SRC" "$SNIPPET_DST"

stamp="$(date +%Y%m%d%H%M%S)"
cp -a "$TEACH_CONF" "${TEACH_CONF}.bak.artifacts.${stamp}"

python3 - "$TEACH_CONF" "$INCLUDE_LINE" <<'PY'
import pathlib
import re
import sys

path = pathlib.Path(sys.argv[1])
include_line = sys.argv[2]
text = path.read_text()
if "edges-artifacts-proxy.conf" in text:
    print(f"{path} already includes edges-artifacts-proxy.conf")
    raise SystemExit(0)

pattern = re.compile(r"^([ \t]*)server[ \t]*\{", re.M)
if not pattern.search(text):
    raise SystemExit(f"no server {{ block in {path}")

def inject(match: re.Match[str]) -> str:
    indent = match.group(1) + "    "
    return (
        f"{match.group(0)}\n"
        f"{indent}# edges artifacts preview: /health and /artifacts/ only; keep /teaching/\n"
        f"{indent}{include_line}"
    )

updated = pattern.sub(inject, text, count=0)
path.write_text(updated)
print(f"inserted include into every server {{ in {path}")
PY

if ! nginx -t; then
  mv "${TEACH_CONF}.bak.artifacts.${stamp}" "$TEACH_CONF"
  die "nginx -t failed; restored $TEACH_CONF from backup"
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
printf '  curl -fsS http://127.0.0.1:8787/health   # after bootstrap.sh\n'
printf '  curl -fsS http://182.92.131.89/health    # via :80, no extra port\n'
