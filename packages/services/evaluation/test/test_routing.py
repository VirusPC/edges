"""Routing fails if a dataset name calls the wrong runner or a 4xx skips failure writeback.

Unknown names still return 202. The failure is the finished record and the
local report, because Langfuse only waits for the accept.
"""

from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

from experiment_webhook.registry import RegistryError, load_registry
from experiment_webhook.server import App, serve_in_thread

from support import post_json


ROOT = Path(__file__).resolve().parents[1]


class RoutingTests(unittest.TestCase):
    def test_dataset_name_selects_one_runner_and_unknown_name_is_a_failure(self) -> None:
        seen: list[tuple[str, list[str]]] = []

        def alpha(context: object) -> dict[str, object]:
            seen.append((context.dataset_name, [item["id"] for item in context.items]))  # type: ignore[attr-defined]
            return {"items": [], "scores": []}

        def beta(context: object) -> dict[str, object]:
            seen.append(("beta", []))
            return {"items": [], "scores": []}

        with tempfile.TemporaryDirectory() as tmp:
            reports = Path(tmp)
            app = App.for_tests(
                registry_path=ROOT / "missing.json",
                secret=None,
                signature_required=False,
                modules={"alpha": alpha, "beta": beta},
                reports_dir=reports,
                fetch_items=lambda name, _dataset_id: [{"id": f"item-{name}", "input": {"question": "q"}}]
                if name == "alpha"
                else [],
            )
            server = serve_in_thread(app)
            self.addCleanup(server.shutdown)
            url = f"http://127.0.0.1:{server.server_address[1]}/langfuse/experiment"
            body = {
                "projectId": "project-1",
                "datasetId": "dataset-1",
                "datasetName": "alpha",
                "payload": {"runName": "alpha-run"},
            }
            status, accepted = post_json(url, body, {"Content-Type": "application/json"})
            self.assertEqual(status, 202)
            self.assertTrue(accepted["accepted"])
            self.assertTrue(app.dispatcher.wait_finished(1, 2))
            self.assertEqual(seen, [("alpha", ["item-alpha"])])

            missing = dict(body, datasetName="not-registered")
            status, accepted = post_json(url, missing, {"Content-Type": "application/json"})
            self.assertEqual(status, 202)
            self.assertTrue(app.dispatcher.wait_finished(2, 2))
            self.assertEqual(seen, [("alpha", ["item-alpha"])])
            failed = app.dispatcher.finished[1]
            self.assertEqual(failed["error"], "unknown_experiment")
            self.assertEqual(failed["status"], "failed")
            report = json.loads(Path(failed["reports"][0]).read_text(encoding="utf-8"))
            self.assertEqual(report["datasetName"], "not-registered")
            self.assertEqual(report["error"], "unknown_experiment")

    def test_shipped_registry_points_at_the_ablation_runner(self) -> None:
        mapping = load_registry(ROOT / "registry.json")
        self.assertEqual(
            mapping["harness-memory-ablation/v1"],
            "experiment_webhook.runners.edges_memory_ablation",
        )
        import experiment_webhook.runners.edges_memory_ablation as runner

        self.assertTrue(callable(runner.run))
        self.assertTrue(callable(runner.adapt_items))

    def test_registry_rejects_a_non_object(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "registry.json"
            path.write_text("[]\n", encoding="utf-8")
            with self.assertRaises(RegistryError):
                load_registry(path)

    def test_invalid_json_does_not_start_a_runner(self) -> None:
        calls: list[str] = []

        def runner(context: object) -> dict[str, object]:
            calls.append("ran")
            return {"items": [], "scores": []}

        app = App.for_tests(
            registry_path=ROOT / "missing.json",
            secret=None,
            signature_required=False,
            modules={"alpha": runner},
        )
        server = serve_in_thread(app)
        self.addCleanup(server.shutdown)
        import urllib.request

        url = f"http://127.0.0.1:{server.server_address[1]}/langfuse/experiment"
        request = urllib.request.Request(
            url,
            data=b"not-json",
            method="POST",
            headers={"Content-Type": "application/json"},
        )
        status, body = post_json_raw(request)
        self.assertEqual(status, 400)
        self.assertEqual(body["error"], "invalid json")
        self.assertEqual(calls, [])
        self.assertEqual(app.dispatcher.finished, [])


def post_json_raw(request: object) -> tuple[int, dict[str, object]]:
    import json
    import urllib.error
    import urllib.request

    try:
        with urllib.request.urlopen(request, timeout=2) as response:  # type: ignore[arg-type]
            return response.status, json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        return exc.code, json.loads(exc.read().decode("utf-8"))
