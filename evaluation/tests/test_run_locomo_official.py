from __future__ import annotations

import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

EVAL_DIR = Path(__file__).resolve().parents[1]
REPO_ROOT = EVAL_DIR.parent
WRAPPER = EVAL_DIR / "run_locomo_official.py"
LOCOMO_ROOT = EVAL_DIR / "third_party" / "locomo"
FIXTURE_PATH = Path(__file__).resolve().parent / "fixtures" / "tiny_locomo_with_rag.json"

if str(EVAL_DIR) not in sys.path:
    sys.path.insert(0, str(EVAL_DIR))


class OfficialCommandTests(unittest.TestCase):
    def test_evaluate_command_calls_submodule_evaluate_qa(self) -> None:
        from run_locomo_official import build_evaluate_command

        command = build_evaluate_command(
            data_file=LOCOMO_ROOT / "data" / "locomo10.json",
            out_file=EVAL_DIR / "reports" / "out.json",
            model="kimi-for-coding",
            sample_id="conv-44",
            qa_per_category=2,
        )
        joined = " ".join(command)
        self.assertIn(str(LOCOMO_ROOT / "task_eval" / "evaluate_qa.py"), joined)
        self.assertIn("--sample-id", command)
        self.assertIn("conv-44", command)
        self.assertIn("--qa-per-category", command)
        self.assertIn("2", command)
        self.assertIn("kimi-for-coding", command)
        self.assertNotIn("evaluation/cases/locomo-smoke", joined)


class OfficialReportTests(unittest.TestCase):
    def test_report_is_evaluation_smoke_not_project_memory_proof(self) -> None:
        from run_locomo_official import render_official_report

        out_samples = [
            {
                "sample_id": "conv-44",
                "qa": [
                    {
                        "question": "Which year?",
                        "answer": "2020",
                        "category": 2,
                        "kimi-for-coding_prediction": "2020",
                        "kimi-for-coding_f1": 1.0,
                    }
                ],
            }
        ]
        text = render_official_report(
            out_samples=out_samples,
            model="kimi-for-coding",
            subset="conv-44; first 2 QA per category 1-5 in file order",
            command="python3 evaluation/run_locomo_official.py print-command",
            real_command=(
                "KIMI_API_KEY=... OPENAI_BASE_URL=https://api.kimi.com/coding/v1 "
                "python3 evaluation/run_locomo_official.py smoke"
            ),
        )
        self.assertIn("Evaluation Smoke", text)
        self.assertIn("not Benchmark Proof", text)
        self.assertIn("not Project Memory proof", text)
        self.assertIn("task_eval/evaluate_qa.py", text)
        self.assertIn("evaluation.py", text)
        self.assertIn("0008-evaluation-smoke-is-not-benchmark-proof.md", text)
        self.assertIn("VirusPC/locomo", text)
        self.assertNotIn("Project Memory is effective", text)
        self.assertIn("Do not cite", text)


class OfficialCliTests(unittest.TestCase):
    def test_print_command_exits_zero_without_api_key(self) -> None:
        env = {
            key: value
            for key, value in os.environ.items()
            if key not in {"KIMI_API_KEY", "OPENAI_API_KEY", "OPENAI_BASE_URL"}
        }
        completed = subprocess.run(
            [sys.executable, str(WRAPPER), "print-command"],
            check=False,
            capture_output=True,
            text=True,
            cwd=str(REPO_ROOT),
            env=env,
        )
        self.assertEqual(
            completed.returncode,
            0,
            msg=completed.stdout + "\n" + completed.stderr,
        )
        body = completed.stdout
        self.assertIn("task_eval/evaluate_qa.py", body)
        self.assertIn("conv-44", body)
        self.assertIn("--qa-per-category 2", body)
        self.assertIn("kimi-for-coding", body)
        self.assertIn("Evaluation Smoke", body)
        self.assertIn("not Project Memory proof", body)

    def test_smoke_without_api_key_exits_nonzero(self) -> None:
        env = {
            key: value
            for key, value in os.environ.items()
            if key not in {"KIMI_API_KEY", "OPENAI_API_KEY"}
        }
        completed = subprocess.run(
            [sys.executable, str(WRAPPER), "smoke", "--date", "2026-09-16"],
            check=False,
            capture_output=True,
            text=True,
            cwd=str(REPO_ROOT),
            env=env,
        )
        self.assertEqual(completed.returncode, 2, msg=completed.stdout + "\n" + completed.stderr)
        self.assertIn("KIMI_API_KEY", completed.stderr)


class OfficialCropTests(unittest.TestCase):
    def test_official_crop_keeps_rag_fields(self) -> None:
        self.assertTrue(FIXTURE_PATH.is_file(), FIXTURE_PATH)
        with tempfile.TemporaryDirectory() as tmp:
            dest = Path(tmp) / "cropped.json"
            completed = subprocess.run(
                [
                    sys.executable,
                    str(WRAPPER),
                    "crop",
                    "--data-file",
                    str(FIXTURE_PATH),
                    "--cropped-file",
                    str(dest),
                ],
                check=False,
                capture_output=True,
                text=True,
                cwd=str(REPO_ROOT),
            )
            self.assertEqual(
                completed.returncode,
                0,
                msg=completed.stdout + "\n" + completed.stderr,
            )
            samples = json.loads(dest.read_text(encoding="utf-8"))
            self.assertEqual(len(samples), 1)
            self.assertEqual(samples[0]["sample_id"], "conv-44")
            self.assertIn("observation", samples[0])
            self.assertIn("session_summary", samples[0])
            self.assertIn("event_summary", samples[0])
            self.assertIn("conversation", samples[0])
            self.assertEqual(len(samples[0]["qa"]), 9)


if __name__ == "__main__":
    unittest.main()
