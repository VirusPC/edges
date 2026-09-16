from __future__ import annotations

import unittest

from support import CASE_DIR  # noqa: F401  # puts case dir on sys.path

from scoring import eval_question_answering, f1_score, gold_answer


class ScoringTests(unittest.TestCase):
    def test_exact_phrase_is_full_f1(self) -> None:
        self.assertEqual(f1_score("Eagles", "Eagles"), 1.0)

    def test_category_5_accepts_official_unanswerable_phrases(self) -> None:
        qas = [
            {
                "question": "adversarial",
                "adversarial_answer": "Eagles",
                "category": 5,
                "evidence": [],
                "dummy_prediction": "No information available",
            },
            {
                "question": "adversarial 2",
                "answer": "",
                "category": 5,
                "evidence": [],
                "dummy_prediction": "something mentioned in passing",
            },
        ]
        scores, _lens, recall = eval_question_answering(qas, "dummy_prediction")
        self.assertEqual(scores, [1, 0])
        self.assertEqual(recall, [1, 1])

    def test_gold_answer_falls_back_to_adversarial_answer(self) -> None:
        self.assertEqual(
            gold_answer({"category": 5, "adversarial_answer": "Eagles"}),
            "Eagles",
        )

    def test_category_2_uses_single_span_f1(self) -> None:
        qas = [
            {
                "question": "year",
                "answer": "2020",
                "category": 2,
                "evidence": [],
                "dummy_prediction": "2020",
            }
        ]
        scores, _lens, _recall = eval_question_answering(qas, "dummy_prediction")
        self.assertEqual(scores, [1.0])


if __name__ == "__main__":
    unittest.main()
