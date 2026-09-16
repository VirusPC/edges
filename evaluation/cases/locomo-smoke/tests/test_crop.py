from __future__ import annotations

import unittest
from collections import Counter

from tests.support import load_tiny_locomo

from crop import SAMPLE_ID, crop_samples


class CropTests(unittest.TestCase):
    def test_keeps_only_conv44_and_first_two_qa_per_category(self) -> None:
        cropped = crop_samples(load_tiny_locomo())

        self.assertEqual(len(cropped), 1)
        sample = cropped[0]
        self.assertEqual(sample["sample_id"], SAMPLE_ID)
        questions = [qa["question"] for qa in sample["qa"]]
        self.assertEqual(
            questions,
            [
                "c2 first in file",
                "c1 first",
                "c1 second",
                "c2 second",
                "c3 only one",
                "c4 first",
                "c4 second",
                "c5 first",
                "c5 second",
            ],
        )
        self.assertEqual(
            Counter(qa["category"] for qa in sample["qa"]),
            {1: 2, 2: 2, 3: 1, 4: 2, 5: 2},
        )

    def test_keeps_conversation_and_drops_rag_side_payloads(self) -> None:
        sample = crop_samples(load_tiny_locomo())[0]
        self.assertIn("conversation", sample)
        self.assertIn("session_1", sample["conversation"])
        self.assertNotIn("observation", sample)
        self.assertNotIn("session_summary", sample)
        self.assertNotIn("event_summary", sample)

    def test_missing_sample_raises(self) -> None:
        with self.assertRaises(ValueError):
            crop_samples([{"sample_id": "conv-1", "qa": []}])


if __name__ == "__main__":
    unittest.main()
