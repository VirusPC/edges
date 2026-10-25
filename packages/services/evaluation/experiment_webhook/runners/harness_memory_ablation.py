"""Adapt Langfuse dataset items onto harness_memory_ablation.run_experiment.

Local case files and a Langfuse Dataset are different shapes. This module
turns webhook items into the dicts `run_experiment` already accepts. It does
not clone worktrees and does not replace the runner.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

from experiment_webhook.dispatch import RunContext, RunFailure


_CATEGORIES = frozenset({"memory-dependent", "memory-irrelevant", "conflict-stale"})


def adapt_items(raw_items: list[Any]) -> list[dict[str, Any]]:
    """Map Dataset items to ablation cases: question, criteria, violations, category."""
    cases: list[dict[str, Any]] = []
    seen: set[str] = set()
    for index, raw in enumerate(raw_items):
        if not isinstance(raw, dict):
            raise RunFailure("invalid_items", f"items[{index}] must be an object")
        if raw.get("status") == "ARCHIVED":
            continue
        if "ground_truth" in raw or "predicted" in raw:
            raise RunFailure("invalid_items", f"items[{index}] is a path-retrieval sample")
        item_id = raw.get("id")
        if not isinstance(item_id, str) or not item_id.strip():
            raise RunFailure("invalid_items", f"items[{index}].id must be a non-empty string")
        metadata = raw.get("metadata") if isinstance(raw.get("metadata"), dict) else {}
        case_id = _case_id(metadata, raw, item_id)
        if case_id in seen:
            raise RunFailure("invalid_items", f"duplicate case id {case_id}")
        seen.add(case_id)
        question = _question(raw, index)
        expected = raw.get("expectedOutput")
        if not isinstance(expected, dict):
            raise RunFailure("invalid_items", f"items[{index}].expectedOutput must be an object")
        category = metadata.get("category")
        if category not in _CATEGORIES:
            raise RunFailure(
                "invalid_items",
                f"items[{index}].metadata.category must be one of {', '.join(sorted(_CATEGORIES))}",
            )
        cases.append(
            {
                "id": item_id.strip(),
                "case_id": case_id,
                "question": question,
                "criteria": _string_list(expected.get("criteria"), f"items[{index}].expectedOutput.criteria"),
                "violations": _string_list(
                    expected.get("violations"),
                    f"items[{index}].expectedOutput.violations",
                ),
                "category": category,
                "metadata": metadata,
            }
        )
    if not cases:
        raise RunFailure("invalid_items", "no dataset items")
    return cases


def run(context: RunContext) -> dict[str, Any]:
    """Call the existing ablation entrypoint with paths from the webhook payload."""
    config = _payload_object(context.payload)
    memory_off = _path_field(config, "memoryOff", "memory_off")
    memory_on = _path_field(config, "memoryOn", "memory_on")
    for label, path in (("memoryOff", memory_off), ("memoryOn", memory_on)):
        if not path.is_dir():
            raise RunFailure("invalid_payload", f"{label} is not a directory")
    repeats = _positive_int(config.get("repeats", 1), "repeats")
    samples = config.get("samples")
    if samples is not None:
        samples = _positive_int(samples, "samples")
    case_ids = config.get("caseIds")
    if case_ids is not None and (
        not isinstance(case_ids, list) or not all(isinstance(item, str) and item.strip() for item in case_ids)
    ):
        raise RunFailure("invalid_payload", "caseIds must be a list of strings")
    judge_name = config.get("judge", "skip")
    if judge_name not in ("skip", "llm"):
        raise RunFailure("invalid_payload", "judge must be skip or llm")
    client_id = config.get("client", "codex")
    if not isinstance(client_id, str) or not client_id.strip():
        raise RunFailure("invalid_payload", "client must be a non-empty string")
    cases = adapt_items(context.items)
    run_experiment, load_named_client, select_cases, judge_from_flag = _load_entrypoint()
    try:
        selected = select_cases(
            cases,
            samples=samples,
            case_ids=[item.strip() for item in case_ids] if case_ids else None,
        )
        client = load_named_client(client_id.strip())
        judge = judge_from_flag(judge_name)
    except Exception as exc:
        raise RunFailure("invalid_payload", type(exc).__name__) from exc
    cache_dir = _cache_dir()
    result = run_experiment(
        memory_off=memory_off,
        memory_on=memory_on,
        cases=selected,
        dataset=context.dataset_name,
        client=client,
        repeats=repeats,
        judge=judge,
        reports_dir=context.reports_dir,
        cache_dir=cache_dir,
    )
    return _normalize(context.dataset_name, selected, result)


def _load_entrypoint() -> tuple[Any, Any, Any, Any]:
    experiments = _experiments_dir()
    if str(experiments) not in sys.path:
        sys.path.insert(0, str(experiments))
    from harness_memory_ablation.cases import select_cases
    from harness_memory_ablation.judge import judge_from_flag
    from harness_memory_ablation.run import load_named_client, run_experiment

    return run_experiment, load_named_client, select_cases, judge_from_flag


def _normalize(dataset_name: str, cases: list[dict[str, Any]], result: dict[str, Any]) -> dict[str, Any]:
    trials = result.get("trials") if isinstance(result.get("trials"), list) else []
    by_case: dict[str, list[dict[str, Any]]] = {}
    for trial in trials:
        if isinstance(trial, dict):
            by_case.setdefault(str(trial.get("case_id") or ""), []).append(trial)
    items: list[dict[str, Any]] = []
    scores: list[dict[str, Any]] = []
    worth = result.get("worth_default_on")
    scores.append(
        {
            "name": "worth_default_on",
            "value": 1 if worth is True else 0,
            "dataType": "BOOLEAN",
            "item_id": None,
            "comment": dataset_name,
        }
    )
    for case in cases:
        rows = by_case.get(case["case_id"], [])
        answers = [str(row.get("answer") or "") for row in rows if row.get("answer")]
        items.append(
            {
                "id": case["id"],
                "input": case["question"],
                "expected_output": {"criteria": case["criteria"], "violations": case["violations"]},
                "output": "\n".join(answers)[:2000],
            }
        )
        for row in rows:
            verdict = row.get("verdict")
            condition = row.get("condition")
            if isinstance(verdict, str) and isinstance(condition, str):
                scores.append(
                    {
                        "name": f"verdict.{condition}",
                        "value": verdict,
                        "dataType": "CATEGORICAL",
                        "item_id": case["id"],
                        "comment": case["case_id"],
                    }
                )
    return {"dataset": dataset_name, "items": items, "scores": scores, "summary": _summary(result)}


def _summary(result: dict[str, Any]) -> dict[str, Any]:
    return {
        "worth_default_on": result.get("worth_default_on"),
        "gates": result.get("gates"),
        "service_name": result.get("service_name"),
    }


def _experiments_dir() -> Path:
    for parent in Path(__file__).resolve().parents:
        candidate = parent / "packages" / "evaluation" / "experiments"
        if (candidate / "harness_memory_ablation" / "run.py").is_file():
            return candidate
    raise RunFailure("invalid_runner", "harness_memory_ablation not found")


def _cache_dir() -> Path:
    return _experiments_dir().parent / ".cache" / "harness-memory-ablation"


def _payload_object(payload: Any) -> dict[str, Any]:
    if isinstance(payload, str):
        try:
            payload = json.loads(payload)
        except json.JSONDecodeError as exc:
            raise RunFailure("invalid_payload", "payload string is not json") from exc
    if not isinstance(payload, dict):
        raise RunFailure("invalid_payload", "payload must be an object with memoryOff and memoryOn")
    return payload


def _path_field(payload: dict[str, Any], *names: str) -> Path:
    for name in names:
        value = payload.get(name)
        if isinstance(value, str) and value.strip():
            return Path(value.strip())
    raise RunFailure("invalid_payload", f"{names[0]} must be a directory path")


def _positive_int(value: Any, name: str) -> int:
    if isinstance(value, bool) or not isinstance(value, int) or value < 1:
        raise RunFailure("invalid_payload", f"{name} must be a positive integer")
    return value


def _case_id(metadata: dict[str, Any], raw: dict[str, Any], item_id: str) -> str:
    for source in (metadata, raw):
        value = source.get("case_id")
        if isinstance(value, str) and value.strip():
            return value.strip()
    return item_id.strip()


def _question(raw: dict[str, Any], index: int) -> str:
    body = raw.get("input")
    if isinstance(body, dict) and isinstance(body.get("question"), str) and body["question"].strip():
        return body["question"].strip()
    if isinstance(body, str) and body.strip():
        return body.strip()
    raise RunFailure("invalid_items", f"items[{index}].input.question must be a non-empty string")


def _string_list(value: Any, where: str) -> list[str]:
    if value == []:
        return []
    if not isinstance(value, list) or not all(isinstance(item, str) and item.strip() for item in value):
        raise RunFailure("invalid_items", f"{where} must be a list of non-empty strings")
    return [item.strip() for item in value]
