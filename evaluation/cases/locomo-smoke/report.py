"""Evaluation Report generator. Smoke only — not Benchmark Proof."""

from __future__ import annotations

from statistics import mean
from typing import Any

from evaluate import f1_key
from scoring import gold_answer


def render_report(
    *,
    out_samples: list[dict[str, Any]],
    mode: str,
    model: str,
    subset: str,
    command: str,
    real_command: str,
    sut: str = "upstream locomo (`task_eval/evaluate_qa.py` out-file schema + `eval_question_answering`)",
    adr_path: str = "docs/adr/0008-evaluation-smoke-is-not-benchmark-proof.md",
) -> str:
    score_name = f1_key(model)
    rows: list[str] = []
    scores: list[float] = []
    for sample in out_samples:
        for qa in sample.get("qa") or []:
            score = float(qa.get(score_name, 0.0))
            scores.append(score)
            pred = qa.get(f"{model}_prediction", "")
            rows.append(
                f"| {sample.get('sample_id')} | {qa.get('category')} | "
                f"{_cell(qa.get('question'))} | {_cell(gold_answer(qa))} | "
                f"{_cell(pred)} | {score:.3f} |"
            )

    mean_f1 = mean(scores) if scores else 0.0
    mode_label = "dry-run (no LLM; fixed placeholder answers)" if mode == "dry-run" else "real (OpenAI-compatible API)"
    return f"""# Evaluation Smoke — LoCoMo truncated-context baseline

**This is Evaluation Smoke, not Benchmark Proof.**

The numbers below only show that the official-style write → retrieve → answer → score path can produce a reproducible Evaluation Report. They are **not** evidence that Project Memory or Agent Memory works. Do not cite them as project-memory gain, “记忆评测通过”, or benchmark 证明有效.

See [{adr_path}](../../{adr_path}).

| Field | Value |
| --- | --- |
| Kind | Evaluation Smoke (not Benchmark Proof) |
| SUT | {sut} |
| Backend | truncated-context baseline (no RAG; Project Memory is **not** wired) |
| Subset | {subset} |
| Model | `{model}` |
| Mode | {mode_label} |
| Samples | {len(out_samples)} |
| QA items | {len(scores)} |
| Mean `{score_name}` | {mean_f1:.3f} |

## Reproduce

Dry-run (no API key):

```bash
{command}
```

Real kimi-for-coding run (key via env, never commit the key):

```bash
{real_command}
```

`KIMI_API_KEY` or `OPENAI_API_KEY` is required for the real run. `OPENAI_BASE_URL` defaults to `https://api.kimi.com/coding/v1` (Kimi Code OpenAI-compatible Chat Completions). Override the model with `--model` / `LOCOMO_MODEL`.

## Per-question scores

| sample_id | category | question | gold | prediction | F1 |
| --- | --- | --- | --- | --- | --- |
{chr(10).join(rows)}

## What this is not

- Not a ranking of memory systems.
- Not a construct-valid proof for filesystem project-memory.
- Not an official LoCoMo leaderboard submission.
"""


def _cell(value: Any) -> str:
    text = "" if value is None else str(value).replace("\n", " ").replace("|", "/")
    return text if len(text) <= 80 else text[:77] + "..."
