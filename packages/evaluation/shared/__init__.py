"""Shared evaluation imports.

Importing this package imports ``retrieval_eval``, which puts
``packages/observation`` on ``sys.path``. ``langfuse_sink`` is not installed.
The agent client implementation stays in ``retrieval_eval``; ``agent_client``
only re-exports it.
"""

from __future__ import annotations

import sys
from pathlib import Path

_EVAL_DIR = Path(__file__).resolve().parents[1]
_EXPERIMENTS = _EVAL_DIR / "experiments"
if str(_EXPERIMENTS) not in sys.path:
    sys.path.insert(0, str(_EXPERIMENTS))

import retrieval_eval  # noqa: F401
