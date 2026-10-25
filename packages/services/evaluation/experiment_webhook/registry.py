"""JSON map of Langfuse dataset name → runner module."""

from __future__ import annotations

import json
from pathlib import Path


class RegistryError(ValueError):
    """The registry file cannot be used."""


def load_registry(path: Path) -> dict[str, str]:
    """Read `{datasetName: "package.module"}`. Keys are matched exactly."""
    if not path.is_file():
        raise RegistryError(f"registry not found: {path}")
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise RegistryError(f"registry is not json: {exc}") from exc
    if not isinstance(data, dict) or not data:
        raise RegistryError("registry must be a non-empty object")
    mapping: dict[str, str] = {}
    for name, module in data.items():
        if not isinstance(name, str) or not name.strip():
            raise RegistryError("registry names must be non-empty strings")
        if not isinstance(module, str) or not module.strip():
            raise RegistryError(f"registry[{name}] must be a module path")
        mapping[name.strip()] = module.strip()
    return mapping
