#!/usr/bin/env python3
"""整棵记忆树的体检与修复：单次 init 看不见的索引不一致。"""

from __future__ import annotations

from pathlib import Path

from lib.blocks import (
    AUTO_END,
    AUTO_START,
    IMPORTANT_END,
    IMPORTANT_START,
    LOCAL_END,
    LOCAL_START,
    MEMORY_INDEX_LINK_PATTERN,
    block_pattern,
    build_auto_block,
    build_important_block,
    build_local_block,
    index_files,
    prune_outer_region,
    upsert_block,
)
from lib.paths import (
    AGENTS_FILE_NAME,
    MEMORY_DIR_NAME,
    legacy_type_dir,
    memory_dir,
    relative_or_name,
    type_dir,
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
from nodes.entries import expected_index_document, memory_entry_types, refresh_index


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


def scan_memory_layout(root: Path, memory_dirs: list[Path]) -> list[dict[str, str]]:
    """检查每层 .memory/ 是否符合当前 LAYOUT；不读取条目正文。"""
    findings: list[dict[str, str]] = []
    expected_indexes = [Path(name).stem for name in index_files().values()]
    for owner in memory_dirs:
        directory = memory_dir(owner)
        for entry_type, file_name in index_files().items():
            content_dir = type_dir(owner, entry_type)
            stale = legacy_type_dir(owner, entry_type)
            if stale is not None:
                issue = (
                    "legacy-type-dir-conflict"
                    if content_dir.exists()
                    else "legacy-singular-type-dir"
                )
                detail = (
                    "新旧类型目录都在，无法自动决定保留哪份"
                    if content_dir.exists()
                    else "旧版单数类型目录需要改名为复数"
                )
                findings.append(
                    {
                        "issue": issue,
                        "path": relative_or_name(stale, root),
                        "destination": relative_or_name(content_dir, root),
                        "detail": detail,
                    }
                )
            if content_dir.exists() and not content_dir.is_dir():
                findings.append(
                    {
                        "issue": "invalid-type-dir",
                        "path": relative_or_name(content_dir, root),
                        "detail": "类型内容路径存在但不是目录，无法自动修复",
                    }
                )
            elif not content_dir.is_dir() and stale is None:
                findings.append(
                    {
                        "issue": "missing-type-dir",
                        "path": relative_or_name(content_dir, root),
                        "detail": "缺少类型内容目录",
                    }
                )

            index_path = directory / file_name
            if index_path.exists() and not index_path.is_file():
                findings.append(
                    {
                        "issue": "invalid-index",
                        "path": relative_or_name(index_path, root),
                        "detail": "类型入口路径存在但不是文件，无法自动修复",
                    }
                )
            elif not index_path.is_file():
                findings.append(
                    {
                        "issue": "missing-index",
                        "path": relative_or_name(index_path, root),
                        "type": entry_type,
                        "detail": "缺少类型入口文件",
                    }
                )
            elif index_path.read_text(encoding="utf-8") != expected_index_document(
                owner, entry_type
            ):
                findings.append(
                    {
                        "issue": "outdated-index",
                        "path": relative_or_name(index_path, root),
                        "type": entry_type,
                        "detail": "类型入口与当前内容目录不一致，需要全量重算",
                    }
                )

        for entry_type in memory_entry_types():
            for source in sorted(directory.glob(f"{entry_type}_*.md")):
                destination = type_dir(owner, entry_type) / source.name
                issue = (
                    "legacy-entry-conflict"
                    if destination.exists()
                    else "legacy-flat-entry"
                )
                detail = (
                    "新旧位置都有同名文件，无法自动决定保留哪份"
                    if destination.exists()
                    else "旧版平铺记忆文件需要移入对应类型目录"
                )
                findings.append(
                    {
                        "issue": issue,
                        "path": relative_or_name(source, root),
                        "destination": relative_or_name(destination, root),
                        "detail": detail,
                    }
                )

        agents_path = owner / AGENTS_FILE_NAME
        agents_state = classify_agents_file(agents_path)
        if agents_state == "missing":
            findings.append(
                {
                    "issue": "missing-agents",
                    "path": relative_or_name(agents_path, root),
                    "detail": "记忆目录缺少 AGENTS.md 入口",
                }
            )
        elif agents_state == "managed":
            document = agents_path.read_text(encoding="utf-8")
            match = block_pattern(LOCAL_START, LOCAL_END).search(document)
            actual_indexes = (
                MEMORY_INDEX_LINK_PATTERN.findall(match.group(0)) if match else []
            )
            if actual_indexes != expected_indexes:
                findings.append(
                    {
                        "issue": "outdated-local",
                        "path": relative_or_name(agents_path, root),
                        "detail": "本层记忆入口清单与当前布局不一致",
                    }
                )
            if IMPORTANT_START not in document:
                findings.append(
                    {
                        "issue": "missing-important",
                        "path": relative_or_name(agents_path, root),
                        "detail": "记忆目录缺少本层硬约束区块",
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
    findings.extend(scan_memory_layout(root, memory_dirs))
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
    local_repairs = {
        finding["path"]
        for finding in findings
        if finding["issue"] in {"missing-agents", "outdated-local"}
    }
    for finding in findings:
        if finding["issue"] not in {"legacy-flat-entry", "legacy-singular-type-dir"}:
            continue
        source = root / finding["path"]
        destination = root / finding["destination"]
        if destination.exists():
            continue
        if finding["issue"] == "legacy-flat-entry":
            if not source.is_file():
                continue
            destination.parent.mkdir(parents=True, exist_ok=True)
        elif not source.is_dir():
            continue
        source.rename(destination)
        repaired.append(
            f"{finding['issue']}: {finding['path']} 移到 {finding['destination']}"
        )

    for finding in findings:
        issue = finding["issue"]
        if issue == "missing-type-dir":
            path = root / finding["path"]
            if not path.exists():
                path.mkdir(parents=True, exist_ok=True)
                repaired.append(f"missing-type-dir: {finding['path']} 补建目录")
            continue
        if issue in {
            "legacy-flat-entry",
            "legacy-entry-conflict",
            "legacy-singular-type-dir",
            "legacy-type-dir-conflict",
            "invalid-type-dir",
            "missing-index",
            "invalid-index",
            "outdated-index",
            "outdated-local",
            "missing-agents",
        }:
            continue
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
        elif issue == "missing-important":
            action = sync_agents_blocks(owner)
            if action in {"created", "updated"}:
                repaired.append(f"{issue}: {finding['path']} 补上硬约束区块，已有规则原样保留")
        elif issue == "foreign-agents":
            # 唯一一处往他人文件里写的地方：只补挂受管区块，既有正文一字不动。
            document = agents_path.read_text(encoding="utf-8")
            updated = document
            if memory_dir(owner).is_dir():
                updated = upsert_block(
                    updated, IMPORTANT_START, IMPORTANT_END, build_important_block()
                )
                updated = upsert_block(updated, LOCAL_START, LOCAL_END, build_local_block())
            if owner == root:
                updated = upsert_block(updated, AUTO_START, AUTO_END, build_auto_block())
            if updated != document:
                write_atomic(agents_path, prune_outer_region(updated).rstrip() + "\n")
                repaired.append(f"{issue}: {finding['path']} 补挂受管区块，既有正文原样保留")

    # 迁移完成后才重算入口；否则旧版平铺文件会在索引里暂时消失。
    for owner in discover_memory_dirs(root):
        content_dirs_valid = True
        for entry_type in index_files():
            directory = type_dir(owner, entry_type)
            if directory.exists() and not directory.is_dir():
                content_dirs_valid = False
                continue
            directory.mkdir(parents=True, exist_ok=True)
        if not content_dirs_valid:
            continue
        for entry_type, file_name in index_files().items():
            index_path = memory_dir(owner) / file_name
            if index_path.exists() and not index_path.is_file():
                continue
            action = refresh_index(owner, entry_type)
            if action in {"created", "updated"}:
                repaired.append(
                    f"{action}-index: {relative_or_name(index_path, root)}"
                )
        agents_path = owner / AGENTS_FILE_NAME
        relative_agents = relative_or_name(agents_path, root)
        if relative_agents in local_repairs:
            local_action = sync_agents_blocks(
                owner,
                local=build_local_block(),
                auto=build_auto_block() if owner == root else "",
            )
            if local_action in {"created", "updated"}:
                repaired.append(
                    f"{local_action}-agents: {relative_agents} 刷新入口清单"
                )

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
