from __future__ import annotations

import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

from support import CASE_DIR, FIXTURE_PATH


class RunCliTests(unittest.TestCase):
    def test_dry_run_exits_zero_and_writes_report_and_out_json(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            reports = tmp_path / "reports"
            data_out = tmp_path / "cropped.json"
            env = {
                key: value
                for key, value in os.environ.items()
                if key not in {"KIMI_API_KEY", "OPENAI_API_KEY", "OPENAI_BASE_URL"}
            }
            completed = subprocess.run(
                [
                    sys.executable,
                    str(CASE_DIR / "run.py"),
                    "dry-run",
                    "--data-file",
                    str(FIXTURE_PATH),
                    "--reports-dir",
                    str(reports),
                    "--cropped-file",
                    str(data_out),
                    "--date",
                    "2026-09-16",
                ],
                check=False,
                capture_output=True,
                text=True,
                env=env,
            )
            self.assertEqual(
                completed.returncode,
                0,
                msg=completed.stdout + "\n" + completed.stderr,
            )
            report = reports / "2026-09-16-locomo-smoke-dry-run.md"
            out_json = reports / "2026-09-16-locomo-smoke-dry-run.json"
            self.assertTrue(report.is_file(), report)
            self.assertTrue(out_json.is_file(), out_json)
            payload = json.loads(out_json.read_text(encoding="utf-8"))
            self.assertEqual(payload[0]["sample_id"], "conv-44")
            self.assertEqual(len(payload[0]["qa"]), 9)
            self.assertIn("dummy_prediction", payload[0]["qa"][0])
            self.assertIn("dummy_f1", payload[0]["qa"][0])
            body = report.read_text(encoding="utf-8")
            self.assertIn("Evaluation Smoke", body)
            self.assertIn("not Benchmark Proof", body)


if __name__ == "__main__":
    unittest.main()
