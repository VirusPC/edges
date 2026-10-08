#!/bin/bash
# Install the site-layout migrator where only root can change it, and allow
# the deploy account to run that one command with no arguments.
#
# On the server, from the repository checkout, as root:
#   sudo bash extensions/services/artifacts-preview/deploy/install-site-layout.sh
# The account is SUDO_USER, or the single account argument.
# Re-run this after the migrator changes. It overwrites the installed copies.
#
# --root DIR is for repository tests. Omit it on the server.
set -euo pipefail

prefix=
user=
while [ "$#" -gt 0 ]; do
  case "$1" in
    --root)
      [ "$#" -ge 2 ] || { echo "usage: install-site-layout.sh [--root DIR] [account]" >&2; exit 2; }
      prefix=${2%/}
      shift 2
      ;;
    --)
      shift
      break
      ;;
    -*)
      echo "unknown option: $1" >&2
      exit 2
      ;;
    *)
      [ -z "$user" ] || { echo "only one account name" >&2; exit 2; }
      user=$1
      shift
      ;;
  esac
done

if [ -z "$user" ]; then
  if [ -n "${SUDO_USER:-}" ]; then
    user=$SUDO_USER
  else
    echo "pass the deploy account, or run via sudo so SUDO_USER is set" >&2
    exit 2
  fi
fi

if ! printf '%s\n' "$user" | grep -Eq '^[a-z_][a-z0-9_-]{0,31}$'; then
  echo "refusing unsafe account name" >&2
  exit 2
fi

if [ -z "$prefix" ] && [ "$(id -u)" -ne 0 ]; then
  echo "run as root: sudo bash extensions/services/artifacts-preview/deploy/install-site-layout.sh" >&2
  exit 1
fi

pick_tool() {
  if [ -n "$prefix" ] && [ -x "${prefix}$1" ]; then
    printf '%s\n' "${prefix}$1"
  else
    printf '%s\n' "$1"
  fi
}

getent_bin=$(pick_tool /usr/bin/getent)
visudo_bin=$(pick_tool /usr/sbin/visudo)
if ! "$getent_bin" passwd "$user" >/dev/null 2>&1; then
  echo "account ${user} does not exist" >&2
  exit 1
fi

src="$(cd "$(dirname "$0")" && pwd)"
entry_src="$src/edges-migrate-site-layout"
lib_src="$src/migrate-site-layout.sh"
py_src="$src/migrate-teaching-nginx-prefix.py"
[ -f "$entry_src" ] && [ -f "$lib_src" ] && [ -f "$py_src" ] || {
  echo "missing site-layout sources next to install-site-layout.sh" >&2
  exit 1
}

fragment=$(mktemp)
trap 'rm -f "$fragment"' EXIT
cat > "$fragment" <<EOF
# Deploy account may run only this root-owned command, with no arguments.
# Do not grant sudo on scripts inside the repository.
Defaults!/usr/local/sbin/edges-migrate-site-layout !setenv
${user} ALL=(root) NOPASSWD: /usr/local/sbin/edges-migrate-site-layout ""
EOF
if ! "$visudo_bin" -cf "$fragment" >/dev/null; then
  echo "visudo rejected the sudoers fragment; not installed" >&2
  exit 1
fi

sbin_dir="${prefix}/usr/local/sbin"
lib_dir="${prefix}/usr/local/lib/edges/site-layout"
sudoers_dir="${prefix}/etc/sudoers.d"
install_dir() {
  if [ "$(id -u)" -eq 0 ]; then
    install -d -o root -g root -m 0755 "$@"
  else
    install -d -m 0755 "$@"
  fi
}
install_file() {
  local mode=$1
  shift
  if [ "$(id -u)" -eq 0 ]; then
    install -o root -g root -m "$mode" "$@"
  else
    install -m "$mode" "$@"
  fi
}
install_dir "${prefix}/usr/local/lib/edges" "$lib_dir" "$sbin_dir"
if [ ! -d "$sudoers_dir" ]; then
  install_dir "$sudoers_dir"
fi
install_file 0755 "$entry_src" "$sbin_dir/edges-migrate-site-layout"
install_file 0755 "$lib_src" "$lib_dir/migrate-site-layout.sh"
install_file 0644 "$py_src" "$lib_dir/migrate-teaching-nginx-prefix.py"
install_file 0440 "$fragment" "$sudoers_dir/edges-site-layout"

echo "installed /usr/local/sbin/edges-migrate-site-layout for ${user}"
if [ -z "$prefix" ]; then
  /usr/local/sbin/edges-migrate-site-layout
fi
