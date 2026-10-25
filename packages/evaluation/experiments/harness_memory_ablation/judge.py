"""Optional LLM-as-judge. The answer path does not use this client.

`skip` records tokens and latency and leaves quality unscored.
`llm` posts one chat completion with the question, the answer, and the
case criteria. It does not attach memory files.
"""

from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from collections.abc import Callable, Mapping, Sequence
from dataclasses import dataclass
from typing import Any


class JudgeError(RuntimeError):
    """The judge response or its configuration cannot be used."""


@dataclass(frozen=True)
class JudgeResult:
    verdict: str
    violations: list[str]


_VERDICTS = frozenset({"correct", "partial", "incorrect"})


class SkipJudge:
    """No quality score. Token and latency gates can still be computed."""

    def score(
        self,
        *,
        question: str,
        answer: str,
        criteria: Sequence[str],
        violations: Sequence[str],
    ) -> None:
        return None


class OpenAICompatJudge:
    """One chat completion. Credentials stay in the process environment."""

    def __init__(
        self,
        *,
        base_url: str,
        api_key: str,
        model: str,
        opener: Callable[..., Any] | None = None,
        timeout: float = 60.0,
    ) -> None:
        if not base_url.strip() or not api_key.strip() or not model.strip():
            raise JudgeError("missing environment variable JUDGE_BASE_URL, JUDGE_API_KEY, JUDGE_MODEL")
        self._base_url = base_url.rstrip("/")
        self._api_key = api_key
        self._model = model
        self._opener = opener or urllib.request.urlopen
        self._timeout = timeout

    def score(
        self,
        *,
        question: str,
        answer: str,
        criteria: Sequence[str],
        violations: Sequence[str],
    ) -> JudgeResult:
        body = {
            "model": self._model,
            "temperature": 0,
            "messages": [
                {"role": "system", "content": _SYSTEM},
                {
                    "role": "user",
                    "content": _user_prompt(question, answer, criteria, violations),
                },
            ],
        }
        request = urllib.request.Request(
            f"{self._base_url}/chat/completions",
            data=json.dumps(body, ensure_ascii=False).encode("utf-8"),
            method="POST",
            headers={
                "Authorization": f"Bearer {self._api_key}",
                "Content-Type": "application/json",
            },
        )
        try:
            with self._opener(request, timeout=self._timeout) as response:
                raw = response.read()
        except urllib.error.HTTPError as exc:
            raise JudgeError(f"HTTP {exc.code}") from exc
        except Exception as exc:
            raise JudgeError(type(exc).__name__) from exc
        try:
            payload = json.loads(raw.decode("utf-8"))
            content = payload["choices"][0]["message"]["content"]
        except (KeyError, IndexError, TypeError, json.JSONDecodeError, UnicodeDecodeError) as exc:
            raise JudgeError("judge response is not chat json") from exc
        if not isinstance(content, str):
            raise JudgeError("judge response is not chat json")
        return parse_judge_payload(content)


def judge_from_flag(flag: str, environ: Mapping[str, str] | None = None) -> SkipJudge | OpenAICompatJudge:
    """`skip`, or `llm` when JUDGE_BASE_URL, JUDGE_API_KEY, and JUDGE_MODEL are set."""
    if flag == "skip":
        return SkipJudge()
    if flag != "llm":
        raise JudgeError(f"unknown judge {flag}")
    env = os.environ if environ is None else environ
    missing = [
        name
        for name in ("JUDGE_BASE_URL", "JUDGE_API_KEY", "JUDGE_MODEL")
        if not (env.get(name) or "").strip()
    ]
    if missing:
        raise JudgeError("missing environment variable " + ", ".join(missing))
    return OpenAICompatJudge(
        base_url=env["JUDGE_BASE_URL"],
        api_key=env["JUDGE_API_KEY"],
        model=env["JUDGE_MODEL"],
    )


def parse_judge_payload(text: str) -> JudgeResult:
    """Last JSON object with `verdict` and `violations`."""
    for candidate in reversed(_objects(text)):
        try:
            obj = json.loads(candidate)
        except json.JSONDecodeError:
            continue
        if not isinstance(obj, dict) or "verdict" not in obj:
            continue
        verdict = obj.get("verdict")
        if verdict not in _VERDICTS:
            raise JudgeError("verdict must be correct, partial, or incorrect")
        raw = obj.get("violations", [])
        if not isinstance(raw, list) or not all(isinstance(item, str) for item in raw):
            raise JudgeError("violations must be a list of strings")
        return JudgeResult(verdict, raw)
    raise JudgeError("no judge json found")


def _objects(text: str) -> list[str]:
    found: list[str] = []
    start: int | None = None
    depth = 0
    in_string = False
    escape = False
    for index, char in enumerate(text):
        if in_string:
            if escape:
                escape = False
            elif char == "\\":
                escape = True
            elif char == '"':
                in_string = False
            continue
        if char == '"':
            in_string = True
            continue
        if char == "{":
            if depth == 0:
                start = index
            depth += 1
        elif char == "}" and depth:
            depth -= 1
            if depth == 0 and start is not None:
                found.append(text[start : index + 1])
                start = None
    return found


_SYSTEM = (
    "你是判分器。只根据给出的判对要点和违反项给回答打分。"
    "不要补充仓库文件，也不要假设自己读过记忆正文。"
    "只输出一个 JSON 对象，不要代码围栏："
    '{"verdict":"correct|partial|incorrect","violations":["命中的违反项"]}'
    "。verdict 为 correct 仅当要点都覆盖且结论不相反。"
    "partial 与 incorrect 都不是 correct。violations 只列被回答触碰的违反项，没有则是空数组。"
)


def _user_prompt(
    question: str,
    answer: str,
    criteria: Sequence[str],
    violations: Sequence[str],
) -> str:
    criteria_lines = "\n".join(f"- {item}" for item in criteria) or "- （无）"
    violation_lines = "\n".join(f"- {item}" for item in violations) or "- （无）"
    return (
        f"问题：{question}\n\n"
        f"回答：{answer}\n\n"
        f"判对要点：\n{criteria_lines}\n\n"
        f"违反项：\n{violation_lines}\n"
    )
