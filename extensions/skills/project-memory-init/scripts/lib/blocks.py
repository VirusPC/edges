#!/usr/bin/env python3
"""受管区块：标记、嵌套顺序，以及区块级的读写。

全部标记都在这一份文件里，与 references/LAYOUT.md 的区块表一一对应。
"""

from __future__ import annotations

import re
from functools import lru_cache

from lib.paths import AGENTS_FILE_NAME, MEMORY_DIR_NAME
from lib.templates import read_template, template_path


# AGENTS.md 里本套工具独占的整块区域；下面几个区块全部嵌在它里面。
OUTER_START = "<!-- project-memory:start -->"
OUTER_END = "<!-- project-memory:end -->"

# 本层记忆：分类型入口的清单。
LOCAL_START = "<!-- project-memory-local:start -->"
LOCAL_END = "<!-- project-memory-local:end -->"

# 下层记忆：直接下层记忆目录的 AGENTS.md 索引。
CHILDREN_START = "<!-- project-memory-children:start -->"
CHILDREN_END = "<!-- project-memory-children:end -->"

# 仅记忆根：自动检索与沉淀策略。
AUTO_START = "<!-- project-memory-auto:start -->"
AUTO_END = "<!-- project-memory-auto:end -->"

# 索引文件内条目清单的区块边界。
ENTRIES_START = "<!-- project-memory-entries:start -->"
ENTRIES_END = "<!-- project-memory-entries:end -->"

# 外层区域内部的规范顺序，与模板一致；补写缺失区块时按它定位。
# 外层是唯一的顶层区块，所以顶层不需要顺序表。
INNER_BLOCK_ORDER = (LOCAL_START, CHILDREN_START, AUTO_START)

# 下层索引里的一个条目，写入形态见 entry_line.tmpl.md。路径从链接目标取而不是从
# 标签取：标签带不带反引号都能解析，旧文件和手写条目一样认。
INDEX_ENTRY_PATTERN = re.compile(r"^- \[[^\]]*\]\(([^)]+)\)(?: — (.*))?$", re.MULTILINE)

# 记忆区块里声明索引文件的那几行，形如 ](.memory/FEEDBACK.md)；索引文件名全大写。
MEMORY_INDEX_LINK_PATTERN = re.compile(
    rf"\]\({re.escape(MEMORY_DIR_NAME)}/([A-Z][A-Z0-9_]*)\.md\)"
)


@lru_cache(maxsize=None)
def load_agents_template() -> str:
    """读 AGENTS.md 模板，并校验四对区块标记都在、不重复、且嵌套与顺序正确。

    标记序列同时编码了嵌套，所以逐个标记比位置就能一次校验完。
    """
    template = read_template(AGENTS_FILE_NAME)
    name = template_path(AGENTS_FILE_NAME).name
    position = -1
    for marker in (
        OUTER_START,
        LOCAL_START,
        LOCAL_END,
        CHILDREN_START,
        CHILDREN_END,
        AUTO_START,
        AUTO_END,
        OUTER_END,
    ):
        found = template.find(marker)
        if found < 0:
            raise ValueError(f"{name} 缺少区块标记: {marker}")
        if template.count(marker) != 1:
            raise ValueError(f"{name} 区块标记重复: {marker}")
        if found < position:
            raise ValueError(f"{name} 区块标记顺序错误: {marker}")
        position = found
    return template


@lru_cache(maxsize=None)
def index_files() -> dict[str, str]:
    """type → 索引文件名，从本层记忆区块声明的那几行推导。

    普通记忆类型只需加一行与同名入口模板；外部格式类型还要提供薄适配。
    """
    names = MEMORY_INDEX_LINK_PATTERN.findall(extract_block(LOCAL_START, LOCAL_END))
    if not names:
        raise ValueError(
            f"{template_path(AGENTS_FILE_NAME).name} 的本层记忆区块里没有声明任何索引文件"
        )
    return {name.lower(): f"{name}.md" for name in dict.fromkeys(names)}


def block_pattern(start: str, end: str) -> re.Pattern[str]:
    """匹配一整个受管区块，含首尾标记。"""
    return re.compile(re.escape(start) + r".*?" + re.escape(end), re.DOTALL)


def extract_block(start: str, end: str) -> str:
    """从整份模板里切出某个受管区块，含首尾标记。"""
    match = block_pattern(start, end).search(load_agents_template())
    if match is None:
        raise ValueError(f"无法从 {template_path(AGENTS_FILE_NAME).name} 切出区块: {start}")
    return match.group(0)


def append_block(text: str, block: str) -> str:
    """把区块追加到文末。"""
    return f"{text.rstrip()}\n\n{block}"


def prune_outer_region(document: str) -> str:
    """规范化外层区域的内部留白；内层区块一个都不剩就连外层一起去掉。"""
    match = block_pattern(OUTER_START, OUTER_END).search(document)
    if match is None:
        return document
    body = match.group(0)[len(OUTER_START) : -len(OUTER_END)].strip()
    region = f"{OUTER_START}\n{body}\n{OUTER_END}" if body else ""
    updated = document[: match.start()] + region + document[match.end() :]
    return re.sub(r"\n{3,}", "\n\n", updated)


def insert_inner_block(document: str, start: str, block: str) -> str:
    """把一个区块插进外层区域内部，缺外层时先补一个空壳。"""
    if OUTER_START not in document:
        document = append_block(document, f"{OUTER_START}\n{OUTER_END}")
    # 插到内层顺序表里排在它后面、且已经存在的那个区块之前；都不在就贴着外层收尾。
    later = INNER_BLOCK_ORDER[INNER_BLOCK_ORDER.index(start) + 1 :]
    anchor = next((marker for marker in later if marker in document), OUTER_END)
    position = document.find(anchor)
    head = document[:position].rstrip()
    return prune_outer_region(f"{head}\n\n{block}\n{document[position:]}")


def upsert_block(document: str, start: str, end: str, block: str) -> str:
    """按标记幂等替换受管区块；不存在则按归属插到该去的位置。

    AGENTS.md 的区块一律归外层区域内部；其余（索引文件里的条目区块）追加到文末。
    """
    pattern = block_pattern(start, end)
    if pattern.search(document):
        return pattern.sub(lambda _match: block, document, count=1)
    if start in INNER_BLOCK_ORDER:
        return insert_inner_block(document, start, block)
    return f"{append_block(document, block)}\n"


def build_local_block() -> str:
    """渲染本层记忆区块。类型入口是闭集且恒存在，所以清单是模板字面量。"""
    return extract_block(LOCAL_START, LOCAL_END)


def build_auto_block() -> str:
    """渲染项目记忆的自动检索与沉淀策略。"""
    return extract_block(AUTO_START, AUTO_END)


def build_children_block(entries: str) -> str:
    """渲染下层记忆索引区块。"""
    return extract_block(CHILDREN_START, CHILDREN_END).replace("{index_entries}", entries)


def render_agents_document(
    title: str, local_block: str, children_block: str, auto_block: str
) -> str:
    """整份渲染 AGENTS.md；仅用于文件尚不存在的干净场景。

    用不到的区块传空串，整段连标记一起消失；内层全空时外层也不留。
    """
    document = load_agents_template().replace("{title}", title)
    for (start, end), block in (
        ((LOCAL_START, LOCAL_END), local_block),
        ((CHILDREN_START, CHILDREN_END), children_block),
        ((AUTO_START, AUTO_END), auto_block),
    ):
        document = block_pattern(start, end).sub(lambda _match: block, document, count=1)
    return re.sub(r"\n{3,}", "\n\n", prune_outer_region(document)).rstrip() + "\n"
