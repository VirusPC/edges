"""HTTP entry: GET /health, POST /langfuse/experiment → 202, then in-process run."""

from __future__ import annotations

import json
import logging
import threading
from collections.abc import Callable, Mapping
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import urlsplit

from experiment_webhook.config import Config, load_config
from experiment_webhook.dispatch import Dispatcher, Runner
from experiment_webhook.langfuse_client import LangfuseClient
from experiment_webhook.registry import RegistryError, load_registry
from experiment_webhook.signature import verify_langfuse_signature


logger = logging.getLogger("experiment_webhook")


class App:
    def __init__(
        self,
        config: Config,
        dispatcher: Dispatcher,
        *,
        now: Callable[[], float] | None = None,
    ) -> None:
        self.config = config
        self.dispatcher = dispatcher
        self._now = now

    @classmethod
    def for_tests(
        cls,
        *,
        registry_path: Path,
        secret: str | None,
        signature_required: bool,
        modules: Mapping[str, Runner],
        timeout_seconds: float = 30,
        fetch_items: Callable[[str, str], list[dict[str, Any]]] | None = None,
        langfuse: LangfuseClient | None = None,
        reports_dir: Path | None = None,
        now: Callable[[], float] | None = None,
    ) -> App:
        reports = reports_dir or Path("/tmp/edges-experiment-webhook-test")
        config = Config(
            registry_path=registry_path,
            reports_dir=reports,
            secret=secret,
            signature_required=signature_required,
            timeout_seconds=timeout_seconds,
        )
        dispatcher = Dispatcher(
            registry={},
            reports_dir=reports,
            timeout_seconds=timeout_seconds,
            callables=dict(modules),
            fetch_items=fetch_items if fetch_items is not None else (lambda _name, _dataset_id: []),
            langfuse=langfuse,
        )
        return cls(config, dispatcher, now=now)

    @classmethod
    def from_config(cls, config: Config, langfuse: LangfuseClient | None = None) -> App:
        try:
            registry = load_registry(config.registry_path)
        except RegistryError as exc:
            raise SystemExit(f"experiment-webhook: {exc}") from exc
        client = langfuse
        if client is None and config.langfuse_configured:
            assert config.langfuse_host and config.langfuse_public_key and config.langfuse_secret_key
            client = LangfuseClient(
                config.langfuse_host,
                config.langfuse_public_key,
                config.langfuse_secret_key,
            )
        dispatcher = Dispatcher(
            registry=registry,
            reports_dir=config.reports_dir,
            timeout_seconds=config.timeout_seconds,
            langfuse=client,
        )
        return cls(config, dispatcher)

    def make_handler(self) -> type[BaseHTTPRequestHandler]:
        app = self

        class Handler(BaseHTTPRequestHandler):
            def do_GET(self) -> None:
                status, payload = app.handle_get(urlsplit(self.path).path)
                _send_json(self, status, payload)

            def do_POST(self) -> None:
                if _normalize(urlsplit(self.path).path) != "/langfuse/experiment":
                    _send_json(self, 404, {"error": "not found"})
                    return
                raw, error = _read_body(self, app.config.max_body_bytes)
                if error is not None:
                    status, message = error
                    _send_json(self, status, {"accepted": False, "error": message})
                    return
                assert raw is not None
                headers = {key.lower(): value for key, value in self.headers.items()}
                status, payload = app.handle_post(raw, headers)
                _send_json(self, status, payload)

            def log_message(self, fmt: str, *args: Any) -> None:
                logger.info("%s %s", self.address_string(), fmt % args)

        return Handler

    def handle_get(self, path: str) -> tuple[int, dict[str, Any]]:
        if _normalize(path) != "/health":
            return 404, {"error": "not found"}
        return 200, {"ok": True}

    def handle_post(self, raw: bytes, headers: Mapping[str, str]) -> tuple[int, dict[str, Any]]:
        if self.config.signature_required:
            if not self.config.secret:
                return 401, {"accepted": False, "error": "signature required"}
            header = _header(headers, "x-langfuse-signature")
            now = self._now() if self._now is not None else None
            if not verify_langfuse_signature(
                raw,
                header,
                self.config.secret,
                self.config.signature_tolerance_seconds,
                now=now,
            ):
                logger.info("signature rejected")
                return 401, {"accepted": False, "error": "invalid signature"}
        try:
            fields = _experiment_fields(json.loads(raw.decode("utf-8")))
        except UnicodeDecodeError:
            return 400, {"accepted": False, "error": "invalid json"}
        except json.JSONDecodeError:
            return 400, {"accepted": False, "error": "invalid json"}
        except ValueError as exc:
            return 400, {"accepted": False, "error": str(exc)}
        run_id = self.dispatcher.start(
            project_id=fields["projectId"],
            dataset_id=fields["datasetId"],
            dataset_name=fields["datasetName"],
            payload=fields["payload"],
        )
        logger.info("accepted runId=%s dataset=%s", run_id, fields["datasetName"])
        return 202, {"accepted": True, "runId": run_id}


def serve(config: Config | None = None) -> None:
    config = config or load_config()
    app = App.from_config(config)
    server = ThreadingHTTPServer((config.host, config.port), app.make_handler())
    logger.info(
        "listening host=%s port=%s signature=%s registry=%s",
        config.host,
        config.port,
        config.signature_required,
        config.registry_path,
    )
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        logger.info("shutting down")
    finally:
        server.server_close()


def serve_in_thread(app: App) -> ThreadingHTTPServer:
    server = ThreadingHTTPServer(("127.0.0.1", 0), app.make_handler())
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    original_shutdown = server.shutdown

    def shutdown() -> None:
        original_shutdown()
        server.server_close()

    server.shutdown = shutdown  # type: ignore[method-assign]
    return server


def _normalize(path: str) -> str:
    if len(path) > 1 and path.endswith("/"):
        path = path[:-1]
    return path


def _header(headers: Mapping[str, str], name: str) -> str | None:
    for key, value in headers.items():
        if key.lower() == name:
            return value
    return None


def _experiment_fields(data: Any) -> dict[str, Any]:
    if not isinstance(data, dict):
        raise ValueError("body must be a JSON object")
    fields: dict[str, Any] = {}
    for name in ("projectId", "datasetId", "datasetName"):
        value = data.get(name)
        if not isinstance(value, str) or not value.strip():
            raise ValueError(f"{name} must be a non-empty string")
        fields[name] = value.strip()
    fields["payload"] = data.get("payload") if "payload" in data else None
    return fields


def _read_body(
    handler: BaseHTTPRequestHandler,
    limit: int,
) -> tuple[bytes | None, tuple[int, str] | None]:
    header = handler.headers.get("Content-Length")
    if header is None:
        return None, (411, "content-length required")
    try:
        length = int(header)
    except ValueError:
        return None, (400, "invalid content-length")
    if length < 0:
        return None, (400, "invalid content-length")
    if length > limit:
        return None, (413, "payload too large")
    return handler.rfile.read(length), None


def _send_json(handler: BaseHTTPRequestHandler, status: int, payload: dict[str, Any]) -> None:
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Content-Length", str(len(body)))
    handler.end_headers()
    handler.wfile.write(body)
