from __future__ import annotations

import unittest

from support import load_tiny_locomo

from crop import crop_samples
from evaluate import DRY_RUN_MODEL, dry_run_evaluate
from report import render_report


class ReportTests(unittest.TestCase):
    def test_smoke_report_states_scope_and_reproduce_commands(self) -> None:
        out = dry_run_evaluate(crop_samples(load_tiny_locomo()))
        text = render_report(
            out_samples=out,
            mode="dry-run",
            model=DRY_RUN_MODEL,
            subset="conv-44; first 2 QA per category 1-5 in file order",
            command="python3 evaluation/cases/locomo-smoke/run.py dry-run",
            real_command="KIMI_API_KEY=... python3 evaluation/cases/locomo-smoke/run.py baseline",
        )
        self.assertIn("Evaluation Smoke", text)
        self.assertIn("not Benchmark Proof", text)
        self.assertIn("SUT", text)
        self.assertIn("upstream locomo", text.lower())
        self.assertIn("conv-44", text)
        self.assertIn(DRY_RUN_MODEL, text)
        self.assertIn("dry-run", text)
        self.assertIn("python3 evaluation/cases/locomo-smoke/run.py dry-run", text)
        self.assertIn("run.py baseline", text)
        self.assertIn("0008-evaluation-smoke-is-not-benchmark-proof.md", text)
        self.assertNotIn("Project Memory is effective", text)
        self.assertIn("Do not cite", text)


if __name__ == "__main__":
    unittest.main()
