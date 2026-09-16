"""Write answers + official-style F1 fields (dry-run or live)."""

from __future__ import annotations

from typing import Any, Callable

from constants import DRY_RUN_ANSWER, DRY_RUN_MODEL
from scoring import eval_question_answering

Answerer = Callable[[dict[str, Any], dict[str, Any]], str]


def prediction_key(model: str) -> str:
    return f"{model}_prediction"


def f1_key(model: str) -> str:
    return f"{model}_f1"


def apply_scores(sample: dict[str, Any], model: str) -> dict[str, Any]:
    pred = prediction_key(model)
    scores, _lens, _recall = eval_question_answering(sample["qa"], pred)
    for qa, score in zip(sample["qa"], scores):
        qa[f1_key(model)] = round(float(score), 3)
    return sample


def attach_predictions(
    samples: list[dict[str, Any]],
    *,
    model: str,
    answerer: Answerer,
) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    for sample in samples:
        qa_items = []
        for qa in sample["qa"]:
            item = dict(qa)
            item[prediction_key(model)] = answerer(sample, item)
            qa_items.append(item)
        scored = {"sample_id": sample["sample_id"], "qa": qa_items}
        apply_scores(scored, model)
        out.append(scored)
    return out


def dry_run_evaluate(
    samples: list[dict[str, Any]],
    model: str = DRY_RUN_MODEL,
    answerer: Answerer | None = None,
) -> list[dict[str, Any]]:
    """Fixed placeholder answers. `answerer` is accepted and ignored — no LLM."""

    del answerer
    return attach_predictions(
        samples,
        model=model,
        answerer=lambda _sample, _qa: DRY_RUN_ANSWER,
    )
