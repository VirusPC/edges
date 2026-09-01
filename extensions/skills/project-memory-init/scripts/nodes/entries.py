#!/usr/bin/env python3
"""记忆文件的读写，以及由它们的 frontmatter 重算出的分类型入口。"""

from __future__ import annotations

import re
from pathlib import Path

from lib.blocks import ENTRIES_END, ENTRIES_START, index_files, upsert_block
from lib.paths import list_memory_files, memory_dir, write_atomic
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
        lines = path.read_text(encoding="utf-8").splitlines()
    except (OSError, UnicodeError):
        return {}
    if not lines or lines[0].strip() != "---":
        return {}
    fields: dict[str, str] = {}
    for line in lines[1:]:
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
    normalized = (slug or "").strip().lower()
    if not re.fullmatch(r"[a-z0-9]+(?:_[a-z0-9]+)*", normalized):
        raise ValueError("--slug 必须是小写 snake_case，例如 reuse_existing_constants")
    if normalized.startswith(tuple(f"{name}_" for name in index_files())):
        raise ValueError("--slug 不要带类型前缀，脚本会按 --type 自动加上")
    return memory_dir(target) / f"{entry_type}_{normalized}.md"


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
    for path in list_memory_files(target, f"{entry_type}_*.md"):
        fields = parse_frontmatter(path)
        title = fields.get("title") or path.stem
        description = fields.get("description") or "缺少 description，请补齐 frontmatter。"
        entries.append(
            render_line(
                ENTRY_LINE_TEMPLATE,
                {"title": title, "path": path.name, "description": description},
            )
        )
    if not entries:
        entries = ["- 暂无条目。"]
    return "\n".join([ENTRIES_START, "\n".join(entries), ENTRIES_END])


def refresh_index(target: Path, entry_type: str) -> str:
    """刷新索引文件里的条目清单；索引文件缺失时先按模板补建。"""
    file_name = index_files()[entry_type]
    path = memory_dir(target) / file_name
    existed = path.is_file()
    existing = path.read_text(encoding="utf-8") if existed else read_template(file_name)
    updated = upsert_block(
        existing, ENTRIES_START, ENTRIES_END, build_entry_index(target, entry_type)
    )
    updated = updated.rstrip() + "\n"
    if not existed:
        write_atomic(path, updated)
        return "created"
    if updated != existing:
        write_atomic(path, updated)
        return "updated"
    return "preserved"
