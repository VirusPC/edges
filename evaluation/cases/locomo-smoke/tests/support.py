from __future__ import annotations

import json
import sys
from pathlib import Path

CASE_DIR = Path(__file__).resolve().parents[1]
if str(CASE_DIR) not in sys.path:
    sys.path.insert(0, str(CASE_DIR))

FIXTURE_PATH = Path(__file__).resolve().parent / "fixtures" / "tiny_locomo.json"


def load_tiny_locomo() -> list[dict]:
    return json.loads(FIXTURE_PATH.read_text(encoding="utf-8"))
