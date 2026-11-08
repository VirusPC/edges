"""Summarize existing monitor JSONL; do not start Docker or a monitor."""
from __future__ import annotations

import math
from pathlib import Path

from native import equal, events, timestamp


def finite(value):
    return type(value) in (int, float) and math.isfinite(value) and value >= 0


def summarize_resources(path: Path, intervals: list, check):
    rows, invalid = events(path)
    check(not invalid, "resource_valid_jsonl")
    frames = [r for _, r in rows if r.get("event") == "sample"]
    check(bool(frames), "resource_samples_present")
    valid = []
    for frame in frames:
        containers = frame.get("containers", [])
        active = frame.get("active_containers")
        complete = (type(active) is int and active > 0 and not frame.get("stats_error_code")
                    and not frame.get("ps_error_code") and frame.get("complete") is not False
                    and len(containers) == frame["active_containers"] == frame.get("sampled_containers")
                    and all(finite(c.get("memory_bytes")) for c in containers))
        if complete:
            total = sum(c["memory_bytes"] for c in containers)
            check(equal(total, frame.get("total_container_memory_bytes")), "resource_memory_sum")
            valid.append(total)
    timeline = sorted([(a, 1) for a, b in intervals if a < b] + [(b, -1) for a, b in intervals if a < b])
    active = peak = 0
    for _, change in timeline:
        active += change
        peak = max(peak, active)
    first = min((timestamp(f["at"]) for f in frames), default=None)
    first_agent = min((a for a, _ in intervals), default=None)
    summary = {"samples": len(frames), "active_samples": sum(type(f.get("active_containers")) is int and f["active_containers"] > 0 for f in frames),
               "valid_complete_memory_samples": len(valid),
               "stats_nonzero_samples": sum(bool(f.get("stats_error_code")) for f in frames),
               "ps_error_samples": sum(bool(f.get("ps_error_code")) for f in frames),
               "sampled_oom_positive_frames": sum(bool(f.get("sampled_oom_killed")) for f in frames),
               "oom_inspect_error_frames": sum(bool(f.get("oom_inspect_error_code")) for f in frames),
               "runtime_memory_peak_observed_bytes": max(valid, default=None),
               "runtime_memory_peak_is_lower_bound": True, "native_peak_agent_overlap": peak,
               "early_agent_execution_unobserved_seconds": max(0, (first - first_agent).total_seconds()) if first and first_agent else None,
               "agents_started_before_first_sample": sum(a < first for a, _ in intervals) if first else None,
               "agents_finished_before_first_sample": sum(b < first for _, b in intervals) if first else None}
    for _, row in rows:
        if row.get("event") == "coverage_assessment":
            for key, value in summary.items():
                if key in row:
                    check(equal(value, row[key]), "resource_assessment_" + key)
    return summary
