#!/usr/bin/env python3
"""项目级文件系统 Memory 原子操作。"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from lib.paths import resolve_root, resolve_target
from lib.provenance import compact_fields
from lib.types import layer_writable_types, reject_unwritable_type
from operations.add_type import add_type
from operations.doctor import doctor_memory
from operations.init import init_memory
from operations.remember import remember


def build_parser() -> argparse.ArgumentParser:
    """构建原子 CLI。"""
    parser = argparse.ArgumentParser(description=__doc__)
    subparsers = parser.add_subparsers(dest="operation", required=True)
    init_parser = subparsers.add_parser("init")
    init_parser.add_argument("--target-dir", required=True, help="要建记忆的目录")
    init_parser.add_argument(
        "--root-dir", help="可选工作区根；默认从 Git 根或祖先 AGENTS.md 自动发现"
    )
    init_parser.add_argument(
        "--description", help="可选目录职责说明；写进上层 AGENTS.md 的下层记忆索引"
    )
    doctor_parser = subparsers.add_parser("doctor")
    doctor_parser.add_argument("--target-dir", required=True, help="记忆树里的任一目录，用于定位记忆根")
    doctor_parser.add_argument("--root-dir", help="可选工作区根；默认自动发现")
    doctor_parser.add_argument(
        "--apply", action="store_true", help="默认只诊断；加上它才真的改文件"
    )
    remember_parser = subparsers.add_parser("remember")
    remember_parser.add_argument("--target-dir", required=True, help="写入哪一层目录的 .memory/")
    remember_parser.add_argument(
        "--type",
        required=True,
        help=(
            "该层已登记的可写类型。官方种子: "
            "feedback / project / reference / skills / user；"
            "另加该层 AGENTS.md 本层清单里的用户类型。"
            "agent_skills 只索引，不能 remember"
        ),
    )
    remember_parser.add_argument(
        "--slug",
        required=True,
        help="小写 snake_case，不带类型前缀；skills 例外，用 kebab-case，它就是技能目录名",
    )
    remember_parser.add_argument("--title", help="索引里显示的标题；skills 可省略")
    remember_parser.add_argument("--description", help="索引里的一句说明；更新时可省略")
    remember_parser.add_argument("--origin-session-id", help="默认从环境变量探测")
    remember_parser.add_argument("--agent-client", help="默认从环境变量探测")
    remember_parser.add_argument("--username", help="默认取 git config user.name")
    remember_parser.add_argument("--email", help="默认取 git config user.email")
    content_group = remember_parser.add_mutually_exclusive_group(required=True)
    content_group.add_argument(
        "--content", help="正文，按「一句结论 → **Why:** → **How to apply:**」组织"
    )
    content_group.add_argument("--content-file", help="从文件读正文；正文较长时用它")
    add_parser = subparsers.add_parser("add-type")
    add_parser.add_argument("--target-dir", required=True, help="已 init 的记忆目录")
    add_parser.add_argument("--name", required=True, help="小写 snake_case 类型名，不能是官方种子")
    add_parser.add_argument("--description", required=True, help="写进 AGENTS 本层清单的那句说明")
    add_parser.add_argument(
        "--gitignore",
        action="store_true",
        help="按 ADR-0003 风格把入口与复数目录写入仓库根 .gitignore",
    )
    add_parser.add_argument(
        "--index-only",
        action="store_true",
        help="只索引不写（remember 拒绝；doctor 不报 missing-type-dir）",
    )
    add_parser.add_argument(
        "--skills-format",
        action="store_true",
        help="条目形态与 skills 相同：<name>/SKILL.md，slug 用 kebab-case",
    )
    add_parser.add_argument(
        "--external-content-dir",
        help="本轮 stub：传入即 JSON 错误。只有官方 agent_skills 能把内容根放在 .memory/ 外",
    )
    return parser


def read_content(arguments: argparse.Namespace) -> str:
    """从命令行或文件读取正文。"""
    if arguments.content is not None:
        return arguments.content
    content_path = Path(arguments.content_file).expanduser().resolve()
    if not content_path.is_file():
        raise ValueError(f"content-file 不存在或不是文件: {content_path}")
    return content_path.read_text(encoding="utf-8")


def main() -> int:
    """执行原子操作并输出机器可读 JSON。"""
    try:
        # 建 parser 仍会读模板（种子类型清单），所以它也得在 try 里，
        # 否则模板坏掉时抛的是 traceback 而不是约定的 JSON 错误。
        # remember --type 的合法值在 parse 之后按该层发现结果校验。
        arguments = build_parser().parse_args()
        target = resolve_target(arguments.target_dir)
        if arguments.operation == "remember":
            writable = layer_writable_types(target)
            if arguments.type not in writable:
                raise ValueError(reject_unwritable_type(target, arguments.type))
        if arguments.operation == "init":
            root = resolve_root(target, arguments.root_dir)
            result = init_memory(target, root, arguments.description)
        elif arguments.operation == "doctor":
            result = doctor_memory(resolve_root(target, arguments.root_dir), arguments.apply)
        elif arguments.operation == "add-type":
            result = add_type(
                target,
                arguments.name,
                arguments.description,
                gitignore=arguments.gitignore,
                writable=not arguments.index_only,
                format="skills" if arguments.skills_format else "ordinary",
                external_content_dir=(
                    tuple(Path(arguments.external_content_dir).parts)
                    if arguments.external_content_dir
                    else None
                ),
            )
        else:
            overrides = compact_fields(
                {
                    "originSessionId": arguments.origin_session_id,
                    "agentClient": arguments.agent_client,
                    "username": arguments.username,
                    "email": arguments.email,
                }
            )
            result = remember(
                target,
                arguments.type,
                arguments.slug,
                arguments.title,
                arguments.description,
                read_content(arguments),
                overrides,
            )
    except (KeyError, OSError, UnicodeError, ValueError) as error:
        print(json.dumps({"ok": False, "error": str(error)}, ensure_ascii=False))
        return 1
    print(json.dumps({"ok": True, **result}, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
