"""In-process dispatch after the HTTP handler has accepted the POST.

A background thread exists so the socket can return 202. The runner is a
direct function call in this process. There is no job queue.
"""

from __future__ import annotations

import importlib
import logging
import threading
import uuid
from collections.abc import Callable
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from experiment_webhook.langfuse_client import LangfuseAPIError, LangfuseClient
from experiment_webhook.reports import stamp_now, write_webhook_report


logger = logging.getLogger("experiment_webhook")

Runner = Callable[["RunContext"], dict[str, Any]]
FetchItems = Callable[[str, str], list[dict[str, Any]]]


class RunFailure(Exception):
    def __init__(self, code: str, detail: str = "") -> None:
        super().__init__(code)
        self.code = code
        self.detail = detail


@dataclass(frozen=True)
class RunContext:
    run_id: str
    project_id: str
    dataset_id: str
    dataset_name: str
    payload: Any
    items: list[dict[str, Any]]
    reports_dir: Path


@dataclass
class Dispatcher:
    registry: dict[str, str]
    reports_dir: Path
    timeout_seconds: float
    callables: dict[str, Runner] = field(default_factory=dict)
    fetch_items: FetchItems | None = None
    langfuse: LangfuseClient | None = None
    finished: list[dict[str, Any]] = field(default_factory=list)
    _cv: threading.Condition = field(default_factory=threading.Condition)

    def start(self, *, project_id: str, dataset_id: str, dataset_name: str, payload: Any) -> str:
        """Start the run and return its id. Does not wait for the runner."""
        run_id = str(uuid.uuid4())
        thread = threading.Thread(
            target=self._execute,
            kwargs={
                "run_id": run_id,
                "project_id": project_id,
                "dataset_id": dataset_id,
                "dataset_name": dataset_name,
                "payload": payload,
            },
            daemon=True,
            name=f"experiment-{run_id[:8]}",
        )
        thread.start()
        return run_id

    def wait_finished(self, count: int, timeout: float) -> bool:
        with self._cv:
            return self._cv.wait_for(lambda: len(self.finished) >= count, timeout)

    def _execute(
        self,
        *,
        run_id: str,
        project_id: str,
        dataset_id: str,
        dataset_name: str,
        payload: Any,
    ) -> None:
        stamp = stamp_now()
        experiment_name = _experiment_name(dataset_name, run_id, payload)
        try:
            runner = self._resolve(dataset_name)
            items, result = self._run_with_timeout(
                runner,
                RunContext(
                    run_id=run_id,
                    project_id=project_id,
                    dataset_id=dataset_id,
                    dataset_name=dataset_name,
                    payload=payload,
                    items=[],
                    reports_dir=self.reports_dir,
                ),
                dataset_name=dataset_name,
                dataset_id=dataset_id,
            )
            langfuse_status = self._write_success(
                run_id=run_id,
                experiment_name=experiment_name,
                dataset_id=dataset_id,
                result=result,
            )
            record = {
                "stamp": stamp,
                "runId": run_id,
                "datasetName": dataset_name,
                "projectId": project_id,
                "datasetId": dataset_id,
                "status": "ok",
                "error": None,
                "detail": "",
                "langfuse": langfuse_status,
                "itemCount": len(items),
            }
            paths = write_webhook_report(self.reports_dir, record)
            record["reports"] = [str(path) for path in paths]
            self._finish(record)
            logger.info("run ok runId=%s dataset=%s langfuse=%s", run_id, dataset_name, langfuse_status)
        except RunFailure as exc:
            self._fail(
                stamp=stamp,
                run_id=run_id,
                project_id=project_id,
                dataset_id=dataset_id,
                dataset_name=dataset_name,
                experiment_name=experiment_name,
                code=exc.code,
                detail=exc.detail,
            )
        except Exception as exc:
            logger.exception("run crashed runId=%s", run_id)
            self._fail(
                stamp=stamp,
                run_id=run_id,
                project_id=project_id,
                dataset_id=dataset_id,
                dataset_name=dataset_name,
                experiment_name=experiment_name,
                code=type(exc).__name__,
                detail="",
            )

    def _run_with_timeout(
        self,
        runner: Runner,
        base: RunContext,
        *,
        dataset_name: str,
        dataset_id: str,
    ) -> tuple[list[dict[str, Any]], dict[str, Any]]:
        box: dict[str, Any] = {}
        cancelled = threading.Event()

        def invoke() -> None:
            try:
                items = self._items(dataset_name, dataset_id)
                if cancelled.is_set():
                    return
                context = RunContext(
                    run_id=base.run_id,
                    project_id=base.project_id,
                    dataset_id=base.dataset_id,
                    dataset_name=base.dataset_name,
                    payload=base.payload,
                    items=items,
                    reports_dir=base.reports_dir,
                )
                box["items"] = items
                box["result"] = runner(context)
            except Exception as exc:
                box["error"] = exc

        worker = threading.Thread(target=invoke, daemon=True, name=f"runner-{base.run_id[:8]}")
        worker.start()
        worker.join(self.timeout_seconds)
        if worker.is_alive():
            # The thread may still be inside the runner. Python cannot stop it.
            # The flag only skips the runner when the timeout landed before it started.
            cancelled.set()
            raise RunFailure("timeout", f"runner exceeded {self.timeout_seconds}s")
        if "error" in box:
            error = box["error"]
            if isinstance(error, RunFailure):
                raise error
            raise RunFailure(type(error).__name__, "") from error
        result = box.get("result")
        if not isinstance(result, dict):
            raise RunFailure("invalid_runner_result")
        items = box.get("items")
        return items if isinstance(items, list) else [], result

    def _items(self, dataset_name: str, dataset_id: str) -> list[dict[str, Any]]:
        if self.fetch_items is not None:
            return self.fetch_items(dataset_name, dataset_id)
        if self.langfuse is None:
            raise RunFailure("langfuse_not_configured")
        try:
            return self.langfuse.fetch_items(dataset_name)
        except LangfuseAPIError as exc:
            raise RunFailure("dataset_fetch_failed", f"status={exc.status}") from exc

    def _resolve(self, dataset_name: str) -> Runner:
        override = self.callables.get(dataset_name)
        if override is not None:
            return override
        module_name = self.registry.get(dataset_name)
        if not module_name:
            raise RunFailure("unknown_experiment")
        try:
            module = importlib.import_module(module_name)
        except Exception as exc:
            raise RunFailure("invalid_runner", type(exc).__name__) from exc
        run = getattr(module, "run", None)
        if not callable(run):
            raise RunFailure("invalid_runner", "missing run")
        return run

    def _write_success(
        self,
        *,
        run_id: str,
        experiment_name: str,
        dataset_id: str,
        result: dict[str, Any],
    ) -> str:
        if self.langfuse is None:
            return "skipped"
        items = result.get("items") if isinstance(result.get("items"), list) else []
        scores = result.get("scores") if isinstance(result.get("scores"), list) else []
        try:
            self.langfuse.write_experiment(
                experiment_id=run_id,
                experiment_name=experiment_name,
                dataset_id=dataset_id,
                items=items,
                scores=scores,
                failed=False,
                error=None,
            )
        except LangfuseAPIError as exc:
            logger.warning("langfuse writeback failed runId=%s status=%s", run_id, exc.status)
            return "failed"
        return "sent"

    def _fail(
        self,
        *,
        stamp: str,
        run_id: str,
        project_id: str,
        dataset_id: str,
        dataset_name: str,
        experiment_name: str,
        code: str,
        detail: str,
    ) -> None:
        langfuse_status = "skipped"
        if self.langfuse is not None:
            try:
                self.langfuse.write_experiment(
                    experiment_id=run_id,
                    experiment_name=experiment_name,
                    dataset_id=dataset_id,
                    items=[],
                    scores=[],
                    failed=True,
                    error=code,
                )
                langfuse_status = "sent"
            except LangfuseAPIError as exc:
                langfuse_status = "failed"
                logger.warning("langfuse failure writeback failed runId=%s status=%s", run_id, exc.status)
        record = {
            "stamp": stamp,
            "runId": run_id,
            "datasetName": dataset_name,
            "projectId": project_id,
            "datasetId": dataset_id,
            "status": "failed",
            "error": code,
            "detail": detail,
            "langfuse": langfuse_status,
        }
        try:
            paths = write_webhook_report(self.reports_dir, record)
            record["reports"] = [str(path) for path in paths]
        except OSError as exc:
            logger.warning("local failure report failed runId=%s error=%s", run_id, type(exc).__name__)
        self._finish(record)
        logger.error(
            "run failed runId=%s dataset=%s error=%s detail=%s langfuse=%s",
            run_id,
            dataset_name,
            code,
            detail,
            langfuse_status,
        )

    def _finish(self, record: dict[str, Any]) -> None:
        with self._cv:
            self.finished.append(record)
            self._cv.notify_all()


def _experiment_name(dataset_name: str, run_id: str, payload: Any) -> str:
    if isinstance(payload, dict):
        run_name = payload.get("runName")
        if isinstance(run_name, str) and run_name.strip():
            return run_name.strip()
    return f"{dataset_name} {run_id[:8]}"
