from __future__ import annotations

import argparse

import anyio

from .agent import stream_prompt


async def _run(prompt: str, context: str | None) -> None:
    async for chunk in stream_prompt(prompt, context=context):
        print(chunk)


def main() -> None:
    parser = argparse.ArgumentParser(description="Run a prompt through the Claude Agent SDK.")
    parser.add_argument("prompt", help="Prompt to send to Claude.")
    parser.add_argument(
        "--context",
        help="Optional repository or task context prepended to the prompt.",
    )
    args = parser.parse_args()
    anyio.run(_run, args.prompt, args.context)


if __name__ == "__main__":
    main()
