#!/usr/bin/env python3
"""Memory Type 种子与本层发现。类型集合在 LAYOUT 产物里，不在 JSON 注册表。"""

from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path

from lib.blocks import (
    ENTRIES_START,
    LEGACY_FLAT_INDEX_LINK_PATTERN,
    LOCAL_END,
    LOCAL_START,
    MEMORY_INDEX_LINK_PATTERN,
    TYPE_META_END,
    TYPE_META_START,
    block_pattern,
    build_local_block,
    index_files,
)
from lib.paths import (
    AGENTS_FILE_NAME,
    MEMORY_DIR_NAME,
    is_external_type,
    memory_dir,
    type_dir_name,
    type_from_dir_name,
    type_index_relpath,
)
from lib.templates import ENTRY_LINE_TEMPLATE, render_line

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


def type_index_template_name(entry_type: str) -> str:
    """Type-entry template stem (FEEDBACK.tmpl.md). Not the layer AGENTS.tmpl.md."""
    return f"{entry_type.upper()}.md"


def index_file_name(entry_type: str) -> str:
    return type_index_relpath(entry_type)


def validate_type_name(entry_type: str) -> str:
    name = (entry_type or "").strip()
    if name.lower() in SEED_TYPE_NAMES:
        raise ValueError(f"不能用 add-type 登记官方种子类型: {name.lower()}")
    if not TYPE_NAME_PATTERN.fullmatch(name):
        raise ValueError(
            "--name 必须是小写 snake_case，例如 docs 或 my_type，不能用 kebab-case"
        )
    return name


def _type_name_from_index_text(text: str, dir_name: str) -> str:
    parsed = parse_type_meta(text)
    if parsed is not None and parsed.name:
        return parsed.name
    return type_from_dir_name(dir_name)


def leftover_flat_index_names(directory: Path) -> list[str]:
    """`.memory/` 根部仍平铺的 `TYPE.md` 入口名（含条目区块）。"""
    if not directory.is_dir():
        return []
    names: list[str] = []
    for path in sorted(directory.glob("*.md")):
        if not TYPE_INDEX_NAME_PATTERN.fullmatch(path.name):
            continue
        try:
            text = path.read_text(encoding="utf-8")
        except (OSError, UnicodeError):
            continue
        if ENTRIES_START in text:
            names.append(path.name)
    return names


def discover_layer_types(target: Path) -> dict[str, str]:
    """从该层 AGENTS.md 本层清单 + `.memory/<plural>/AGENTS.md` 发现 type → 入口路径。

    尚未 doctor 的平铺 `.memory/TYPE.md` 也认，入口路径仍指向旧文件，
    直到 doctor 搬到 `<plural>/AGENTS.md`。新入口一旦在磁盘上就覆盖旧路径。
    """
    types: dict[str, str] = {}
    agents = target / AGENTS_FILE_NAME
    directory = memory_dir(target)

    def add(name: str, rel: str, *, overwrite: bool = False) -> None:
        if overwrite or name not in types:
            types[name] = rel

    if agents.is_file():
        match = block_pattern(LOCAL_START, LOCAL_END).search(
            agents.read_text(encoding="utf-8")
        )
        if match:
            block = match.group(0)
            for dir_name in MEMORY_INDEX_LINK_PATTERN.findall(block):
                rel = f"{dir_name}/{AGENTS_FILE_NAME}"
                path = directory / rel
                name = type_from_dir_name(dir_name)
                leftover = directory / f"{name.upper()}.md"
                if path.is_file():
                    try:
                        name = _type_name_from_index_text(
                            path.read_text(encoding="utf-8"), dir_name
                        )
                    except (OSError, UnicodeError):
                        name = type_from_dir_name(dir_name)
                    add(name, rel)
                elif leftover.is_file() and leftover.name in leftover_flat_index_names(
                    directory
                ):
                    add(name, leftover.name)
                else:
                    add(name, rel)
            for stem in LEGACY_FLAT_INDEX_LINK_PATTERN.findall(block):
                name = stem.lower()
                leftover = f"{stem}.md"
                dest_rel = type_index_relpath(name)
                if (directory / dest_rel).is_file():
                    add(name, dest_rel, overwrite=True)
                elif (directory / leftover).is_file():
                    add(name, leftover)
    if directory.is_dir():
        for name in leftover_flat_index_names(directory):
            add(Path(name).stem.lower(), name)
        for path in sorted(directory.glob(f"*/{AGENTS_FILE_NAME}")):
            try:
                text = path.read_text(encoding="utf-8")
            except (OSError, UnicodeError):
                continue
            if ENTRIES_START not in text:
                continue
            dir_name = path.parent.name
            rel = f"{dir_name}/{AGENTS_FILE_NAME}"
            add(_type_name_from_index_text(text, dir_name), rel, overwrite=True)
    return types


def parse_type_meta(text: str) -> TypeSpec | None:
    match = block_pattern(TYPE_META_START, TYPE_META_END).search(text)
    if match is None:
        return None
    fields: dict[str, str] = {}
    for raw in match.group(0).splitlines():
        key, sep, value = raw.partition(":")
        if sep:
            fields[key.strip()] = value.strip()
    name = fields.get("name", "")
    if not name:
        return None
    return TypeSpec(
        name=name,
        index_file=index_file_name(name),
        description=fields.get("description", ""),
        writable=fields.get("writable", "true") != "false",
        gitignore=fields.get("gitignore", "false") == "true",
        format=fields.get("format", "ordinary"),
    )


def layer_type_specs(target: Path) -> list[TypeSpec]:
    specs: list[TypeSpec] = []
    for name, file_name in discover_layer_types(target).items():
        path = memory_dir(target) / file_name
        parsed = None
        if path.is_file():
            try:
                parsed = parse_type_meta(path.read_text(encoding="utf-8"))
            except (OSError, UnicodeError):
                parsed = None
        if parsed is not None:
            specs.append(parsed)
            continue
        specs.append(
            TypeSpec(
                name=name,
                index_file=file_name,
                description="",
                writable=not is_external_type(name),
                gitignore=name == "user",
                format="skills" if name in {"skills", "agent_skills"} else "ordinary",
            )
        )
    return specs


def layer_writable_types(target: Path) -> tuple[str, ...]:
    return tuple(spec.name for spec in layer_type_specs(target) if spec.writable)


def reject_unwritable_type(target: Path, entry_type: str) -> str:
    """remember / CLI 拒绝写入时的错误文案。"""
    specs = {spec.name: spec for spec in layer_type_specs(target)}
    spec = specs.get(entry_type)
    if spec is not None and not spec.writable:
        return f"--type {entry_type} 只索引，不能 remember"
    writable = layer_writable_types(target)
    return (
        f"--type 未在该层登记为可写类型: {entry_type}。"
        f"已登记可写类型: {', '.join(writable) or '(none)'}"
    )


def gitignore_patterns(entry_type: str) -> tuple[str, ...]:
    legacy_flat = f"{entry_type.upper()}.md"
    plural = type_dir_name(entry_type)
    return (
        f".memory/{legacy_flat}",
        f".memory/{plural}/",
        f"**/.memory/{legacy_flat}",
        f"**/.memory/{plural}/",
    )


def find_git_root(start: Path) -> Path | None:
    for candidate in (start, *start.parents):
        if (candidate / ".git").exists():
            return candidate
    return None


def ensure_type_gitignore(repo_root: Path, entry_type: str) -> str:
    gitignore = repo_root / ".gitignore"
    if not (repo_root / ".git").exists():
        return "skipped-no-git"
    existing = gitignore.read_text(encoding="utf-8") if gitignore.is_file() else ""
    missing = [pattern for pattern in gitignore_patterns(entry_type) if pattern not in existing]
    if not missing:
        return "preserved"
    block = "\n".join(
        [
            f"# Memory type {entry_type} (project-memory-add-type)",
            *missing,
        ]
    )
    updated = existing.rstrip() + "\n\n" + block + "\n"
    gitignore.write_text(updated, encoding="utf-8")
    return "updated"


def drop_legacy_flat_index_lines(document: str) -> str:
    """删掉本层清单里旧的 `.memory/TYPE.md` 行。"""
    match = block_pattern(LOCAL_START, LOCAL_END).search(document)
    if match is None:
        return document
    updated_block = re.sub(
        rf"^- \[[^\]]*\]\({re.escape(MEMORY_DIR_NAME)}/[A-Z][A-Z0-9_]*\.md\)(?: — .*)?\n?",
        "",
        match.group(0),
        flags=re.MULTILINE,
    )
    return document[: match.start()] + updated_block + document[match.end() :]


def upsert_local_type_line(document: str, index_file: str, description: str) -> str:
    """插入或保留 `.memory/<plural>/AGENTS.md` 行，从不删除其它 type 行。"""
    relative = f".memory/{index_file}"
    line = render_line(
        ENTRY_LINE_TEMPLATE,
        {"title": relative, "path": relative, "description": description},
    )
    match = block_pattern(LOCAL_START, LOCAL_END).search(document)
    if match is None:
        raise ValueError("AGENTS.md 缺少本层记忆区块，请先 init")
    block = match.group(0)
    entry_pattern = re.compile(
        rf"^- \[[^\]]*\]\({re.escape(relative)}\)(?: — .*)?$",
        re.MULTILINE,
    )
    if entry_pattern.search(block):
        return document
    updated_block = block.replace(LOCAL_END, f"{line}\n{LOCAL_END}", 1)
    return document[: match.start()] + updated_block + document[match.end() :]


def ensure_seed_local_lines(document: str) -> str:
    """补上缺失的种子行，不删除额外 type 行；顺手收掉旧平铺链接。"""
    if block_pattern(LOCAL_START, LOCAL_END).search(document) is None:
        return document
    document = drop_legacy_flat_index_lines(document)
    seed_block = build_local_block()
    for dir_name in MEMORY_INDEX_LINK_PATTERN.findall(seed_block):
        desc_match = re.search(
            rf"\]\(\.memory/{re.escape(dir_name)}/{re.escape(AGENTS_FILE_NAME)}\)(?: — (.*))?$",
            seed_block,
            re.MULTILINE,
        )
        description = (desc_match.group(1) if desc_match else "").strip()
        document = upsert_local_type_line(
            document, f"{dir_name}/{AGENTS_FILE_NAME}", description
        )
    return document
