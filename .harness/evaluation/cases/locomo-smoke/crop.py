"""Deterministic LoCoMo crop: conv-44, first 2 QA per category 1–5."""

from __future__ import annotations

import json
import urllib.request
from pathlib import Path
from typing import Any

from constants import (
    CATEGORIES,
    KEEP_SAMPLE_KEYS,
    LOCOMO10_URL,
    QA_PER_CATEGORY,
    SAMPLE_ID,
)

__all__ = ["SAMPLE_ID", "crop_samples", "load_locomo", "write_json"]


def crop_samples(
    samples: list[dict[str, Any]],
    *,
    sample_id: str = SAMPLE_ID,
    per_category: int = QA_PER_CATEGORY,
    categories: tuple[int, ...] = CATEGORIES,
) -> list[dict[str, Any]]:
    """Keep one conversation and the first N QA items per category in file order.

    If a category has fewer than N items, take all of them. Extra samples and
    unused LoCoMo payloads (observation / summaries) are dropped so the cropped
    file is a truncated-context baseline input, not a RAG corpus.
    """

    source = next((item for item in samples if item.get("sample_id") == sample_id), None)
    if source is None:
        raise ValueError(f"sample_id {sample_id!r} not found")

    taken: dict[int, int] = {category: 0 for category in categories}
    selected: list[dict[str, Any]] = []
    for qa in source.get("qa") or []:
        category = qa.get("category")
        if category not in taken:
            continue
        if taken[category] >= per_category:
            continue
        selected.append(qa)
        taken[category] += 1

    cropped = {key: source[key] for key in KEEP_SAMPLE_KEYS if key in source}
    cropped["qa"] = selected
    return [cropped]


def load_locomo(
    data_file: str | Path | None = None,
    *,
    cache_path: str | Path | None = None,
    url: str = LOCOMO10_URL,
) -> list[dict[str, Any]]:
    if data_file is not None:
        return json.loads(Path(data_file).read_text(encoding="utf-8"))
    if cache_path is None:
        raise ValueError("either data_file or cache_path is required")
    dest = Path(cache_path)
    dest.parent.mkdir(parents=True, exist_ok=True)
    if not dest.is_file():
        _download(url, dest)
    return json.loads(dest.read_text(encoding="utf-8"))


def write_json(path: str | Path, payload: Any) -> Path:
    dest = Path(path)
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return dest


def _download(url: str, dest: Path) -> None:
    request = urllib.request.Request(url, headers={"User-Agent": "edges-locomo-smoke"})
    with urllib.request.urlopen(request, timeout=60) as response:
        dest.write_bytes(response.read())
