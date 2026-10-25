"""A slow runner must not hold the HTTP response, and the failure is written back.

Production change that should fail this test: waiting for the runner before
202, or swallowing a timeout without a failure score and a local report.
"""

from __future__ import annotations

import json
import tempfile
import time
import unittest
from pathlib import Path

from experiment_webhook.langfuse_client import LangfuseClient
from experiment_webhook.server import App, serve_in_thread

from support import post_json, sign


SECRET = "lf-whsec_timeout"


class Capture:
    def __init__(self) -> None:
        self.calls: list[dict[str, object]] = []

    def __call__(self, request: object, timeout: float | None = None) -> "_Response":
        body = getattr(request, "data", None)
        self.calls.append({"url": request.full_url, "body": body})  # type: ignore[attr-defined]
        return _Response(200, b"{}")


class _Response:
    def __init__(self, status: int, payload: bytes) -> None:
        self.status = status
        self._payload = payload

    def read(self) -> bytes:
        return self._payload

    def __enter__(self) -> "_Response":
        return self

    def __exit__(self, *_args: object) -> None:
        return None


class TimeoutTests(unittest.TestCase):
    def test_http_202_then_timeout_writes_failure_score_and_report(self) -> None:
        def slow(context: object) -> dict[str, object]:
            time.sleep(3)
            return {"items": [], "scores": []}

        capture = Capture()
        client = LangfuseClient("http://langfuse.test", "pk-test", "sk-test", opener=capture)
        with tempfile.TemporaryDirectory() as tmp:
            reports = Path(tmp)
            app = App.for_tests(
                registry_path=Path(tmp) / "registry.json",
                secret=SECRET,
                signature_required=True,
                modules={"slow-dataset": slow},
                timeout_seconds=0.2,
                langfuse=client,
                reports_dir=reports,
                now=lambda: 1_700_000_000,
            )
            server = serve_in_thread(app)
            self.addCleanup(server.shutdown)
            url = f"http://127.0.0.1:{server.server_address[1]}/langfuse/experiment"
            payload = {
                "projectId": "project-1",
                "datasetId": "dataset-1",
                "datasetName": "slow-dataset",
                "payload": {},
            }
            raw = json.dumps(payload).encode("utf-8")
            header = sign(raw, SECRET, timestamp=1_700_000_000)
            started = time.perf_counter()
            status, body = post_json(
                url,
                payload,
                {"Content-Type": "application/json", "x-langfuse-signature": header},
            )
            elapsed = time.perf_counter() - started
            self.assertEqual(status, 202)
            self.assertTrue(body["accepted"])
            self.assertLess(elapsed, 1.0)
            self.assertTrue(app.dispatcher.wait_finished(1, 2))
            finished = app.dispatcher.finished[0]
            self.assertEqual(finished["status"], "failed")
            self.assertEqual(finished["error"], "timeout")
            self.assertEqual(finished["langfuse"], "sent")
            report = json.loads(Path(finished["reports"][0]).read_text(encoding="utf-8"))
            self.assertEqual(report["error"], "timeout")
            self.assertIn("评测冒烟", Path(finished["reports"][1]).read_text(encoding="utf-8"))
            scores = _scores(capture)
            run_ok = next(row for row in scores if row["name"] == "run_ok")
            self.assertEqual(run_ok["value"], 0)
            self.assertEqual(run_ok["dataType"], "BOOLEAN")
            trace_body = next(
                json.loads(call["body"])  # type: ignore[arg-type]
                for call in capture.calls
                if "/otel/" in str(call["url"])
            )
            attributes = trace_body["resourceSpans"][0]["scopeSpans"][0]["spans"][0]["attributes"]
            found = {item["key"]: item["value"]["stringValue"] for item in attributes}
            self.assertEqual(found["langfuse.experiment.dataset.id"], "dataset-1")
            self.assertEqual(trace_body["resourceSpans"][0]["scopeSpans"][0]["spans"][0]["status"]["code"], 2)


def _scores(capture: Capture) -> list[dict[str, object]]:
    rows: list[dict[str, object]] = []
    for call in capture.calls:
        if str(call["url"]).endswith("/api/public/scores"):
            parsed = json.loads(call["body"])  # type: ignore[arg-type]
            if not isinstance(parsed, dict):
                raise AssertionError("score post must be one object")
            rows.append(parsed)
    if not rows:
        raise AssertionError("no score post")
    return rows
