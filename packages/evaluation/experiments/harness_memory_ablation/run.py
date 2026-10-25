"""Run harness memory ablation against two local worktrees.

Does not clone, fetch, checkout, or reset. `retrieval_eval.run` is the wrong
entry: its `sync_clone` would replace a dirty memory-off tree. This runner
only points the agent client at the directories you pass.

Answers come from the agent client (codex by default, pi when `--client pi`).
The prompt is the question. Memory files are not pasted in. Quality, when
requested, is a separate judge call.

    python3 packages/evaluation/experiments/harness_memory_ablation/run.py print-command \
        --memory-off /path/to/worktree-A --memory-on /path/to/worktree-B --samples 1

    python3 packages/evaluation/experiments/harness_memory_ablation/run.py run \
        --memory-off /path/to/worktree-A --memory-on /path/to/worktree-B \
        --case S01 --case S02

A full 30-case file is not in this repo. Point `--cases` at a local
Dataset `harness-memory-ablation/v1` export. That run needs agent
credentials and the two worktrees prepared outside this command.
"""

from __future__ import annotations

import argparse
import json
import shlex
import subprocess
import sys
import time
from collections.abc import Callable, Mapping, Sequence
from datetime import datetime
from pathlib import Path
from typing import Any

_PACKAGE = Path(__file__).resolve().parent
_EXPERIMENTS = _PACKAGE.parent
_EVAL_DIR = _EXPERIMENTS.parent
for _path in (_EVAL_DIR, _EXPERIMENTS):
    if str(_path) not in sys.path:
        sys.path.insert(0, str(_path))

import shared  # noqa: F401  # retrieval_eval + packages/observation on sys.path

from harness_memory_ablation.answer import answer_text, trial_failure, usage_from_events
from harness_memory_ablation.cases import (
    DATASET_V1,
    CasesError,
    load_cases,
    select_cases,
)
from harness_memory_ablation.judge import JudgeError, judge_from_flag
from harness_memory_ablation.prompt import build_prompt
from harness_memory_ablation.report import write_report
from harness_memory_ablation.score import compare_trials
from harness_memory_ablation.trace import SERVICE_NAME, build_trial_trace
from langfuse_sink import ExportResult, exporter_from_env, make_session_id
from shared.agent_client import (
    DEFAULT_CONFIG,
    Client,
    ClientCall,
    ConfigError,
    _load_clients,
    codex_command,
    pi_command,
    pi_install_command,
    pi_sandbox_check_command,
    pi_sandbox_config_json,
    run_client,
)


DEFAULT_CASES = _PACKAGE / "cases" / "smoke.json"
CACHE_ROOT = _EVAL_DIR / ".cache" / "harness-memory-ablation"
REPORTS_DIR = _EVAL_DIR / "reports"
_FULL_RUN_NOTE = (
    "完整 30 题需要在本 PR 之外准备 Agent 凭据和 A/B worktree，"
    f"并把 `--cases` 指到本地 Dataset `{DATASET_V1}` 导出。"
    "本命令不克隆、不重置工作目录。"
)


def load_named_client(client_id: str) -> Client:
    """Reuse retrieval_eval's client registry. Paths are not part of that registry."""
    registry = _load_clients(DEFAULT_CONFIG.parent / "clients.json")
    if client_id not in registry:
        known = ", ".join(sorted(registry))
        raise ConfigError(f"unknown client {client_id}; known clients: {known}")
    return registry[client_id]


def print_command(
    *,
    memory_off: Path,
    memory_on: Path,
    cases: Sequence[Mapping[str, Any]],
    client: Client,
    repeats: int,
    samples: int | None = None,
) -> str:
    """Print the agent commands for the first selected case. Does not run them."""
    shown = list(cases[:samples] if samples is not None else cases)
    if not shown:
        raise CasesError("no cases")
    case = shown[0]
    prompt = build_prompt(str(case["question"]))
    lines = [
        (
            f"# harness-memory-ablation cases={len(shown)} first={case['case_id']} "
            f"repeats={repeats} client={client.id}"
        ),
        "# does not clone or reset the worktrees",
    ]
    for condition, cwd in (("memory:off", memory_off), ("memory:on", memory_on)):
        lines.append(f"# {condition} cwd={cwd}")
        lines.append(_shell_command(client, cwd, prompt, condition, str(case["case_id"])))
    return "\n".join(lines)


def run_experiment(
    *,
    memory_off: Path,
    memory_on: Path,
    cases: Sequence[Mapping[str, Any]],
    dataset: str,
    client: Client,
    repeats: int,
    judge: Any,
    reports_dir: Path,
    cache_dir: Path,
    client_runner: Callable[..., ClientCall] = run_client,
    exporter: Any = None,
    stamp: str | None = None,
    run_date: str | None = None,
    clock: Callable[[], float] | None = None,
) -> dict[str, Any]:
    """Ask the client in each worktree. Does not clone or clean those trees."""
    for cwd in (memory_off, memory_on):
        if not cwd.is_dir():
            raise CasesError(f"worktree is not a directory: {cwd}")
    if repeats < 1:
        raise CasesError("repeats must be a positive integer")
    stamp = stamp or datetime.now().strftime("%Y-%m-%d-%H%M%S")
    run_date = run_date or stamp[:10]
    now = clock or time.perf_counter
    session_id = make_session_id("harness-memory-ablation", [client.id], stamp)
    sink = exporter if exporter is not None else exporter_from_env()
    conditions = {
        "memory:off": _worktree_status(memory_off),
        "memory:on": _worktree_status(memory_on),
    }
    trials: list[dict[str, Any]] = []
    for condition, cwd in (("memory:off", memory_off), ("memory:on", memory_on)):
        for case in cases:
            for repeat in range(1, repeats + 1):
                trials.append(
                    _one_trial(
                        condition=condition,
                        cwd=cwd,
                        case=case,
                        repeat=repeat,
                        client=client,
                        dataset=dataset,
                        judge=judge,
                        cache_dir=cache_dir,
                        stamp=stamp,
                        run_date=run_date,
                        session_id=session_id,
                        client_runner=client_runner,
                        exporter=sink,
                        clock=now,
                    )
                )
    summary = compare_trials(trials)
    payload = {
        "kind": "evaluation-smoke",
        "service_name": SERVICE_NAME,
        "dataset": dataset,
        "client": client.id,
        "repeats": repeats,
        "judge": type(judge).__name__,
        "note": _FULL_RUN_NOTE,
        "conditions": conditions,
        "trials": trials,
        **summary,
    }
    write_report(reports_dir / f"{stamp}-harness-memory-ablation", payload)
    (cache_dir / "sessions" / stamp / "result.json").parent.mkdir(parents=True, exist_ok=True)
    (cache_dir / "sessions" / stamp / "result.json").write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    return payload


def _one_trial(
    *,
    condition: str,
    cwd: Path,
    case: Mapping[str, Any],
    repeat: int,
    client: Client,
    dataset: str,
    judge: Any,
    cache_dir: Path,
    stamp: str,
    run_date: str,
    session_id: str,
    client_runner: Callable[..., ClientCall],
    exporter: Any,
    clock: Callable[[], float],
) -> dict[str, Any]:
    prompt = build_prompt(str(case["question"]))
    log_dir = cache_dir / "sessions" / stamp / condition.replace(":", "-")
    log_dir.mkdir(parents=True, exist_ok=True)
    stem = f"{case['case_id']}-r{repeat}"
    last_message = log_dir / f"{stem}.last.txt"
    started = clock()
    call = client_runner(client, cwd, prompt, last_message)
    latency_ms = (clock() - started) * 1000
    saved = last_message.read_text(encoding="utf-8") if last_message.is_file() else ""
    answer = answer_text(kind=client.kind, last_message=saved, stdout=call.stdout)
    usage = usage_from_events(client.kind, call.stdout)
    (log_dir / f"{stem}.events.jsonl").write_text(call.stdout, encoding="utf-8")
    (log_dir / f"{stem}.stderr.txt").write_text(call.stderr, encoding="utf-8")
    failure = trial_failure(call, answer)
    verdict: str | None = None
    violations: list[str] = []
    error = failure
    if failure is None:
        try:
            judged = judge.score(
                question=str(case["question"]),
                answer=answer,
                criteria=list(case["criteria"]),
                violations=list(case["violations"]),
            )
        except Exception as exc:
            judged = None
            error = type(exc).__name__
        if judged is not None:
            verdict = judged.verdict
            violations = list(judged.violations)
    trace = build_trial_trace(
        events_jsonl=call.stdout,
        case_id=str(case["case_id"]),
        category=str(case["category"]),
        condition=condition,
        client_id=client.id,
        client_kind=client.kind,
        prompt=prompt,
        answer=answer,
        session_id=session_id,
        run_date=run_date,
        dataset=dataset,
        attributes=_trace_attributes(verdict, violations, usage, latency_ms, error),
    )
    _export(exporter, trace)
    return {
        "case_id": case["case_id"],
        "category": case["category"],
        "condition": condition,
        "repeat": repeat,
        "question": case["question"],
        "answer": answer,
        "verdict": verdict,
        "violations": violations,
        "input_tokens": usage["input_tokens"],
        "output_tokens": usage["output_tokens"],
        "cached_input_tokens": usage["cached_input_tokens"],
        "latency_ms": latency_ms,
        "returncode": call.returncode,
        "timed_out": call.timed_out,
        "error": error,
    }


def _trace_attributes(
    verdict: str | None,
    violations: Sequence[str],
    usage: Mapping[str, int | None],
    latency_ms: float,
    error: str | None,
) -> dict[str, str]:
    attributes: dict[str, str] = {
        "violation_count": str(len(violations)),
        "latency_ms": f"{latency_ms:.1f}",
    }
    if verdict is not None:
        attributes["verdict"] = verdict
    if error:
        attributes["error"] = error
    tokens = usage.get("input_tokens")
    if isinstance(tokens, int):
        attributes["input_tokens"] = str(tokens)
    return attributes


def _export(exporter: Any, trace: Any) -> None:
    try:
        result = exporter.export(trace)
    except Exception as exc:
        result = ExportResult("failed", error=type(exc).__name__)
    if result.status == "failed":
        print(f"harness_memory_ablation: trace export failed: {result.error}", file=sys.stderr)


def _shell_command(client: Client, cwd: Path, prompt: str, condition: str, case_id: str) -> str:
    if client.kind == "pi":
        command = pi_command(client, prompt)
        install = "PI_CODING_AGENT_DIR=<fresh> " + shlex.join(pi_install_command(client))
        sandbox = "write $PI_CODING_AGENT_DIR/sandbox.json " + pi_sandbox_config_json()
        check = shlex.join(pi_sandbox_check_command(cwd, "bwrap"))
        run = f"(cd {shlex.quote(str(cwd))} && {shlex.join(command)})"
        return "\n".join([install, sandbox, check, run])
    last_message = (
        CACHE_ROOT / "sessions" / "<stamp>" / condition.replace(":", "-") / f"{case_id}-r1.last.txt"
    )
    return shlex.join(codex_command(client, cwd, prompt, last_message))


def _worktree_status(cwd: Path) -> dict[str, Any]:
    commit = _git_output(["git", "-C", str(cwd), "rev-parse", "HEAD"])
    porcelain = _git_output(["git", "-C", str(cwd), "status", "--porcelain"])
    return {"cwd": str(cwd), "commit": commit, "dirty": bool(porcelain)}


def _git_output(command: list[str]) -> str | None:
    try:
        result = subprocess.run(
            command,
            check=False,
            text=True,
            capture_output=True,
            timeout=10,
        )
    except (OSError, subprocess.TimeoutExpired):
        return None
    if result.returncode != 0:
        return None
    text = result.stdout.strip()
    return text or None


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Harness memory ablation: local worktree A/B × agent client × free-form cases"
    )
    sub = parser.add_subparsers(dest="command", required=True)
    for name in ("print-command", "run"):
        command = sub.add_parser(name)
        command.add_argument("--memory-off", type=Path, required=True)
        command.add_argument("--memory-on", type=Path, required=True)
        command.add_argument("--cases", type=Path, default=DEFAULT_CASES)
        command.add_argument("--samples", type=int, default=None)
        command.add_argument("--case", action="append", dest="case_ids", default=None)
        command.add_argument("--client", default="codex")
        command.add_argument("--repeats", type=int, default=1)
        command.add_argument("--judge", choices=("skip", "llm"), default="skip")
    return parser


def main(argv: Sequence[str] | None = None) -> int:
    parser = _parser()
    try:
        args = parser.parse_args(None if argv is None else list(argv))
    except SystemExit as exc:
        code = exc.code
        return code if isinstance(code, int) else 2
    try:
        loaded = load_cases(args.cases)
        cases = select_cases(loaded["items"], samples=args.samples, case_ids=args.case_ids)
        client = load_named_client(args.client)
    except (CasesError, ConfigError) as exc:
        print(f"harness_memory_ablation: {exc}", file=sys.stderr)
        return 2
    if args.command == "print-command":
        try:
            print(
                print_command(
                    memory_off=args.memory_off,
                    memory_on=args.memory_on,
                    cases=cases,
                    client=client,
                    repeats=args.repeats,
                )
            )
        except CasesError as exc:
            print(f"harness_memory_ablation: {exc}", file=sys.stderr)
            return 2
        return 0
    for cwd in (args.memory_off, args.memory_on):
        if not cwd.is_dir():
            print(f"harness_memory_ablation: worktree is not a directory: {cwd}", file=sys.stderr)
            return 2
    try:
        judge = judge_from_flag(args.judge)
    except JudgeError as exc:
        print(f"harness_memory_ablation: {exc}", file=sys.stderr)
        return 2
    run_experiment(
        memory_off=args.memory_off,
        memory_on=args.memory_on,
        cases=cases,
        dataset=loaded["dataset"],
        client=client,
        repeats=args.repeats,
        judge=judge,
        reports_dir=REPORTS_DIR,
        cache_dir=CACHE_ROOT,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
