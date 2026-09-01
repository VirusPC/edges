#!/usr/bin/env python3
"""模板读取与占位符替换。产物的结构一律由 references/templates 决定。"""

from __future__ import annotations

import re
from functools import lru_cache
from pathlib import Path

from lib.paths import SKILL_DIR


TEMPLATE_DIR = SKILL_DIR / "references" / "templates"

# 条目产物名是 <type>_<slug>.md；尖括号在 Windows 上非法，模板名以角色词代替。
# 类型本身对外一律叫 type，Python 里写 entry_type 只为避开内建名。
ENTRY_OUTPUT_PATTERN = "type_slug.md"

# 下层索引与条目索引共用这一份行片段：都是「一个链接加一句说明」。
ENTRY_LINE_TEMPLATE = "_entry_line.md"

PLACEHOLDER_PATTERN = re.compile(r"\{(\w+)\}")


def template_path(output_name: str) -> Path:
    """模板文件名的唯一规则：产物名去掉后缀，加 .tmpl.md。"""
    return TEMPLATE_DIR / f"{Path(output_name).stem}.tmpl.md"


@lru_cache(maxsize=None)
def read_template(output_name: str) -> str:
    """读一份模板。按产物名精确查找，不通配目录，所以往模板目录放文件没有副作用。"""
    path = template_path(output_name)
    if not path.is_file():
        raise ValueError(f"模板不存在: {path}")
    return path.read_text(encoding="utf-8")


def fill_placeholders(text: str, values: dict[str, str]) -> str:
    """把 `{key}` 换成值。两条规则让模板可以把可选内容直接写出来：

    一行里所有占位符都取不到值，整行消失；分隔符 ` — ` 后面取不到值，连分隔符一起去掉。
    有了这两条，字段清单和字段顺序都能留在模板里，脚本不必知道有哪些字段。
    """
    rendered: list[str] = []
    for line in text.split("\n"):
        keys = PLACEHOLDER_PATTERN.findall(line)
        if keys and not any(values.get(key) for key in keys):
            continue
        for key in keys:
            line = line.replace(f"{{{key}}}", values.get(key, ""))
        rendered.append(re.sub(r" — $", "", line))
    return "\n".join(rendered)


def render_line(template_name: str, values: dict[str, str]) -> str:
    """按行片段模板渲染一个列表项，行格式只存在于模板里。"""
    return fill_placeholders(read_template(template_name).strip(), values)
