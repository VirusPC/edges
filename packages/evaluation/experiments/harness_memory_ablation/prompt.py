"""Free-form question prompt. The caller does not paste memory files."""

from __future__ import annotations


def build_prompt(question: str) -> str:
    """Ask the agent to answer from the current worktree on its own."""
    return (
        "你在当前工作目录里回答下面的问题。\n"
        "可以自己读文件和搜索。调用方没有把记忆正文放进这条消息。\n"
        "直接回答，不要改仓库里的文件。\n"
        "\n"
        f"问题：{question}\n"
    )
