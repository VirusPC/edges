#!/usr/bin/env python3
"""目录定位与文件落盘。"""

from __future__ import annotations

import os
import tempfile
from pathlib import Path


MEMORY_DIR_NAME = ".memory"
AGENTS_FILE_NAME = "AGENTS.md"

# 生态标准的 skill 位置。本套工具只读它，绝不写。
AGENTS_DIR_NAME = ".agents"

# 内容根不在 .memory/ 下的类型：type → 相对目标目录的路径片段。
# 只有这一张表能让内容根越出 .memory/，越界带来的读写差别由调用方各自处理。
EXTERNAL_CONTENT_DIRS = {"agent_skills": (AGENTS_DIR_NAME, "skills")}

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


def type_dir_name(entry_type: str) -> str:
    """类型内容目录名：复数，与 `skills/` 对齐。

    `--type`、索引文件名、条目前缀仍用单数。已经以 s 结尾的类型名
    （目前是 `skills`）不再追加。
    """
    return entry_type if entry_type.endswith("s") else f"{entry_type}s"


def is_external_type(entry_type: str) -> bool:
    """内容根是否在 `.memory/` 之外。外部类型一律只读，工具不往里写。"""
    return entry_type in EXTERNAL_CONTENT_DIRS


def type_content_dir(target: Path, entry_type: str) -> Path:
    """目标目录里某一类型的内容根。

    默认是 `.memory/<复数>`；`EXTERNAL_CONTENT_DIRS` 里的类型改挂到目标目录下别处。
    映射必须优先于 `type_dir_name()`——`agent_skills` 结尾是 `s`，不加复数也会
    落到 `.memory/agent_skills`，靠这张表才拨回 `.agents/skills`。
    """
    external = EXTERNAL_CONTENT_DIRS.get(entry_type)
    if external is not None:
        return target.joinpath(*external)
    return memory_dir(target) / type_dir_name(entry_type)


def legacy_type_dir(target: Path, entry_type: str) -> Path | None:
    """旧版「目录名 = type 原值」的位置；与当前目录不同且存在时才返回。"""
    if is_external_type(entry_type) or type_dir_name(entry_type) == entry_type:
        return None
    path = memory_dir(target) / entry_type
    return path if path.exists() else None


def relative_or_name(path: Path, root: Path) -> str:
    """尽量给出相对记忆根的路径，越界时退回文件名。"""
    try:
        return path.relative_to(root).as_posix()
    except ValueError:
        return path.name


def relative_link(path: Path, base: Path) -> str:
    """索引条目里的链接路径：相对 base，允许 `../` 越界。

    与 `relative_or_name()` 的区别是越界处理——那个退回文件名（够用于报告），
    这个必须给出真能点开的路径，因为外部类型的内容根就在 `.memory/` 外面。
    """
    return Path(os.path.relpath(path, base)).as_posix()


def list_memory_files(target: Path, pattern: str = "*.md") -> list[Path]:
    """递归列出记忆目录下的 Markdown，按相对路径排序以保证 diff 稳定。"""
    directory = memory_dir(target)
    if not directory.is_dir():
        return []
    return sorted(
        directory.rglob(pattern),
        key=lambda path: path.relative_to(directory).as_posix(),
    )


def list_type_files(
    target: Path, entry_type: str, pattern: str = "*.md", *, recursive: bool = False
) -> list[Path]:
    """列出某一类型内容根里的文件；是否递归由该类型的适配器决定。"""
    directory = type_content_dir(target, entry_type)
    if not directory.is_dir():
        return []
    paths = directory.rglob(pattern) if recursive else directory.glob(pattern)
    return sorted(paths, key=lambda path: path.relative_to(directory).as_posix())
