"""Load free-form ablation cases. Not path-retrieval samples."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any


CATEGORIES = frozenset({"memory-dependent", "memory-irrelevant", "conflict-stale"})
DATASET_V1 = "harness-memory-ablation/v1"


class CasesError(ValueError):
    """The case file or the selection is not usable."""


def load_cases(path: Path) -> dict[str, Any]:
    """Read Dataset-shaped items: question, criteria, violations, category."""
    if not path.is_file():
        raise CasesError(f"case file not found: {path}")
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise CasesError(f"{path} is not json: {exc}") from exc
    if not isinstance(data, dict):
        raise CasesError(f"{path} must be an object")
    dataset = data.get("dataset")
    if not isinstance(dataset, str) or not dataset.strip():
        raise CasesError(f"{path} dataset must be a non-empty string")
    raw_items = data.get("items")
    if not isinstance(raw_items, list) or not raw_items:
        raise CasesError(f"{path} needs a non-empty items array")
    items: list[dict[str, Any]] = []
    seen: set[str] = set()
    for index, raw in enumerate(raw_items):
        item = _item(raw, f"{path} items[{index}]")
        if item["case_id"] in seen:
            raise CasesError(f"duplicate case id {item['case_id']}")
        seen.add(item["case_id"])
        items.append(item)
    return {"dataset": dataset.strip(), "items": items}


def select_cases(
    items: list[dict[str, Any]],
    *,
    samples: int | None,
    case_ids: list[str] | None,
) -> list[dict[str, Any]]:
    """Filter by case id, then keep the first `samples` items."""
    chosen = list(items)
    if case_ids:
        by_case = {item["case_id"]: item for item in items}
        by_id = {item["id"]: item for item in items}
        missing = [case_id for case_id in case_ids if case_id not in by_case and case_id not in by_id]
        if missing:
            raise CasesError(f"unknown case {missing[0]}")
        chosen = [by_case.get(case_id) or by_id[case_id] for case_id in case_ids]
    if samples is not None:
        if not isinstance(samples, int) or isinstance(samples, bool) or samples < 1:
            raise CasesError("samples must be a positive integer")
        chosen = chosen[:samples]
    if not chosen:
        raise CasesError("no cases")
    return chosen


def _item(raw: Any, where: str) -> dict[str, Any]:
    if not isinstance(raw, dict):
        raise CasesError(f"{where} must be an object")
    if "ground_truth" in raw or "predicted" in raw:
        raise CasesError(f"{where} is a path-retrieval sample; expected input.question and expectedOutput")
    item_id = _required_str(raw, "id", where)
    case_id = raw.get("case_id")
    if case_id is None:
        raise CasesError(f"{where}.case_id must be a non-empty string")
    if not isinstance(case_id, str) or not case_id.strip():
        raise CasesError(f"{where}.case_id must be a non-empty string")
    question = _question(raw, where)
    expected = raw.get("expectedOutput")
    if not isinstance(expected, dict):
        raise CasesError(f"{where}.expectedOutput must be an object with criteria and violations")
    criteria = _string_list(expected.get("criteria"), f"{where}.expectedOutput.criteria")
    violations = _string_list(expected.get("violations"), f"{where}.expectedOutput.violations")
    metadata = raw.get("metadata")
    if not isinstance(metadata, dict):
        raise CasesError(f"{where}.metadata must be an object")
    category = metadata.get("category")
    if category not in CATEGORIES:
        raise CasesError(f"{where}.metadata.category must be one of {', '.join(sorted(CATEGORIES))}")
    return {
        "id": item_id,
        "case_id": case_id.strip(),
        "question": question,
        "criteria": criteria,
        "violations": violations,
        "category": category,
        "metadata": metadata,
    }


def _question(raw: dict[str, Any], where: str) -> str:
    body = raw.get("input")
    if isinstance(body, dict) and isinstance(body.get("question"), str) and body["question"].strip():
        return body["question"].strip()
    if isinstance(body, str) and body.strip():
        return body.strip()
    raise CasesError(f"{where}.input.question must be a non-empty string")


def _string_list(value: Any, where: str) -> list[str]:
    if not isinstance(value, list) or not all(isinstance(item, str) and item.strip() for item in value):
        if value == []:
            return []
        raise CasesError(f"{where} must be a list of non-empty strings")
    return [item.strip() for item in value]


def _required_str(raw: dict[str, Any], key: str, where: str) -> str:
    value = raw.get(key)
    if not isinstance(value, str) or not value.strip():
        raise CasesError(f"{where}.{key} must be a non-empty string")
    return value.strip()
