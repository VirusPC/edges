"""Legacy hand-port of LoCoMo QA scoring.

**Legacy / port.** New Evaluation Smoke runs should score via the VirusPC/locomo
submodule: `evaluation/run_locomo_official.py` → `task_eval/evaluate_qa.py` →
official `task_eval/evaluation.py`. This module stays so PR #70 reports and
`cases/locomo-smoke` tests remain reproducible.

Faithful port of snap-research/locomo `task_eval/evaluation.py` helpers used by
`eval_question_answering` (F1 / category-5 unanswerable check). Unused imports
from that file (bert_score, rouge) are omitted on purpose.
"""

from __future__ import annotations

import re
import string
from collections import Counter

__all__ = ["eval_question_answering", "f1", "f1_score", "gold_answer", "normalize_answer"]


def gold_answer(qa: dict) -> str:
    """locomo10 cat-5 items store the foil in `adversarial_answer`, not `answer`."""

    if "answer" in qa and qa["answer"] not in (None, ""):
        return str(qa["answer"])
    if qa.get("adversarial_answer") not in (None, ""):
        return str(qa["adversarial_answer"])
    return ""


def normalize_answer(text: str) -> str:
    text = text.replace(",", "")

    def remove_articles(value: str) -> str:
        return re.sub(r"\b(a|an|the|and)\b", " ", value)

    def white_space_fix(value: str) -> str:
        return " ".join(value.split())

    def remove_punc(value: str) -> str:
        exclude = set(string.punctuation)
        return "".join(ch for ch in value if ch not in exclude)

    return white_space_fix(remove_articles(remove_punc(text.lower())))


def f1_score(prediction: str, ground_truth: str) -> float:
    prediction_tokens = [_stem(word) for word in normalize_answer(prediction).split()]
    ground_truth_tokens = [_stem(word) for word in normalize_answer(ground_truth).split()]
    common = Counter(prediction_tokens) & Counter(ground_truth_tokens)
    num_same = sum(common.values())
    if num_same == 0:
        return 0.0
    precision = 1.0 * num_same / len(prediction_tokens)
    recall = 1.0 * num_same / len(ground_truth_tokens)
    return (2 * precision * recall) / (precision + recall)


def f1(prediction: str, ground_truth: str) -> float:
    predictions = [part.strip() for part in prediction.split(",")]
    ground_truths = [part.strip() for part in ground_truth.split(",")]
    return sum(
        max(f1_score(pred, gt) for pred in predictions) for gt in ground_truths
    ) / len(ground_truths)


def eval_question_answering(
    qas: list[dict],
    eval_key: str = "prediction",
    metric: str = "f1",
) -> tuple[list[float], float, list[float]]:
    del metric  # upstream keeps the arg; QA smoke only uses F1 / cat-5.
    all_ems: list[float] = []
    all_recall: list[float] = []
    for index, line in enumerate(qas):
        raw_answer = gold_answer(line)
        answer = raw_answer if isinstance(line[eval_key], list) else str(raw_answer)
        if line["category"] == 3:
            answer = answer.split(";")[0].strip()
        output = line[eval_key]

        if line["category"] in [2, 3, 4]:
            all_ems.append(f1_score(output, answer))
        elif line["category"] in [1]:
            all_ems.append(f1(output, answer))
        elif line["category"] in [5]:
            text = output.lower()
            if "no information available" in text or "not mentioned" in text:
                all_ems.append(1)
            else:
                all_ems.append(0)
        else:
            raise ValueError(f"unknown LoCoMo category: {line['category']}")

        if index + 1 != len(all_ems):
            raise AssertionError(all_ems)

        if eval_key + "_context" in line and len(line["evidence"]) > 0:
            if line[eval_key + "_context"][0].startswith("S"):
                sessions = [item[1:] for item in line[eval_key + "_context"]]
                recall_acc = float(
                    sum(ev.split(":")[0][1:] in sessions for ev in line["evidence"])
                ) / len(line["evidence"])
            else:
                recall_acc = float(
                    sum(ev in line[eval_key + "_context"] for ev in line["evidence"])
                ) / len(line["evidence"])
            all_recall.append(recall_acc)
        else:
            all_recall.append(1)

    return all_ems, 0.0, all_recall


def _stem(word: str) -> str:
    try:
        from nltk.stem import PorterStemmer

        return PorterStemmer().stem(word)
    except ImportError:
        return _porter_stem(word)


def _porter_stem(word: str) -> str:
    """Small Porter stemmer so dry-run scoring works without vendoring nltk."""

    word = word.lower()
    if len(word) <= 2:
        return word

    def measure(value: str) -> int:
        pattern = 0
        prev_vowel = False
        count = 0
        for char in value:
            is_vowel = char in "aeiou" or (char == "y" and not prev_vowel and pattern > 0)
            if not is_vowel and prev_vowel:
                count += 1
            prev_vowel = is_vowel
            pattern += 1
        return count

    def has_vowel(value: str) -> bool:
        return any(ch in "aeiou" or (ch == "y" and i > 0) for i, ch in enumerate(value))

    def stem_from(suffix: str, replacement: str, minimum: int = 0) -> bool:
        nonlocal word
        if word.endswith(suffix) and measure(word[: -len(suffix)]) > minimum:
            word = word[: -len(suffix)] + replacement
            return True
        return False

    if word.endswith("sses"):
        word = word[:-2]
    elif word.endswith("ies"):
        word = word[:-2]
    elif word.endswith("ss"):
        pass
    elif word.endswith("s"):
        word = word[:-1]

    if word.endswith("eed"):
        if measure(word[:-3]) > 0:
            word = word[:-1]
    elif word.endswith("ed"):
        stem = word[:-2]
        if has_vowel(stem):
            word = stem
            if word.endswith(("at", "bl", "iz")):
                word += "e"
            elif len(word) >= 2 and word[-1] == word[-2] and word[-1] not in "aeiou":
                word = word[:-1]
    elif word.endswith("ing"):
        stem = word[:-3]
        if has_vowel(stem):
            word = stem
            if word.endswith(("at", "bl", "iz")):
                word += "e"
            elif len(word) >= 2 and word[-1] == word[-2] and word[-1] not in "aeiou":
                word = word[:-1]

    if word.endswith("y") and has_vowel(word[:-1]):
        word = word[:-1] + "i"

    for suffix, replacement in (
        ("ational", "ate"),
        ("tional", "tion"),
        ("enci", "ence"),
        ("anci", "ance"),
        ("izer", "ize"),
        ("abli", "able"),
        ("alli", "al"),
        ("entli", "ent"),
        ("eli", "e"),
        ("ousli", "ous"),
        ("ization", "ize"),
        ("ation", "ate"),
        ("ator", "ate"),
        ("alism", "al"),
        ("iveness", "ive"),
        ("fulness", "ful"),
        ("ousness", "ous"),
        ("aliti", "al"),
        ("iviti", "ive"),
        ("biliti", "ble"),
    ):
        if stem_from(suffix, replacement, 0):
            break

    for suffix, replacement in (
        ("icate", "ic"),
        ("ative", ""),
        ("alize", "al"),
        ("iciti", "ic"),
        ("ical", "ic"),
        ("ful", ""),
        ("ness", ""),
    ):
        if stem_from(suffix, replacement, 0):
            break

    for suffix in (
        "al",
        "ance",
        "ence",
        "er",
        "ic",
        "able",
        "ible",
        "ant",
        "ement",
        "ment",
        "ent",
        "ion",
        "ou",
        "ism",
        "ate",
        "iti",
        "ous",
        "ive",
        "ize",
    ):
        if word.endswith(suffix) and measure(word[: -len(suffix)]) > 1:
            if suffix == "ion":
                stem = word[:-3]
                if stem.endswith(("s", "t")):
                    word = stem
            else:
                word = word[: -len(suffix)]
            break

    if word.endswith("e") and measure(word[:-1]) > 1:
        word = word[:-1]
    elif word.endswith("e") and measure(word[:-1]) == 1:
        stem = word[:-1]
        if not (
            len(stem) >= 3
            and stem[-1] not in "aeiouwxy"
            and stem[-2] in "aeiou"
            and stem[-3] not in "aeiou"
        ):
            word = stem

    if word.endswith("ll") and measure(word) > 1:
        word = word[:-1]
    return word
