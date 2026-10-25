"""The same process `edges evaluation server start --dev` launches.

GET /health and a forged signed POST go through `python -m experiment_webhook`,
not the in-process test server.
"""

from __future__ import annotations

import hashlib
import hmac
import json
import os
import socket
import subprocess
import sys
import time
import unittest
import urllib.error
import urllib.request
from pathlib import Path


SERVICE = Path(__file__).resolve().parents[1]


def _free_port() -> int:
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        return int(sock.getsockname()[1])


def _sign(raw: bytes, secret: str) -> str:
    issued = int(time.time())
    digest = hmac.new(secret.encode("utf-8"), f"{issued}.".encode("utf-8") + raw, hashlib.sha256).hexdigest()
    return f"t={issued},v1={digest}"


def _get(port: int) -> tuple[int, dict[str, object]]:
    with urllib.request.urlopen(f"http://127.0.0.1:{port}/health", timeout=2) as response:
        return response.status, json.loads(response.read().decode("utf-8"))


def _post(port: int, raw: bytes, signature: str) -> tuple[int, dict[str, object]]:
    request = urllib.request.Request(
        f"http://127.0.0.1:{port}/langfuse/experiment",
        data=raw,
        method="POST",
        headers={"content-type": "application/json", "x-langfuse-signature": signature},
    )
    try:
        with urllib.request.urlopen(request, timeout=2) as response:
            return response.status, json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        return error.code, json.loads(error.read().decode("utf-8"))


class DevEntryTests(unittest.TestCase):
    def test_module_entry_health_and_forged_signed_post(self) -> None:
        port = _free_port()
        secret = "lf-whsec_dev_entry"
        env = os.environ.copy()
        env.update(
            {
                "PYTHONPATH": str(SERVICE),
                "EXPERIMENT_WEBHOOK_HOST": "127.0.0.1",
                "EXPERIMENT_WEBHOOK_PORT": str(port),
                "LANGFUSE_WEBHOOK_SECRET": secret,
                "EXPERIMENT_WEBHOOK_REPORTS_DIR": str(Path(os.environ.get("TMPDIR", "/tmp"))),
            }
        )
        proc = subprocess.Popen(
            [sys.executable, "-m", "experiment_webhook"],
            cwd=SERVICE,
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
        )
        try:
            deadline = time.time() + 5
            health: dict[str, object] | None = None
            while time.time() < deadline:
                if proc.poll() is not None:
                    output = proc.stdout.read() if proc.stdout else ""
                    self.fail(f"server exited {proc.returncode}: {output}")
                try:
                    status, health = _get(port)
                except (urllib.error.URLError, TimeoutError):
                    time.sleep(0.05)
                    continue
                self.assertEqual(status, 200)
                break
            self.assertEqual(health, {"ok": True})
            raw = json.dumps(
                {
                    "projectId": "proj_dev",
                    "datasetId": "ds_dev",
                    "datasetName": "not-in-registry",
                    "payload": {"note": "forged"},
                }
            ).encode("utf-8")
            status, body = _post(port, raw, "t=1,v1=deadbeef")
            self.assertEqual(status, 401)
            self.assertEqual(body.get("accepted"), False)
            status, body = _post(port, raw, _sign(raw, secret))
            self.assertEqual(status, 202)
            self.assertEqual(body.get("accepted"), True)
            self.assertIsInstance(body.get("runId"), str)
        finally:
            proc.terminate()
            try:
                proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                proc.kill()
                proc.wait(timeout=5)
            if proc.stdout is not None:
                proc.stdout.close()
