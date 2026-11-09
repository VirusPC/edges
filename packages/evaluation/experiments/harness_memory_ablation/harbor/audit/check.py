"""Offline consistency audit of a prepared or completed Harbor memory experiment.

No model, network, Docker, or audited shell commands are invoked. Archived Python
is executable code: authenticate it against --trusted-source, or explicitly use
--trust-archived-code after reviewing the archive.
"""
from __future__ import annotations

import argparse
from collections import Counter
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path, PurePosixPath
import random
import re
import sys
import tempfile
import tomllib
from types import ModuleType

from native import audit_native, equal, read, sha, subset_equal
from resources import summarize_resources


class AuditStopped(ValueError):
    pass


def safe_child(parent: Path, relative: str) -> Path:
    part = PurePosixPath(relative)
    if not relative or part.is_absolute() or ".." in part.parts or part.as_posix() != relative:
        raise ValueError("unsafe relative artifact path")
    path = parent / relative
    if path.is_symlink() or not path.resolve().is_relative_to(parent.resolve()):
        raise ValueError("artifact escapes its root")
    return path


def load_source(source: Path, name: str, metrics=None):
    module = ModuleType("_audit_frozen_" + name)
    path = source / (name + ".py")
    module.__file__ = str(path)
    old = sys.modules.get("metrics")
    try:
        if metrics is not None:
            sys.modules["metrics"] = metrics
        exec(compile(path.read_bytes(), str(path), "exec"), module.__dict__)
    finally:
        if old is None:
            sys.modules.pop("metrics", None)
        else:
            sys.modules["metrics"] = old
    return module


def file_map(path: Path):
    return {p.relative_to(path).as_posix(): sha(p) for p in path.rglob("*") if p.is_file()}


def check_prepared(run, manifest, dataset, plan, cases, runner, metrics, scratch, check, require):
    entries = {(p["case_id"], p["condition"]): p for p in plan}
    require(len({p["task_name"] for p in plan}) == len(entries), "unique_case_condition_tasks")
    require(all(re.fullmatch(r"[A-Za-z0-9_-]+", p["task_name"]) for p in plan), "safe_task_names")
    require(all(p["task_name"] == entries[(p["case_id"], p["condition"])]["task_name"] for p in plan), "stable_repeated_task_identity")
    expected_order = [(c["case_id"], condition, repeat) for c in cases
                      for repeat in range(1, manifest["repeats"] + 1) for condition in metrics.CONDITIONS]
    random.Random(manifest["seed"]).shuffle(expected_order)
    check(expected_order == [(p["case_id"], p["condition"], p["repeat"]) for p in plan], "seeded_plan_order")
    check([p["order"] for p in plan] == list(range(1, len(plan) + 1)), "plan_order_positions")
    require(set(manifest["snapshots"]) == {p["task_name"] for p in plan}, "snapshot_inventory")
    expected_tasks = set(manifest["snapshots"])
    check({p.name for p in (run / "tasks").iterdir()} == expected_tasks, "task_inventory")
    anchor_cache = {}
    for case in cases:
        visible = [m for m in dataset["memories"] if runner.timestamp(m["available_at"]) < runner.timestamp(case["query_at"])]
        key = tuple(m["memory_id"] for m in visible)
        if key not in anchor_cache:
            anchor_cache[key] = metrics.content_anchors(visible)
        markers_by_arm, payloads = {}, {}
        for condition in metrics.CONDITIONS:
            entry = entries[(case["case_id"], condition)]
            name = entry["task_name"]
            task = safe_child(run / "tasks", name)
            environment, workspace = task / "environment", task / "environment/workspace"
            spec = read(task / "tests/spec.json")
            ids = list(key) if condition != "none" else []
            check(equal(spec.get("case"), case) and spec.get("condition") == condition, "verifier_case_identity", name)
            check(spec.get("visible_memory_ids") == ids, "strict_temporal_visibility", name)
            check(set(spec.get("read_markers", {})) == set(ids), "marker_inventory", name)
            check(equal(spec.get("content_anchors"), {mid: anchor_cache[key][mid] for mid in ids}), "body_anchor_recomputation", name)
            markers_by_arm[condition] = spec.get("read_markers", {})
            expected = scratch / name
            rebuilt = runner.build_workspace(expected, visible, condition, case["scope"], spec.get("read_markers", {}))
            check(file_map(workspace) == file_map(expected), "reconstructed_workspace", name)
            check({p.relative_to(workspace).as_posix() for p in workspace.rglob("*") if p.is_dir()} ==
                  {p.relative_to(expected).as_posix() for p in expected.rglob("*") if p.is_dir()}, "reconstructed_directories", name)
            snapshot = manifest["snapshots"][name]
            check(snapshot.get("case_id") == case["case_id"] and snapshot.get("condition") == condition, "snapshot_identity", name)
            check(subset_equal(rebuilt, snapshot), "snapshot_memory_hashes", name)
            check(runner.directory_digest(workspace) == snapshot["workspace_sha256"], "snapshot_workspace_hash", name)
            payloads[condition] = rebuilt["memory_payload_sha256"]
            prompt = (task / "instruction.md").read_text()
            check(prompt == runner.instruction(case), "identical_frozen_prompt", name)
            check(hashlib.sha256(prompt.encode()).hexdigest() == manifest["prompt_sha256"][case["case_id"]], "prompt_hash", name)
            config = tomllib.loads((task / "task.toml").read_text())
            check(config["environment"]["workdir"] == (PurePosixPath("/workspace") / case["scope"]).as_posix(), "task_cwd", name)
            check(config["agent"]["timeout_sec"] == manifest["timeout_sec"], "task_timeout", name)
            check(config["verifier"]["environment_mode"] == "separate", "task_verifier_separate", name)
            expected_docker = (f"FROM {manifest['agent_image']}\nUSER root\n"
                "RUN apt-get update && apt-get install -y --no-install-recommends bash curl ca-certificates git && rm -rf /var/lib/apt/lists/*\n"
                "COPY workspace /workspace\nRUN git init -q --initial-branch=main /workspace\nWORKDIR /workspace\n")
            check((environment / "Dockerfile").read_text() == expected_docker, "restricted_docker_recipe", name)
            check({p.name for p in environment.iterdir()} == {"workspace", "Dockerfile"}, "agent_context_inventory", name)
            for module in ("metrics.py", "verify.py"):
                check(sha(task / "tests" / module) == sha(run / "source" / module), "verifier_source_hash", name)
            check((task / "tests/test.sh").read_text() == "#!/bin/bash\nset -euo pipefail\npython3 /tests/verify.py --spec /tests/spec.json\n", "verifier_entrypoint", name)
        check(markers_by_arm["scoped"] == markers_by_arm["root"], "identical_arm_markers", case["case_id"])
        check(payloads["scoped"] == payloads["root"], "identical_arm_payloads", case["case_id"])


def audit_run(run: Path, *, scratch: Path, stage="completed", report=None, protocol=None,
              protocol_sha256=None, dataset_input="dataset.json", input_root=None,
              trusted_source=None, trust_archived_code=False, resources=None):
    """Return a private audit record and a command inventory; never change inputs."""
    run, scratch = run.resolve(), scratch.resolve()
    checks, errors, commands, tools = Counter(), [], [], Counter()
    result = {"schema_version": 1, "stage": stage, "created_at": datetime.now(timezone.utc).isoformat(),
              "checks": checks, "errors": errors, "native_trials": [], "input_sha256": {},
              "scope": {"report": report is not None, "protocol": protocol is not None,
                        "external_protocol_digest": protocol_sha256 is not None,
                        "protocol_inputs": input_root is not None, "resources": resources is not None,
                        "trusted_source_comparison": trusted_source is not None},
              "audit_source_sha256": {p.name: sha(p) for p in Path(__file__).parent.glob("*.py")},
              "limitations": [
                  "Consistency is not authenticity: retain an independently trusted protocol digest or source checkout.",
                  "Archived Python executes locally only after an explicit trust choice; it is not sandboxed.",
                  "Gold relevance, user origin, normalization, and semantic command effects require independent review.",
                  "Returned-text evidence proves exposure, not comprehension or causal use.",
                  "Controller trial wall time has no independent monotonic-clock record.",
                  "Resource samples can miss peaks; these summaries do not prove absence of network or filesystem effects."]}

    def check(condition, label, identity=None):
        checks[label] += 1
        if not condition:
            errors.append({"check": label, "identity": identity})

    def require(condition, label):
        check(condition, label)
        if not condition:
            raise AuditStopped(label)

    try:
        require(stage in {"prepared", "completed"}, "valid_stage")
        require(not scratch.is_relative_to(run), "scratch_outside_run")
        # Reject all links before any file traversal or archived-code import.
        require(not any(p.is_symlink() for p in run.rglob("*")), "no_run_symlinks")
        manifest, dataset, plan = (read(run / name) for name in ("manifest.json", "dataset.json", "plan.json"))
        for name in ("manifest.json", "dataset.json", "plan.json"):
            result["input_sha256"][name] = sha(run / name)
        require(sha(run / "dataset.json") == manifest["dataset_sha256"], "frozen_dataset_hash")
        declared = manifest["program_sha256"]
        source = run / "source"
        require(set(declared) == {p.name for p in source.glob("*.py")}, "source_inventory")
        require({"metrics.py", "run.py", "dataset.py", "report.py", "verify.py"} <= set(declared), "required_source_modules")
        for name, digest in declared.items():
            require(sha(safe_child(source, name)) == digest, "frozen_source_hash")
        if trusted_source is not None:
            trusted_source = Path(trusted_source).resolve()
            for name, digest in declared.items():
                require(sha(safe_child(trusted_source, name)) == digest, "trusted_source_hash")
        else:
            require(trust_archived_code, "archived_code_trust_required")
        frozen_protocol = None
        if protocol is not None:
            protocol = Path(protocol).resolve()
            result["input_sha256"]["protocol"] = sha(protocol)
            if protocol_sha256 is not None:
                require(sha(protocol) == protocol_sha256, "external_protocol_hash")
            frozen_protocol = read(protocol)
            require(frozen_protocol["inputs"][dataset_input] == sha(run / "dataset.json"), "protocol_dataset_hash")
            if input_root is not None:
                for name, digest in frozen_protocol["inputs"].items():
                    require(sha(safe_child(Path(input_root).resolve(), name)) == digest, "protocol_input_hash")
            for key in ("model", "harbor_version", "codex_version", "reasoning_effort", "timeout_sec",
                        "seed", "repeats", "concurrency", "agent_image", "cases", "planned_trials"):
                if key in frozen_protocol:
                    check(equal(manifest.get(key), frozen_protocol[key]), "protocol_parameter_" + key)
        else:
            require(protocol_sha256 is None and input_root is None, "protocol_required_for_external_inputs")
        metrics = load_source(source, "metrics")
        runner = load_source(source, "run", metrics)
        reporter = load_source(source, "report")
        load_source(source, "dataset").validate_dataset(dataset)
        cases = reporter.selected_cases(dataset, manifest)
        rows = read(run / "trials.json") if stage == "completed" else []
        reporter.validate_matrix(plan, rows, cases, manifest)
        check(True, "complete_plan_matrix")
        check_prepared(run, manifest, dataset, plan, cases, runner, metrics, scratch, check, require)
        result["planned_trials"] = len(plan)
        if stage == "completed":
            require(Counter(r["trial_id"] for r in rows) == Counter(p["trial_id"] for p in plan), "complete_result_matrix")
            require(bool(manifest.get("execution_finished_at")), "execution_finished")
            by_id = {r["trial_id"]: r for r in rows}
            rebuilt_rows, intervals = [], []
            require({p.name for p in (run / "jobs").iterdir()} == set(by_id), "native_job_inventory")
            for entry in plan:
                tid, row = entry["trial_id"], by_id[entry["trial_id"]]
                check(all(row.get(k) == v for k, v in entry.items()), "row_plan_identity", tid)
                fresh = runner.collect_trial(run, entry, row["trial_wall_ms"], row["harbor_returncode"])
                check(equal(fresh, row), "frozen_trial_recomputation", tid)
                rebuilt_rows.append(fresh)
                natives = list((run / "jobs" / tid).glob("*/result.json"))
                check(len(natives) == 1, "one_native_trial", tid)
                if len(natives) != 1:
                    continue
                trial = natives[0].parent
                spec = read(run / "tasks" / entry["task_name"] / "tests/spec.json")
                if (trial / "agent/codex.txt").is_file() and (trial / "verifier/trial.json").is_file():
                    check(equal(metrics.evaluate_artifact(spec, (trial / "agent/codex.txt").read_text()),
                                read(trial / "verifier/trial.json")), "frozen_verifier_recomputation", tid)
                else:
                    check(bool(row.get("error")), "successful_verifier_artifact", tid)
                audit, interval = audit_native(trial, row, spec, check, commands, tools)
                result["native_trials"].append({"trial_id": tid, **audit})
                if interval:
                    intervals.append(interval)
            saved = read(run / "result.json")
            bootstrap = saved["statistics"]["bootstrap_samples"]
            require(type(bootstrap) is int and bootstrap > 0, "positive_bootstrap_samples")
            if frozen_protocol is not None:
                check(bootstrap == frozen_protocol["statistical_plan"]["bootstrap_samples"], "protocol_bootstrap_samples")
            summary = metrics.summarize(plan, rebuilt_rows, cases, seed=manifest["seed"], bootstrap=bootstrap)
            check(subset_equal(summary, saved), "frozen_aggregate_recomputation")
            check(equal(saved["trials"], rows), "result_trial_copy")
            result.update(observed_trials=len(rows), failed_trials=sum(bool(r.get("error")) for r in rows),
                          bootstrap_samples=bootstrap, seed=manifest["seed"])
            for name in ("trials.json", "result.json"):
                result["input_sha256"][name] = sha(run / name)
            if report is not None:
                published = read(Path(report))
                result["input_sha256"]["report"] = sha(Path(report))
                check(set(published["tracks"]) == set(reporter.TRACKS), "report_tracks")
                for track in reporter.TRACKS:
                    selected = cases if track == "all" else [c for c in cases if
                        (reporter.unknown_scope(c) == (track == "scope_unknown") if track in {"scope_known", "scope_unknown"}
                         else c.get("task_mode", "memory_qa") == track)]
                    ids = {c["case_id"] for c in selected}
                    subplan = [p for p in plan if p["case_id"] in ids]
                    subrows = [r for r in rebuilt_rows if r["case_id"] in ids]
                    value = metrics.summarize(subplan, subrows, selected, seed=manifest["seed"], bootstrap=bootstrap)
                    reporter.paired_session_counts(value["paired_comparisons"], subplan, subrows, selected)
                    check(subset_equal(value, published["tracks"][track]), "report_statistics_" + track)
                    check(equal(reporter.case_card(selected, dataset["memories"])[0], published["tracks"][track]["dataset_card"]), "report_card_" + track)
                for name in ("manifest.json", "dataset.json", "plan.json", "trials.json"):
                    check(published["input_sha256"][name] == sha(run / name), "report_input_hash")
                check(published["protocol"]["sha256"] == declared["metrics.py"], "report_scoring_hash")
            if resources is not None:
                result["input_sha256"]["resources"] = sha(Path(resources))
                result["resources"] = summarize_resources(Path(resources), intervals, check)
                check(result["resources"]["native_peak_agent_overlap"] <= manifest["concurrency"], "native_concurrency_bound")
        else:
            require(report is None and resources is None, "completed_stage_for_report_resources")
    except AuditStopped:
        pass
    except (ValueError, OSError, KeyError, TypeError, IndexError) as exc:
        errors.append({"check": "malformed_or_missing_artifact", "exception_type": type(exc).__name__})
    result["status"] = "passed" if not errors else "failed"
    result["tool_inventory"] = {"event_counts": dict(tools), "commands": len(commands), "semantic_review": "not_performed"}
    return result, commands


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--run", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--stage", choices=("prepared", "completed"), default="completed")
    parser.add_argument("--report", type=Path)
    parser.add_argument("--protocol", type=Path)
    parser.add_argument("--protocol-sha256")
    parser.add_argument("--dataset-input", default="dataset.json")
    parser.add_argument("--input-root", type=Path)
    trust = parser.add_mutually_exclusive_group(required=True)
    trust.add_argument("--trusted-source", type=Path)
    trust.add_argument("--trust-archived-code", action="store_true")
    parser.add_argument("--resources", type=Path)
    args = parser.parse_args()
    output = args.output.resolve()
    roots = [args.run.resolve()]
    if args.input_root:
        roots.append(args.input_root.resolve())
    if any(output.is_relative_to(root) for root in roots):
        parser.error("output must be outside run and input-root")
    output.mkdir(parents=True, exist_ok=False, mode=0o700)
    options = vars(args).copy()
    options.pop("output")
    with tempfile.TemporaryDirectory(prefix="reconstruct-", dir=output) as temporary:
        result, commands = audit_run(**options, scratch=Path(temporary))
    for name, value in (("audit.json", json.dumps(result, ensure_ascii=False, indent=2) + "\n"),
                        ("commands-for-review.jsonl", "".join(json.dumps(c, ensure_ascii=False) + "\n" for c in commands))):
        path = output / name
        with path.open("x", encoding="utf-8") as stream:
            path.chmod(0o600)
            stream.write(value)
    print(json.dumps({"status": result["status"], "checks": sum(result["checks"].values()), "errors": len(result["errors"])}))
    return 0 if result["status"] == "passed" else 1


if __name__ == "__main__":
    raise SystemExit(main())
