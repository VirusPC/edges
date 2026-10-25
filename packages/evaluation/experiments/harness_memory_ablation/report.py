"""Write one ablation run's json and markdown report."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any


def write_report(path_stem: Path, payload: dict[str, Any]) -> tuple[Path, Path]:
    """Write `<stem>.json` and `<stem>.md`. The markdown says this is a smoke."""
    path_stem.parent.mkdir(parents=True, exist_ok=True)
    json_path = path_stem.with_suffix(".json")
    md_path = path_stem.with_suffix(".md")
    json_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    md_path.write_text(_markdown(payload), encoding="utf-8")
    return json_path, md_path


def _markdown(payload: dict[str, Any]) -> str:
    lines = [
        f"# Harness memory ablation {payload.get('dataset', '')}",
        "",
        "评测冒烟。这是链路记录，不是公开基准证明，也不是项目记忆有效的证据。",
        "",
        payload.get("note") or "",
        "",
        f"- service.name: `{payload.get('service_name')}`",
        f"- dataset: `{payload.get('dataset')}`",
        f"- client: `{payload.get('client')}`",
        f"- repeats: `{payload.get('repeats')}`",
        f"- judge: `{payload.get('judge')}`",
        f"- worth_default_on: `{payload.get('worth_default_on')}`",
        "",
        "## Conditions",
        "",
        "| condition | cwd | commit | dirty |",
        "| --- | --- | --- | --- |",
    ]
    conditions = payload.get("conditions") or {}
    for name in ("memory:off", "memory:on"):
        row = conditions.get(name) or {}
        lines.append(
            f"| {name} | `{row.get('cwd')}` | `{row.get('commit')}` | `{row.get('dirty')}` |"
        )
    lines.extend(
        [
            "",
            "## Gates",
            "",
            "memory-dependent 正确率 +10 个百分点；输入 token 中位增量 ≤15%；耗时中位增量 ≤10%；memory-irrelevant 不下降且违反次数不上升。conflict-stale 单独列出，不参与 worth_default_on。",
            "",
            "| gate | pass | detail |",
            "| --- | --- | --- |",
        ]
    )
    for gate in payload.get("gates") or []:
        lines.append(f"| {gate.get('id')} | `{gate.get('pass')}` | {gate.get('detail')} |")
    lines.extend(["", "## By category", ""])
    by_category = payload.get("by_category") or {}
    if not by_category:
        lines.append("（无）")
    for category, sides in by_category.items():
        lines.append(f"### {category}")
        lines.append("")
        lines.append("| condition | accuracy | n | violations |")
        lines.append("| --- | --- | --- | --- |")
        for name in ("memory:off", "memory:on"):
            side = (sides or {}).get(name) or {}
            accuracy = side.get("accuracy")
            rendered = "—" if accuracy is None else f"{accuracy:.1%}"
            lines.append(
                f"| {name} | {rendered} | {side.get('n', 0)} | {side.get('violation_count', 0)} |"
            )
        lines.append("")
    conflict = (payload.get("conflict") or {}).get("b_worse_case_ids") or []
    lines.append(f"conflict/stale 上 memory:on 更差的题：{', '.join(conflict) if conflict else '—'}")
    lines.extend(["", "## Trials", "", "| case | condition | repeat | verdict | input tokens | latency ms |", "| --- | --- | --- | --- | --- | --- |"])
    for trial in payload.get("trials") or []:
        lines.append(
            "| {case_id} | {condition} | {repeat} | {verdict} | {tokens} | {latency} |".format(
                case_id=trial.get("case_id"),
                condition=trial.get("condition"),
                repeat=trial.get("repeat"),
                verdict=trial.get("verdict"),
                tokens=trial.get("input_tokens"),
                latency=trial.get("latency_ms"),
            )
        )
    lines.append("")
    return "\n".join(lines)
