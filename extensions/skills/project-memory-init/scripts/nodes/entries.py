#!/usr/bin/env python3
"""记忆文件的读写，以及由它们的 frontmatter 重算出的分类型入口。"""

from __future__ import annotations

import re
from pathlib import Path

from lib.blocks import ENTRIES_END, ENTRIES_START, index_files, upsert_block
from lib.paths import (
    is_external_type,
    list_type_files,
    memory_dir,
    relative_link,
    type_content_dir,
    write_atomic,
)
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

# 正文遵循 Agent Skills 协议的类型：形态是 <name>/SKILL.md，不套普通记忆模板。
# 「用什么格式」和「能不能写」是两回事——skills 两者都占，agent_skills 只占前者，
# 后者由 lib.paths.is_external_type() 判定（内容根在 .memory/ 外的一律只读）。
SKILLS_TYPE = "skills"
AGENT_SKILLS_TYPE = "agent_skills"
AGENT_SKILL_FORMAT_TYPES = frozenset({SKILLS_TYPE, AGENT_SKILLS_TYPE})

# Agent Skills 协议：产物名固定，目录名即 name，kebab-case 且不超过 64 字符。
SKILL_OUTPUT_NAME = "SKILL.md"
SKILL_NAME_PATTERN = re.compile(r"[a-z0-9]+(?:-[a-z0-9]+)*")
SKILL_NAME_MAX = 64

# spec 顶层闭集。实现字段不出现在这里。
SPEC_TOP_LEVEL_KEYS = frozenset(
    {"name", "description", "license", "compatibility", "metadata", "allowed-tools"}
)

# 旧版普通记忆写在 YAML 顶层的实现字段；读仍认，写不再产出。
FLAT_COMPAT_KEYS = frozenset(
    {
        "title",
        "type",
        "originSessionId",
        "agentClient",
        "username",
        "email",
        "updatedAt",
    }
)

# metadata 子键 → 内部字段名。带 edges- 前缀的是当前写法；未加前缀的也能读。
METADATA_KEY_MAP = {
    "edges-title": "title",
    "edges-type": "type",
    "edges-origin-session-id": "originSessionId",
    "edges-agent-client": "agentClient",
    "edges-username": "username",
    "edges-email": "email",
    "edges-updated-at": "updatedAt",
    **{key: key for key in FLAT_COMPAT_KEYS},
}


def memory_entry_types() -> tuple[str, ...]:
    """可由 remember 写入的类型。内容根在 `.memory/` 之外的一律只读。"""
    return tuple(name for name in index_files() if not is_external_type(name))


def entry_output_name(entry_type: str) -> str:
    """这一类的产物名，同时决定用哪份模板（模板名 = 产物名 + .tmpl.md）。"""
    if entry_type in AGENT_SKILL_FORMAT_TYPES:
        return SKILL_OUTPUT_NAME
    return ENTRY_OUTPUT_PATTERN


def entry_name(path: Path, entry_type: str) -> str:
    """条目的 name。skill 的身份是目录名，不是文件名——文件名恒为 SKILL.md。"""
    if entry_type in AGENT_SKILL_FORMAT_TYPES:
        return path.parent.name
    return path.stem


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


def parse_yaml_scalar(raw: str) -> str:
    """解开 yaml_scalar 加上的引号。"""
    value = raw.strip()
    if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
        inner = value[1:-1]
        if value[0] == '"':
            inner = inner.replace('\\"', '"').replace("\\\\", "\\")
        return inner
    return value


def _parse_frontmatter_lines(lines: list[str]) -> dict[str, str]:
    """从 frontmatter 行解析逻辑字段。顶层旧键先填，metadata 后盖，后者赢。"""
    top_level: dict[str, str] = {}
    metadata: dict[str, str] = {}
    in_metadata = False
    for raw_line in lines:
        line = raw_line.rstrip("\r\n")
        if not line.strip():
            continue
        indented = line.startswith((" ", "\t"))
        if indented:
            if not in_metadata:
                continue
            key, separator, raw_value = line.strip().partition(":")
            if not separator:
                continue
            value = parse_yaml_scalar(raw_value)
            if value:
                metadata[key.strip()] = value
            continue
        in_metadata = False
        key, separator, raw_value = line.partition(":")
        if not separator:
            continue
        name = key.strip()
        if name == "metadata":
            in_metadata = True
            continue
        value = parse_yaml_scalar(raw_value)
        if value:
            top_level[name] = value
    fields: dict[str, str] = {}
    for key, value in top_level.items():
        if key in SPEC_TOP_LEVEL_KEYS or key in FLAT_COMPAT_KEYS:
            fields[key] = value
    for key, value in metadata.items():
        internal = METADATA_KEY_MAP.get(key)
        if internal:
            fields[internal] = value
    return fields


def parse_frontmatter(path: Path) -> dict[str, str]:
    """读取 YAML frontmatter 为内部字段名。

    新文件：实现字段在 `metadata.edges-*`。旧文件：同一批字段在顶层。
    两边都有时 metadata 赢。读不出来时返回空字典。
    """
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
        collected: list[str] = []
        try:
            for raw_line in source:
                if raw_line.rstrip("\r\n").strip() == "---":
                    break
                collected.append(raw_line)
        except UnicodeError:
            return {}
    return _parse_frontmatter_lines(collected)


def top_level_frontmatter_keys(path: Path) -> set[str]:
    """frontmatter 里未缩进的键名，用来发现旧版扁平实现字段。"""
    keys: set[str] = set()
    try:
        source = path.open(encoding="utf-8")
    except (OSError, UnicodeError):
        return keys
    with source:
        try:
            first = next(source)
        except (StopIteration, UnicodeError):
            return keys
        if first.strip() != "---":
            return keys
        try:
            for raw_line in source:
                line = raw_line.rstrip("\r\n")
                if line.strip() == "---":
                    break
                if not line.strip() or line.startswith((" ", "\t")):
                    continue
                key, separator, _value = line.partition(":")
                if separator:
                    keys.add(key.strip())
        except UnicodeError:
            return keys
    return keys


def has_legacy_flat_frontmatter(path: Path) -> bool:
    """普通记忆是否还把实现字段写在 YAML 顶层。"""
    return bool(top_level_frontmatter_keys(path) & FLAT_COMPAT_KEYS)


def extract_entry_body(text: str) -> str:
    """取关闭 `---` 之后的正文。"""
    if not text.startswith("---"):
        return text
    rest = text[3:]
    if rest.startswith("\n"):
        rest = rest[1:]
    marker = "\n---"
    index = rest.find(marker)
    if index < 0:
        return text
    body = rest[index + len(marker) :]
    if body.startswith("\n"):
        body = body[1:]
    return body


def ordinary_memory_types() -> tuple[str, ...]:
    """走 type_slug 模板的可写类型，不含 skills。"""
    return tuple(
        name for name in memory_entry_types() if name not in AGENT_SKILL_FORMAT_TYPES
    )


def rewrite_ordinary_header(path: Path) -> bool:
    """把旧扁平文件头收成当前模板，正文 strip 后写回。改了返回 True。"""
    try:
        original = path.read_text(encoding="utf-8")
    except (OSError, UnicodeError):
        return False
    fields = parse_frontmatter(path)
    if "name" not in fields:
        fields["name"] = path.stem
    if "type" not in fields:
        prefix = path.stem.split("_", 1)[0]
        if prefix in ordinary_memory_types():
            fields["type"] = prefix
    body = extract_entry_body(original).strip()
    if not body:
        return False
    updated = render_entry(fields, body, ENTRY_OUTPUT_PATTERN)
    if updated == original:
        return False
    write_atomic(path, updated)
    return True


def render_entry(
    fields: dict[str, str], content: str, output_name: str = ENTRY_OUTPUT_PATTERN
) -> str:
    """渲染单条记忆。frontmatter 的字段清单、顺序与可选性全部由模板决定。"""
    normalized_content = content.strip()
    if not normalized_content:
        raise ValueError("content 不能为空")
    template = read_template(output_name)
    declared = set(PLACEHOLDER_PATTERN.findall(template))
    # 脚本产出了模板没声明的字段时必须报错，否则那个字段会被静默丢掉。
    undeclared = sorted(key for key, value in fields.items() if value and key not in declared)
    if undeclared:
        name = template_path(output_name).name
        raise ValueError(f"{name} 缺少占位符，字段会丢失: {', '.join(undeclared)}")
    values = {key: yaml_scalar(value) for key, value in fields.items() if value}
    values["content"] = normalized_content
    return fill_placeholders(template, values).rstrip() + "\n"


def resolve_memory_path(target: Path, entry_type: str, slug: str | None) -> Path:
    """把类型与 slug 映射为唯一的条目文件路径。"""
    if entry_type not in memory_entry_types():
        raise ValueError(f"--type 不支持由 remember 写入: {entry_type}")
    normalized = (slug or "").strip().lower()
    directory = type_content_dir(target, entry_type)
    if entry_type in AGENT_SKILL_FORMAT_TYPES:
        # Agent Skills 协议要求 name 等于目录名，所以 slug 直接当目录名用。
        if not SKILL_NAME_PATTERN.fullmatch(normalized) or len(normalized) > SKILL_NAME_MAX:
            raise ValueError(
                f"--slug 在 {entry_type} 里是技能目录名，必须是 kebab-case 且不超过 "
                f"{SKILL_NAME_MAX} 字符，例如 rerun-failed-e2e"
            )
        return directory / normalized / SKILL_OUTPUT_NAME
    if not re.fullmatch(r"[a-z0-9]+(?:_[a-z0-9]+)*", normalized):
        raise ValueError("--slug 必须是小写 snake_case，例如 reuse_existing_constants")
    if normalized.startswith(tuple(f"{name}_" for name in index_files())):
        raise ValueError("--slug 不要带类型前缀，脚本会按 --type 自动加上")
    return directory / f"{entry_type}_{normalized}.md"


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
    agent_skill = entry_type in AGENT_SKILL_FORMAT_TYPES
    # title 可能来自旧顶层键或 metadata.edges-title，parse_frontmatter 已经摊平。
    resolved_title = (title or existing.get("title") or "").strip()
    resolved_description = (description or existing.get("description") or "").strip()
    # Agent Skills 没有 title 这个概念，给了就存进 metadata，不给也不拦。
    if not resolved_title and not agent_skill:
        raise ValueError("新建记忆必须提供 --title")
    if not resolved_description:
        raise ValueError("新建记忆必须提供 --description")
    fields = {
        "name": name,
        "title": resolved_title,
        "description": resolved_description,
    }
    # skill 的类型由它所在的位置决定，写进 frontmatter 只会多一个 spec 不认的顶层键。
    if not agent_skill:
        fields["type"] = entry_type
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
    if entry_type in AGENT_SKILL_FORMAT_TYPES:
        # skill 目录的内部形状属于外部协议；这里只保留一个很薄的当前格式适配器。
        paths = list_type_files(target, entry_type, f"*/{SKILL_OUTPUT_NAME}")
    else:
        paths = list_type_files(target, entry_type, f"{entry_type}_*.md")
    for path in paths:
        fields = parse_frontmatter(path)
        name = entry_name(path, entry_type)
        title = fields.get("title") or fields.get("name") or name
        description = fields.get("description") or "缺少 description，请补齐 frontmatter。"
        entries.append(
            render_line(
                ENTRY_LINE_TEMPLATE,
                {
                    "title": title,
                    # 外部类型的内容根在 .memory/ 外，链接必须能带 `../` 越界。
                    "path": relative_link(path, directory),
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
