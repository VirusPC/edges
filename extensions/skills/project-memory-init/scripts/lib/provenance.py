#!/usr/bin/env python3
"""出处与审计字段的来源：git 配置与调用方环境变量。

字段各自的覆盖规则见 references/frontmatter-fields.md。
"""

from __future__ import annotations

import os
import subprocess
from datetime import datetime
from pathlib import Path


# 创建时写入、更新时保留的出处字段。
ORIGIN_FIELDS = ("originSessionId", "agentClient")

# 每次写入都刷新的审计字段。
AUDIT_FIELDS = ("username", "email")

# 各家客户端的识别环境变量、agentClient 取值、会话 id 环境变量。
AGENT_CLIENTS = (
    ("CURSOR_AGENT", "cursor", "CURSOR_CONVERSATION_ID"),
    ("CLAUDECODE", "claude-code", "CLAUDE_SESSION_ID"),
)


def now_timestamp() -> str:
    """带本地时区的 ISO 8601 时间戳。"""
    return datetime.now().astimezone().isoformat(timespec="seconds")


def compact_fields(fields: dict[str, str | None]) -> dict[str, str]:
    """丢掉空值，让缺失字段在 frontmatter 里整行消失而不是留空。"""
    return {key: value for key, value in fields.items() if value}


def run_git(target: Path, *arguments: str) -> str | None:
    """在目标目录执行只读 git 命令；取不到一律返回 None，不抛异常。"""
    try:
        completed = subprocess.run(
            ["git", "-C", str(target), *arguments],
            capture_output=True,
            text=True,
            timeout=5,
            check=False,
        )
    except (OSError, subprocess.SubprocessError):
        return None
    if completed.returncode != 0:
        return None
    return completed.stdout.strip() or None


def git_identity(target: Path) -> dict[str, str]:
    """从 git 配置读取署名；带 -C 让仓库级配置优先于全局配置。"""
    identity: dict[str, str] = {}
    for option, field in (("user.name", "username"), ("user.email", "email")):
        value = run_git(target, "config", option)
        if value:
            identity[field] = value
    return identity


def agent_context() -> dict[str, str]:
    """从环境变量探测调用方客户端与会话 id；认新客户端只需加一行。"""
    for flag, client, session_variable in AGENT_CLIENTS:
        if os.environ.get(flag):
            return compact_fields(
                {
                    "agentClient": client,
                    "originSessionId": os.environ.get(session_variable),
                }
            )
    return {}
