#!/usr/bin/env python3
"""Preferred official-path LoCoMo Evaluation Smoke via the VirusPC/locomo submodule.

Invokes ``task_eval/evaluate_qa.py`` so F1 comes from official
``task_eval/evaluation.py``. This is Evaluation Smoke, not Benchmark Proof
and not Project Memory proof.
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
from pathlib import Path
from statistics import mean
from typing import Any

EVAL_DIR = Path(__file__).resolve().parent
REPO_ROOT = EVAL_DIR.parent
LOCOMO_ROOT = EVAL_DIR / "third_party" / "locomo"
EVALUATE_QA = LOCOMO_ROOT / "task_eval" / "evaluate_qa.py"
CROP_SCRIPT = LOCOMO_ROOT / "scripts" / "crop_locomo_data.py"
DEFAULT_DATA = LOCOMO_ROOT / "data" / "locomo10.json"
DEFAULT_REPORTS = EVAL_DIR / "reports"
DEFAULT_CROPPED = EVAL_DIR / ".cache" / "locomo" / "locomo10-conv44-official-smoke.json"

PINNED_COMMIT = "cb5151e32c82c3b6fc6ffdc18e72572691b9d8ea"
UPSTREAM_BASE = "snap-research/locomo@3eb6f2c585f5e1699204e3c3bdf7adc5c28cb376"
SAMPLE_ID = "conv-44"
QA_PER_CATEGORY = 2
DEFAULT_MODEL = "kimi-for-coding"
DEFAULT_BASE_URL = "https://api.kimi.com/coding/v1"
DEFAULT_DATE = "2026-09-16"
SUBSET = (
    f"{SAMPLE_ID}; first {QA_PER_CATEGORY} QA per category 1-5 in file order "
    "(take all if a category has <2)"
)
PRINT_COMMAND = "python3 evaluation/run_locomo_official.py print-command"
SMOKE_COMMAND = (
    "KIMI_API_KEY=... OPENAI_BASE_URL=https://api.kimi.com/coding/v1 "
    "python3 evaluation/run_locomo_official.py smoke"
)
CLONE_COMMAND = "git clone --recurse-submodules https://github.com/VirusPC/edges.git"
INIT_COMMAND = "git submodule update --init evaluation/third_party/locomo"


def require_submodule() -> Path:
    if not EVALUATE_QA.is_file() or not CROP_SCRIPT.is_file():
        raise FileNotFoundError(
            "LoCoMo submodule is missing or empty. "
            f"Run `{INIT_COMMAND}` (or clone with `--recurse-submodules`)."
        )
    return LOCOMO_ROOT


def build_evaluate_command(
    *,
    data_file: Path,
    out_file: Path,
    model: str,
    sample_id: str = SAMPLE_ID,
    qa_per_category: int = QA_PER_CATEGORY,
    python: str | None = None,
) -> list[str]:
    return [
        python or sys.executable,
        str(EVALUATE_QA),
        "--data-file",
        str(data_file),
        "--out-file",
        str(out_file),
        "--model",
        model,
        "--sample-id",
        sample_id,
        "--qa-per-category",
        str(qa_per_category),
        "--batch-size",
        "1",
        "--overwrite",
    ]


def build_crop_command(
    *,
    data_file: Path,
    cropped_file: Path,
    sample_id: str = SAMPLE_ID,
    qa_per_category: int = QA_PER_CATEGORY,
    python: str | None = None,
) -> list[str]:
    return [
        python or sys.executable,
        str(CROP_SCRIPT),
        "--data-file",
        str(data_file),
        "--out-file",
        str(cropped_file),
        "--sample-id",
        sample_id,
        "--qa-per-category",
        str(qa_per_category),
    ]


def render_official_report(
    *,
    out_samples: list[dict[str, Any]],
    model: str,
    subset: str,
    command: str,
    real_command: str,
    sut: str = (
        "VirusPC/locomo `task_eval/evaluate_qa.py` → official "
        "`task_eval/evaluation.py` (`eval_question_answering` F1)"
    ),
    adr_path: str = "docs/adr/0008-evaluation-smoke-is-not-benchmark-proof.md",
) -> str:
    score_name = f"{model}_f1"
    rows: list[str] = []
    scores: list[float] = []
    for sample in out_samples:
        for qa in sample.get("qa") or []:
            score = float(qa.get(score_name, 0.0))
            scores.append(score)
            pred = qa.get(f"{model}_prediction", "")
            rows.append(
                f"| {sample.get('sample_id')} | {qa.get('category')} | "
                f"{_cell(qa.get('question'))} | {_cell(_gold_answer(qa))} | "
                f"{_cell(pred)} | {score:.3f} |"
            )

    mean_f1 = mean(scores) if scores else 0.0
    return f"""# Evaluation Smoke — official LoCoMo QA (not Project Memory proof)

**This is Evaluation Smoke, not Benchmark Proof.**

The numbers below only show that the official write → retrieve → answer → score path can produce a reproducible Evaluation Report. They are **not** evidence that Project Memory or Agent Memory works. Do not cite them as project-memory gain, “记忆评测通过”, or benchmark 证明有效.

See [{adr_path}](../../{adr_path}).

| Field | Value |
| --- | --- |
| Kind | Evaluation Smoke (not Benchmark Proof / not Project Memory proof) |
| SUT | {sut} |
| Fork | [VirusPC/locomo](https://github.com/VirusPC/locomo) @ `{PINNED_COMMIT}` |
| Upstream base | {UPSTREAM_BASE} |
| Intentional delta | OpenAI-compatible model backend + smoke subset flags (official prompts + F1 unchanged) |
| Backend | truncated-context baseline (no RAG; Project Memory is **not** wired) |
| Subset | {subset} |
| Model | `{model}` |
| Samples | {len(out_samples)} |
| QA items | {len(scores)} |
| Mean `{score_name}` | {mean_f1:.3f} |

## Reproduce

Clone with the submodule (or init it later):

```bash
{CLONE_COMMAND}
# existing clone:
{INIT_COMMAND}
```

Print the official command (no API key):

```bash
{command}
```

Real kimi-for-coding run (key via env, never commit the key):

```bash
{real_command}
```

`KIMI_API_KEY` or `OPENAI_API_KEY` is required for the real run (Kimi Code Console Bearer key, not a Moonshot pay-as-you-go key). `OPENAI_BASE_URL` defaults to `{DEFAULT_BASE_URL}`. Do not use `api.moonshot.ai` / `api.moonshot.cn` for `kimi-for-coding`.

## Per-question scores

| sample_id | category | question | gold | prediction | F1 |
| --- | --- | --- | --- | --- | --- |
{chr(10).join(rows)}

## What this is not

- Not a ranking of memory systems.
- Not a construct-valid proof for filesystem project-memory.
- Not an official LoCoMo leaderboard submission.
- Not the legacy hand-port at `evaluation/cases/locomo-smoke/` (kept for history).
"""


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)

    print_parser = sub.add_parser(
        "print-command",
        help="Print the official evaluate_qa.py invocation (no API key)",
    )
    _add_smoke_flags(print_parser)

    crop_parser = sub.add_parser(
        "crop",
        help="Official crop: conv-44 / 2 QA per category, keep RAG fields",
    )
    crop_parser.add_argument("--data-file", type=Path, default=DEFAULT_DATA)
    crop_parser.add_argument("--cropped-file", type=Path, default=DEFAULT_CROPPED)
    crop_parser.add_argument("--sample-id", default=SAMPLE_ID)
    crop_parser.add_argument("--qa-per-category", type=int, default=QA_PER_CATEGORY)

    smoke_parser = sub.add_parser(
        "smoke",
        help="Run official evaluate_qa.py and write Evaluation Smoke reports",
    )
    _add_smoke_flags(smoke_parser)

    args = parser.parse_args(argv)

    if args.command == "print-command":
        print(_format_print_command(args))
        return 0

    try:
        require_submodule()
    except FileNotFoundError as exc:
        print(str(exc), file=sys.stderr)
        return 2

    if args.command == "crop":
        return _run_crop(args)
    return _run_smoke(args)


def _add_smoke_flags(parser: argparse.ArgumentParser) -> None:
    parser.add_argument("--data-file", type=Path, default=DEFAULT_DATA)
    parser.add_argument("--reports-dir", type=Path, default=DEFAULT_REPORTS)
    parser.add_argument("--date", default=DEFAULT_DATE)
    parser.add_argument("--model", default=os.environ.get("LOCOMO_MODEL", DEFAULT_MODEL))
    parser.add_argument("--sample-id", default=SAMPLE_ID)
    parser.add_argument("--qa-per-category", type=int, default=QA_PER_CATEGORY)


def _format_print_command(args: argparse.Namespace) -> str:
    out_file = Path(args.reports_dir) / f"{args.date}-locomo-official-smoke-{_slug(args.model)}.json"
    evaluate = build_evaluate_command(
        data_file=args.data_file,
        out_file=out_file,
        model=args.model,
        sample_id=args.sample_id,
        qa_per_category=args.qa_per_category,
        python="python3",
    )
    evaluate_line = " \\\n  ".join(_pretty_pairs(_pretty_argv(evaluate)))
    return f"""# Evaluation Smoke, not Benchmark Proof / not Project Memory proof.
# Official F1: VirusPC/locomo task_eval/evaluation.py (pinned {PINNED_COMMIT}).
# Upstream base: {UPSTREAM_BASE}. Intentional delta: OpenAI-compatible model backend + smoke subset flags; official F1/prompts unchanged.
# Subset: {args.sample_id}; first {args.qa_per_category} QA per category in file order.

# One-time submodule init
{CLONE_COMMAND}
# or, in an existing clone:
{INIT_COMMAND}
# optional live-run deps (not needed for print-command / unit tests):
# pip install -r evaluation/third_party/locomo/requirements-openai-compat.txt

# Official evaluate_qa.py (requires KIMI_API_KEY or OPENAI_API_KEY)
KIMI_API_KEY=... OPENAI_BASE_URL={DEFAULT_BASE_URL} \\
  {evaluate_line}

# Thin Edges wrapper (same official command, then writes the markdown report)
{SMOKE_COMMAND}
"""


def _run_crop(args: argparse.Namespace) -> int:
    command = build_crop_command(
        data_file=args.data_file,
        cropped_file=args.cropped_file,
        sample_id=args.sample_id,
        qa_per_category=args.qa_per_category,
    )
    completed = subprocess.run(command, check=False, cwd=str(LOCOMO_ROOT), env=_child_env())
    if completed.returncode != 0:
        return completed.returncode
    print(f"wrote {args.cropped_file} (official crop; observation/session_summary kept)")
    return 0


def _run_smoke(args: argparse.Namespace) -> int:
    if not (os.environ.get("KIMI_API_KEY") or os.environ.get("OPENAI_API_KEY")):
        print("smoke requires KIMI_API_KEY or OPENAI_API_KEY", file=sys.stderr)
        print(f"No key in CI? run: {PRINT_COMMAND}", file=sys.stderr)
        return 2

    reports_dir = Path(args.reports_dir)
    reports_dir.mkdir(parents=True, exist_ok=True)
    stem = f"{args.date}-locomo-official-smoke-{_slug(args.model)}"
    out_file = reports_dir / f"{stem}.json"
    report_path = reports_dir / f"{stem}.md"
    command = build_evaluate_command(
        data_file=args.data_file,
        out_file=out_file,
        model=args.model,
        sample_id=args.sample_id,
        qa_per_category=args.qa_per_category,
    )
    completed = subprocess.run(command, check=False, cwd=str(LOCOMO_ROOT), env=_child_env())
    if completed.returncode != 0:
        return completed.returncode

    out_samples = json.loads(out_file.read_text(encoding="utf-8"))
    report_path.write_text(
        render_official_report(
            out_samples=out_samples,
            model=args.model,
            subset=(
                f"{args.sample_id}; first {args.qa_per_category} QA per category "
                "1-5 in file order (take all if a category has <2)"
            ),
            command=PRINT_COMMAND,
            real_command=SMOKE_COMMAND,
        ),
        encoding="utf-8",
    )
    print(f"wrote {out_file}")
    print(f"wrote {report_path}")
    return 0


def _child_env() -> dict[str, str]:
    env = dict(os.environ)
    env["PYTHONDONTWRITEBYTECODE"] = "1"
    return env


def _pretty_argv(command: list[str]) -> list[str]:
    pretty: list[str] = []
    for item in command:
        try:
            pretty.append(str(Path(item).relative_to(REPO_ROOT)))
        except ValueError:
            pretty.append(item)
    return pretty


def _pretty_pairs(parts: list[str]) -> list[str]:
    """Keep `--flag value` on one line so the printed command is greppable."""
    grouped: list[str] = []
    index = 0
    while index < len(parts):
        current = parts[index]
        if current.startswith("--") and index + 1 < len(parts) and not parts[index + 1].startswith("--"):
            grouped.append(f"{current} {parts[index + 1]}")
            index += 2
            continue
        grouped.append(current)
        index += 1
    return grouped


def _gold_answer(qa: dict[str, Any]) -> str:
    if qa.get("answer") not in (None, ""):
        return str(qa["answer"])
    if qa.get("adversarial_answer") not in (None, ""):
        return str(qa["adversarial_answer"])
    return ""


def _cell(value: Any) -> str:
    text = "" if value is None else str(value).replace("\n", " ").replace("|", "/")
    return text if len(text) <= 80 else text[:77] + "..."


def _slug(model: str) -> str:
    return "".join(ch if ch.isalnum() else "-" for ch in model).strip("-")


if __name__ == "__main__":
    raise SystemExit(main())
