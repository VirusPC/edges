"""Tamper tests for the offline audit; no Docker, network, or model calls."""
from __future__ import annotations

from collections import Counter
import importlib.util
import json
from pathlib import Path
import sys
import tempfile
import unittest

PROGRAM = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROGRAM))
sys.path.insert(0, str(PROGRAM / "audit"))
import check as audit_check
import monitor_resources as monitor
from native import observed_ids, sha
from resources import summarize_resources


def save(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value), encoding="utf-8")


class AuditTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.base = Path(self.temp.name)
        self.run = self.base / "run"
        self.scratch = self.base / "scratch"
        self.scratch.mkdir()
        self.metrics = audit_check.load_source(PROGRAM, "metrics")
        self.runner = audit_check.load_source(PROGRAM, "run", self.metrics)
        self.reporter = audit_check.load_source(PROGRAM, "report")
        dataset = {"schema_version": 1, "memories": [
            {"memory_id": "fixture-memory", "scope": "service", "title": "Release policy",
             "body": "A release requires approval from two reviewers and a successful staging rehearsal before publication.",
             "available_at": "2025-01-01T00:00:00Z", "source": {"trace_id": "fixture-origin"}}],
            "cases": [{"case_id": "fixture-question", "scope": "service", "question": "What precedes a release?",
                       "query_at": "2025-02-01T00:00:00Z", "gold_memory_ids": ["fixture-memory"], "split": "test",
                       "source": {"session_id": "fixture-session", "trace_id": "fixture-query"}}]}
        self.input = self.base / "input.json"
        save(self.input, dataset)
        args = self.runner.arguments().parse_args(["--dataset", str(self.input), "--output", str(self.run),
                    "--model", "fixture-model", "--repeats", "1", "--seed", "7", "--prepare-only"])
        self.dataset, self.cases, self.plan, self.manifest = self.runner.prepare(args)
        self.protocol = self.base / "protocol.json"
        save(self.protocol, {"inputs": {"input.json": sha(self.input)}, "seed": 7, "repeats": 1,
                             "statistical_plan": {"bootstrap_samples": 8}})

    def tearDown(self):
        self.temp.cleanup()

    def audit(self, stage="prepared", **kwargs):
        with tempfile.TemporaryDirectory(dir=self.scratch) as scratch:
            return audit_check.audit_run(self.run, scratch=Path(scratch), stage=stage, trusted_source=PROGRAM, **kwargs)[0]

    def finish(self):
        rows = []
        usage = {"input_tokens": 100, "output_tokens": 20, "cached_input_tokens": 30}
        total_usage = {**usage, "total_tokens": 120}
        for entry in self.plan:
            task = self.run / "tasks" / entry["task_name"]
            spec = json.loads((task / "tests/spec.json").read_text())
            selected = spec["visible_memory_ids"]
            events = []
            if selected:
                body = next((task / "environment/workspace").rglob("memory-*.md")).read_text()
                events.append({"type": "item.completed", "item": {"type": "command_execution", "id": "fixture-read",
                    "command": "cat memory-fixture.md", "aggregated_output": body, "exit_code": 0}})
            events += [{"type": "item.completed", "item": {"type": "agent_message", "text": json.dumps({
                "answer": "Use two reviewers and staging.", "selected_memory_ids": selected})}},
                {"type": "turn.completed", "usage": usage}]
            text = "\n".join(json.dumps(e) for e in events)
            trial = self.run / "jobs" / entry["trial_id"] / (entry["task_name"] + "__fixture")
            (trial / "agent/sessions").mkdir(parents=True)
            (trial / "agent/codex.txt").write_text(text)
            save(trial / "verifier/trial.json", self.metrics.evaluate_artifact(spec, text))
            save(trial / "result.json", {"task_name": entry["task_name"], "verifier_environment_mode": "separate",
                "exception_info": None, "agent_result": {"n_input_tokens": 100, "n_output_tokens": 20, "n_cache_tokens": 30},
                "agent_execution": {"started_at": "2025-03-01T00:00:00Z", "finished_at": "2025-03-01T00:00:02Z"}})
            save(trial / "agent/trajectory.json", {"final_metrics": {
                "total_prompt_tokens": 100, "total_completion_tokens": 20, "total_cached_tokens": 30}})
            rollout = [{"type": "token_usage_record", "payload": {"response_id": "fixture-response", "usage": total_usage}},
                {"type": "event_msg", "payload": {"type": "token_count", "info": {"total_token_usage": total_usage}}}]
            (trial / "agent/sessions/rollout.jsonl").write_text("\n".join(json.dumps(e) for e in rollout))
            rows.append(self.runner.collect_trial(self.run, entry, 3000, 0))
        self.manifest["execution_finished_at"] = "2025-03-01T00:00:03Z"
        save(self.run / "manifest.json", self.manifest)
        save(self.run / "trials.json", rows)
        summary = self.metrics.summarize(self.plan, rows, self.cases, seed=7, bootstrap=8)
        save(self.run / "result.json", {**summary, "manifest": self.manifest, "trials": rows})
        self.reporter.generate(self.run, self.base / "report", bootstrap=8)

    def test_prepared_archive_and_external_hashes_pass(self):
        before = audit_check.file_map(self.run)
        result = self.audit(protocol=self.protocol, protocol_sha256=sha(self.protocol), dataset_input="input.json", input_root=self.base)
        self.assertEqual(result["status"], "passed", result["errors"])
        self.assertEqual(before, audit_check.file_map(self.run))

    def test_completed_archive_and_report_pass_without_input_mutation(self):
        self.finish()
        before = audit_check.file_map(self.run)
        result = self.audit("completed", report=self.base / "report/report.json", protocol=self.protocol, dataset_input="input.json")
        self.assertEqual(result["status"], "passed", result["errors"])
        self.assertEqual(len(result["native_trials"]), 3)
        self.assertEqual(before, audit_check.file_map(self.run))

    def test_modified_dataset_or_source_fails_before_execution(self):
        for relative in ("dataset.json", "source/metrics.py"):
            with self.subTest(relative=relative):
                path = self.run / relative
                original = path.read_bytes()
                path.write_bytes(original + b"\n")
                self.assertEqual(self.audit()["status"], "failed")
                path.write_bytes(original)

    def test_untrusted_code_and_changed_external_protocol_fail(self):
        result, _ = audit_check.audit_run(self.run, scratch=self.scratch, stage="prepared")
        self.assertIn("archived_code_trust_required", [e["check"] for e in result["errors"]])
        result = self.audit(protocol=self.protocol, protocol_sha256="0" * 64, dataset_input="input.json")
        self.assertIn("external_protocol_hash", [e["check"] for e in result["errors"]])

    def test_self_reported_hash_cannot_authorize_changed_code(self):
        source = self.run / "source/metrics.py"
        source.write_text(source.read_text() + '\nraise RuntimeError("must not execute")\n')
        self.manifest["program_sha256"]["metrics.py"] = sha(source)
        save(self.run / "manifest.json", self.manifest)
        result = self.audit()
        self.assertIn("trusted_source_hash", [e["check"] for e in result["errors"]])

    def test_missing_or_duplicate_plan_cell_fails(self):
        for altered in (self.plan[:-1], self.plan[:-1] + [self.plan[0]]):
            save(self.run / "plan.json", altered)
            self.assertEqual(self.audit()["status"], "failed")

    def test_complete_but_reordered_plan_fails_seed_check(self):
        save(self.run / "plan.json", list(reversed(self.plan)))
        result = self.audit()
        self.assertIn("seeded_plan_order", [e["check"] for e in result["errors"]])

    def test_injected_image_file_fails_even_with_changed_workspace_hash(self):
        task = self.run / "tasks" / self.plan[0]["task_name"]
        (task / "environment/workspace/unexpected-gold.json").write_text("[]")
        name = task.name
        self.manifest["snapshots"][name]["workspace_sha256"] = self.runner.directory_digest(task / "environment/workspace")
        save(self.run / "manifest.json", self.manifest)
        result = self.audit()
        self.assertIn("reconstructed_workspace", [e["check"] for e in result["errors"]])

    def test_symlink_cannot_escape_input_tree(self):
        (self.run / "external").symlink_to(self.input)
        result = self.audit()
        self.assertIn("no_run_symlinks", [e["check"] for e in result["errors"]])

    def test_native_usage_tamper_and_report_tamper_are_detected(self):
        self.finish()
        trajectory = next(self.run.glob("jobs/*/*/agent/trajectory.json"))
        value = json.loads(trajectory.read_text()); value["final_metrics"]["total_cached_tokens"] += 1
        save(trajectory, value)
        path = self.base / "report/report.json"
        value = json.loads(path.read_text()); value["tracks"]["all"]["paired_comparisons"]["scoped-vs-root"]["total_tokens"]["delta_left_minus_right"] += 10
        save(path, value)
        result = self.audit("completed", report=path)
        checks = [e["check"] for e in result["errors"]]
        self.assertIn("trajectory_cached_input_tokens", checks)
        self.assertIn("report_statistics_all", checks)

    def test_missing_trial_is_not_success_or_zero(self):
        self.finish()
        rows = json.loads((self.run / "trials.json").read_text())
        save(self.run / "trials.json", rows[:-1])
        result = self.audit("completed")
        self.assertIn("complete_result_matrix", [e["check"] for e in result["errors"]])

    def test_command_and_final_answer_are_not_body_evidence(self):
        spec = {"read_markers": {"m": "BODY_MARKER"}, "content_anchors": {"m": ["UNIQUE_BODY"]}}
        rows = [(1, {"type": "item.completed", "item": {"type": "command_execution", "command": "BODY_MARKER UNIQUE_BODY", "aggregated_output": "empty"}}),
                (2, {"type": "item.completed", "item": {"type": "agent_message", "text": "BODY_MARKER UNIQUE_BODY"}})]
        self.assertEqual(observed_ids(spec, rows), (set(), set()))


class MonitorTests(unittest.TestCase):
    def test_complete_partial_and_exited_oom_frames(self):
        with tempfile.TemporaryDirectory() as temp:
            run = Path(temp); (run / "jobs/t1/task__random").mkdir(parents=True)
            def fake(args):
                if args[0] == "ps":
                    return 0, "running\tnative\ttask__random__env\trunning\nexited\told\ttask__random__env\texited\nother\tother\tother__env\trunning\n"
                if args[0] == "stats":
                    return 0, json.dumps({"ID": "running", "MemUsage": "1MiB / 2GiB", "CPUPerc": "12.5%", "PIDs": "3"})
                return 0, '{"OOMKilled":false}\n{"OOMKilled":true}\n'
            value = monitor.sample(run, fake)
            self.assertEqual(value["active_containers"], 1)
            self.assertEqual(value["total_container_memory_bytes"], 1024**2)
            self.assertEqual(value["sampled_oom_killed"], 1)
            self.assertTrue(value["complete"])
            partial = monitor.sample(run, lambda args: (1, "") if args[0] == "stats" else fake(args))
            self.assertFalse(partial["complete"])
            self.assertIsNone(partial["total_container_memory_bytes"])
            failed_ps = monitor.sample(run, lambda args: (1, ""))
            self.assertIsNone(failed_ps["active_containers"])
            self.assertFalse(failed_ps["complete"])

    def test_resource_summary_excludes_incomplete_zero_and_detects_false_peak(self):
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp) / "resources.jsonl"
            rows = [{"event": "sample", "at": "2025-01-01T00:00:01Z", "active_containers": 1, "sampled_containers": 1,
                     "containers": [{"memory_bytes": 42}], "total_container_memory_bytes": 42},
                    {"event": "sample", "at": "2025-01-01T00:00:02Z", "active_containers": 1, "sampled_containers": 0,
                     "stats_error_code": 1, "containers": [], "total_container_memory_bytes": 0},
                    {"event": "sample", "at": "2025-01-01T00:00:03Z", "active_containers": None,
                     "ps_error_code": 1, "containers": [], "total_container_memory_bytes": None},
                    {"event": "coverage_assessment", "runtime_memory_peak_observed_bytes": 99}]
            path.write_text("\n".join(json.dumps(r) for r in rows))
            failures = []
            summary = summarize_resources(path, [], lambda ok, name: failures.append(name) if not ok else None)
            self.assertEqual(summary["valid_complete_memory_samples"], 1)
            self.assertEqual(summary["runtime_memory_peak_observed_bytes"], 42)
            self.assertIn("resource_assessment_runtime_memory_peak_observed_bytes", failures)


if __name__ == "__main__":
    unittest.main()
