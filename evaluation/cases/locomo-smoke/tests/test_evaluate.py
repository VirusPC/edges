from __future__ import annotations

import unittest

from crop import crop_samples
from evaluate import DRY_RUN_ANSWER, DRY_RUN_MODEL, dry_run_evaluate, f1_key, prediction_key
from tests.support import load_tiny_locomo


class DryRunEvaluateTests(unittest.TestCase):
    def test_out_file_matches_upstream_evaluate_qa_schema(self) -> None:
        cropped = crop_samples(load_tiny_locomo())
        out = dry_run_evaluate(cropped)

        self.assertIsInstance(out, list)
        self.assertEqual(len(out), 1)
        sample = out[0]
        self.assertEqual(set(sample.keys()), {"sample_id", "qa"})
        self.assertEqual(sample["sample_id"], "conv-44")
        self.assertEqual(len(sample["qa"]), 9)

        pred = prediction_key(DRY_RUN_MODEL)
        score = f1_key(DRY_RUN_MODEL)
        for qa in sample["qa"]:
            self.assertEqual(qa[pred], DRY_RUN_ANSWER)
            self.assertIn(score, qa)
            self.assertIsInstance(qa[score], float)
            self.assertIn("question", qa)
            self.assertIn("answer", qa)
            self.assertIn("category", qa)

    def test_does_not_call_network(self) -> None:
        cropped = crop_samples(load_tiny_locomo())
        out = dry_run_evaluate(cropped, answerer=lambda *_args, **_kwargs: (_ for _ in ()).throw(
            AssertionError("dry-run must not call the live answerer")
        ))
        self.assertEqual(out[0]["qa"][0][prediction_key(DRY_RUN_MODEL)], DRY_RUN_ANSWER)


if __name__ == "__main__":
    unittest.main()
