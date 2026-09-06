#!/usr/bin/env python3
"""记忆文件的读写，以及由它们的 frontmatter 重算出的分类型入口。"""

from __future__ import annotations

import re
from pathlib import Path

from lib.blocks import ENTRIES_END, ENTRIES_START, index_files, upsert_block
from lib.paths import list_type_files, memory_dir, type_dir, write_atomic
from lib.provenance import AUDIT_FIELDS, ORIGIN_FIELDS, now_timestamp
from lib.templates import (
    ENTRY_LINE_TEMPLATE,
    ENTRY_OUTPUT_PATTERN,
    PLACEHOLDER_PATTERN,
    fill_placeholders,
    read_template,
    render_line,
    template_path,
)


# YAML 里只在标量首字符才有特殊含义的指示符。
YAML_INDICATORS = "-?:,[]{}#&*!|>'\"%@`"

# 不加引号就会被解析成布尔、空值、数字或时间戳的字面量。
YAML_TYPED = re.compile(
    r"^(?:true|false|yes|no|on|off|null|~|[+-]?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|\d{4}-\d{2}-\d{2}.*)$",
    re.IGNORECASE,
)

# 这类入口由本套索引，但正文遵循外部协议，不能套普通记忆模板。
SKILLS_TYPE = "skills"
EXTERNAL_ENTRY_TYPES = frozenset({SKILLS_TYPE})


def memory_entry_types() -> tuple[str, ...]:
    """可由 remember 写入的普通记忆类型。"""
    return tuple(name for name in index_files() if name not in EXTERNAL_ENTRY_TYPES)


def yaml_scalar(value: str) -> str:
    """把单行文本渲染成 YAML 标量，只在真会歧义时加引号。"""
    text = " ".join(str(value).split())
    if not text:
        return '""'
    needs_quote = (
        text[0] in YAML_INDICATORS
        or ": " in text
        or " #" in text
        or text.endswith(":")
        or bool(YAML_TYPED.match(text))
    )
    if not needs_quote:
        return text
    escaped = text.replace("\\", "\\\\").replace('"', '\\"')
    return f'"{escaped}"'


def parse_frontmatter(path: Path) -> dict[str, str]:
    """读取扁平 YAML frontmatter；没有 frontmatter 或读不出来时返回空字典。"""
    try:
        source = path.open(encoding="utf-8")
    except (OSError, UnicodeError):
        return {}
    with source:
        try:
            first = next(source)
        except (StopIteration, UnicodeError):
            return {}
        if first.strip() != "---":
            return {}
        fields: dict[str, str] = {}
        try:
            for raw_line in source:
                line = raw_line.rstrip("\r\n")
                if line.strip() == "---":
                    break
                if not line.strip() or line.startswith((" ", "\t")):
                    continue
                key, separator, raw_value = line.partition(":")
                if not separator:
                    continue
                value = raw_value.strip()
                if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
                    value = value[1:-1]
                if value:
                    fields[key.strip()] = value
        except UnicodeError:
            return {}
    return fields


def render_entry(fields: dict[str, str], content: str) -> str:
    """渲染单条记忆。frontmatter 的字段清单、顺序与可选性全部由模板决定。"""
    normalized_content = content.strip()
    if not normalized_content:
        raise ValueError("content 不能为空")
    template = read_template(ENTRY_OUTPUT_PATTERN)
    declared = set(PLACEHOLDER_PATTERN.findall(template))
    # 脚本产出了模板没声明的字段时必须报错，否则那个字段会被静默丢掉。
    undeclared = sorted(key for key, value in fields.items() if value and key not in declared)
    if undeclared:
        name = template_path(ENTRY_OUTPUT_PATTERN).name
        raise ValueError(f"{name} 缺少占位符，字段会丢失: {', '.join(undeclared)}")
    values = {key: yaml_scalar(value) for key, value in fields.items() if value}
    values["content"] = normalized_content
    return fill_placeholders(template, values).rstrip() + "\n"


def resolve_memory_path(target: Path, entry_type: str, slug: str | None) -> Path:
    """把类型与 slug 映射为唯一的条目文件路径。"""
    if entry_type not in memory_entry_types():
        raise ValueError(f"--type 不支持由 remember 写入: {entry_type}")
    normalized = (slug or "").strip().lower()
    if not re.fullmatch(r"[a-z0-9]+(?:_[a-z0-9]+)*", normalized):
        raise ValueError("--slug 必须是小写 snake_case，例如 reuse_existing_constants")
    if normalized.startswith(tuple(f"{name}_" for name in index_files())):
        raise ValueError("--slug 不要带类型前缀，脚本会按 --type 自动加上")
    return type_dir(target, entry_type) / f"{entry_type}_{normalized}.md"


def build_entry_fields(
    name: str,
    entry_type: str,
    title: str | None,
    description: str | None,
    existing: dict[str, str],
    detected: dict[str, str],
    overrides: dict[str, str],
) -> dict[str, str]:
    """组装 frontmatter。显式覆盖优先级最高，其余按字段语义决定谁胜出。"""
    resolved_title = (title or existing.get("title") or "").strip()
    resolved_description = (description or existing.get("description") or "").strip()
    if not resolved_title:
        raise ValueError("新建记忆必须提供 --title")
    if not resolved_description:
        raise ValueError("新建记忆必须提供 --description")
    fields = {
        "name": name,
        "title": resolved_title,
        "description": resolved_description,
        "type": entry_type,
    }
    # 出处字段记的是「谁最先写的」，所以已有值胜过本次探测值。
    for key in ORIGIN_FIELDS:
        value = overrides.get(key) or existing.get(key) or detected.get(key)
        if value:
            fields[key] = value
    # 审计字段记的是「谁最后改的」，所以本次探测值胜过已有值；探测不到才沿用旧值。
    for key in AUDIT_FIELDS:
        value = overrides.get(key) or detected.get(key) or existing.get(key)
        if value:
            fields[key] = value
    fields["updatedAt"] = now_timestamp()
    return fields


def build_entry_index(target: Path, entry_type: str) -> str:
    """从全部条目文件的 frontmatter 重算某个索引的条目清单。"""
    entries: list[str] = []
    directory = memory_dir(target)
    if entry_type == SKILLS_TYPE:
        # skills/ 的内部形状属于外部协议；这里只保留一个很薄的当前格式适配器。
        paths = list_type_files(target, entry_type, "*/SKILL.md")
    else:
        paths = list_type_files(target, entry_type, f"{entry_type}_*.md")
    for path in paths:
        fields = parse_frontmatter(path)
        title = fields.get("title") or fields.get("name") or path.stem
        description = fields.get("description") or "缺少 description，请补齐 frontmatter。"
        entries.append(
            render_line(
                ENTRY_LINE_TEMPLATE,
                {
                    "title": title,
                    "path": path.relative_to(directory).as_posix(),
                    "description": description,
                },
            )
        )
    if not entries:
        entries = ["- 暂无条目。"]
    return "\n".join([ENTRIES_START, "\n".join(entries), ENTRIES_END])


def expected_index_document(target: Path, entry_type: str) -> str:
    """计算索引目标态但不落盘，供 refresh 与 doctor 共用。"""
    file_name = index_files()[entry_type]
    path = memory_dir(target) / file_name
    existing = (
        path.read_text(encoding="utf-8")
        if path.is_file()
        else read_template(file_name)
    )
    updated = upsert_block(
        existing, ENTRIES_START, ENTRIES_END, build_entry_index(target, entry_type)
    )
    return updated.rstrip() + "\n"


def refresh_index(target: Path, entry_type: str) -> str:
    """刷新索引文件里的条目清单；索引文件缺失时先按模板补建。"""
    file_name = index_files()[entry_type]
    path = memory_dir(target) / file_name
    existed = path.is_file()
    existing = path.read_text(encoding="utf-8") if existed else ""
    updated = expected_index_document(target, entry_type)
    if not existed:
        write_atomic(path, updated)
        return "created"
    if updated != existing:
        write_atomic(path, updated)
        return "updated"
    return "preserved"
