#!/usr/bin/env python3
"""整棵记忆树的体检与修复：单次 init 看不见的索引不一致。"""

from __future__ import annotations

from pathlib import Path

from lib.blocks import (
    AUTO_END,
    AUTO_START,
    LOCAL_END,
    LOCAL_START,
    build_auto_block,
    build_local_block,
    upsert_block,
)
from lib.paths import (
    AGENTS_FILE_NAME,
    MEMORY_DIR_NAME,
    memory_dir,
    relative_or_name,
    write_atomic,
)
from nodes.agents import (
    classify_agents_file,
    drop_index_entries,
    find_index_anchor,
    read_index_entries,
    sync_agents_blocks,
    sync_index_entry,
)


def is_noise_path(parts: tuple[str, ...]) -> bool:
    """路径里有隐藏目录（`.memory` 本身除外）或 node_modules 就当噪声跳过。"""
    return any(
        (part.startswith(".") and part != MEMORY_DIR_NAME) or part == "node_modules"
        for part in parts
    )


def discover_memory_dirs(root: Path) -> list[Path]:
    """扫出记忆根下所有带记忆的目录。"""
    found = [root] if memory_dir(root).is_dir() else []
    for path in sorted(root.rglob(MEMORY_DIR_NAME)):
        owner = path.parent
        if path.is_dir() and owner != root and not is_noise_path(path.relative_to(root).parts):
            found.append(owner)
    return found


def scan_index_entries(
    root: Path, holders: list[Path], owned: set[Path]
) -> tuple[list[dict[str, str]], dict[Path, list[tuple[Path, str]]]]:
    """逐份 AGENTS.md 查下层索引：认不出的文件，和指向已无记忆目录的死条目。

    顺带记下每个被登记的目录由哪几层登记、条目里写的描述是什么，
    交给 scan_registrations 判断错位与重复——那一步改登记时要照原样带走描述。
    """
    findings: list[dict[str, str]] = []
    seen: dict[Path, list[tuple[Path, str]]] = {}
    for holder in holders:
        agents_path = holder / AGENTS_FILE_NAME
        state = classify_agents_file(agents_path)
        if state == "foreign":
            findings.append(
                {
                    "issue": "foreign-agents",
                    "path": relative_or_name(agents_path, root),
                    "detail": "有 AGENTS.md 但不含本套受管标记，需要补挂受管区块",
                }
            )
            continue
        if state == "missing":
            continue
        for relative, description in read_index_entries(agents_path):
            entry_dir = (holder / relative).parent.resolve()
            if entry_dir not in owned:
                findings.append(
                    {
                        "issue": "dead-entry",
                        "path": relative_or_name(agents_path, root),
                        "entry": relative,
                        "detail": "条目指向的目录已经没有记忆了",
                    }
                )
                continue
            seen.setdefault(entry_dir, []).append((holder, description))
    return findings, seen


def scan_registrations(
    root: Path, memory_dirs: list[Path], seen: dict[Path, list[tuple[Path, str]]]
) -> list[dict[str, str]]:
    """逐个记忆目录查它登记在哪：没人登记、登记错层、还是被多处重复登记。"""
    findings: list[dict[str, str]] = []
    for directory in memory_dirs:
        if directory == root:
            continue
        anchor = find_index_anchor(directory, root)
        holders = seen.get(directory, [])
        if not holders:
            findings.append(
                {
                    "issue": "unregistered",
                    "path": relative_or_name(directory, root),
                    "detail": f"有记忆但没有任何索引登记它，应登记到 {relative_or_name(anchor, root)}",
                }
            )
            continue
        for holder, description in holders:
            if holder == anchor:
                continue
            findings.append(
                {
                    "issue": "misplaced" if len(holders) == 1 else "duplicate",
                    "path": relative_or_name(holder / AGENTS_FILE_NAME, root),
                    "entry": (directory.relative_to(holder) / AGENTS_FILE_NAME).as_posix(),
                    "description": description,
                    "detail": f"应该登记在 {relative_or_name(anchor, root)}",
                }
            )
    return findings


def collect_findings(root: Path) -> list[dict[str, str]]:
    """扫全树，找出单次 init 看不见的索引不一致。

    只诊断不修改；修复由 apply_findings 按同一份结论执行。
    """
    memory_dirs = discover_memory_dirs(root)
    owned = set(memory_dirs)
    # 记忆根即使自己没有 .memory/，也可能只持有索引区块，所以必须在扫描范围内。
    holders = memory_dirs if root in owned else [root, *memory_dirs]
    findings, seen = scan_index_entries(root, holders, owned)
    findings.extend(scan_registrations(root, memory_dirs, seen))
    root_agents = root / AGENTS_FILE_NAME
    if classify_agents_file(root_agents) == "managed":
        if AUTO_START not in root_agents.read_text(encoding="utf-8"):
            findings.append(
                {
                    "issue": "missing-auto",
                    "path": relative_or_name(root_agents, root),
                    "detail": "记忆根缺少自动化策略区块",
                }
            )
    return findings


def register(directory: Path, root: Path, description: str | None, issue: str) -> list[str]:
    """把一个目录登记回该去的那一层；没实际改动就不进修复清单。"""
    anchor = find_index_anchor(directory, root)
    action, _entry, _description = sync_index_entry(anchor, directory, description)
    if action in {"preserved", "not-applicable"}:
        return []
    verb = "改登记到" if issue == "misplaced" else "登记到"
    return [
        f"{issue}: {relative_or_name(directory, root)} {verb} "
        f"{relative_or_name(anchor, root) or '.'}"
    ]


def apply_findings(root: Path, findings: list[dict[str, str]]) -> list[str]:
    """按诊断结论修复，分三段执行。

    先做全部删除与区块修补，再把错位条目登记回正确层级，最后重扫补掉仍未登记的。
    分段是必需的：`misplaced` 删掉后就变成未登记，同一次遍历里看不到这个新状态。
    `foreign` 只补挂受管区块，绝不改动既有正文。
    """
    repaired: list[str] = []
    displaced: list[tuple[Path, str]] = []
    for finding in findings:
        issue = finding["issue"]
        agents_path = root / finding["path"]
        owner = agents_path.parent
        if issue in {"dead-entry", "misplaced", "duplicate"}:
            if issue == "misplaced":
                entry_dir = (owner / finding["entry"]).parent
                displaced.append((entry_dir, finding.get("description", "")))
            if drop_index_entries(agents_path, {finding["entry"]}):
                repaired.append(f"{issue}: {finding['path']} 移除 {finding['entry']}")
        elif issue == "missing-auto":
            sync_agents_blocks(owner, auto=build_auto_block())
            repaired.append(f"{issue}: {finding['path']} 补上策略区块")
        elif issue == "foreign-agents":
            # 唯一一处往他人文件里写的地方：只补挂受管区块，既有正文一字不动。
            document = agents_path.read_text(encoding="utf-8")
            updated = document
            if memory_dir(owner).is_dir():
                updated = upsert_block(updated, LOCAL_START, LOCAL_END, build_local_block())
            if owner == root:
                updated = upsert_block(updated, AUTO_START, AUTO_END, build_auto_block())
            if updated != document:
                write_atomic(agents_path, updated.rstrip() + "\n")
                repaired.append(f"{issue}: {finding['path']} 补挂受管区块，既有正文原样保留")
    for directory, description in displaced:
        repaired.extend(register(directory.resolve(), root, description or None, "misplaced"))
    # 重扫补登记：既覆盖原本就未登记的，也覆盖上一段删除后新暴露出来的。
    for finding in collect_findings(root):
        if finding["issue"] == "unregistered":
            directory = (root / finding["path"]).resolve()
            repaired.extend(register(directory, root, None, "unregistered"))
    return repaired


def doctor_memory(root: Path, apply: bool) -> dict[str, object]:
    """体检整棵记忆树。默认只诊断，apply 为真才写。"""
    findings = collect_findings(root)
    repaired = apply_findings(root, findings) if apply else []
    remaining = collect_findings(root) if apply else findings
    return {
        "operation": "doctor",
        "rootDir": str(root),
        "applied": apply,
        "memoryDirs": [
            relative_or_name(path, root) or "." for path in discover_memory_dirs(root)
        ],
        "findings": findings,
        "repaired": repaired,
        "remaining": remaining,
    }
