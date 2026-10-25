"""One ablation trial as a trace. Scoring and service.name stay here.

The shared sink has no tag field. Filter labels go in metadata `tags`
as one comma-separated string. Export maps that to
`langfuse.trace.metadata.tags`, not a Langfuse tag list.
"""

from __future__ import annotations

import time
from collections.abc import Sequence

from langfuse_sink import (
    Span,
    Trace,
    new_span_id,
    new_trace_id,
    spans_from_codex_jsonl,
    spans_from_pi_jsonl,
)


SERVICE_NAME = "edges-harness-memory-ablation"
EVAL_TAG = "eval:harness-memory-ablation"
_STEP_NS = 1_000_000


def trial_tags(condition: str, run_date: str) -> str:
    """`eval:harness-memory-ablation,memory:on|off,run:YYYY-MM-DD`."""
    return ",".join((EVAL_TAG, condition, f"run:{run_date}"))


def build_trial_trace(
    *,
    events_jsonl: str,
    case_id: str,
    category: str,
    condition: str,
    client_id: str,
    client_kind: str,
    prompt: str,
    answer: str,
    session_id: str | None,
    run_date: str,
    dataset: str,
    attributes: dict[str, str] | None = None,
) -> Trace:
    """Root span plus client child spans. Labels stay in metadata, not sink tags."""
    trace_id = new_trace_id()
    root_id = new_span_id()
    start = time.time_ns()
    adapter = spans_from_pi_jsonl if client_kind == "pi" else spans_from_codex_jsonl
    children = adapter(
        events_jsonl,
        trace_id=trace_id,
        parent_id=root_id,
        start_time_unix_nano=start,
    )
    root_start, root_end = _root_window(start, children)
    root = Span(
        trace_id=trace_id,
        span_id=root_id,
        name=f"harness-memory-ablation {case_id}",
        start_time_unix_nano=root_start,
        end_time_unix_nano=root_end,
        kind="span",
        input=prompt,
        output=answer,
        attributes=dict(attributes or {}),
    )
    metadata = {
        "case_id": case_id,
        "category": category,
        "condition": condition,
        "dataset": dataset,
        "client_id": client_id,
        "tags": trial_tags(condition, run_date),
    }
    return Trace(
        name=f"harness-memory-ablation {case_id}",
        spans=[root, *children],
        service_name=SERVICE_NAME,
        session_id=session_id,
        user_id=client_id,
        metadata=metadata,
    )


def _root_window(start: int, children: Sequence[Span]) -> tuple[int, int]:
    root_start = start
    root_end = start + _STEP_NS
    for child in children:
        if child.start_time_unix_nano < root_start:
            root_start = child.start_time_unix_nano
        if child.end_time_unix_nano > root_end:
            root_end = child.end_time_unix_nano
    return root_start, root_end
