"""Signature checks fail if the HMAC is not the official Langfuse header.

Production change that should fail these tests: hashing the re-serialized
JSON instead of the raw body, or accepting a stale timestamp.
"""

from __future__ import annotations

import hashlib
import hmac
import json
import threading
import unittest
import urllib.error
import urllib.request
from pathlib import Path

import support  # noqa: F401  # quiets expected failure logs

from experiment_webhook.server import App, serve_in_thread
from experiment_webhook.signature import verify_langfuse_signature


SECRET = "lf-whsec_test"
RAW = b'{"datasetName":"harness-memory-ablation/v1","projectId":"p","datasetId":"d","payload":{}}'


def _header(raw: bytes, secret: str, timestamp: int) -> str:
    digest = hmac.new(secret.encode("utf-8"), f"{timestamp}.".encode("utf-8") + raw, hashlib.sha256).hexdigest()
    return f"t={timestamp},v1={digest}"


class SignatureTests(unittest.TestCase):
    def test_accepts_official_header_over_raw_body(self) -> None:
        header = _header(RAW, SECRET, 1_700_000_000)
        self.assertTrue(
            verify_langfuse_signature(
                RAW,
                header,
                SECRET,
                tolerance_seconds=300,
                now=1_700_000_100,
            )
        )

    def test_rejects_body_that_was_reserialized(self) -> None:
        header = _header(RAW, SECRET, 1_700_000_000)
        reserialized = json.dumps(json.loads(RAW), separators=(", ", ": ")).encode("utf-8")
        self.assertFalse(
            verify_langfuse_signature(
                reserialized,
                header,
                SECRET,
                tolerance_seconds=300,
                now=1_700_000_000,
            )
        )

    def test_rejects_stale_timestamp_and_bad_signature(self) -> None:
        stale = _header(RAW, SECRET, 1_700_000_000)
        self.assertFalse(
            verify_langfuse_signature(RAW, stale, SECRET, tolerance_seconds=300, now=1_700_000_000 + 301)
        )
        self.assertFalse(
            verify_langfuse_signature(
                RAW,
                "t=1700000000,v1=deadbeef",
                SECRET,
                tolerance_seconds=300,
                now=1_700_000_000,
            )
        )
        self.assertFalse(verify_langfuse_signature(RAW, None, SECRET, tolerance_seconds=300, now=1_700_000_000))

    def test_http_rejects_bad_signature_and_accepts_when_disabled(self) -> None:
        calls: list[str] = []

        def runner(context: object) -> dict[str, object]:
            calls.append("ran")
            return {"items": [], "scores": []}

        registry = Path(__file__).parent / "_unused_registry.json"
        app = App.for_tests(
            registry_path=registry,
            secret=SECRET,
            signature_required=True,
            modules={"harness-memory-ablation/v1": runner},
        )
        server = serve_in_thread(app)
        self.addCleanup(server.shutdown)
        url = f"http://127.0.0.1:{server.server_address[1]}/langfuse/experiment"
        bad = urllib.request.Request(
            url,
            data=RAW,
            method="POST",
            headers={"Content-Type": "application/json", "x-langfuse-signature": "t=1,v1=00"},
        )
        with self.assertRaises(urllib.error.HTTPError) as raised:
            urllib.request.urlopen(bad, timeout=2)
        raised.exception.close()
        self.assertEqual(raised.exception.code, 401)
        self.assertEqual(calls, [])

        disabled = App.for_tests(
            registry_path=registry,
            secret=SECRET,
            signature_required=False,
            modules={"harness-memory-ablation/v1": runner},
        )
        open_server = serve_in_thread(disabled)
        self.addCleanup(open_server.shutdown)
        open_url = f"http://127.0.0.1:{open_server.server_address[1]}/langfuse/experiment"
        request = urllib.request.Request(open_url, data=RAW, method="POST", headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(request, timeout=2) as response:
            body = json.loads(response.read().decode("utf-8"))
            self.assertEqual(response.status, 202)
        self.assertTrue(body["accepted"])
        self.assertTrue(body["runId"])
        deadline = threading.Event()
        for _ in range(50):
            if calls:
                break
            deadline.wait(0.02)
        self.assertEqual(calls, ["ran"])
