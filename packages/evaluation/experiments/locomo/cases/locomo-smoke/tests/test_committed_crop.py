from __future__ import annotations

import json
import unittest
from collections import Counter
from pathlib import Path

from support import CASE_DIR


class CommittedCropTests(unittest.TestCase):
    def test_committed_crop_is_conv44_with_two_qa_per_category(self) -> None:
        path = CASE_DIR / "data" / "locomo10-conv44-smoke.json"
        self.assertTrue(path.is_file(), path)
        samples = json.loads(path.read_text(encoding="utf-8"))
        self.assertEqual(len(samples), 1)
        self.assertEqual(samples[0]["sample_id"], "conv-44")
        qa = samples[0]["qa"]
        self.assertEqual(len(qa), 10)
        self.assertEqual(Counter(item["category"] for item in qa), {1: 2, 2: 2, 3: 2, 4: 2, 5: 2})
        self.assertIn("conversation", samples[0])
        self.assertNotIn("observation", samples[0])
        for item in qa:
            if item["category"] == 5:
                self.assertIn("adversarial_answer", item)
            else:
                self.assertIn("answer", item)
