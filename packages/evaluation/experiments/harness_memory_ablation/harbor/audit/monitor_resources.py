"""Read-only Docker sampling for one run; outputs sensitive, local-only JSONL.

Docker's reported memory is a container working-set measure, not process RSS or
the entire VM/daemon/build footprint. OOM state is sampled, so short-lived or
already-removed containers can be missed. This does not start or alter trials.
"""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
import json
from pathlib import Path
import re
import subprocess
import time


def now():
    return datetime.now(timezone.utc).isoformat()


def docker(arguments):
    try:
        result = subprocess.run(["docker", *arguments], capture_output=True, text=True, timeout=20, check=False)
        return result.returncode, result.stdout
    except (OSError, subprocess.TimeoutExpired):
        return -1, ""


def memory_bytes(text):
    match = re.fullmatch(r"\s*(\d+(?:\.\d+)?)\s*(B|kB|KB|KiB|MB|MiB|GB|GiB|TB|TiB)\s*", text)
    if not match:
        raise ValueError("unrecognized Docker memory unit")
    units = {"B": 1, "kB": 1000, "KB": 1000, "KiB": 1024, "MB": 1000**2, "MiB": 1024**2,
             "GB": 1000**3, "GiB": 1024**3, "TB": 1000**4, "TiB": 1024**4}
    return float(match[1]) * units[match[2]]


def percentage(text):
    return float(text.removesuffix("%"))


def matching_containers(run, command=docker):
    # Harbor's native random trial basename is the Compose project prefix.
    names = {p.name.lower() for p in (run / "jobs").glob("*/*") if p.is_dir()}
    code, text = command(["ps", "-a", "--no-trunc", "--format",
                          '{{.ID}}\t{{.Names}}\t{{.Label "com.docker.compose.project"}}\t{{.State}}'])
    selected = []
    if code == 0:
        for line in text.splitlines():
            parts = line.split("\t")
            if len(parts) != 4:
                continue
            cid, name, project, state = parts
            if any(project == trial + "__env" or project.startswith(trial + "__verifier__") for trial in names):
                selected.append({"id": cid, "name": name, "state": state,
                                 "role": "verifier" if "__verifier__" in project else "agent"})
    return code, selected


def sample(run, command=docker):
    started = time.monotonic()
    code, discovered = matching_containers(run, command)
    selected = [c for c in discovered if c["state"] == "running"]
    frame = {"event": "sample", "at": now(), "ps_error_code": code,
             "active_containers": len(selected) if code == 0 else None,
             "agent_containers": sum(c["role"] == "agent" for c in selected),
             "verifier_containers": sum(c["role"] == "verifier" for c in selected),
             "containers": [], "sampled_containers": 0, "complete": code == 0,
             "total_container_memory_bytes": None, "total_container_cpu_percent": None,
             "sampled_oom_killed": 0, "oom_inspect_error_code": None}
    if selected:
        ids = [c["id"] for c in selected]
        status, text = command(["stats", "--no-stream", "--no-trunc", "--format", "{{json .}}", *ids])
        frame["stats_error_code"] = status
        by_id = {c["id"]: c for c in selected}
        parse_errors = 0
        for line in text.splitlines():
            try:
                row = json.loads(line)
                cid = row.get("ID") or row.get("Container")
                if cid not in by_id:
                    raise ValueError("unexpected container")
                used, limit = row["MemUsage"].split("/")
                frame["containers"].append({**by_id[cid], "memory_bytes": memory_bytes(used),
                    "memory_limit_bytes": memory_bytes(limit), "memory_rss_bytes": None,
                    "cpu_percent": percentage(row["CPUPerc"]), "pids": int(row["PIDs"])})
            except (ValueError, TypeError, KeyError):
                parse_errors += 1
        frame["stats_parse_errors"] = parse_errors
        frame["sampled_containers"] = len(frame["containers"])
        frame["complete"] = status == 0 and not parse_errors and len({c["id"] for c in frame["containers"]}) == len(ids)
        if frame["complete"]:
            frame["total_container_memory_bytes"] = sum(c["memory_bytes"] for c in frame["containers"])
            frame["total_container_cpu_percent"] = sum(c["cpu_percent"] for c in frame["containers"])
    elif code == 0:
        frame.update(total_container_memory_bytes=0, total_container_cpu_percent=0)
    if discovered:
        status, state_text = command(["inspect", "--format", "{{json .State}}", *[c["id"] for c in discovered]])
        frame["oom_inspect_error_code"] = status
        # State only, never serialize Config/Env or the native command.
        for line in state_text.splitlines():
            try:
                frame["sampled_oom_killed"] += json.loads(line).get("OOMKilled") is True
            except (ValueError, AttributeError):
                frame["oom_inspect_error_code"] = -2
    try:
        plan = json.loads((run / "plan.json").read_text())
        rows = json.loads((run / "trials.json").read_text()) if (run / "trials.json").exists() else []
        frame.update(planned_trials=len(plan), observed_trials=len(rows), failed_trials=sum(bool(r.get("error")) for r in rows))
    except (OSError, ValueError, TypeError):
        frame.update(planned_trials=None, observed_trials=None, failed_trials=None)
    frame["sampling_duration_seconds"] = time.monotonic() - started
    return frame


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--run", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True, help="new local JSONL file outside run")
    parser.add_argument("--interval", type=float, default=5)
    parser.add_argument("--max-samples", type=int)
    args = parser.parse_args()
    run, output = args.run.resolve(), args.output.resolve()
    if args.interval <= 0 or args.interval > 60 or (args.max_samples is not None and args.max_samples < 1):
        parser.error("interval must be in (0,60], max-samples must be positive")
    if output.is_relative_to(run):
        parser.error("resource output must be outside the immutable run")
    output.parent.mkdir(parents=True, exist_ok=True)
    status, info_text = docker(["info", "--format",
        '{"NCPU":{{.NCPU}},"MemTotal":{{.MemTotal}},"ServerVersion":{{json .ServerVersion}}}'])
    try:
        info = json.loads(info_text) if status == 0 else {}
    except ValueError:
        info = {}
    start = {"event": "monitor_start", "at": now(), "target_interval_seconds": args.interval,
             "docker_info_error_code": status,
             "docker": {"cpus": info.get("NCPU"), "memory_bytes": info.get("MemTotal"), "version": info.get("ServerVersion")},
             "memory_measure": "Docker stats working set; RSS unavailable; excludes VM/daemon/build overhead",
             "oom_measure": "sampled container State.OOMKilled; removal and sampling gaps may hide OOM",
             "filter": "native trial Compose project; read-only Docker queries; no intervention"}
    count = empty = 0
    interrupted = False
    with output.open("x", encoding="utf-8") as stream:
        output.chmod(0o600)

        def emit(value):
            stream.write(json.dumps(value, ensure_ascii=False, allow_nan=False) + "\n")
            stream.flush()

        emit(start)
        try:
            while True:
                before = time.monotonic()
                frame = sample(run)
                emit(frame)
                count += 1
                done = (frame["planned_trials"] is not None and frame["observed_trials"] == frame["planned_trials"]
                        and frame["planned_trials"] > 0 and frame["active_containers"] == 0 and frame["complete"])
                empty = empty + 1 if done else 0
                if empty >= 3 or (args.max_samples is not None and count >= args.max_samples):
                    break
                time.sleep(max(0, args.interval - (time.monotonic() - before)))
        except KeyboardInterrupt:
            interrupted = True
        finally:
            emit({"event": "monitor_end", "at": now(), "samples": count, "interrupted": interrupted,
                  "reason": "interrupted" if interrupted else "complete_and_empty" if empty >= 3 else "sample_limit"})
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
