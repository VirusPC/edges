#!/usr/bin/env python3
"""init 操作：在一个目录上幂等建起记忆与索引。"""

from __future__ import annotations

from pathlib import Path

from lib.blocks import build_auto_block, index_files, load_agents_template
from lib.paths import (
    AGENTS_FILE_NAME,
    list_memory_files,
    memory_dir,
    type_dir,
    write_atomic,
)
from lib.templates import ENTRY_OUTPUT_PATTERN, read_template
from nodes.agents import (
    find_index_anchor,
    rehome_index_entries,
    sync_agents_blocks,
    sync_index_entry,
    sync_target_agents,
)
from nodes.entries import memory_entry_types, refresh_index


def init_memory(target: Path, root: Path, description: str | None = None) -> dict[str, object]:
    """幂等初始化索引文件与 AGENTS.md 区块。模板全部校验通过后才动文件。"""
    load_agents_template()
    templates = {name: read_template(name) for name in index_files().values()}
    read_template(ENTRY_OUTPUT_PATTERN)
    directory = memory_dir(target)
    legacy = (
        sorted(
            path.name
            for entry_type in memory_entry_types()
            for path in directory.glob(f"{entry_type}_*.md")
        )
        if directory.is_dir()
        else []
    )
    if legacy:
        raise ValueError(
            "检测到旧版平铺记忆文件，请先运行 project-memory-doctor 迁移: "
            + ", ".join(legacy)
        )
    directory.mkdir(parents=True, exist_ok=True)
    for entry_type in index_files():
        type_dir(target, entry_type).mkdir(parents=True, exist_ok=True)
    created: list[str] = []
    preserved: list[str] = []
    for name, template in templates.items():
        path = directory / name
        if path.exists():
            preserved.append(path.relative_to(target).as_posix())
            continue
        write_atomic(path, template)
        created.append(path.relative_to(target).as_posix())
    for entry_type in index_files():
        refresh_index(target, entry_type)
    agents_action = sync_target_agents(target, root)
    # 先建记忆根的 AGENTS.md，anchor 可能就是它。
    auto_action = sync_agents_blocks(root, auto=build_auto_block())
    anchor = find_index_anchor(target, root)
    rehomed = rehome_index_entries(target, anchor, root)
    index_action, index_entry, index_description = sync_index_entry(
        anchor, target, description
    )
    return {
        "operation": "init",
        "targetDir": str(target),
        "memoryDir": str(directory),
        "agentsMd": str(target / AGENTS_FILE_NAME),
        "agentsAction": agents_action,
        "rootDir": str(root),
        "rootAgentsMd": str(root / AGENTS_FILE_NAME),
        "autoAction": auto_action,
        "indexAnchor": str(anchor),
        "indexAction": index_action,
        "indexEntry": index_entry,
        "indexDescription": index_description,
        "inheritedEntries": rehomed["inherited"],
        "detachedEntries": rehomed["detached"],
        "created": created,
        "preserved": preserved,
        "memoryFiles": [
            path.relative_to(target).as_posix() for path in list_memory_files(target)
        ],
    }
