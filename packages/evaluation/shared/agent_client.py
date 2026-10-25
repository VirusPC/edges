"""Re-export the retrieval agent client. Do not copy ``retrieval_eval.client``."""

from __future__ import annotations

from retrieval_eval.client import (
    ClientCall,
    build_prompt,
    codex_command,
    pi_command,
    pi_install_command,
    pi_sandbox_check_command,
    pi_sandbox_config_json,
    read_command_version,
    run_client,
)
from retrieval_eval.config import DEFAULT_CONFIG, Client, ConfigError, _load_clients

__all__ = [
    "Client",
    "ClientCall",
    "ConfigError",
    "DEFAULT_CONFIG",
    "_load_clients",
    "build_prompt",
    "codex_command",
    "pi_command",
    "pi_install_command",
    "pi_sandbox_check_command",
    "pi_sandbox_config_json",
    "read_command_version",
    "run_client",
]
