#!/usr/bin/env python3
"""remember 操作：写入一条记忆，并重算它牵动的索引。"""

from __future__ import annotations

from pathlib import Path

from lib.blocks import index_files
from lib.paths import AGENTS_FILE_NAME, memory_dir, resolve_root, write_atomic
from lib.provenance import AUDIT_FIELDS, ORIGIN_FIELDS, agent_context, git_identity
from nodes.agents import sync_target_agents
from nodes.entries import (
    build_entry_fields,
    parse_frontmatter,
    refresh_index,
    render_entry,
    resolve_memory_path,
)


def remember(
    target: Path,
    entry_type: str,
    slug: str | None,
    title: str | None,
    description: str | None,
    content: str,
    overrides: dict[str, str],
) -> dict[str, object]:
    """沉淀单条项目记忆，然后重算索引与 AGENTS.md 区块。"""
    if not memory_dir(target).is_dir() or not (target / AGENTS_FILE_NAME).is_file():
        raise ValueError("目标目录尚未初始化，请先执行 init")
    path = resolve_memory_path(target, entry_type, slug)
    action = "updated" if path.exists() else "created"
    existing = parse_frontmatter(path) if path.exists() else {}
    detected = {**agent_context(), **git_identity(target)}
    fields = build_entry_fields(
        path.stem, entry_type, title, description, existing, detected, overrides
    )
    write_atomic(path, render_entry(fields, content))
    # 全部索引一起重算：AGENTS.md 的记忆区块静态声明了它们都在，缺一个就是死链。
    for declared_type in index_files():
        refresh_index(target, declared_type)
    agents_action = sync_target_agents(target, resolve_root(target, None))
    index_path = memory_dir(target) / index_files()[entry_type]
    provenance_keys = (*ORIGIN_FIELDS, *AUDIT_FIELDS)
    return {
        "operation": "remember",
        "targetDir": str(target),
        "type": entry_type,
        "name": path.stem,
        "title": fields["title"],
        "path": path.relative_to(target).as_posix(),
        "index": index_path.relative_to(target).as_posix(),
        "action": action,
        "agentsAction": agents_action,
        "provenance": {key: fields[key] for key in provenance_keys if key in fields},
    }
