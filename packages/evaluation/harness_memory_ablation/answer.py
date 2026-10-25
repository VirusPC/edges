"""Read a free-form answer and token usage out of a client event stream."""

from __future__ import annotations

import json
from typing import Any

from langfuse_sink import spans_from_codex_jsonl, spans_from_pi_jsonl
from retrieval_eval.client import ClientCall


_IGNORED_PARSE_ERRORS = frozenset(
    {
        "no predicted json found",
        "empty output",
        "predicted is not a list of strings",
        "no agent message in event stream",
    }
)
_USAGE_KEYS = ("input_tokens", "output_tokens", "cached_input_tokens", "reasoning_tokens")


def answer_text(*, kind: str, last_message: str, stdout: str) -> str:
    """Codex prefers the `-o` file. pi reads the last stopped assistant text."""
    if kind == "pi":
        text = _pi_stop_text(stdout)
        if text:
            return text
        return last_message if last_message.strip() else ""
    if last_message.strip():
        return last_message
    return _codex_agent_message(stdout)


def usage_from_events(kind: str, stdout: str) -> dict[str, int | None]:
    """Sum generation usage across the event stream. Missing usage stays None."""
    adapter = spans_from_pi_jsonl if kind == "pi" else spans_from_codex_jsonl
    spans = adapter(
        stdout,
        trace_id="ab" * 16,
        parent_id="cd" * 8,
        start_time_unix_nano=0,
    )
    totals = {key: 0 for key in _USAGE_KEYS}
    seen = False
    for span in spans:
        if span.usage is None:
            continue
        seen = True
        for key in _USAGE_KEYS:
            value = getattr(span.usage, key)
            if isinstance(value, int) and not isinstance(value, bool):
                totals[key] += value
    if not seen:
        return {key: None for key in _USAGE_KEYS}
    return totals


def trial_failure(call: ClientCall, answer: str) -> str | None:
    """Retrieval JSON parse misses are not failures when a free-form answer exists."""
    if call.timed_out:
        return "timeout"
    if call.returncode not in (0, None) and call.returncode != 0:
        return call.parse_error or f"exit {call.returncode}"
    if call.parse_error and call.parse_error not in _IGNORED_PARSE_ERRORS:
        return call.parse_error
    if not answer.strip():
        return "empty answer"
    return None


def _codex_agent_message(stdout: str) -> str:
    found = ""
    for event in _events(stdout):
        if event.get("type") != "item.completed":
            continue
        item = event.get("item")
        if not isinstance(item, dict) or item.get("type") != "agent_message":
            continue
        text = item.get("text")
        if isinstance(text, str):
            found = text
    return found


def _pi_stop_text(stdout: str) -> str:
    found = ""
    for event in _events(stdout):
        if event.get("type") != "message_end":
            continue
        message = event.get("message")
        if not isinstance(message, dict) or message.get("role") != "assistant":
            continue
        if message.get("stopReason") != "stop":
            continue
        found = _join_text(message.get("content"))
    return found


def _join_text(content: object) -> str:
    if not isinstance(content, list):
        return ""
    parts: list[str] = []
    for block in content:
        if isinstance(block, dict) and block.get("type") == "text" and isinstance(block.get("text"), str):
            parts.append(block["text"])
    return "".join(parts)


def _events(stdout: str) -> list[dict[str, Any]]:
    events: list[dict[str, Any]] = []
    for line in stdout.splitlines():
        line = line.strip()
        if not line.startswith("{"):
            continue
        try:
            event = json.loads(line)
        except json.JSONDecodeError:
            continue
        if isinstance(event, dict):
            events.append(event)
    return events
