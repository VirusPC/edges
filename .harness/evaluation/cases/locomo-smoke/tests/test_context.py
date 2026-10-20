from __future__ import annotations

import unittest

from support import CASE_DIR  # noqa: F401

from context import build_question_prompt, map_cat5_prediction


class ContextTests(unittest.TestCase):
    def test_cat5_prompt_uses_adversarial_answer(self) -> None:
        prompt = build_question_prompt(
            {
                "question": "Which bird mesmerizes Audrey?",
                "category": 5,
                "adversarial_answer": "Eagles",
            }
        )
        self.assertIn("(a) Not mentioned in the conversation", prompt)
        self.assertIn("(b) Eagles", prompt)
        self.assertNotIn("the stated option", prompt)

    def test_map_cat5_letter_to_official_unanswerable_phrase(self) -> None:
        self.assertEqual(map_cat5_prediction("(a)"), "Not mentioned in the conversation")
        self.assertEqual(map_cat5_prediction("a"), "Not mentioned in the conversation")
        self.assertEqual(map_cat5_prediction("Eagles"), "Eagles")
