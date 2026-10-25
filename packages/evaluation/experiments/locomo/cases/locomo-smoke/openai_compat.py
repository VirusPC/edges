"""Minimal OpenAI-compatible Chat Completions client (stdlib only)."""

from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from typing import Any

from constants import DEFAULT_BASE_URL


def resolve_api_config(
    *,
    api_key: str | None = None,
    base_url: str | None = None,
) -> tuple[str, str]:
    key = (
        api_key
        or os.environ.get("KIMI_API_KEY")
        or os.environ.get("OPENAI_API_KEY")
        or ""
    ).strip()
    url = (base_url or os.environ.get("OPENAI_BASE_URL") or DEFAULT_BASE_URL).rstrip("/")
    return key, url


def chat_complete(
    *,
    prompt: str,
    model: str,
    api_key: str,
    base_url: str,
    timeout: float = 120,
    max_tokens: int = 1024,
) -> str:
    if not api_key:
        raise ValueError("missing API key: set KIMI_API_KEY or OPENAI_API_KEY")
    endpoint = base_url.rstrip("/") + "/chat/completions"
    body = json.dumps(
        {
            "model": model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 1,  # kimi-for-coding rejects other temperatures
            "max_tokens": max_tokens,
        }
    ).encode("utf-8")
    request = urllib.request.Request(
        endpoint,
        data=body,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "User-Agent": "edges-locomo-smoke",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            payload: dict[str, Any] = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"chat completion failed: HTTP {exc.code}: {detail}") from exc
    choices = payload.get("choices") or []
    if not choices:
        raise RuntimeError(f"chat completion returned no choices: {payload}")
    message = choices[0].get("message") or {}
    content = message.get("content")
    if content is None:
        raise RuntimeError(f"chat completion missing message.content: {payload}")
    return str(content).strip()
