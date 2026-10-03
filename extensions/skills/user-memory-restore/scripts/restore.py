#!/usr/bin/env python3
"""Restore a new-layout user archive; --force replaces the private subtree."""
from __future__ import annotations
import argparse
import json
import os
from pathlib import Path, PurePosixPath
import shutil
import stat
import sys
import tarfile
import tempfile

BACKUP_SCRIPTS = Path(__file__).resolve().parents[2] / 'user-memory-backup/scripts'
sys.path.insert(0, str(BACKUP_SCRIPTS))
from backup import USERS_DIR, CONVERSION, ensure_ignore, safe_parent

PREFIX = USERS_DIR.as_posix() + '/'
EMPTY_ENTRY = '- 暂无条目。'


def _safe_members(tar, repo_dir, force=False):
    members, seen = [], set()
    safe_parent(repo_dir / USERS_DIR.parent, repo_dir)
    for info in tar.getmembers():
        name = info.name.replace('\\', '/')
        if name.startswith('./'):
            name = name[2:]
        parts = PurePosixPath(name).parts
        if '..' in parts or name.startswith('/') or not name:
            raise ValueError('归档含非法路径: ' + name)
        if name.startswith('.memory/'):
            raise ValueError(CONVERSION)
        if not name.startswith(PREFIX):
            raise ValueError('归档含非用户记忆路径: ' + name)
        if not info.isfile():
            raise ValueError('归档含非普通文件成员: ' + name)
        normalized = PurePosixPath(name).as_posix()
        if normalized in seen:
            raise ValueError('归档含重复路径: ' + normalized)
        seen.add(normalized)
        info.name = normalized
        if not force:
            safe_parent(repo_dir / normalized, repo_dir)
        members.append(info)
    if not members:
        raise ValueError('归档里没有 .harness/memory/users/ 成员')
    for name in seen:
        if any(parent.as_posix() in seen for parent in PurePosixPath(name).parents):
            raise ValueError('归档路径既是文件又是目录: ' + name)
    return members


def user_memory_occupied(repo_dir):
    users = repo_dir / USERS_DIR
    if users.is_symlink():
        return True
    if not users.exists():
        return False
    if not users.is_dir():
        return True
    for path in users.rglob('*'):
        if path.name != 'AGENTS.md' or path.parent != users:
            return True
        if path.is_symlink() or not path.is_file():
            return True
        text = path.read_text()
        start, end = '<!-- project-memory-entries:start -->', '<!-- project-memory-entries:end -->'
        if start not in text or end not in text:
            return bool(text.strip())
        block = text.split(start, 1)[1].split(end, 1)[0]
        if any(line.strip() not in {'', EMPTY_ENTRY} for line in block.splitlines()):
            return True
    return False


def restore_user_memory(archive, repo_dir, force=False):
    archive = Path(archive).expanduser().resolve()
    repo_dir = Path(repo_dir).expanduser().resolve()
    if not archive.is_file() or not repo_dir.is_dir():
        raise ValueError('归档或目标目录不存在')
    users = repo_dir / USERS_DIR
    if archive.is_relative_to(users):
        raise ValueError('先将归档移到待替换 users 目录之外')
    safe_parent(users.parent, repo_dir)
    # Read and stage the entire archive before clearing any old data. Temporary
    # extraction is owner-only and outside the target Git tree.
    with tarfile.open(archive, 'r:*') as tar:
        members = _safe_members(tar, repo_dir, force)
        if user_memory_occupied(repo_dir) and not force:
            raise ValueError('目标已有用户记忆，拒绝覆盖；确认后加 --force（替换，不合并）')
        with tempfile.TemporaryDirectory(prefix='private-user-memory-') as raw:
            staging = Path(raw)
            staging.chmod(0o700)
            for info in members:
                dest = staging / info.name
                dest.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
                source = tar.extractfile(info)
                if source is None:
                    raise ValueError('无法读取归档成员')
                with source, dest.open('xb') as handle:
                    shutil.copyfileobj(source, handle)
                dest.chmod(stat.S_IMODE(info.mode) & 0o777)
            ensure_ignore(repo_dir, ['/.harness/memory/users/'])
            if force and (users.exists() or users.is_symlink()):
                if users.is_symlink() or not users.is_dir():
                    users.unlink()
                else:
                    shutil.rmtree(users)
            for info in members:
                dest = repo_dir / info.name
                safe_parent(dest, repo_dir)
                dest.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(staging / info.name, dest)
    return {'archive': str(archive), 'repoDir': str(repo_dir), 'extracted': [info.name for info in members], 'indexRefresh': 'preserved-archive-index'}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--archive', required=True)
    parser.add_argument('--repo-dir', required=True)
    parser.add_argument('--force', action='store_true', help='替换整个 users 子树，不合并')
    args = parser.parse_args()
    try:
        result = restore_user_memory(args.archive, args.repo_dir, args.force)
    except (OSError, ValueError, tarfile.TarError) as error:
        print(json.dumps({'ok': False, 'error': str(error)}, ensure_ascii=False))
        return 1
    print(json.dumps({'ok': True, **result}, ensure_ascii=False))
    return 0

if __name__ == '__main__':
    raise SystemExit(main())
