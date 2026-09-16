from __future__ import annotations

import unittest

from support import load_tiny_locomo

from baseline import live_evaluate
from crop import crop_samples
from evaluate import f1_key, prediction_key


class BaselineTests(unittest.TestCase):
    def test_live_evaluate_uses_completer_and_keeps_upstream_schema(self) -> None:
        cropped = crop_samples(load_tiny_locomo())
        calls: list[str] = []

        def completer(*, prompt: str, model: str, api_key: str, base_url: str) -> str:
            calls.append(prompt)
            self.assertEqual(model, "kimi-for-coding")
            self.assertEqual(api_key, "test-key")
            self.assertEqual(base_url, "https://api.kimi.com/coding/v1")
            self.assertIn("Andrew said", prompt)
            return "No information available"

        out = live_evaluate(
            cropped,
            model="kimi-for-coding",
            api_key="test-key",
            base_url="https://api.kimi.com/coding/v1",
            completer=completer,
        )
        self.assertEqual(len(calls), 9)
        self.assertEqual(out[0]["sample_id"], "conv-44")
        self.assertEqual(set(out[0].keys()), {"sample_id", "qa"})
        pred = prediction_key("kimi-for-coding")
        score = f1_key("kimi-for-coding")
        for qa in out[0]["qa"]:
            self.assertEqual(qa[pred], "No information available")
            self.assertIn(score, qa)
        cat5 = [qa[score] for qa in out[0]["qa"] if qa["category"] == 5]
        self.assertEqual(cat5, [1.0, 1.0])


if __name__ == "__main__":
    unittest.main()
