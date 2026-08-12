from __future__ import annotations

from collections.abc import AsyncIterator

BASE_PROMPT = "You are assisting with the local repository setup."


def build_prompt(user_request: str, *, context: str | None = None) -> str:
    prompt = BASE_PROMPT
    if context:
        prompt = f"{prompt}\n\nContext:\n{context.strip()}"
    return f"{prompt}\n\nUser request:\n{user_request.strip()}"


async def stream_prompt(user_request: str, *, context: str | None = None) -> AsyncIterator[str]:
    from claude_agent_sdk import AssistantMessage, ClaudeAgentOptions, TextBlock, query

    options = ClaudeAgentOptions(max_turns=1)
    prompt = build_prompt(user_request, context=context)

    async for message in query(prompt=prompt, options=options):
        if isinstance(message, AssistantMessage):
            for block in message.content:
                if isinstance(block, TextBlock):
                    yield block.text
