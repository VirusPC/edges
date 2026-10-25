"""Local webhook outcome next to other evaluation reports."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


def stamp_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d-%H%M%S")


def write_webhook_report(reports_dir: Path, record: dict[str, Any]) -> tuple[Path, Path]:
    """Write `<stamp>-<run>-experiment-webhook-<status>.json` and `.md`."""
    reports_dir.mkdir(parents=True, exist_ok=True)
    stamp = str(record.get("stamp") or stamp_now())
    run_id = str(record.get("runId") or "run")
    status = str(record.get("status") or "failed")
    stem = reports_dir / f"{stamp}-{run_id[:8]}-experiment-webhook-{status}"
    json_path = stem.with_suffix(".json")
    md_path = stem.with_suffix(".md")
    json_path.write_text(json.dumps(record, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    md_path.write_text(_markdown(record), encoding="utf-8")
    return json_path, md_path


def _markdown(record: dict[str, Any]) -> str:
    lines = [
        f"# Experiment webhook {record.get('datasetName', '')}",
        "",
        "评测冒烟。这是链路记录，不是公开基准证明，也不是项目记忆有效的证据。",
        "",
        f"- runId: `{record.get('runId')}`",
        f"- dataset: `{record.get('datasetName')}`",
        f"- status: `{record.get('status')}`",
        f"- error: `{record.get('error')}`",
        f"- langfuse: `{record.get('langfuse')}`",
        "",
    ]
    if record.get("error"):
        lines.append(str(record.get("detail") or ""))
        lines.append("")
    return "\n".join(lines)
