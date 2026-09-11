#!/usr/bin/env python3
"""Archive gitignored user memory (USER.md + users/) into a tar.gz."""

from __future__ import annotations

import argparse
import json
import tarfile
from datetime import datetime, timezone
from pathlib import Path


USER_INDEX = Path(".memory") / "USER.md"
USERS_DIR = Path(".memory") / "users"


def _utc_stamp() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")


def _collect_members(repo_dir: Path) -> list[Path]:
    members: list[Path] = []
    index = repo_dir / USER_INDEX
    if index.is_file():
        members.append(index)
    users = repo_dir / USERS_DIR
    if users.is_dir():
        members.extend(sorted(path for path in users.rglob("*") if path.is_file()))
    return members


def backup_user_memory(
    repo_dir: Path,
    output_dir: Path | None = None,
    timestamp: str | None = None,
) -> Path:
    """Pack .memory/USER.md and .memory/users/ if present. Never git add."""
    repo_dir = repo_dir.expanduser().resolve()
    if not repo_dir.is_dir():
        raise ValueError(f"仓库目录不存在或不是目录: {repo_dir}")
    members = _collect_members(repo_dir)
    if not members:
        raise ValueError("没有可备份的用户记忆：缺少 .memory/USER.md 与 .memory/users/ 下的文件")
    destination = (output_dir or repo_dir).expanduser().resolve()
    destination.mkdir(parents=True, exist_ok=True)
    stamp = timestamp or _utc_stamp()
    archive = destination / f"user-memory-backup-{stamp}.tar.gz"
    with tarfile.open(archive, "w:gz") as tar:
        for path in members:
            tar.add(path, arcname=path.relative_to(repo_dir).as_posix())
    return archive


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo-dir", required=True, help="含 .memory/ 的仓库目录")
    parser.add_argument("--output-dir", help="归档目录；默认仓库根")
    parser.add_argument("--timestamp", help="测试用时间戳，形如 20260911T120000Z")
    arguments = parser.parse_args()
    try:
        archive = backup_user_memory(
            Path(arguments.repo_dir),
            Path(arguments.output_dir) if arguments.output_dir else None,
            arguments.timestamp,
        )
    except (OSError, ValueError) as error:
        print(json.dumps({"ok": False, "error": str(error)}, ensure_ascii=False))
        return 1
    print(json.dumps({"ok": True, "archive": str(archive)}, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
