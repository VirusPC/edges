#!/usr/bin/env python3
"""AGENTS.md 的维护：本层记忆区块，以及登记下层记忆目录的索引。"""

from __future__ import annotations

import re
from pathlib import Path

from lib.blocks import (
    AUTO_END,
    AUTO_START,
    CHILDREN_END,
    CHILDREN_START,
    INDEX_ENTRY_PATTERN,
    LOCAL_END,
    LOCAL_START,
    OUTER_START,
    block_pattern,
    build_auto_block,
    build_children_block,
    build_local_block,
    insert_inner_block,
    prune_outer_region,
    render_agents_document,
    upsert_block,
)
from lib.paths import AGENTS_FILE_NAME, memory_dir, write_atomic
from lib.templates import ENTRY_LINE_TEMPLATE, render_line


def classify_agents_file(path: Path) -> str:
    """判断 AGENTS.md 的归属：缺失、已受本套管理、或含他人内容。"""
    if not path.is_file():
        return "missing"
    text = path.read_text(encoding="utf-8")
    if any(
        marker in text
        for marker in (OUTER_START, LOCAL_START, CHILDREN_START, AUTO_START)
    ):
        return "managed"
    return "foreign"


def sync_agents_blocks(
    directory: Path, local: str = "", children: str = "", auto: str = ""
) -> str:
    """维护一份 AGENTS.md 的受管区块，只写传进来的那几个。

    含他人内容时不动文件，交给 `$project-memory-doctor`。
    """
    path = directory / AGENTS_FILE_NAME
    state = classify_agents_file(path)
    if state == "foreign":
        return "needs-doctor"
    if state == "missing":
        write_atomic(path, render_agents_document(directory.name, local, children, auto))
        return "created"
    existing = path.read_text(encoding="utf-8")
    updated = existing
    for (start, end), block in (
        ((LOCAL_START, LOCAL_END), local),
        ((CHILDREN_START, CHILDREN_END), children),
        ((AUTO_START, AUTO_END), auto),
    ):
        if block:
            updated = upsert_block(updated, start, end, block)
    if updated == existing:
        return "preserved"
    write_atomic(path, updated)
    return "updated"


def sync_target_agents(target: Path, root: Path) -> str:
    """维护目标目录的 AGENTS.md：本层记忆区块，记忆根再加自动化策略。"""
    return sync_agents_blocks(
        target,
        local=build_local_block(),
        auto=build_auto_block() if target == root else "",
    )


def normalize_index_description(target: Path, description: str | None) -> str:
    """规范化下层索引条目的描述，并为新入口提供通用兜底。"""
    normalized = " ".join(description.split()) if description else ""
    return normalized or f"{target.name} 目录的项目记忆与规范入口。"


def merge_index_entry(
    document: str, relative_agents: str, entry: str, description_given: bool
) -> tuple[str, bool]:
    """把下层入口并进已有的下层索引区块；不传描述时保留已有描述。"""
    pattern = block_pattern(CHILDREN_START, CHILDREN_END)
    block_match = pattern.search(document)
    if block_match is None:
        return insert_inner_block(document, CHILDREN_START, build_children_block(entry)), True
    managed_block = block_match.group(0)
    # 判据和 INDEX_ENTRY_PATTERN 一致：只认链接目标，标签写成什么都不影响。
    entry_pattern = re.compile(
        rf"^- \[[^\]]*\]\({re.escape(relative_agents)}\)(?: — .*)?$", re.MULTILINE
    )
    if entry_pattern.search(managed_block):
        if not description_given:
            return document, False
        updated_block = entry_pattern.sub(lambda _match: entry, managed_block, count=1)
    else:
        updated_block = managed_block.replace(CHILDREN_END, f"{entry}\n{CHILDREN_END}", 1)
    if updated_block == managed_block:
        return document, False
    return pattern.sub(lambda _match: updated_block, document, count=1), True


def ancestors_up_to(start: Path, root: Path) -> list[Path]:
    """从 start 逐层向上直到 root（含两端）。start 不在 root 之下时只返回 start。"""
    if start != root and root not in start.parents:
        return [start]
    return [start, *(p for p in start.parents if p == root or root in p.parents)]


def read_index_entries(path: Path) -> list[tuple[str, str]]:
    """读出一份 AGENTS.md 下层索引里的 (相对路径, 描述)。"""
    if not path.is_file():
        return []
    match = block_pattern(CHILDREN_START, CHILDREN_END).search(
        path.read_text(encoding="utf-8")
    )
    if match is None:
        return []
    return [
        (found.group(1), (found.group(2) or "").strip())
        for found in INDEX_ENTRY_PATTERN.finditer(match.group(0))
    ]


def drop_index_entries(path: Path, relative_paths: set[str]) -> bool:
    """从下层索引里删掉指定条目；一条不剩就连区块带外层一起收掉。"""
    document = path.read_text(encoding="utf-8")
    match = block_pattern(CHILDREN_START, CHILDREN_END).search(document)
    if match is None:
        return False
    kept = [
        found.group(0)
        for found in INDEX_ENTRY_PATTERN.finditer(match.group(0))
        if found.group(1) not in relative_paths
    ]
    replacement = build_children_block("\n".join(kept)) if kept else ""
    updated = document[: match.start()] + replacement + document[match.end() :]
    updated = re.sub(r"\n{3,}", "\n\n", prune_outer_region(updated)).rstrip() + "\n"
    if updated == document:
        return False
    write_atomic(path, updated)
    return True


def find_index_anchor(target: Path, root: Path) -> Path:
    """target 该登记到哪一层：最近的带记忆祖先，一个都没有才落到记忆根。

    索引因此跟随记忆层级而非目录层级——路径上不带记忆的中间目录被跳过，
    不会凭空多出一层只为转发。
    """
    for candidate in target.parents:
        if candidate == root:
            break
        if memory_dir(candidate).is_dir():
            return candidate
    return root


def sync_index_entry(
    anchor: Path, target: Path, description: str | None
) -> tuple[str, str | None, str | None]:
    """把 target 登记进 anchor 的下层索引区块。"""
    if anchor == target:
        return "not-applicable", None, None
    path = anchor / AGENTS_FILE_NAME
    state = classify_agents_file(path)
    relative_agents = (target.relative_to(anchor) / AGENTS_FILE_NAME).as_posix()
    normalized_description = normalize_index_description(target, description)
    if state == "foreign":
        return "needs-doctor", relative_agents, normalized_description
    entry = render_line(
        ENTRY_LINE_TEMPLATE,
        {
            "title": relative_agents,
            "path": relative_agents,
            "description": normalized_description,
        },
    )
    if state == "missing":
        # 记忆根的 AGENTS.md 由 init 先建，所以这里的 anchor 必是中间层。
        write_atomic(
            path,
            render_agents_document(
                anchor.name, build_local_block(), build_children_block(entry), ""
            ),
        )
        return "created", relative_agents, normalized_description
    existing = path.read_text(encoding="utf-8")
    updated, entry_changed = merge_index_entry(
        existing, relative_agents, entry, description is not None
    )
    # 没动条目时不回报描述，避免让调用方以为兜底文案已经写进文件。
    reported_description = normalized_description if entry_changed else None
    if updated == existing:
        return "preserved", relative_agents, reported_description
    write_atomic(path, updated)
    return "updated", relative_agents, reported_description


def rehome_index_entries(target: Path, anchor: Path, root: Path) -> dict[str, list[str]]:
    """把祖先索引里错位的条目搬到该去的那一层。

    两种错位：target 自己的条目留在 anchor 之上（说明 anchor 下沉了），
    以及 target 的子孙条目留在祖先那里（说明 target 刚成为新的 anchor）。
    """
    inherited: list[tuple[Path, str]] = []
    detached: list[str] = []
    for ancestor in ancestors_up_to(target.parent, root):
        agents_path = ancestor / AGENTS_FILE_NAME
        if classify_agents_file(agents_path) != "managed":
            continue
        obsolete: set[str] = set()
        for relative, description in read_index_entries(agents_path):
            entry_dir = (ancestor / relative).parent.resolve()
            if entry_dir == target:
                if ancestor != anchor:
                    obsolete.add(relative)
            elif target in entry_dir.parents:
                obsolete.add(relative)
                inherited.append((entry_dir, description))
        if obsolete and drop_index_entries(agents_path, obsolete):
            detached.extend(f"{ancestor.name}:{relative}" for relative in sorted(obsolete))
    # 子孙条目改登记到 target，走的是和新建入口同一条路径。
    added: list[str] = []
    for entry_dir, description in sorted(inherited):
        action, entry, _description = sync_index_entry(target, entry_dir, description)
        if entry and action not in {"preserved", "not-applicable", "needs-doctor"}:
            added.append(entry)
    return {"inherited": added, "detached": detached}
