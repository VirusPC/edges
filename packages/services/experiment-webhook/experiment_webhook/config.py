"""Process configuration. Secrets stay in the environment."""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


_OFF = {"0", "false", "no", "off"}
_SERVICE_DIR = Path(__file__).resolve().parent.parent


def _raw(name: str, environ: dict[str, str] | None = None) -> str | None:
    source = os.environ if environ is None else environ
    value = source.get(name)
    if value is None:
        return None
    stripped = value.strip()
    return stripped or None


def _reports_dir() -> Path:
    override = _raw("EXPERIMENT_WEBHOOK_REPORTS_DIR")
    if override:
        return Path(override)
    for parent in Path(__file__).resolve().parents:
        candidate = parent / "packages" / "evaluation" / "reports"
        if candidate.is_dir():
            return candidate
    return _SERVICE_DIR.parents[2] / "evaluation" / "reports"


@dataclass(frozen=True)
class Config:
    host: str = "127.0.0.1"
    port: int = 8791
    registry_path: Path = _SERVICE_DIR / "registry.json"
    reports_dir: Path = Path("reports")
    secret: str | None = None
    signature_required: bool = True
    signature_tolerance_seconds: int = 300
    timeout_seconds: float = 600
    langfuse_host: str | None = None
    langfuse_public_key: str | None = None
    langfuse_secret_key: str | None = None
    max_body_bytes: int = 1_048_576

    @property
    def langfuse_configured(self) -> bool:
        return bool(self.langfuse_host and self.langfuse_public_key and self.langfuse_secret_key)


def load_config(environ: dict[str, str] | None = None) -> Config:
    source = os.environ if environ is None else environ
    signature_raw = (source.get("EXPERIMENT_WEBHOOK_SIGNATURE") or "on").strip().lower()
    host = _raw("EXPERIMENT_WEBHOOK_HOST", source) or _raw("HOST", source) or "127.0.0.1"
    port = _port(source)
    registry = _raw("EXPERIMENT_WEBHOOK_REGISTRY", source)
    timeout = _timeout(source)
    langfuse_host = _raw("LANGFUSE_HOST", source) or _raw("LANGFUSE_BASE_URL", source)
    if langfuse_host:
        langfuse_host = langfuse_host.rstrip("/")
    reports = _raw("EXPERIMENT_WEBHOOK_REPORTS_DIR", source)
    return Config(
        host=host,
        port=port,
        registry_path=Path(registry) if registry else _SERVICE_DIR / "registry.json",
        reports_dir=Path(reports) if reports else _reports_dir(),
        secret=_raw("LANGFUSE_WEBHOOK_SECRET", source),
        signature_required=signature_raw not in _OFF,
        signature_tolerance_seconds=_int(source, "LANGFUSE_WEBHOOK_TOLERANCE_SECONDS", 300, 0),
        timeout_seconds=timeout,
        langfuse_host=langfuse_host,
        langfuse_public_key=_raw("LANGFUSE_PUBLIC_KEY", source),
        langfuse_secret_key=_raw("LANGFUSE_SECRET_KEY", source),
    )


def _port(source: dict[str, str]) -> int:
    raw = _raw("EXPERIMENT_WEBHOOK_PORT", source) or _raw("PORT", source)
    if raw is None:
        return 8791
    try:
        port = int(raw)
    except ValueError:
        return 8791
    if port < 0 or port > 65535:
        return 8791
    return port


def _timeout(source: dict[str, str]) -> float:
    raw = _raw("EXPERIMENT_RUN_TIMEOUT_SECONDS", source)
    if raw is None:
        return 600
    try:
        value = float(raw)
    except ValueError:
        return 600
    if value < 1:
        return 600
    return value


def _int(source: dict[str, str], name: str, default: int, minimum: int) -> int:
    raw = _raw(name, source)
    if raw is None:
        return default
    try:
        value = int(raw)
    except ValueError:
        return default
    return value if value >= minimum else default
