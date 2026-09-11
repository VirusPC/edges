#!/usr/bin/env python3
"""Restore gitignored user memory from a backup archive into a repo."""

from __future__ import annotations

import argparse
import json
import sys
import tarfile
from pathlib import Path


ALLOWED_INDEX = ".memory/USER.md"
ALLOWED_USERS_PREFIX = ".memory/users/"
EMPTY_ENTRY = "- 暂无条目。"

INIT_SCRIPTS = (
    Path(__file__).resolve().parents[2] / "project-memory-init" / "scripts"
)


def _normalize_member_name(name: str) -> str:
    normalized = name.replace("\\", "/")
    if normalized.startswith("./"):
        normalized = normalized[2:]
    return normalized


def _destination_for_member(repo_dir: Path, name: str) -> Path:
    """Resolve dest path and require it stay under repo .memory/."""
    memory_root = (repo_dir / ".memory").resolve()
    destination = (repo_dir / name).resolve()
    try:
        destination.relative_to(memory_root)
    except ValueError as error:
        raise ValueError(f"归档成员会写到 .memory/ 之外: {name}") from error
    return destination


def _safe_members(tar: tarfile.TarFile, repo_dir: Path) -> list[tarfile.TarInfo]:
    """Keep only regular files under USER.md / users/. Fail closed on specials."""
    kept: list[tarfile.TarInfo] = []
    for info in tar.getmembers():
        name = _normalize_member_name(info.name)
        info.name = name
        if ".." in Path(name).parts or Path(name).is_absolute():
            raise ValueError(f"归档含非法路径: {info.name}")
        allowed = name == ALLOWED_INDEX or name.startswith(ALLOWED_USERS_PREFIX)
        if not allowed:
            continue
        if not info.isfile():
            raise ValueError(f"归档含非普通文件成员: {info.name}")
        _destination_for_member(repo_dir, name)
        kept.append(info)
    if not kept:
        raise ValueError("归档里没有 .memory/USER.md 或 .memory/users/ 成员")
    return kept


def _clear_user_memory(repo_dir: Path) -> None:
    """Replace semantics: drop dest USER.md and everything under users/."""
    users = repo_dir / ".memory" / "users"
    if users.exists():
        for path in sorted(users.rglob("*"), reverse=True):
            if path.is_symlink() or path.is_file():
                path.unlink()
            elif path.is_dir():
                path.rmdir()
        if users.exists():
            users.rmdir()
    index = repo_dir / ".memory" / "USER.md"
    if index.exists() or index.is_symlink():
        index.unlink()


def _extract_regular_file(
    tar: tarfile.TarFile, info: tarfile.TarInfo, repo_dir: Path
) -> None:
    destination = _destination_for_member(repo_dir, info.name)
    destination.parent.mkdir(parents=True, exist_ok=True)
    source = tar.extractfile(info)
    if source is None:
        raise ValueError(f"无法读取归档成员: {info.name}")
    with source, destination.open("wb") as handle:
        handle.write(source.read())


def user_memory_occupied(repo_dir: Path) -> bool:
    """True when dest already has user entries (empty init index does not count)."""
    users = repo_dir / ".memory" / "users"
    if users.is_dir() and any(path.is_file() for path in users.glob("user_*.md")):
        return True
    index = repo_dir / ".memory" / "USER.md"
    if not index.is_file():
        return False
    text = index.read_text(encoding="utf-8")
    start = "<!-- project-memory-entries:start -->"
    end = "<!-- project-memory-entries:end -->"
    if start not in text or end not in text:
        return bool(text.strip())
    body = text[text.index(start) + len(start) : text.index(end)]
    lines = [
        line.strip()
        for line in body.splitlines()
        if line.strip() and not line.strip().startswith("<!--")
    ]
    return any(line != EMPTY_ENTRY for line in lines)


def _refresh_user_index(repo_dir: Path) -> str:
    if not (repo_dir / "AGENTS.md").is_file() or not (repo_dir / ".memory").is_dir():
        return "skipped"
    scripts = str(INIT_SCRIPTS)
    if scripts not in sys.path:
        sys.path.insert(0, scripts)
    from nodes.entries import refresh_index  # noqa: E402

    return refresh_index(repo_dir, "user")


def restore_user_memory(
    archive: Path, repo_dir: Path, force: bool = False
) -> dict[str, object]:
    """Reinject USER.md and users/. --force replaces dest user memory, it does not merge."""
    archive = archive.expanduser().resolve()
    repo_dir = repo_dir.expanduser().resolve()
    if not archive.is_file():
        raise ValueError(f"归档不存在或不是文件: {archive}")
    if not repo_dir.is_dir():
        raise ValueError(f"目标仓库不存在或不是目录: {repo_dir}")
    if user_memory_occupied(repo_dir) and not force:
        raise ValueError("目标已有用户记忆条目，拒绝覆盖；确认后加 --force（替换，不合并）")
    extracted: list[str] = []
    with tarfile.open(archive, "r:*") as tar:
        members = _safe_members(tar, repo_dir)
        if force:
            _clear_user_memory(repo_dir)
        for info in members:
            _extract_regular_file(tar, info, repo_dir)
            extracted.append(info.name)
    refresh = _refresh_user_index(repo_dir)
    return {
        "archive": str(archive),
        "repoDir": str(repo_dir),
        "extracted": extracted,
        "indexRefresh": refresh,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--archive", required=True, help="user-memory-backup-*.tar.gz 路径")
    parser.add_argument("--repo-dir", required=True, help="要回注的仓库目录")
    parser.add_argument(
        "--force",
        action="store_true",
        help="目标已有用户记忆时整份替换（清空 users/ 与 USER.md 再解压），不合并",
    )
    arguments = parser.parse_args()
    try:
        result = restore_user_memory(
            Path(arguments.archive), Path(arguments.repo_dir), arguments.force
        )
    except (OSError, ValueError, tarfile.TarError) as error:
        print(json.dumps({"ok": False, "error": str(error)}, ensure_ascii=False))
        return 1
    print(json.dumps({"ok": True, **result}, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
