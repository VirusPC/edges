"""Langfuse public API: dataset items, experiment traces, scores.

Uses urllib. The User-Agent matches the observation smoke client so Cloudflare
does not answer 1010 to Python's default identifier. No secrets are logged.
"""

from __future__ import annotations

import base64
import json
import secrets
import time
import urllib.error
import urllib.parse
import urllib.request
from collections.abc import Callable
from typing import Any


USER_AGENT = "edges-observation/1"
_TRACE_PATH = "/api/public/otel/v1/traces"
_SCORES_PATH = "/api/public/scores"
_ITEMS_PATH = "/api/public/dataset-items"

Opener = Callable[..., Any]


class LangfuseAPIError(RuntimeError):
    def __init__(self, status: int, path: str):
        super().__init__(f"langfuse api status={status} path={path}")
        self.status = status
        self.path = path


class LangfuseClient:
    def __init__(
        self,
        host: str,
        public_key: str,
        secret_key: str,
        opener: Opener | None = None,
        timeout: float = 20,
    ) -> None:
        self._host = host.rstrip("/")
        self._public_key = public_key
        self._secret_key = secret_key
        self._opener = opener or urllib.request.urlopen
        self._timeout = timeout

    def fetch_items(self, dataset_name: str) -> list[dict[str, Any]]:
        """All ACTIVE items for a dataset name. Pages until meta.totalPages."""
        page = 1
        collected: list[dict[str, Any]] = []
        while page <= 100:
            query = urllib.parse.urlencode(
                {"datasetName": dataset_name, "page": page, "limit": 100}
            )
            payload = self._get(f"{_ITEMS_PATH}?{query}")
            data = payload.get("data") if isinstance(payload, dict) else None
            if not isinstance(data, list):
                raise LangfuseAPIError(200, _ITEMS_PATH)
            for item in data:
                if isinstance(item, dict) and item.get("status", "ACTIVE") == "ACTIVE":
                    collected.append(item)
            meta = payload.get("meta") if isinstance(payload, dict) else None
            total_pages = 1
            if isinstance(meta, dict) and isinstance(meta.get("totalPages"), int):
                total_pages = meta["totalPages"]
            if page >= total_pages or not data:
                break
            page += 1
        return collected

    def write_experiment(
        self,
        *,
        experiment_id: str,
        experiment_name: str,
        dataset_id: str,
        items: list[dict[str, Any]],
        scores: list[dict[str, Any]],
        failed: bool,
        error: str | None,
    ) -> dict[str, Any]:
        """One root span per item, then scores on those trace ids.

        `items` entries use `id`, `input`, `output`, `expected_output`.
        Scores may set `item_id`; scores without `item_id` attach to the first trace.
        """
        now = time.time_ns()
        spans: list[dict[str, Any]] = []
        trace_by_item: dict[str, str] = {}
        if not items:
            items = [
                {
                    "id": f"failure-{experiment_id}",
                    "input": None,
                    "output": error or "failed",
                    "expected_output": None,
                }
            ]
        for item in items:
            trace_id = secrets.token_hex(16)
            span_id = secrets.token_hex(8)
            item_id = str(item.get("id") or trace_id)
            trace_by_item[item_id] = trace_id
            spans.append(
                _span(
                    trace_id=trace_id,
                    span_id=span_id,
                    experiment_id=experiment_id,
                    experiment_name=experiment_name,
                    dataset_id=dataset_id,
                    item_id=item_id,
                    item_input=item.get("input"),
                    item_output=item.get("output"),
                    expected_output=item.get("expected_output"),
                    failed=failed,
                    error=error,
                    now=now,
                )
            )
        self._post(_TRACE_PATH, {"resourceSpans": [_resource(spans)]})
        score_rows = _score_rows(scores, trace_by_item, failed=failed, error=error)
        # This Langfuse public API accepts one score object per POST, not an array.
        for row in score_rows:
            self._post(_SCORES_PATH, row)
        return {"traces": len(spans), "scores": len(score_rows), "status": "sent"}

    def _get(self, path: str) -> dict[str, Any]:
        status, payload = self._request("GET", path, None)
        if status < 200 or status >= 300 or not isinstance(payload, dict):
            raise LangfuseAPIError(status, path.split("?", 1)[0])
        return payload

    def _post(self, path: str, body: Any) -> None:
        status, _payload = self._request("POST", path, body)
        if status < 200 or status >= 300:
            raise LangfuseAPIError(status, path)

    def _request(self, method: str, path: str, body: Any) -> tuple[int, Any]:
        data = None if body is None else json.dumps(body, ensure_ascii=False).encode("utf-8")
        token = base64.b64encode(f"{self._public_key}:{self._secret_key}".encode()).decode("ascii")
        request = urllib.request.Request(
            f"{self._host}{path}",
            data=data,
            method=method,
            headers={
                "Authorization": f"Basic {token}",
                "Accept": "application/json",
                "Content-Type": "application/json",
                "User-Agent": USER_AGENT,
            },
        )
        try:
            with self._opener(request, timeout=self._timeout) as response:
                raw = response.read()
                status = int(getattr(response, "status", None) or response.getcode())
        except urllib.error.HTTPError as exc:
            raw = exc.read() if exc.fp is not None else b""
            status = int(exc.code)
        if not raw:
            return status, None
        try:
            parsed = json.loads(raw.decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError):
            parsed = None
        return status, parsed


def _resource(spans: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        "resource": {
            "attributes": [
                {"key": "service.name", "value": {"stringValue": "edges-experiment-webhook"}}
            ]
        },
        "scopeSpans": [
            {
                "scope": {"name": "edges-experiment-webhook"},
                "spans": spans,
            }
        ],
    }


def _span(
    *,
    trace_id: str,
    span_id: str,
    experiment_id: str,
    experiment_name: str,
    dataset_id: str,
    item_id: str,
    item_input: Any,
    item_output: Any,
    expected_output: Any,
    failed: bool,
    error: str | None,
    now: int,
) -> dict[str, Any]:
    attributes = [
        _string("langfuse.trace.name", experiment_name),
        _string("langfuse.observation.type", "span"),
        _string("langfuse.experiment.id", experiment_id),
        _string("langfuse.experiment.name", experiment_name),
        _string("langfuse.experiment.dataset.id", dataset_id),
        _string("langfuse.experiment.item.id", item_id),
        _string("langfuse.experiment.item.root_observation_id", span_id),
        _string("langfuse.observation.input", _json(item_input)),
        _string("langfuse.observation.output", _json(item_output)),
        _string("langfuse.experiment.item.expected_output", _json(expected_output)),
    ]
    if error:
        attributes.append(_string("langfuse.observation.status_message", error))
    return {
        "traceId": trace_id,
        "spanId": span_id,
        "name": "experiment-item",
        "kind": 1,
        "startTimeUnixNano": str(now),
        "endTimeUnixNano": str(now + 1_000_000),
        "status": {"code": 2 if failed else 1},
        "attributes": [item for item in attributes if item is not None],
    }


def _score_rows(
    scores: list[dict[str, Any]],
    trace_by_item: dict[str, str],
    *,
    failed: bool,
    error: str | None,
) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    first_trace = next(iter(trace_by_item.values()))
    for score in scores:
        if not isinstance(score, dict):
            continue
        name = score.get("name")
        if not isinstance(name, str) or not name:
            continue
        item_id = score.get("item_id")
        trace_id = trace_by_item.get(str(item_id), first_trace) if item_id else first_trace
        rows.append(_score(trace_id, name, score.get("value"), score.get("dataType"), score.get("comment")))
    rows.append(
        _score(
            first_trace,
            "run_ok",
            0 if failed else 1,
            "BOOLEAN",
            error if failed else "ok",
        )
    )
    return rows


def _score(trace_id: str, name: str, value: Any, data_type: Any, comment: Any) -> dict[str, Any]:
    kind = data_type if isinstance(data_type, str) else "NUMERIC"
    return {
        "id": secrets.token_hex(16),
        "traceId": trace_id,
        "name": name,
        "value": _score_value(kind, value),
        "dataType": kind,
        "comment": comment if isinstance(comment, str) else "",
    }


def _score_value(kind: str, value: Any) -> Any:
    if kind == "BOOLEAN":
        if value in (True, 1, 1.0, "1", "true"):
            return 1
        return 0
    if kind == "CATEGORICAL":
        return str(value) if value is not None else ""
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return 0
    return value


def _string(key: str, value: str | None) -> dict[str, Any] | None:
    if value is None:
        return None
    return {"key": key, "value": {"stringValue": value[:8000]}}


def _json(value: Any) -> str | None:
    if value is None:
        return None
    if isinstance(value, str):
        return value
    return json.dumps(value, ensure_ascii=False)
