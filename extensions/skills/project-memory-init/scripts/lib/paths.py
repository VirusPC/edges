#!/usr/bin/env python3
"""目录定位与文件落盘。"""

from __future__ import annotations

import os
import tempfile
from pathlib import Path


MEMORY_DIR_NAME = ".memory"
AGENTS_FILE_NAME = "AGENTS.md"

# paths.py 在 lib/ 下：parents[0]=lib, [1]=scripts, [2]=skill 根。
SKILL_DIR = Path(__file__).resolve().parents[2]


def write_atomic(path: Path, content: str) -> None:
    """在同目录写临时文件后原子替换目标。"""
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary_path: str | None = None
    try:
        with tempfile.NamedTemporaryFile(
            "w", encoding="utf-8", dir=path.parent, delete=False
        ) as temporary_file:
            temporary_path = temporary_file.name
            temporary_file.write(content)
        os.replace(temporary_path, path)
    finally:
        if temporary_path and os.path.exists(temporary_path):
            os.unlink(temporary_path)


def resolve_target(raw_target: str) -> Path:
    """解析并校验目标目录。"""
    target = Path(raw_target).expanduser().resolve()
    if not target.is_dir():
        raise ValueError(f"目标目录不存在或不是目录: {target}")
    return target


def resolve_root(target: Path, raw_root: str | None) -> Path:
    """解析记忆根索引所在目录，显式参数优先于自动发现。"""
    if raw_root:
        root = resolve_target(raw_root)
        if target != root and root not in target.parents:
            raise ValueError(f"root-dir 必须是 target-dir 的祖先目录: {root}")
        return root
    for candidate in (target, *target.parents):
        if (candidate / ".git").exists():
            return candidate
    for candidate in target.parents:
        if (candidate / AGENTS_FILE_NAME).is_file():
            return candidate
    return target


def memory_dir(target: Path) -> Path:
    """目标目录的记忆目录。"""
    return target / MEMORY_DIR_NAME


def relative_or_name(path: Path, root: Path) -> str:
    """尽量给出相对记忆根的路径，越界时退回文件名。"""
    try:
        return path.relative_to(root).as_posix()
    except ValueError:
        return path.name


def list_memory_files(target: Path, pattern: str = "*.md") -> list[Path]:
    """列出记忆目录下的 Markdown，按文件名升序以保证 diff 稳定。"""
    directory = memory_dir(target)
    if not directory.is_dir():
        return []
    return sorted(directory.glob(pattern), key=lambda path: path.name)
