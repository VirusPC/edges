"""Check self-hosted Langfuse reachability and point at the live-trigger note.

Does not register a Custom Experiment URL and does not start a tunnel.
Secrets and the instance hostname are not printed.
The signed POST that counts for this PR is recorded in REAL-CUSTOM-EXPERIMENT.md.

    PYTHONPATH=. python3 scripts/real_custom_experiment.py
"""

from __future__ import annotations

import base64
import json
import os
import shutil
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path


USER_AGENT = "edges-observation/1"
CHECKLIST = Path(__file__).with_name("REAL-CUSTOM-EXPERIMENT.md")


def main() -> int:
    host = (os.environ.get("LANGFUSE_HOST") or os.environ.get("LANGFUSE_BASE_URL") or "").strip().rstrip("/")
    public_key = (os.environ.get("LANGFUSE_PUBLIC_KEY") or "").strip()
    secret_key = (os.environ.get("LANGFUSE_SECRET_KEY") or "").strip()
    if not host or not public_key or not secret_key:
        print(
            "BLOCKED: set LANGFUSE_HOST or LANGFUSE_BASE_URL, LANGFUSE_PUBLIC_KEY, and LANGFUSE_SECRET_KEY"
        )
        return 2
    token = base64.b64encode(f"{public_key}:{secret_key}".encode()).decode("ascii")
    try:
        health = _get(host, "/api/public/health", token)
    except urllib.error.HTTPError as exc:
        print(f"BLOCKED: Langfuse health HTTP {exc.code}")
        return 2
    except OSError as exc:
        print(f"BLOCKED: Langfuse health {type(exc).__name__}")
        return 2
    version = health.get("version") if isinstance(health, dict) else None
    print(f"Langfuse health OK version={version}")
    dataset_name = "harness-memory-ablation/v1"
    try:
        _get(host, "/api/public/v2/datasets/" + urllib.parse.quote(dataset_name, safe=""), token)
        items = _get(
            host,
            "/api/public/dataset-items?"
            + urllib.parse.urlencode({"datasetName": dataset_name, "page": 1, "limit": 1}),
            token,
        )
    except urllib.error.HTTPError as exc:
        print(f"dataset {dataset_name} HTTP {exc.code}")
        return 2
    meta = items.get("meta") if isinstance(items, dict) else None
    total = meta.get("totalItems") if isinstance(meta, dict) else None
    print(f"dataset {dataset_name} readable totalItems={total}")
    tunnel = shutil.which("cloudflared")
    local_bin = Path.home() / ".local" / "bin" / "cloudflared"
    if tunnel:
        cloudflared = "found"
    elif local_bin.is_file() and os.access(local_bin, os.X_OK):
        cloudflared = "found-off-path"
    else:
        cloudflared = "not-installed"
    print(f"cloudflared={cloudflared}")
    print("this script does not send a Custom Experiment POST")
    print(
        "acceptance: signed POST through a quick tunnel, then Langfuse dataset and experiment APIs; "
        "UI click deferred (public dataset PATCH 405, tRPC remote-experiment routes 401 without a UI session)"
    )
    print(f"checklist: {CHECKLIST}")
    return 0


def _get(host: str, path: str, token: str) -> dict:
    request = urllib.request.Request(
        host + path,
        headers={
            "Authorization": f"Basic {token}",
            "Accept": "application/json",
            "User-Agent": USER_AGENT,
        },
        method="GET",
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        payload = json.loads(response.read().decode("utf-8"))
    if not isinstance(payload, dict):
        raise OSError("langfuse json was not an object")
    return payload


if __name__ == "__main__":
    sys.exit(main())
