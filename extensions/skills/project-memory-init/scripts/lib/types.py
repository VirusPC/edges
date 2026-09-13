#!/usr/bin/env python3
"""Memory Type 种子与本层发现。类型集合在 LAYOUT 产物里，不在 JSON 注册表。"""

from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path

from lib.blocks import (
    ENTRIES_START,
    LOCAL_END,
    LOCAL_START,
    MEMORY_INDEX_LINK_PATTERN,
    block_pattern,
    index_files,
)
from lib.paths import AGENTS_FILE_NAME, is_external_type, memory_dir

SEED_TYPE_NAMES: tuple[str, ...] = (
    "user",
    "feedback",
    "project",
    "reference",
    "skills",
    "agent_skills",
)
TYPE_NAME_PATTERN = re.compile(r"^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$")
TYPE_INDEX_NAME_PATTERN = re.compile(r"^[A-Z][A-Z0-9_]*\.md$")


@dataclass(frozen=True)
class TypeSpec:
    name: str
    index_file: str
    description: str = ""
    writable: bool = True
    gitignore: bool = False
    format: str = "ordinary"


def seed_index_files() -> dict[str, str]:
    """官方 init 种子：仍从 AGENTS.tmpl.md 推导。"""
    return index_files()


def index_file_name(entry_type: str) -> str:
    return f"{entry_type.upper()}.md"


def validate_type_name(entry_type: str) -> str:
    name = (entry_type or "").strip()
    if name.lower() in SEED_TYPE_NAMES:
        raise ValueError(f"不能用 add-type 登记官方种子类型: {name.lower()}")
    if not TYPE_NAME_PATTERN.fullmatch(name):
        raise ValueError(
            "--name 必须是小写 snake_case，例如 docs 或 my_type，不能用 kebab-case"
        )
    return name


def discover_layer_types(target: Path) -> dict[str, str]:
    """从该层 AGENTS.md 本层清单 + `.memory/*.md` 入口产物发现 type → 入口文件名。"""
    types: dict[str, str] = {}
    agents = target / AGENTS_FILE_NAME
    if agents.is_file():
        match = block_pattern(LOCAL_START, LOCAL_END).search(
            agents.read_text(encoding="utf-8")
        )
        if match:
            for raw in MEMORY_INDEX_LINK_PATTERN.findall(match.group(0)):
                types[raw.lower()] = f"{raw}.md"
    directory = memory_dir(target)
    if directory.is_dir():
        for path in sorted(directory.glob("*.md")):
            if not TYPE_INDEX_NAME_PATTERN.fullmatch(path.name):
                continue
            try:
                text = path.read_text(encoding="utf-8")
            except (OSError, UnicodeError):
                continue
            if ENTRIES_START not in text:
                continue
            types.setdefault(path.stem.lower(), path.name)
    return types


def layer_writable_types(target: Path) -> tuple[str, ...]:
    return tuple(
        name for name in discover_layer_types(target) if not is_external_type(name)
    )
