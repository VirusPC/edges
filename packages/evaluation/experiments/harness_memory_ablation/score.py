"""Accuracy, hard-constraint violations, and token/latency gates.

Thresholds match the ablation design: memory-dependent accuracy at least
+10 percentage points, input-token median increase at most 15%, latency
median increase at most 10%, and memory-irrelevant quality not worse.
conflict/stale is reported and does not block the main verdict.
Token and latency use the median of per-case medians, paired by case id.
`partial` is not correct. A missing verdict leaves the quality gates unscored.
"""

from __future__ import annotations

import statistics
from collections.abc import Mapping, Sequence
from typing import Any


CONDITIONS = ("memory:off", "memory:on")
CATEGORIES = ("memory-dependent", "memory-irrelevant", "conflict-stale")
DEPENDENT_ACCURACY_PP = 10.0
INPUT_TOKEN_RATIO = 0.15
LATENCY_RATIO = 0.10


def compare_trials(trials: Sequence[Mapping[str, Any]]) -> dict[str, Any]:
    """Compare memory:on with memory:off. Does not call a model."""
    grouped = _group(trials)
    by_category = _by_category(grouped)
    token_off, token_on = _paired_condition_medians(grouped, "input_tokens")
    latency_off, latency_on = _paired_condition_medians(grouped, "latency_ms")
    dependent = _accuracy_delta(by_category, "memory-dependent")
    irrelevant = _irrelevant_gate(by_category)
    gates = [
        _accuracy_gate(dependent),
        _ratio_gate("input_tokens", token_off, token_on, INPUT_TOKEN_RATIO),
        _ratio_gate("latency", latency_off, latency_on, LATENCY_RATIO),
        irrelevant,
    ]
    return {
        "by_category": by_category,
        "gates": gates,
        "conflict": {"b_worse_case_ids": _b_worse(grouped)},
        "worth_default_on": all(gate["pass"] is True for gate in gates),
    }


def _group(trials: Sequence[Mapping[str, Any]]) -> dict[tuple[str, str], list[Mapping[str, Any]]]:
    grouped: dict[tuple[str, str], list[Mapping[str, Any]]] = {}
    for trial in trials:
        condition = str(trial.get("condition") or "")
        case_id = str(trial.get("case_id") or "")
        grouped.setdefault((condition, case_id), []).append(trial)
    return grouped


def _case_ids(grouped: dict[tuple[str, str], list[Mapping[str, Any]]]) -> list[str]:
    seen: list[str] = []
    for _condition, case_id in grouped:
        if case_id not in seen:
            seen.append(case_id)
    return seen


def _rollup_case(rows: Sequence[Mapping[str, Any]]) -> dict[str, Any]:
    verdicts = [row.get("verdict") for row in rows]
    if verdicts and all(isinstance(verdict, str) for verdict in verdicts):
        accuracy = sum(1 for verdict in verdicts if verdict == "correct") / len(verdicts)
    else:
        accuracy = None
    return {
        "accuracy": accuracy,
        "input_tokens": _median([row.get("input_tokens") for row in rows]),
        "latency_ms": _median([row.get("latency_ms") for row in rows]),
        "violation_count": sum(len(row.get("violations") or []) for row in rows),
        "category": rows[0].get("category") if rows else None,
    }


def _by_category(grouped: dict[tuple[str, str], list[Mapping[str, Any]]]) -> dict[str, Any]:
    out: dict[str, Any] = {}
    for category in CATEGORIES:
        sides: dict[str, Any] = {}
        for condition in CONDITIONS:
            case_rows = []
            violations = 0
            for case_id in _case_ids(grouped):
                rows = grouped.get((condition, case_id))
                if not rows or rows[0].get("category") != category:
                    continue
                rolled = _rollup_case(rows)
                case_rows.append(rolled)
                violations += int(rolled["violation_count"])
            accuracies = [row["accuracy"] for row in case_rows]
            if case_rows and all(isinstance(value, float) for value in accuracies):
                accuracy = sum(accuracies) / len(accuracies)
            else:
                accuracy = None
            sides[condition] = {
                "accuracy": accuracy,
                "n": len(case_rows),
                "violation_count": violations,
            }
        if any(sides[condition]["n"] for condition in CONDITIONS):
            out[category] = sides
    return out


def _paired_condition_medians(
    grouped: dict[tuple[str, str], list[Mapping[str, Any]]],
    field: str,
) -> tuple[float | None, float | None]:
    off_values: list[float] = []
    on_values: list[float] = []
    for case_id in _case_ids(grouped):
        off_rows = grouped.get(("memory:off", case_id))
        off = _rollup_case(off_rows) if off_rows else None
        on = _rollup_case(grouped[("memory:on", case_id)]) if ("memory:on", case_id) in grouped else None
        if off is None or on is None:
            continue
        if off[field] is None or on[field] is None:
            continue
        off_values.append(float(off[field]))
        on_values.append(float(on[field]))
    if not off_values:
        return None, None
    return _median(off_values), _median(on_values)


def _accuracy_delta(by_category: Mapping[str, Any], category: str) -> tuple[float | None, float | None]:
    sides = by_category.get(category)
    if not isinstance(sides, dict):
        return None, None
    off = sides.get("memory:off", {}).get("accuracy")
    on = sides.get("memory:on", {}).get("accuracy")
    if not isinstance(off, float) or not isinstance(on, float):
        return None, None
    return off, on


def _accuracy_gate(pair: tuple[float | None, float | None]) -> dict[str, Any]:
    off, on = pair
    if off is None or on is None:
        return {"id": "dependent_accuracy", "pass": None, "delta_pp": None, "detail": "unscored"}
    delta_pp = (on - off) * 100
    passed = delta_pp + 1e-9 >= DEPENDENT_ACCURACY_PP
    return {
        "id": "dependent_accuracy",
        "pass": passed,
        "delta_pp": delta_pp,
        "detail": f"{delta_pp:+.1f}pp",
    }


def _ratio_gate(gate_id: str, off: float | None, on: float | None, limit: float) -> dict[str, Any]:
    if off is None or on is None:
        return {"id": gate_id, "pass": None, "delta_ratio": None, "detail": "unscored"}
    if off == 0:
        ratio = 0.0 if on == 0 else float("inf")
    else:
        ratio = (on - off) / off
    passed = ratio <= limit + 1e-12
    if ratio == float("inf"):
        detail = "+inf"
    else:
        detail = f"{ratio:+.1%}"
    return {"id": gate_id, "pass": passed, "delta_ratio": ratio, "detail": detail}


def _irrelevant_gate(by_category: Mapping[str, Any]) -> dict[str, Any]:
    sides = by_category.get("memory-irrelevant")
    if not isinstance(sides, dict):
        return {"id": "irrelevant_not_harmful", "pass": None, "detail": "unscored"}
    off = sides.get("memory:off", {})
    on = sides.get("memory:on", {})
    off_acc = off.get("accuracy")
    on_acc = on.get("accuracy")
    if not isinstance(off_acc, float) or not isinstance(on_acc, float):
        return {"id": "irrelevant_not_harmful", "pass": None, "detail": "unscored"}
    off_violations = int(off.get("violation_count") or 0)
    on_violations = int(on.get("violation_count") or 0)
    passed = on_acc + 1e-12 >= off_acc and on_violations <= off_violations
    return {
        "id": "irrelevant_not_harmful",
        "pass": passed,
        "detail": f"accuracy {off_acc:.1%} -> {on_acc:.1%}; violations {off_violations} -> {on_violations}",
    }


def _b_worse(grouped: dict[tuple[str, str], list[Mapping[str, Any]]]) -> list[str]:
    worse: list[str] = []
    for case_id in _case_ids(grouped):
        off_rows = grouped.get(("memory:off", case_id))
        on_rows = grouped.get(("memory:on", case_id))
        if not off_rows or not on_rows or off_rows[0].get("category") != "conflict-stale":
            continue
        off = _rollup_case(off_rows)["accuracy"]
        on = _rollup_case(on_rows)["accuracy"]
        if isinstance(off, float) and isinstance(on, float) and on < off:
            worse.append(case_id)
    return worse


def _median(values: Sequence[Any]) -> float | None:
    numbers = [float(value) for value in values if isinstance(value, (int, float)) and not isinstance(value, bool)]
    if not numbers:
        return None
    return float(statistics.median(numbers))
