#!/usr/bin/env python3
"""Legacy LoCoMo Evaluation Smoke runner (hand-port, truncated-context baseline).

Preferred official path: ``evaluation/run_locomo_official.py`` (VirusPC/locomo
submodule → ``task_eval/evaluate_qa.py`` → official ``evaluation.py`` F1).
"""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

from baseline import live_evaluate
from constants import DEFAULT_BASE_URL, DEFAULT_MODEL, DRY_RUN_MODEL, SAMPLE_ID
from crop import crop_samples, load_locomo, write_json
from evaluate import dry_run_evaluate
from openai_compat import resolve_api_config
from report import render_report

CASE_DIR = Path(__file__).resolve().parent
EVAL_DIR = CASE_DIR.parents[1]
DEFAULT_REPORTS = EVAL_DIR / "reports"
DEFAULT_CACHE = EVAL_DIR / ".cache" / "locomo" / "locomo10.json"
DEFAULT_CROPPED = CASE_DIR / "data" / "locomo10-conv44-smoke.json"

SUBSET = f"{SAMPLE_ID}; first 2 QA per category 1-5 in file order (take all if a category has <2)"
DRY_RUN_COMMAND = "python3 evaluation/cases/locomo-smoke/run.py dry-run"
REAL_COMMAND = (
    "KIMI_API_KEY=... OPENAI_BASE_URL=https://api.kimi.com/coding/v1 "
    "python3 evaluation/cases/locomo-smoke/run.py baseline"
)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)

    crop_parser = sub.add_parser("crop", help="Build the conv-44 / 2-QA-per-category JSON")
    _add_io_flags(crop_parser)

    dry_parser = sub.add_parser("dry-run", help="Dummy answers, official-style out-file + report")
    _add_io_flags(dry_parser)
    dry_parser.add_argument("--date", default="2026-09-16")
    dry_parser.add_argument("--reports-dir", type=Path, default=DEFAULT_REPORTS)

    base_parser = sub.add_parser("baseline", help="Real truncated-context run via OpenAI-compatible API")
    _add_io_flags(base_parser)
    base_parser.add_argument("--date", default="2026-09-16")
    base_parser.add_argument("--reports-dir", type=Path, default=DEFAULT_REPORTS)
    base_parser.add_argument("--model", default=os.environ.get("LOCOMO_MODEL", DEFAULT_MODEL))
    base_parser.add_argument("--base-url", default=None)
    base_parser.add_argument("--api-key", default=None)

    args = parser.parse_args(argv)

    cropped = _load_or_crop(args)
    write_json(args.cropped_file, cropped)

    if args.command == "crop":
        print(f"wrote {args.cropped_file}")
        return 0

    if args.command == "dry-run":
        out = dry_run_evaluate(cropped)
        model = DRY_RUN_MODEL
        mode = "dry-run"
        stem = f"{args.date}-locomo-smoke-dry-run"
        command = DRY_RUN_COMMAND
    else:
        api_key, base_url = resolve_api_config(api_key=args.api_key, base_url=args.base_url)
        if not api_key:
            print("baseline requires KIMI_API_KEY or OPENAI_API_KEY", file=sys.stderr)
            return 2
        out = live_evaluate(
            cropped,
            model=args.model,
            api_key=api_key,
            base_url=base_url,
        )
        model = args.model
        mode = "real"
        stem = f"{args.date}-locomo-smoke-{_slug(model)}"
        command = REAL_COMMAND

    reports_dir = Path(args.reports_dir)
    reports_dir.mkdir(parents=True, exist_ok=True)
    out_path = reports_dir / f"{stem}.json"
    report_path = reports_dir / f"{stem}.md"
    write_json(out_path, out)
    report_path.write_text(
        render_report(
            out_samples=out,
            mode=mode,
            model=model,
            subset=SUBSET,
            command=DRY_RUN_COMMAND,
            real_command=REAL_COMMAND,
        ),
        encoding="utf-8",
    )
    print(f"wrote {out_path}")
    print(f"wrote {report_path}")
    return 0


def _add_io_flags(parser: argparse.ArgumentParser) -> None:
    parser.add_argument(
        "--data-file",
        type=Path,
        default=None,
        help="Local locomo10.json (or already-cropped JSON). If omitted, fetch the pinned upstream file into evaluation/.cache/.",
    )
    parser.add_argument("--cache-file", type=Path, default=DEFAULT_CACHE)
    parser.add_argument("--cropped-file", type=Path, default=DEFAULT_CROPPED)


def _load_or_crop(args: argparse.Namespace) -> list[dict]:
    data_file = args.data_file
    if data_file is None and Path(args.cropped_file).is_file():
        data_file = args.cropped_file
    source = load_locomo(data_file, cache_path=args.cache_file)
    if (
        len(source) == 1
        and source[0].get("sample_id") == SAMPLE_ID
        and args.data_file is not None
        and Path(args.data_file).resolve() == Path(args.cropped_file).resolve()
    ):
        return source
    if _looks_cropped(source):
        return source
    return crop_samples(source)


def _looks_cropped(samples: list[dict]) -> bool:
    if len(samples) != 1 or samples[0].get("sample_id") != SAMPLE_ID:
        return False
    qa = samples[0].get("qa") or []
    if not qa:
        return False
    counts: dict[int, int] = {}
    for item in qa:
        counts[item.get("category")] = counts.get(item.get("category"), 0) + 1
    return all(count <= 2 for count in counts.values()) and set(counts) <= {1, 2, 3, 4, 5}


def _slug(model: str) -> str:
    return "".join(ch if ch.isalnum() else "-" for ch in model).strip("-")


if __name__ == "__main__":
    raise SystemExit(main())
