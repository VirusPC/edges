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
    TYPE_META_END,
    TYPE_META_START,
    block_pattern,
    build_local_block,
    index_files,
)
from lib.paths import AGENTS_FILE_NAME, is_external_type, memory_dir, type_dir_name
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
    index_name = index_file_name(entry_type)
    plural = type_dir_name(entry_type)
    return (
        f".memory/{index_name}",
        f".memory/{plural}/",
        f"**/.memory/{index_name}",
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


def upsert_local_type_line(document: str, index_file: str, description: str) -> str:
    """插入或保留 `.memory/FOO.md` 行，从不删除其它 type 行。"""
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
    """补上缺失的种子行，不删除额外 type 行。"""
    if block_pattern(LOCAL_START, LOCAL_END).search(document) is None:
        return document
    seed_block = build_local_block()
    for raw in MEMORY_INDEX_LINK_PATTERN.findall(seed_block):
        desc_match = re.search(
            rf"\]\(\.memory/{re.escape(raw)}\.md\)(?: — (.*))?$",
            seed_block,
            re.MULTILINE,
        )
        description = (desc_match.group(1) if desc_match else "").strip()
        document = upsert_local_type_line(document, f"{raw}.md", description)
    return document
