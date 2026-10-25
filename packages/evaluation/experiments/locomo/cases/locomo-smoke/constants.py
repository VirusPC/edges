"""Locked smoke-subset and provider defaults."""

from __future__ import annotations

SAMPLE_ID = "conv-44"
CATEGORIES = (1, 2, 3, 4, 5)
QA_PER_CATEGORY = 2

# Pinned upstream snapshot (locomo is effectively frozen since 2024-08).
LOCOMO_COMMIT = "3eb6f2c585f5e1699204e3c3bdf7adc5c28cb376"
LOCOMO10_URL = (
    f"https://raw.githubusercontent.com/snap-research/locomo/"
    f"{LOCOMO_COMMIT}/data/locomo10.json"
)

DRY_RUN_MODEL = "dummy"
DRY_RUN_ANSWER = "DRY_RUN_PLACEHOLDER"

DEFAULT_MODEL = "kimi-for-coding"
# Kimi Code Console (token plan), not Moonshot pay-as-you-go api.moonshot.ai.
DEFAULT_BASE_URL = "https://api.kimi.com/coding/v1"

# Official evaluate_qa.py only routes names containing gpt/claude/gemini/hf.
# kimi-for-coding is OpenAI-compatible, so the wrapper talks to Chat Completions
# and then applies upstream eval_question_answering.
KEEP_SAMPLE_KEYS = ("sample_id", "qa", "conversation")
