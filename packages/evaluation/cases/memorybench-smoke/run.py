#!/usr/bin/env python3
"""Bounded NFCats smoke using pinned, unmodified THUIR/MemoryBench classes.

Dependencies and upstream checkout live under evaluation/.cache/memorybench.
Credentials are read from the environment or this worktree's root .env;
never serialized into reports.
"""
from __future__ import annotations

import argparse
import copy
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import time

UPSTREAM_SHA = "247ba8c1e327fa297c0d57aaad0e3cbd66bac656"
DATA_SHA = "3acd60a4bd35b43b408f0e6db4c5f1e88df5e96d"
CACHE = Path(__file__).resolve().parents[2] / ".cache" / "memorybench"
ENV_FILE = Path(__file__).resolve().parents[4] / ".env"
ENV_KEYS = {
    "OPENAI_API_KEY", "OPENAI_BASE_URL", "MEMORYBENCH_MODEL",
    "EVALUATE_API_KEY", "EVALUATE_BASE_URL", "EVALUATE_MODEL",
}


class AbortRun(BaseException):
    """Escape upstream catch-and-retry/fallback-to-score-1 handlers."""


def save(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n")


def main():
    from dotenv import dotenv_values

    # Read only our selected file and keys; do not execute shell expressions,
    # expand variables, or import unrelated credentials such as GITHUB_TOKEN.
    for key, value in dotenv_values(ENV_FILE, interpolate=False).items():
        if key in ENV_KEYS and value:
            os.environ.setdefault(key, value)
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--prepare-only", action="store_true")
    parser.add_argument("--model", default=os.getenv("MEMORYBENCH_MODEL"))
    parser.add_argument("--judge-model", default=os.getenv("EVALUATE_MODEL"))
    parser.add_argument("--train-limit", type=int, default=10)
    parser.add_argument("--test-limit", type=int, default=10)
    parser.add_argument("--max-output-tokens", type=int, default=4096)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    if not (1 <= args.train_limit <= 100 and 1 <= args.test_limit <= 20):
        parser.error("smoke limits: train 1..100, test 1..20")
    if not 128 <= args.max_output_tokens <= 8192:
        parser.error("max output tokens must be 128..8192")
    if not args.prepare_only and (
        not args.model or not os.getenv("OPENAI_API_KEY") or not os.getenv("OPENAI_BASE_URL")
    ):
        parser.error("set OPENAI_API_KEY, OPENAI_BASE_URL and MEMORYBENCH_MODEL in the worktree root .env or environment")
    upstream = CACHE / "upstream"
    sha = subprocess.check_output(["git", "-C", str(upstream), "rev-parse", "HEAD"], text=True).strip()
    if sha != UPSTREAM_SHA:
        parser.error("upstream checkout does not match pinned commit")
    if subprocess.check_output(["git", "-C", str(upstream), "status", "--porcelain"], text=True).strip():
        parser.error("upstream must be unmodified")
    sys.path.insert(0, str(upstream))
    # Disable upstream implicit .env discovery; credentials must be explicit.
    os.environ["PYTHON_DOTENV_DISABLED"] = "1"
    os.environ["HF_HUB_DISABLE_IMPLICIT_TOKEN"] = "1"
    os.environ["LLM_REQUEST_TIMEOUT"] = "90"
    os.environ["EVALUATE_API_KEY"] = os.getenv("EVALUATE_API_KEY") or os.getenv("OPENAI_API_KEY", "prepare-only")
    os.environ["EVALUATE_BASE_URL"] = os.getenv("EVALUATE_BASE_URL") or os.getenv("OPENAI_BASE_URL", "http://localhost:1/v1")
    os.environ["EVALUATE_MODEL"] = args.judge_model or args.model or "prepare-only"

    from huggingface_hub import snapshot_download

    data_dir = snapshot_download(
        "THUIR/MemoryBench", repo_type="dataset", revision=DATA_SHA,
        allow_patterns=["README.md", "dataset/NFCats/**"],
        local_dir=str(CACHE / "data"), token=False,
    )
    from datasets import load_from_disk
    from src.dataset.NFCats import NFCats_Dataset
    from src.dataset.utils import convert_str_to_obj
    from src.solver import SolverFactory

    class PinnedNFCats(NFCats_Dataset):
        def _load_data(self):
            # The upstream README lists all 28 configs; loading a partial local
            # snapshot through load_dataset tries to resolve missing configs.
            # Read the exact published Arrow files, with the upstream converter.
            self.has_corpus = False
            return load_from_disk(str(Path(data_dir) / "dataset" / "NFCats")).map(convert_str_to_obj)

    dataset = PinnedNFCats()
    dataset.openai_model.config.max_tokens = args.max_output_tokens
    original_counts = {key: len(dataset.dataset[key]) for key in ["train", "test"]}
    for split, count in [("train", args.train_limit), ("test", args.test_limit)]:
        if count > original_counts[split]:
            parser.error(f"requested {split} subset exceeds dataset")
        dataset.dataset[split] = dataset.dataset[split].select(range(count))
    ids = {split: list(dataset.dataset[split]["test_idx"]) for split in ["train", "test"]}
    if set(ids["train"]) & set(ids["test"]):
        parser.error("training and test IDs overlap")
    dialogs = [dict(test_idx=row["test_idx"], dialog=row["dialog"], dataset="NFCats")
               for row in dataset.dataset["train"]]
    manifest = {
        "scope": "NFCats off-policy smoke; not full benchmark or Edges memory proof",
        "upstream_commit": sha, "dataset_revision": DATA_SHA,
        "dataset": "NFCats", "original_counts": original_counts, "selected_ids": ids,
        "selection": "first N rows of each official split, before generation",
        "history_field": "dialog (same as upstream off-policy default)",
        "training_message_count": sum(len(d["dialog"]) for d in dialogs),
        "training_followup_user_turns": sum(max(0, sum(m["role"] == "user" for m in d["dialog"]) - 1) for d in dialogs),
        "data_sha256": {str(p.relative_to(CACHE / "data")): hashlib.sha256(p.read_bytes()).hexdigest()
                        for p in sorted((CACHE / "data" / "dataset" / "NFCats").rglob("*.arrow"))},
        "model": args.model, "judge_model": os.environ["EVALUATE_MODEL"],
        "data_loader": "pinned published Arrow files + official convert_str_to_obj",
        "temperature": 0.1, "top_p": 0.1, "max_output_tokens": args.max_output_tokens,
        "judge_max_output_tokens": args.max_output_tokens, "retrieve_k": 1,
        "grading": "upstream NFCats native 1..5 rubric, no cross-dataset normalization",
        "max_requests": 4 * args.test_limit, "concurrency": 1,
    }
    if args.prepare_only:
        save(CACHE / "preparation.json", manifest)
        print(json.dumps({"status": "prepared", "original_counts": original_counts, "selected_ids": ids}))
        return
    if args.output is None:
        parser.error("run requires a fresh --output directory (prevents accidental reruns)")
    args.output.mkdir(parents=True, exist_ok=False)
    save(args.output / "manifest.json", manifest)
    events = []
    state = {"status": "running", "arms": {}}
    save(args.output / "results.json", state)

    def observe(llm, stage, arm, test_idx):
        llm.client.max_retries = 0
        original = llm.client.chat.completions.create

        def call(**kwargs):
            if len(events) >= manifest["max_requests"]:
                raise AbortRun("API request budget exhausted")
            # Upstream drops max_tokens for GPT reasoning models. Keep this run bounded.
            if llm._is_reasoning_model(llm.config.model):
                kwargs["max_completion_tokens"] = args.max_output_tokens
            if llm.config.model.lower().startswith("minimax"):
                kwargs.pop("max_tokens", None)
                kwargs["max_completion_tokens"] = args.max_output_tokens
                kwargs["extra_body"] = {"reasoning_split": True}
            begin = time.monotonic()
            event = {"stage": stage, "arm": arm, "test_idx": test_idx, "model": kwargs["model"]}
            try:
                result = original(**kwargs)
                choice = result.choices[0]
                event.update(usage=result.usage.model_dump() if result.usage else None,
                             finish_reason=choice.finish_reason, response=choice.message.content)
                if choice.finish_reason != "stop" or not choice.message.content:
                    raise AbortRun("empty or truncated response; no score recorded")
                return result
            except Exception as exc:
                event["error_type"] = type(exc).__name__
                event["http_status"] = getattr(exc, "status_code", None)
                raise AbortRun(f"{stage} API failed: {type(exc).__name__}") from None
            finally:
                event["elapsed_seconds"] = round(time.monotonic() - begin, 3)
                events.append(event)
                save(args.output / "api_events.json", events)
        llm.client.chat.completions.create = call
        return lambda: setattr(llm.client.chat.completions, "create", original)

    try:
        for arm in ["wo_memory", "bm25_message"]:
            config = {"llm_provider": "openai", "llm_config": {
                "model": args.model, "openai_base_url": os.environ["OPENAI_BASE_URL"],
                "temperature": 0.1, "top_p": 0.1, "max_tokens": args.max_output_tokens,
            }}
            if arm == "bm25_message":
                config["retrieve_k"] = 1
            solver = SolverFactory.create(method_name=arm, config=config,
                                          memory_cache_dir=str(args.output / f"index-{arm}"))
            started = time.monotonic()
            solver.create_or_load_memory(dialogs)
            arm_result = {"memory_write_seconds": round(time.monotonic() - started, 3), "cases": []}
            state["arms"][arm] = arm_result
            for row in dataset.dataset["test"]:
                idx = row["test_idx"]
                messages = copy.deepcopy(dataset.get_initial_chat_messages(idx))
                retrieved = solver.agent.retrieve_memory(messages[-1]["content"], k=1) if arm == "bm25_message" else []
                restore = observe(solver.agent.llm, "solver", arm, idx)
                try:
                    response = solver.agent.generate_response(messages=messages, lang=row["lang"])
                finally:
                    restore()
                case = {"test_idx": idx, "response": response, "retrieved_memories": retrieved}
                arm_result["cases"].append(case)
                save(args.output / "results.json", state)
                restore = observe(dataset.openai_model, "judge", arm, idx)
                try:
                    metrics = dataset.evaluate_single(row["input_prompt"], row["info"], response)
                finally:
                    restore()
                # Native parser accepts 6..10 despite its 1..5 prompt. Reject those runs.
                if metrics.get("score") not in [1, 2, 3, 4, 5]:
                    raise AbortRun("judge returned an out-of-rubric score")
                case["metrics"] = metrics
                save(args.output / "results.json", state)
                print(json.dumps({"arm": arm, "test_idx": idx, "score": metrics["score"]}), flush=True)
            arm_result["mean_score"] = sum(c["metrics"]["score"] for c in arm_result["cases"]) / args.test_limit
        state["status"] = "completed"
    except AbortRun as exc:
        state.update(status="failed", reason=str(exc))
        raise SystemExit(str(exc)) from None
    except Exception as exc:
        state.update(status="failed", reason=type(exc).__name__)
        raise SystemExit(f"run failed: {type(exc).__name__}") from None
    except KeyboardInterrupt:
        state.update(status="interrupted")
        raise
    finally:
        save(args.output / "results.json", state)
    print(json.dumps({"status": "completed", "means": {k: v["mean_score"] for k, v in state["arms"].items()}}))


if __name__ == "__main__":
    main()
