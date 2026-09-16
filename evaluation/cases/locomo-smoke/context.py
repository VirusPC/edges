"""Truncated-context builder matching locomo `task_eval/gpt_utils.py`."""

from __future__ import annotations

from typing import Any

CONV_START_PROMPT = (
    "Below is a conversation between two people: {} and {}. The conversation "
    "takes place over multiple days and the date of each conversation is "
    "wriiten at the beginning of the conversation.\n\n"
)

QA_PROMPT = (
    "Based on the above context, write an answer in the form of a short phrase "
    "for the following question. Answer with exact words from the context "
    "whenever possible.\n\nQuestion: {} Short answer:\n"
)

QA_PROMPT_CAT_5 = (
    "Based on the above context, answer the following question.\n\n"
    "Question: {} Short answer:\n"
)


def estimate_tokens(text: str) -> int:
    return max(1, len(text) // 4)


def speakers_of(conversation: dict[str, Any]) -> tuple[str, str]:
    session = conversation.get("session_1") or []
    names = list({turn.get("speaker", "") for turn in session if turn.get("speaker")})
    if len(names) >= 2:
        return names[0], names[1]
    speaker_a = conversation.get("speaker_a") or "Speaker A"
    speaker_b = conversation.get("speaker_b") or "Speaker B"
    return str(speaker_a), str(speaker_b)


def build_truncated_context(
    conversation: dict[str, Any],
    *,
    question_tokens: int = 80,
    max_tokens: int = 128_000,
) -> str:
    """Fill from the earliest session, same walk as upstream get_input_context."""

    speaker_a, speaker_b = speakers_of(conversation)
    start_prompt = CONV_START_PROMPT.format(speaker_a, speaker_b)
    query_conv = ""
    session_nums = [
        int(key.split("_")[-1])
        for key in conversation
        if key.startswith("session_") and "date_time" not in key
    ]
    if not session_nums:
        return start_prompt

    stop = False
    for index in range(min(session_nums), max(session_nums) + 1):
        session_key = f"session_{index}"
        if session_key not in conversation:
            continue
        for dialog in conversation[session_key][::-1]:
            turn = f"{dialog['speaker']} said, \"{dialog['text']}\"\n"
            if dialog.get("blip_caption"):
                turn += f" and shared {dialog['blip_caption']}.\n"
            turn += "\n"
            date = conversation.get(f"{session_key}_date_time", "")
            probe = f"DATE: {date}\nCONVERSATION:\n{turn}"
            if (
                estimate_tokens(probe)
                + estimate_tokens(query_conv)
                + question_tokens
                + estimate_tokens(start_prompt)
                < max_tokens
            ):
                query_conv = turn + query_conv
            else:
                stop = True
                break
        date = conversation.get(f"{session_key}_date_time", "")
        query_conv = f"DATE: {date}\nCONVERSATION:\n{query_conv}"
        if stop:
            break
    return start_prompt + query_conv


def build_question_prompt(qa: dict[str, Any]) -> str:
    question = qa["question"]
    if qa.get("category") == 2:
        question = question + " Use DATE of CONVERSATION to answer with an approximate date."
    elif qa.get("category") == 5:
        question = (
            question
            + " Select the correct answer: (a) Not mentioned in the conversation (b) "
            + str(qa.get("answer") or "the stated option")
            + "."
        )
        return QA_PROMPT_CAT_5.format(question)
    return QA_PROMPT.format(question)
