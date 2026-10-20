"""Live truncated-context baseline using an OpenAI-compatible endpoint."""

from __future__ import annotations

from typing import Any, Callable

from context import (
    build_question_prompt,
    build_truncated_context,
    estimate_tokens,
    map_cat5_prediction,
)
from evaluate import attach_predictions
from openai_compat import chat_complete

Completer = Callable[..., str]


def live_evaluate(
    samples: list[dict[str, Any]],
    *,
    model: str,
    api_key: str,
    base_url: str,
    completer: Completer = chat_complete,
    max_context_tokens: int = 128_000,
) -> list[dict[str, Any]]:
    def answerer(sample: dict[str, Any], qa: dict[str, Any]) -> str:
        question_prompt = build_question_prompt(qa)
        context = build_truncated_context(
            sample["conversation"],
            question_tokens=estimate_tokens(question_prompt),
            max_tokens=max_context_tokens,
        )
        raw = completer(
            prompt=context + "\n\n" + question_prompt,
            model=model,
            api_key=api_key,
            base_url=base_url,
        )
        if qa.get("category") == 5:
            return map_cat5_prediction(raw)
        return raw

    return attach_predictions(samples, model=model, answerer=answerer)
