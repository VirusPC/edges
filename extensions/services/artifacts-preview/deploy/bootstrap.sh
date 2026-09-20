#!/usr/bin/env bash
# Rebuild and restart the artifacts preview user unit after a repo pull.
# No sudo. Requires ~/.config/edges/artifacts-preview.env (token on the box).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"
UNIT_NAME="edges-artifacts-preview.service"
UNIT_SRC="$SCRIPT_DIR/$UNIT_NAME"
UNIT_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/systemd/user"
ENV_FILE="${XDG_CONFIG_HOME:-$HOME/.config}/edges/artifacts-preview.env"
DATA_DIR_DEFAULT="$HOME/.local/share/edges-artifacts"
UID_NOW="$(id -u)"
export XDG_RUNTIME_DIR="${XDG_RUNTIME_DIR:-/run/user/${UID_NOW}}"
if [ -z "${DBUS_SESSION_BUS_ADDRESS:-}" ] && [ -S "${XDG_RUNTIME_DIR}/bus" ]; then
  export DBUS_SESSION_BUS_ADDRESS="unix:path=${XDG_RUNTIME_DIR}/bus"
fi

die() {
  printf '%s\n' "$*" >&2
  exit 1
}

# Non-interactive SSH often has no nvm/corepack on PATH.
export PATH="${HOME}/.local/share/pnpm:${HOME}/.local/bin:/usr/local/bin:${PATH}"
if [ -s "${NVM_DIR:-$HOME/.nvm}/nvm.sh" ]; then
  export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
  # shellcheck disable=SC1091
  . "$NVM_DIR/nvm.sh"
fi

[ -f "$ENV_FILE" ] || die "missing $ENV_FILE — copy deploy/artifacts.env.example, set EDGES_ARTIFACTS_TOKEN, chmod 0600"
if grep -Eq '^[[:space:]]*EDGES_ARTIFACTS_TOKEN=replace-with-shared-token[[:space:]]*$' "$ENV_FILE"; then
  die "$ENV_FILE still has the placeholder token"
fi

command -v node >/dev/null 2>&1 || die "node not on PATH (need Node >= 20 on this box)"
command -v pnpm >/dev/null 2>&1 || die "pnpm not on PATH (corepack enable && corepack prepare pnpm@latest --activate)"
command -v systemctl >/dev/null 2>&1 || die "systemctl not found"

NODE_BIN="$(command -v node)"
NODE_DIR="$(cd "$(dirname "$NODE_BIN")" && pwd)"
PNPM_DIR="$(cd "$(dirname "$(command -v pnpm)")" && pwd)"
DATA_DIR="$(
  awk -F= '/^[[:space:]]*EDGES_ARTIFACTS_DATA_DIR=/{gsub(/[[:space:]]/,"",$2); print $2; exit}' "$ENV_FILE"
)"
if [ -z "${DATA_DIR}" ]; then
  DATA_DIR="$DATA_DIR_DEFAULT"
fi
mkdir -p "$DATA_DIR"
chmod 700 "$DATA_DIR"

cd "$REPO_ROOT"
pnpm install --frozen-lockfile --filter edges-artifacts-preview...
pnpm --filter edges-artifacts-preview build
[ -f "$REPO_ROOT/extensions/services/artifacts-preview/dist/index.js" ] || die "build did not produce dist/index.js"

mkdir -p "$UNIT_DIR/${UNIT_NAME}.d"
install -m 644 "$UNIT_SRC" "$UNIT_DIR/$UNIT_NAME"
cat > "$UNIT_DIR/${UNIT_NAME}.d/node-path.conf" <<EOF
[Service]
Environment=PATH=${NODE_DIR}:${PNPM_DIR}:/usr/local/bin:/usr/bin:/bin
EOF

if ! systemctl --user daemon-reload; then
  die "systemctl --user failed. One-time: sudo loginctl enable-linger \"$USER\" (see deploy/setup-nginx-artifacts.sh)"
fi
systemctl --user enable "$UNIT_NAME"
systemctl --user restart "$UNIT_NAME"

ok=0
for _ in 1 2 3 4 5 6 7 8; do
  if curl -fsS http://127.0.0.1:8787/health >/dev/null; then
    ok=1
    break
  fi
  sleep 1
done
[ "$ok" -eq 1 ] || die "service restarted but http://127.0.0.1:8787/health did not become ready"
printf 'artifacts preview healthy on 127.0.0.1:8787\n'
systemctl --user --no-pager --full status "$UNIT_NAME" | head -n 20 || true
