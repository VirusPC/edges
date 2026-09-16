from __future__ import annotations

import json
import sys
from pathlib import Path

CASE_DIR = Path(__file__).resolve().parents[1]
TESTS_DIR = Path(__file__).resolve().parent
for _path in (CASE_DIR, TESTS_DIR):
    if str(_path) not in sys.path:
        sys.path.insert(0, str(_path))

FIXTURE_PATH = TESTS_DIR / "fixtures" / "tiny_locomo.json"


def load_tiny_locomo() -> list[dict]:
    return json.loads(FIXTURE_PATH.read_text(encoding="utf-8"))
