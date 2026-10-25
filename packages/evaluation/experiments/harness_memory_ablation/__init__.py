"""Harness memory ablation: local worktrees × memory on/off × free-form cases.

Importing this package imports `retrieval_eval`, which puts
`packages/observation` on `sys.path`. `langfuse_sink` is not installed.
Other experiments should take the agent client from `shared.agent_client`.
"""

from __future__ import annotations

import retrieval_eval  # noqa: F401
