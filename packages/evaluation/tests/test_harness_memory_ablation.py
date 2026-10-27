"""Offline tests for the harness memory ablation runner. No agent and no network."""

from __future__ import annotations

import io
import json
import re
import subprocess
import sys
import tempfile
import unittest
from contextlib import redirect_stderr
from pathlib import Path
from unittest.mock import patch

EVAL_DIR = Path(__file__).resolve().parents[1]
EXPERIMENTS = EVAL_DIR / "experiments"
for _path in (EVAL_DIR, EXPERIMENTS):
    if str(_path) not in sys.path:
        sys.path.insert(0, str(_path))

from harness_memory_ablation.answer import answer_text, trial_failure, usage_from_events
from harness_memory_ablation.cases import CasesError, load_cases, select_cases
from harness_memory_ablation.judge import JudgeError, JudgeResult, OpenAICompatJudge, parse_judge_payload
from harness_memory_ablation.prompt import build_prompt
from harness_memory_ablation.report import write_report
from harness_memory_ablation.run import main, print_command, run_experiment
from harness_memory_ablation.score import compare_trials
from harness_memory_ablation.trace import EVAL_TAG, SERVICE_NAME, build_trial_trace, trial_tags
from shared.agent_client import Client, ClientCall
import retrieval_eval.git_repo as git_repo


SMOKE_CASES = EXPERIMENTS / "harness_memory_ablation" / "cases" / "smoke.json"
PACKAGE_DIR = EXPERIMENTS / "harness_memory_ablation"
_REPO_SLUG = re.compile(r"VirusPC/[A-Za-z0-9_-]+")


def _assert_no_personal_repo_slug(test: unittest.TestCase, blob: str) -> None:
    """Keep GitHub slugs to repos this public tree already names."""
    allowed = {"VirusPC/edges", "VirusPC/locomo"}
    test.assertLessEqual(set(_REPO_SLUG.findall(blob)), allowed)


def _client() -> Client:
    return Client(id="codex", command="codex", timeout_seconds=30, sandbox="read-only", kind="codex")


def _case(case_id: str, category: str, question: str = "q") -> dict:
    return {
        "id": f"harness-memory-ablation-{case_id}",
        "case_id": case_id,
        "question": question,
        "criteria": ["要点"],
        "violations": ["不要做的事"],
        "category": category,
        "metadata": {"category": category},
    }


def _trial(
    case_id: str,
    category: str,
    condition: str,
    *,
    verdict: str | None,
    tokens: int | None,
    latency: float | None,
    violations: list[str] | None = None,
) -> dict:
    return {
        "case_id": case_id,
        "category": category,
        "condition": condition,
        "repeat": 1,
        "verdict": verdict,
        "violations": violations or [],
        "input_tokens": tokens,
        "latency_ms": latency,
    }


class CaseTests(unittest.TestCase):
    def test_smoke_pack_is_dataset_shape_and_public(self) -> None:
        loaded = load_cases(SMOKE_CASES)
        self.assertEqual(loaded["dataset"], "harness-memory-ablation/smoke")
        self.assertGreaterEqual(len(loaded["items"]), 2)
        categories = {item["category"] for item in loaded["items"]}
        self.assertIn("memory-dependent", categories)
        self.assertIn("memory-irrelevant", categories)
        _assert_no_personal_repo_slug(self, SMOKE_CASES.read_text(encoding="utf-8"))
        first = loaded["items"][0]
        self.assertIn("question", first)
        self.assertIsInstance(first["criteria"], list)
        self.assertIsInstance(first["violations"], list)
        self.assertNotIn("ground_truth", first)
        self.assertNotIn("predicted", first)

    def test_select_samples_and_case_ids(self) -> None:
        loaded = load_cases(SMOKE_CASES)
        one = select_cases(loaded["items"], samples=1, case_ids=None)
        self.assertEqual([item["case_id"] for item in one], ["S01"])
        picked = select_cases(loaded["items"], samples=None, case_ids=["S02"])
        self.assertEqual([item["case_id"] for item in picked], ["S02"])
        truncated = select_cases(loaded["items"], samples=1, case_ids=["S02", "S01"])
        self.assertEqual([item["case_id"] for item in truncated], ["S02"])

    def test_rejects_path_retrieval_shape(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "bad.json"
            path.write_text(
                json.dumps({"dataset": "x", "items": [{"id": "a", "prompt": "q", "ground_truth": ["p"]}]}),
                encoding="utf-8",
            )
            with self.assertRaises(CasesError):
                load_cases(path)


class PromptTests(unittest.TestCase):
    def test_prompt_is_the_question_only(self) -> None:
        question = "工作区入口在哪里？"
        prompt = build_prompt(question)
        self.assertIn(question, prompt)
        self.assertNotIn('{"predicted"', prompt)
        self.assertNotIn("ground_truth", prompt)
        self.assertNotIn("判对要点", prompt)
        self.assertNotIn(".edges/memory/", prompt)


class AnswerTests(unittest.TestCase):
    def test_codex_prefers_last_message_and_sums_usage(self) -> None:
        stdout = "\n".join(
            [
                json.dumps(
                    {
                        "type": "turn.completed",
                        "usage": {"input_tokens": 10, "cached_input_tokens": 4, "output_tokens": 2},
                    }
                ),
                json.dumps(
                    {
                        "type": "turn.completed",
                        "usage": {"input_tokens": 5, "output_tokens": 1, "reasoning_output_tokens": 3},
                    }
                ),
                json.dumps(
                    {"type": "item.completed", "item": {"type": "agent_message", "text": "来自事件流"}}
                ),
            ]
        )
        self.assertEqual(answer_text(kind="codex", last_message="来自 -o", stdout=stdout), "来自 -o")
        self.assertEqual(answer_text(kind="codex", last_message="  ", stdout=stdout), "来自事件流")
        usage = usage_from_events("codex", stdout)
        self.assertEqual(usage["input_tokens"], 15)
        self.assertEqual(usage["output_tokens"], 3)
        self.assertEqual(usage["cached_input_tokens"], 4)
        self.assertEqual(usage["reasoning_tokens"], 3)

    def test_pi_reads_stop_text(self) -> None:
        stdout = json.dumps(
            {
                "type": "message_end",
                "message": {
                    "role": "assistant",
                    "stopReason": "stop",
                    "content": [{"type": "text", "text": "pi 回答"}],
                    "usage": {"input": 8, "output": 2, "cacheRead": 1},
                },
            }
        )
        self.assertEqual(answer_text(kind="pi", last_message="", stdout=stdout), "pi 回答")
        usage = usage_from_events("pi", stdout)
        self.assertEqual(usage["input_tokens"], 9)
        self.assertEqual(usage["cached_input_tokens"], 1)

    def test_predicted_parse_error_is_not_a_failure(self) -> None:
        call = ClientCall(
            predicted=[],
            command=["codex"],
            stdout="",
            stderr="",
            returncode=0,
            timed_out=False,
            parse_error="no predicted json found",
        )
        self.assertIsNone(trial_failure(call, "有回答"))
        self.assertEqual(trial_failure(call, "  "), "empty answer")


class ScoreTests(unittest.TestCase):
    def test_gates_use_category_accuracy_and_median_cost(self) -> None:
        trials = [
            _trial("M01", "memory-dependent", "memory:off", verdict="incorrect", tokens=100, latency=1000),
            _trial("M01", "memory-dependent", "memory:off", verdict="incorrect", tokens=300, latency=3000),
            _trial("M01", "memory-dependent", "memory:on", verdict="correct", tokens=110, latency=1100),
            _trial("M01", "memory-dependent", "memory:on", verdict="correct", tokens=130, latency=1100),
            _trial("I01", "memory-irrelevant", "memory:off", verdict="correct", tokens=100, latency=1000),
            _trial("I01", "memory-irrelevant", "memory:on", verdict="correct", tokens=110, latency=1000),
            _trial(
                "C01",
                "conflict-stale",
                "memory:off",
                verdict="correct",
                tokens=100,
                latency=1000,
            ),
            _trial(
                "C01",
                "conflict-stale",
                "memory:on",
                verdict="incorrect",
                tokens=110,
                latency=1000,
                violations=["过时"],
            ),
        ]
        # M01 medians: off tokens 200, on 120. I01 and C01 are single values.
        # Condition medians of [200, 100, 100] and [120, 110, 110].
        summary = compare_trials(trials)
        gates = {gate["id"]: gate for gate in summary["gates"]}
        self.assertTrue(gates["dependent_accuracy"]["pass"])
        self.assertGreaterEqual(gates["dependent_accuracy"]["delta_pp"], 10)
        self.assertTrue(gates["input_tokens"]["pass"])
        self.assertLessEqual(gates["input_tokens"]["delta_ratio"], 0.15)
        self.assertTrue(gates["latency"]["pass"])
        self.assertTrue(gates["irrelevant_not_harmful"]["pass"])
        self.assertTrue(summary["worth_default_on"])
        self.assertEqual(summary["conflict"]["b_worse_case_ids"], ["C01"])
        self.assertEqual(summary["by_category"]["conflict-stale"]["memory:on"]["violation_count"], 1)

    def test_skip_judge_leaves_quality_unscored(self) -> None:
        trials = [
            _trial("M01", "memory-dependent", "memory:off", verdict=None, tokens=100, latency=1000),
            _trial("M01", "memory-dependent", "memory:on", verdict=None, tokens=200, latency=1000),
            _trial("I01", "memory-irrelevant", "memory:off", verdict=None, tokens=100, latency=1000),
            _trial("I01", "memory-irrelevant", "memory:on", verdict=None, tokens=100, latency=1000),
        ]
        summary = compare_trials(trials)
        gates = {gate["id"]: gate for gate in summary["gates"]}
        self.assertIsNone(gates["dependent_accuracy"]["pass"])
        self.assertIsNone(gates["irrelevant_not_harmful"]["pass"])
        self.assertFalse(gates["input_tokens"]["pass"])
        self.assertFalse(summary["worth_default_on"])


class JudgeTests(unittest.TestCase):
    def test_parse_fenced_json(self) -> None:
        result = parse_judge_payload('说明\n```json\n{"verdict":"partial","violations":["改了 posts/"]}\n```')
        self.assertEqual(result, JudgeResult("partial", ["改了 posts/"]))

    def test_llm_judge_posts_criteria_not_memory_files(self) -> None:
        captured: dict = {}

        class _Response:
            status = 200

            def read(self) -> bytes:
                return json.dumps(
                    {"choices": [{"message": {"content": '{"verdict":"correct","violations":[]}'}}]}
                ).encode()

            def __enter__(self):
                return self

            def __exit__(self, *args):
                return False

        def opener(request, timeout=None):
            captured["url"] = request.full_url
            captured["auth"] = request.get_header("Authorization")
            captured["body"] = json.loads(request.data.decode("utf-8"))
            captured["timeout"] = timeout
            return _Response()

        judge = OpenAICompatJudge(
            base_url="https://judge.example/v1",
            api_key="sk-test",
            model="judge-model",
            opener=opener,
        )
        result = judge.score(
            question="问题",
            answer="回答",
            criteria=["要点 A"],
            violations=["不要直推 main"],
        )
        self.assertEqual(result.verdict, "correct")
        self.assertEqual(captured["url"], "https://judge.example/v1/chat/completions")
        self.assertEqual(captured["auth"], "Bearer sk-test")
        blob = json.dumps(captured["body"], ensure_ascii=False)
        self.assertIn("要点 A", blob)
        self.assertIn("不要直推 main", blob)
        self.assertIn("回答", blob)
        self.assertNotIn(".edges/memory/", blob)
        self.assertNotIn("sk-test", blob)
        with self.assertRaises(JudgeError):
            OpenAICompatJudge(base_url="", api_key="", model="", opener=opener)


class TraceTests(unittest.TestCase):
    def test_service_name_and_tags_are_not_retrieval(self) -> None:
        self.assertEqual(SERVICE_NAME, "edges-harness-memory-ablation")
        self.assertNotEqual(SERVICE_NAME, "edges-retrieval-eval")
        stdout = json.dumps(
            {"type": "item.completed", "item": {"type": "agent_message", "text": "回答"}}
        )
        trace = build_trial_trace(
            events_jsonl=stdout,
            case_id="M01",
            category="memory-dependent",
            condition="memory:on",
            client_id="codex",
            client_kind="codex",
            prompt="问题",
            answer="回答",
            session_id="harness-memory-ablation/codex/2026-10-25-031700/ab12",
            run_date="2026-10-25",
            dataset="harness-memory-ablation/v1",
        )
        self.assertEqual(trace.service_name, SERVICE_NAME)
        self.assertFalse(hasattr(trace, "tags"))
        self.assertEqual(trace.metadata["tags"], trial_tags("memory:on", "2026-10-25"))
        self.assertIn(EVAL_TAG, trace.metadata["tags"])
        self.assertIn("memory:on", trace.metadata["tags"])
        self.assertIn("run:2026-10-25", trace.metadata["tags"])
        self.assertNotIn("edges-retrieval-eval", json.dumps(trace.metadata))
        self.assertFalse(any(key.startswith("langfuse.") for key in trace.metadata))


class RunTests(unittest.TestCase):
    def test_print_command_uses_local_cwd_and_one_sample(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            off = Path(tmp) / "off"
            on = Path(tmp) / "on"
            off.mkdir()
            on.mkdir()
            text = print_command(
                memory_off=off,
                memory_on=on,
                cases=load_cases(SMOKE_CASES)["items"],
                client=_client(),
                repeats=1,
                samples=1,
            )
        self.assertNotIn("git clone", text)
        self.assertNotIn("sync_clone", text)
        self.assertNotIn("checkout --detach", text)
        self.assertIn("codex exec", text)
        self.assertIn("--sandbox read-only", text)
        self.assertIn(f"-C {off}", text)
        self.assertIn(f"-C {on}", text)
        self.assertIn("LoCoMo", text)
        self.assertNotIn("score 和 evaluator", text)
        self.assertIn("memory:off", text)
        self.assertIn("memory:on", text)

    def test_cli_print_command(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            off = Path(tmp) / "off"
            on = Path(tmp) / "on"
            off.mkdir()
            on.mkdir()
            completed = subprocess.run(
                [
                    sys.executable,
                    str(PACKAGE_DIR / "run.py"),
                    "print-command",
                    "--memory-off",
                    str(off),
                    "--memory-on",
                    str(on),
                    "--samples",
                    "1",
                    "--case",
                    "S01",
                    "--case",
                    "S02",
                ],
                check=True,
                text=True,
                capture_output=True,
            )
        self.assertIn("codex exec", completed.stdout)
        self.assertIn(str(off), completed.stdout)
        self.assertNotIn("git clone", completed.stdout)
        self.assertNotIn("score 和 evaluator", completed.stdout)

    def test_run_keeps_dirty_worktree_and_exports_tags(self) -> None:
        exported = []

        def runner(client, repo_dir, prompt, last_message_path):
            last_message_path.write_text(f"回答-{repo_dir.name}", encoding="utf-8")
            stdout = "\n".join(
                [
                    json.dumps(
                        {
                            "type": "turn.completed",
                            "usage": {"input_tokens": 110 if repo_dir.name == "on" else 100, "output_tokens": 4},
                        }
                    ),
                    json.dumps(
                        {
                            "type": "item.completed",
                            "item": {"type": "agent_message", "text": last_message_path.read_text(encoding="utf-8")},
                        }
                    ),
                ]
            )
            return ClientCall(
                predicted=[],
                command=["codex", "exec"],
                stdout=stdout,
                stderr="",
                returncode=0,
                timed_out=False,
                parse_error="no predicted json found",
            )

        class _Sink:
            def export(self, trace):
                exported.append(trace)
                from langfuse_sink import ExportResult

                return ExportResult("skipped")

        class _Judge:
            def score(self, *, question, answer, criteria, violations):
                if answer.endswith("-on"):
                    return JudgeResult("correct", [])
                return JudgeResult("incorrect", [])

        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            off = root / "off"
            on = root / "on"
            off.mkdir()
            on.mkdir()
            dirty = off / "experiment-only.txt"
            dirty.write_text("keep me\n", encoding="utf-8")
            reports = root / "reports"
            cache = root / "cache"
            ticks = iter([0.0, 1.0, 0.0, 1.0, 0.0, 1.1, 0.0, 1.1])
            with patch.object(git_repo, "sync_clone", side_effect=AssertionError("must not clone")):
                payload = run_experiment(
                    memory_off=off,
                    memory_on=on,
                    cases=[_case("M01", "memory-dependent", "依赖题"), _case("I01", "memory-irrelevant", "无关题")],
                    dataset="harness-memory-ablation/v1",
                    client=_client(),
                    repeats=1,
                    judge=_Judge(),
                    reports_dir=reports,
                    cache_dir=cache,
                    client_runner=runner,
                    exporter=_Sink(),
                    stamp="2026-10-25-031700",
                    run_date="2026-10-25",
                    clock=lambda: next(ticks),
                )
            self.assertEqual(dirty.read_text(encoding="utf-8"), "keep me\n")
            self.assertTrue(any(reports.glob("*.md")))
            self.assertTrue(any(reports.glob("*.json")))
            self.assertEqual(payload["service_name"], SERVICE_NAME)
            self.assertTrue(payload["worth_default_on"])
            self.assertEqual(len(exported), 4)
            self.assertTrue(all(trace.service_name == SERVICE_NAME for trace in exported))
            conditions = {trace.metadata["condition"] for trace in exported}
            self.assertEqual(conditions, {"memory:off", "memory:on"})
            self.assertTrue(all(EVAL_TAG in trace.metadata["tags"] for trace in exported))
            self.assertTrue(any("memory:off" in trace.metadata["tags"] for trace in exported))
            self.assertTrue(any("memory:on" in trace.metadata["tags"] for trace in exported))
            self.assertTrue(all(not hasattr(trace, "tags") for trace in exported))
            events = list(cache.rglob("*.events.jsonl"))
            self.assertEqual(len(events), 4)
            markdown = next(reports.glob("*.md")).read_text(encoding="utf-8")
            self.assertIn("评测冒烟", markdown)
            self.assertIn("memory-dependent", markdown)
            self.assertNotIn("edges-retrieval-eval", markdown)

    def test_main_samples_requires_paths(self) -> None:
        with redirect_stderr(io.StringIO()):
            code = main(["print-command"])
        self.assertEqual(code, 2)


class ReportTests(unittest.TestCase):
    def test_markdown_lists_gates_without_claiming_proof(self) -> None:
        payload = {
            "kind": "evaluation-smoke",
            "service_name": SERVICE_NAME,
            "dataset": "harness-memory-ablation/v1",
            "client": "codex",
            "repeats": 1,
            "judge": "skip",
            "worth_default_on": False,
            "note": "完整 30 题需要在本 PR 之外准备 Agent 凭据和 A/B worktree。",
            "conditions": {
                "memory:off": {"cwd": "/tmp/off", "commit": None, "dirty": False},
                "memory:on": {"cwd": "/tmp/on", "commit": "abc", "dirty": True},
            },
            "gates": [
                {"id": "dependent_accuracy", "pass": None, "detail": "unscored"},
                {"id": "input_tokens", "pass": True, "detail": "+1.0%"},
            ],
            "by_category": {},
            "conflict": {"b_worse_case_ids": []},
            "trials": [],
        }
        with tempfile.TemporaryDirectory() as tmp:
            json_path, md_path = write_report(Path(tmp) / "run", payload)
            text = md_path.read_text(encoding="utf-8")
            self.assertIn("评测冒烟", text)
            self.assertIn("不是公开基准证明", text)
            self.assertIn("unscored", text)
            self.assertIn("/tmp/off", text)
            stored = json.loads(json_path.read_text(encoding="utf-8"))
        self.assertEqual(stored["service_name"], SERVICE_NAME)


class PrivacyTests(unittest.TestCase):
    def test_package_docs_do_not_name_personal_repos(self) -> None:
        paths = [PACKAGE_DIR / "README.md", EVAL_DIR / "README.md", PACKAGE_DIR / "cases" / "README.md"]
        paths.extend(PACKAGE_DIR.glob("*.py"))
        blob = "\n".join(path.read_text(encoding="utf-8") for path in paths if path.is_file())
        _assert_no_personal_repo_slug(self, blob)
        readme = (PACKAGE_DIR / "README.md").read_text(encoding="utf-8")
        self.assertIn("evaluations/harness-memory-ablation", readme)
        self.assertIn("--samples 1", readme)
        self.assertIn("--memory-off", readme)
        self.assertIn("--memory-on", readme)
        self.assertIn("edges-harness-memory-ablation", readme)
        self.assertIn(EVAL_TAG, readme)


if __name__ == "__main__":
    unittest.main()
