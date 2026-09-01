#!/usr/bin/env python3
"""项目级文件系统 Memory 原子操作。"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from lib.blocks import index_files
from lib.paths import resolve_root, resolve_target
from lib.provenance import compact_fields
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
        choices=sorted(index_files()),
        help="feedback=纠正与禁止模式，project=代码里推不出的决策，reference=外部资料去哪找",
    )
    remember_parser.add_argument("--slug", required=True, help="小写 snake_case，不带类型前缀")
    remember_parser.add_argument("--title", help="索引里显示的标题；更新时可省略")
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
        # 建 parser 就要读模板（`--type` 的取值来自模板），所以它也得在 try 里，
        # 否则模板坏掉时抛的是 traceback 而不是约定的 JSON 错误。
        arguments = build_parser().parse_args()
        target = resolve_target(arguments.target_dir)
        if arguments.operation == "init":
            root = resolve_root(target, arguments.root_dir)
            result = init_memory(target, root, arguments.description)
        elif arguments.operation == "doctor":
            result = doctor_memory(resolve_root(target, arguments.root_dir), arguments.apply)
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
