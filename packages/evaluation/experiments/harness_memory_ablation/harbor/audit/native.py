"""Independent native-record checks adapted from the original offline result audit."""
from __future__ import annotations

from collections import Counter
from datetime import datetime
import hashlib
import json
import math
from pathlib import Path
import re


def read(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def equal(a, b) -> bool:
    if isinstance(a, dict) and isinstance(b, dict):
        return a.keys() == b.keys() and all(equal(a[k], b[k]) for k in a)
    if isinstance(a, list) and isinstance(b, list):
        return len(a) == len(b) and all(equal(x, y) for x, y in zip(a, b))
    if type(a) in (int, float) and type(b) in (int, float):
        return math.isclose(a, b, rel_tol=1e-12, abs_tol=1e-8)
    return type(a) is type(b) and a == b


def subset_equal(expected, actual) -> bool:
    if isinstance(expected, dict) and isinstance(actual, dict):
        return all(k in actual and subset_equal(v, actual[k]) for k, v in expected.items())
    return equal(expected, actual)


def timestamp(value: str) -> datetime:
    result = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if result.tzinfo is None:
        raise ValueError("timestamp lacks timezone")
    return result


def events(path: Path):
    """Retain line numbers; native CLI diagnostic text is not a JSON event."""
    rows, diagnostics = [], []
    for line, text in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        try:
            value = json.loads(text)
        except ValueError:
            diagnostics.append(line)
            continue
        if isinstance(value, dict):
            rows.append((line, value))
        else:
            diagnostics.append(line)
    return rows, diagnostics


def strings(value):
    if isinstance(value, str):
        return [value]
    if isinstance(value, dict):
        return [s for child in value.values() for s in strings(child)]
    if isinstance(value, list):
        return [s for child in value for s in strings(child)]
    return []


def returned_blocks(rows):
    result = []
    for line, event in rows:
        item = event.get("item") or {}
        if event.get("type") != "item.completed" or not isinstance(item, dict):
            continue
        if item.get("type") == "command_execution":
            blocks = [item["aggregated_output"]] if isinstance(item.get("aggregated_output"), str) else []
        elif item.get("type") == "mcp_tool_call":
            blocks = strings(item.get("result"))
        else:
            continue
        result.extend((line, text, re.sub(r"\s+", "", text)) for text in blocks)
    return result


def observed_ids(spec, rows):
    blocks = returned_blocks(rows)
    markers = {mid for mid, marker in spec.get("read_markers", {}).items()
               if any(marker in text for _, text, _ in blocks)}
    content = {mid for mid, anchors in spec.get("content_anchors", {}).items()
               if any(anchor in normalized for anchor in anchors for _, _, normalized in blocks)}
    return markers, content


def usage_sum(values):
    return sum(values) if values and all(type(v) is int and v >= 0 for v in values) else None


def audit_native(trial: Path, row: dict, spec: dict, check, commands: list, tool_counts: Counter):
    """Reconcile five native usage views without the scoring parser's arithmetic."""
    tid = row["trial_id"]
    native = read(trial / "result.json")
    check(native.get("task_name") == row["task_name"], "native_task_identity", tid)
    check(native.get("verifier_environment_mode") == "separate", "separate_verifier", tid)
    check(not native.get("exception_info") or bool(row.get("error")), "native_error_recorded", tid)
    phase = native.get("agent_execution") or {}
    latency = None
    interval = None
    if phase.get("started_at") and phase.get("finished_at"):
        start, end = timestamp(phase["started_at"]), timestamp(phase["finished_at"])
        latency = (end - start).total_seconds() * 1000
        interval = (start, end)
    check(equal(row.get("agent_latency_ms"), latency), "agent_stage_latency", tid)
    path = trial / "agent/codex.txt"
    if not path.is_file():
        check(bool(row.get("error")), "successful_trial_has_log", tid)
        return {"native_record": True, "usage_audited": False}, interval
    rows, diagnostics = events(path)
    turns = [e for _, e in rows if e.get("type") == "turn.completed"]
    usage = {field: usage_sum([(e.get("usage") or {}).get(field) for e in turns])
             for field in ("input_tokens", "output_tokens", "cached_input_tokens")}
    inp, out, cache = (usage[k] for k in ("input_tokens", "output_tokens", "cached_input_tokens"))
    usage["total_tokens"] = inp + out if inp is not None and out is not None else None
    usage["uncached_input_tokens"] = inp - cache if inp is not None and cache is not None and inp >= cache else None
    for field, value in usage.items():
        check(equal(row.get(field), value), "jsonl_" + field, tid)
    markers, content = observed_ids(spec, rows)
    for field, expected in (("marker_observed_memory_ids", markers), ("content_observed_memory_ids", content),
                            ("observed_memory_ids", markers | content)):
        check(set(row.get(field) or []) == expected, "tool_return_" + field, tid)
    seen = set()
    for line, event in rows:
        item = event.get("item") or {}
        if event.get("type") != "item.completed" or not isinstance(item, dict):
            continue
        kind, iid = item.get("type"), item.get("id")
        if kind in {"agent_message", "reasoning", "todo_list"}:
            continue
        if iid is not None and (kind, iid) in seen:
            continue
        seen.add((kind, iid))
        tool_counts[kind or "unknown"] += 1
        if kind == "command_execution":
            commands.append({"trial_id": tid, "line": line, "item_id": iid,
                             "command": item.get("command"), "exit_code": item.get("exit_code"),
                             "log_sha256": sha(path), "review_status": "not_reviewed"})
    if row.get("error"):
        # Failed trials can legitimately lack completed usage/trajectory artifacts.
        return {"native_record": True, "usage_audited": False, "diagnostic_lines": diagnostics}, interval
    check(bool(turns), "terminal_usage_present", tid)
    for field, key in (("input_tokens", "n_input_tokens"), ("output_tokens", "n_output_tokens"),
                       ("cached_input_tokens", "n_cache_tokens")):
        check(equal(usage[field], (native.get("agent_result") or {}).get(key)), "harbor_" + field, tid)
    trajectory = read(trial / "agent/trajectory.json").get("final_metrics", {})
    for field, key in (("input_tokens", "total_prompt_tokens"), ("output_tokens", "total_completion_tokens"),
                       ("cached_input_tokens", "total_cached_tokens")):
        check(equal(usage[field], trajectory.get(key)), "trajectory_" + field, tid)
    rollouts = list((trial / "agent/sessions").rglob("*.jsonl"))
    check(len(rollouts) == 1, "one_native_rollout", tid)
    final, responses = None, {}
    for rollout in rollouts:
        rollout_rows, invalid = events(rollout)
        check(not invalid, "rollout_valid_jsonl", tid)
        for line, event in rollout_rows:
            payload = event.get("payload") or {}
            if event.get("type") == "event_msg" and payload.get("type") == "token_count" and payload.get("info"):
                final = payload["info"].get("total_token_usage")
            if event.get("type") == "token_usage_record":
                key = payload.get("response_id") or (rollout.name, line)
                value = payload.get("usage") or {}
                check(key not in responses or responses[key] == value, "response_usage_consistent", tid)
                responses[key] = value
    check(final is not None and bool(responses), "rollout_usage_present", tid)
    for field in ("input_tokens", "output_tokens", "cached_input_tokens", "total_tokens"):
        check(equal(usage[field], usage_sum([v.get(field) for v in responses.values()])), "response_sum_" + field, tid)
        check(equal(usage[field], (final or {}).get(field)), "rollout_final_" + field, tid)
    return {"native_record": True, "usage_audited": True, "responses": len(responses),
            "diagnostic_lines": diagnostics, "log_sha256": sha(path)}, interval
