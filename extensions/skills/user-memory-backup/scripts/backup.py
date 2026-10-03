#!/usr/bin/env python3
"""Archive private .harness/memory/users, including its index and assets."""
from __future__ import annotations
import argparse
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import re
import stat
import subprocess
import tarfile

USERS_DIR = Path('.harness/memory/users')
CONVERSION = ('conversion-required: restore the old archive with its matching older tool in an isolated old project, '
              'run project-memory-migrate --target-dir <old-project>, then create a new user-memory-backup archive.')


def _utc_stamp():
    return datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')


def safe_parent(path, root):
    current = path
    while current != root.parent:
        if current.is_symlink():
            raise ValueError('路径含符号链接，拒绝越界: ' + str(current))
        if current == root:
            return
        current = current.parent
    raise ValueError('路径不在目标目录内')


def ensure_ignore(directory, rules):
    """Rules precede all private outputs; append to the nearest output directory."""
    path = directory / '.gitignore'
    if path.is_symlink() or (path.exists() and not path.is_file()):
        raise ValueError('不安全的 .gitignore')
    old = path.read_text() if path.exists() else ''
    missing = [rule for rule in rules if rule not in old.splitlines()]
    if missing:
        path.write_text(old.rstrip() + '\n\n# Private user memory\n' + '\n'.join(missing) + '\n')
    if subprocess.run(['git', '-C', str(directory), 'rev-parse', '--show-toplevel'], capture_output=True).returncode == 0:
        for rule in rules:
            sample = rule.lstrip('/').replace('*', 'sample')
            if sample.endswith('/'):
                sample += 'AGENTS.md'
            if subprocess.run(['git', '-C', str(directory), 'check-ignore', '-q', '--no-index', sample]).returncode:
                raise ValueError('忽略规则未生效: ' + rule)


def _collect_members(repo_dir):
    users = repo_dir / USERS_DIR
    safe_parent(users, repo_dir)
    if not users.is_dir():
        if (repo_dir / '.memory').exists():
            raise ValueError(CONVERSION)
        raise ValueError('没有可备份的用户记忆：缺少 .harness/memory/users/')
    members = []
    for base, dirs, files in os.walk(users, followlinks=False, onerror=lambda error: (_ for _ in ()).throw(error)):
        for name in dirs + files:
            path = Path(base) / name
            if path.is_symlink() or not (path.is_dir() or path.is_file()):
                raise ValueError('用户记忆含非普通文件或符号链接: ' + str(path))
        members.extend(Path(base) / name for name in sorted(files))
    if not members:
        raise ValueError('没有可备份的用户记忆文件')
    return members


def backup_user_memory(repo_dir, output_dir=None, timestamp=None):
    repo_dir = Path(repo_dir).expanduser().resolve()
    if not repo_dir.is_dir():
        raise ValueError('仓库目录不存在或不是目录')
    members = _collect_members(repo_dir)
    destination = Path(output_dir or repo_dir).expanduser().resolve()
    if destination.is_relative_to(repo_dir / USERS_DIR):
        raise ValueError('归档不能写入用户记忆正文目录')
    stamp = timestamp or _utc_stamp()
    if not re.fullmatch('[A-Za-z0-9_-]+', stamp):
        raise ValueError('非法时间戳')
    archive = destination / f'user-memory-backup-{stamp}.tar.gz'
    if archive.exists() or archive.is_symlink():
        raise ValueError('归档已存在，拒绝覆盖: ' + str(archive))
    destination.mkdir(parents=True, exist_ok=True)
    ensure_ignore(destination, ['user-memory-backup-*.tar.gz'])
    ensure_ignore(repo_dir, ['/.harness/memory/users/'])
    fd = os.open(archive, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    try:
        with os.fdopen(fd, 'wb') as file:
            with tarfile.open(fileobj=file, mode='w:gz') as handle:
                for path in members:
                    safe_parent(path, repo_dir)
                    handle.add(path, arcname=path.relative_to(repo_dir).as_posix(), recursive=False)
    except BaseException:
        archive.unlink(missing_ok=True)
        raise
    return archive


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--repo-dir', required=True, help='含 .harness/memory/users 的作用域目录')
    parser.add_argument('--output-dir')
    parser.add_argument('--timestamp')
    args = parser.parse_args()
    try:
        archive = backup_user_memory(args.repo_dir, args.output_dir, args.timestamp)
    except (OSError, ValueError, tarfile.TarError) as error:
        print(json.dumps({'ok': False, 'error': str(error)}, ensure_ascii=False))
        return 1
    print(json.dumps({'ok': True, 'archive': str(archive)}, ensure_ascii=False))
    return 0

if __name__ == '__main__':
    raise SystemExit(main())
