#!/usr/bin/env python3
"""add-type：在指定记忆目录按 LAYOUT 登记一个 Memory Type。"""

from __future__ import annotations

from pathlib import Path

from lib.paths import (
    AGENTS_FILE_NAME,
    memory_dir,
    type_content_dir,
    write_atomic,
)
from lib.templates import read_index_template
from lib.types import (
    ensure_type_gitignore,
    find_git_root,
    index_file_name,
    type_index_template_name,
    upsert_local_type_line,
    validate_type_name,
)
from nodes.agents import classify_agents_file
from nodes.entries import refresh_index


def add_type(
    target: Path,
    entry_type: str,
    description: str,
    *,
    gitignore: bool = False,
    writable: bool = True,
    format: str = "ordinary",
    external_content_dir: tuple[str, ...] | None = None,
) -> dict[str, object]:
    if external_content_dir is not None:
        raise ValueError(
            "external content root is stubbed this round; "
            "only official agent_skills may live outside .memory/"
        )
    name = validate_type_name(entry_type)
    normalized = " ".join((description or "").split())
    if not normalized:
        raise ValueError("add-type 必须提供 --description")
    if format not in {"ordinary", "skills"}:
        raise ValueError("format 只能是 ordinary 或 skills")
    if not memory_dir(target).is_dir() or classify_agents_file(
        target / AGENTS_FILE_NAME
    ) != "managed":
        raise ValueError("目标目录尚未初始化，请先执行 init")

    index_name = index_file_name(name)
    index_path = memory_dir(target) / index_name
    content_dir = type_content_dir(target, name)
    existed = index_path.is_file()
    if not existed:
        write_atomic(
            index_path,
            read_index_template(
                type_index_template_name(name),
                name,
                normalized,
                flags={
                    "gitignore": "true" if gitignore else "false",
                    "writable": "true" if writable else "false",
                    "format": format,
                },
            ),
        )
    if writable:
        content_dir.mkdir(parents=True, exist_ok=True)
    refresh_index(target, name)

    agents_path = target / AGENTS_FILE_NAME
    before = agents_path.read_text(encoding="utf-8")
    after = upsert_local_type_line(before, index_name, normalized)
    if after != before:
        write_atomic(agents_path, after)
        agents_action = "updated"
    else:
        agents_action = "preserved"

    gitignore_action = None
    if gitignore:
        repo_root = find_git_root(target)
        if repo_root is None:
            gitignore_action = "skipped-no-git"
        else:
            gitignore_action = ensure_type_gitignore(repo_root, name)

    rel_index = index_path.relative_to(target).as_posix()
    rel_dir = content_dir.relative_to(target).as_posix()
    return {
        "operation": "add-type",
        "targetDir": str(target),
        "type": name,
        "index": rel_index,
        "contentDir": rel_dir,
        "agentsAction": agents_action,
        "action": "preserved" if existed else "created",
        "gitignoreAction": gitignore_action,
        "flags": {
            "gitignore": gitignore,
            "writable": writable,
            "format": format,
            "gitignoreAction": gitignore_action,
        },
    }
