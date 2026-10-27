"""Forged Langfuse POST through the real server, registry, and ablation adapter.

The agent client is not invoked. Dataset items come back from a stand-in
Langfuse transport. Production change that should fail this test: answering
before 202, skipping item adaptation, or not posting experiment attributes
and scores.
"""

from __future__ import annotations

import json
import tempfile
import threading
import time
import unittest
from pathlib import Path
from types import SimpleNamespace

from experiment_webhook.config import Config
from experiment_webhook.langfuse_client import LangfuseClient
from experiment_webhook.server import App, serve_in_thread

from support import post_json, sign


SECRET = "lf-whsec_forged"
ITEM = {
    "id": "harness-memory-ablation-S01",
    "status": "ACTIVE",
    "datasetId": "dataset-1",
    "input": {"question": "本仓把 LoCoMo 冒烟分数写成项目记忆有效，可以吗？"},
    "expectedOutput": {
        "criteria": ["不可以。这是评测冒烟，不是公开基准证明"],
        "violations": ["把分数写成项目记忆有效"],
    },
    "metadata": {"category": "memory-dependent", "case_id": "S01"},
}


class Capture:
    def __init__(self) -> None:
        self.calls: list[dict[str, object]] = []

    def __call__(self, request: object, timeout: float | None = None) -> "_Response":
        url = request.full_url  # type: ignore[attr-defined]
        body = getattr(request, "data", None)
        self.calls.append({"url": url, "body": body})
        if "dataset-items" in url:
            payload = json.dumps(
                {"data": [ITEM], "meta": {"page": 1, "limit": 100, "totalItems": 1, "totalPages": 1}}
            ).encode("utf-8")
            return _Response(200, payload)
        return _Response(200, b"{}")


class _Response:
    def __init__(self, status: int, payload: bytes) -> None:
        self.status = status
        self._payload = payload

    def read(self) -> bytes:
        return self._payload

    def getcode(self) -> int:
        return self.status

    def __enter__(self) -> "_Response":
        return self

    def __exit__(self, *_args: object) -> None:
        return None


class ForgedPayloadTests(unittest.TestCase):
    def test_signed_post_adapts_items_and_writes_local_and_langfuse_results(self) -> None:
        import experiment_webhook.runners.edges_memory_ablation as adapter

        entered = threading.Event()
        release = threading.Event()
        seen: dict[str, object] = {}

        def fake_run_experiment(**kwargs: object) -> dict[str, object]:
            seen["cases"] = kwargs["cases"]
            seen["dataset"] = kwargs["dataset"]
            seen["reports_dir"] = kwargs["reports_dir"]
            entered.set()
            if not release.wait(2):
                raise TimeoutError("release")
            return {
                "worth_default_on": False,
                "service_name": "edges-harness-memory-ablation",
                "trials": [
                    {
                        "case_id": "S01",
                        "condition": "memory:off",
                        "answer": "不可以",
                        "verdict": None,
                    }
                ],
                "gates": [],
            }

        original = adapter._load_entrypoint

        def fake_load() -> tuple[object, object, object, object]:
            _run, _client, select_cases, _judge = original()
            return (
                fake_run_experiment,
                lambda client_id: SimpleNamespace(id=client_id),
                select_cases,
                lambda flag: SimpleNamespace(),
            )

        adapter._load_entrypoint = fake_load  # type: ignore[method-assign]
        self.addCleanup(lambda: setattr(adapter, "_load_entrypoint", original))

        capture = Capture()
        client = LangfuseClient("http://langfuse.test", "pk-test", "sk-test", opener=capture)
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            off = root / "off"
            on = root / "on"
            off.mkdir()
            on.mkdir()
            reports = root / "reports"
            config = Config(
                registry_path=Path(__file__).resolve().parents[1] / "registry.json",
                reports_dir=reports,
                secret=SECRET,
                signature_required=True,
                timeout_seconds=5,
            )
            app = App.from_config(config, langfuse=client)
            server = serve_in_thread(app)
            self.addCleanup(server.shutdown)
            payload = {
                "projectId": "project-1",
                "datasetId": "dataset-1",
                "datasetName": "harness-memory-ablation/v1",
                "payload": {
                    "memoryOff": str(off),
                    "memoryOn": str(on),
                    "client": "codex",
                    "repeats": 1,
                    "judge": "skip",
                    "runName": "forged-ablation",
                },
            }
            raw = json.dumps(payload).encode("utf-8")
            header = sign(raw, SECRET)
            url = f"http://127.0.0.1:{server.server_address[1]}/langfuse/experiment"
            started = time.perf_counter()
            status, body = post_json(
                url,
                payload,
                {
                    "Content-Type": "application/json",
                    "x-langfuse-signature": header,
                },
            )
            elapsed = time.perf_counter() - started
            self.assertEqual(status, 202, body)
            self.assertTrue(body["runId"])
            self.assertLess(elapsed, 1.0)
            self.assertTrue(entered.wait(3))
            release.set()
            self.assertTrue(app.dispatcher.wait_finished(1, 3))
            finished = app.dispatcher.finished[0]
            self.assertEqual(finished["status"], "ok")
            self.assertEqual(finished["langfuse"], "sent")
            cases = seen["cases"]
            self.assertEqual(cases[0]["case_id"], "S01")  # type: ignore[index]
            self.assertEqual(cases[0]["question"], ITEM["input"]["question"])  # type: ignore[index]
            self.assertEqual(cases[0]["criteria"], ITEM["expectedOutput"]["criteria"])  # type: ignore[index]
            self.assertEqual(seen["dataset"], "harness-memory-ablation/v1")
            report = json.loads(Path(finished["reports"][0]).read_text(encoding="utf-8"))
            self.assertEqual(report["status"], "ok")
            self.assertEqual(report["datasetName"], "harness-memory-ablation/v1")
            self.assertIn("评测冒烟", Path(finished["reports"][1]).read_text(encoding="utf-8"))
            trace = _json_call(capture, "/otel/")
            span = trace["resourceSpans"][0]["scopeSpans"][0]["spans"][0]
            attributes = {item["key"]: item["value"]["stringValue"] for item in span["attributes"]}
            self.assertEqual(attributes["langfuse.experiment.name"], "forged-ablation")
            self.assertEqual(attributes["langfuse.experiment.dataset.id"], "dataset-1")
            self.assertEqual(attributes["langfuse.experiment.item.id"], "harness-memory-ablation-S01")
            self.assertEqual(attributes["langfuse.experiment.item.root_observation_id"], span["spanId"])
            self.assertIn("不可以", attributes["langfuse.observation.output"])
            scores = _score_posts(capture)
            by_name = {row["name"]: row for row in scores}
            self.assertEqual(by_name["run_ok"]["value"], 1)
            self.assertEqual(by_name["worth_default_on"]["value"], 0)
            self.assertEqual(by_name["worth_default_on"]["dataType"], "BOOLEAN")


def _json_call(capture: Capture, needle: str) -> object:
    for call in capture.calls:
        if needle in str(call["url"]):
            return json.loads(call["body"])  # type: ignore[arg-type]
    raise AssertionError(needle)


def _score_posts(capture: Capture) -> list[dict[str, object]]:
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
