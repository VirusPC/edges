"""Independently check the public synthetic-scenes-v1 templates and frozen inputs.

This is a template-constrained parser, not a general semantic proof. Expected
documents are resolved from visible Chinese bodies and questions without using
scene_truth, generator/oracle functions, gold, or reference answers. Stored gold
and answers are checked only after resolution. No model is invoked.
"""
from __future__ import annotations

import argparse
import ast
from collections import Counter, defaultdict
from datetime import datetime
import hashlib
import json
from pathlib import Path, PurePosixPath
import re
import sys


HERE = Path(__file__).resolve().parent
GENERATOR = "synthetic-scenes-v1"
PARSER_VERSION = 1
TOPICS = ("发布门槛", "留存期限", "回退条件", "归档规则", "通知时限")
PRECEDENCE = (
    "适用规则：目录规则覆盖自身及子目录；同主题存在已生效的更深层规则时，以更深层为准。"
    "同一层若有多个版本，以当前生效区间内起始时间最新者为准。"
    "其他业务、兄弟目录和未请求的主题不能据此推断。"
)
BODY_PATTERN = (
    r"虚构业务：(?P<label>[^。\n]+)。主题：(?P<topic>[^。\n]+)。\n\n"
    r"适用目录：(?P<scope>[^；\n]+)；适用对象：(?P<audience>[^。\n]+)。"
    r"根目录的有条件规则也只能用于列明的对象。\n" + re.escape(PRECEDENCE) +
    r"\n\n版本有效期：从 (?P<start>[^（\n]+)（含）至 (?P<end>[^（\n]+)（不含，若未设则持续）。"
    r"此记录在 (?P<available>[^ \n]+) 才可获得；在这之前不得据此回答。\n\n"
    r"规定：(?P<value>[^\n]+)。\n"
)
QUESTION_PATTERNS = {
    "local": r"(?P<first>[^。]+)的结算服务准备做本月发布。请核对适用的发布门槛，以及原始记录和摘要的留存期限。",
    "override": r"请为(?P<first>[^。]+)结算服务整理执行前约定：发布要满足什么门槛，记录保留多久，失败时按什么条件回退？若上层与服务自己的规定不同，说明此刻适用的规则。",
    "cross_scope": r"(?P<first>[^。]+)准备与(?P<second>[^。]+)联动。本次只核对前者的发布门槛，以及后者负责的记录留存期限和回退条件，整理执行前需要遵守的约定。",
    "global": r"本次复核(?P<first>[^。]+)的统一行政约定：复核记录怎样归档、保留多久，异常确认后应在多长时间内通知？",
    "negative": r"(?P<first>[^。]+)在准备活动物料：每箱装 (?P<per_box>\d+) 件，共有 (?P<boxes>\d+) 箱，一共有多少件？",
}
VALUE_PATTERNS = {
    "发布门槛": r"观察至少 \d+ 分钟，且错误计数不超过 \d+ 次",
    "留存期限": r"业务流水的原始记录保留 \d+ 天，业务摘要保留 \d+ 天",
    "回退条件": r"连续 \d+ 个检查窗口失败时回退，并恢复最近 \d+ 份快照中的最后一份通过校验者",
    "归档规则": r"复核记录按月归档，保留 \d+ 个月",
    "通知时限": r"异常确认后 \d+ 分钟内通知值班协调员",
}


class ReviewError(ValueError):
    """A stable public diagnostic; never embeds input paths or document contents."""


def require(condition: bool, message: str) -> None:
    if not condition:
        raise ReviewError(message)


def digest(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def instant(value: str) -> datetime:
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    require(parsed.tzinfo is not None, "timestamp lacks timezone")
    return parsed


def scope(value: str) -> str:
    path = PurePosixPath(value)
    require(bool(value) and not path.is_absolute() and ".." not in path.parts
            and "\\" not in value and str(path) == value, "invalid relative scope")
    return value


def is_ancestor(owner: str, target: str) -> bool:
    return owner == "." or target == owner or target.startswith(owner + "/")


def parse_question(question: str) -> tuple[str, dict, list[tuple[str, str]]]:
    matches = [(family, re.fullmatch(pattern, question)) for family, pattern in QUESTION_PATTERNS.items()]
    matches = [(family, match) for family, match in matches if match]
    require(len(matches) == 1, "question does not match exactly one supported v1 template")
    family, match = matches[0]
    parts = match.groupdict()
    first = parts["first"]
    requests = {
        "local": [(first, topic) for topic in TOPICS[:2]],
        "override": [(first, topic) for topic in TOPICS[:3]],
        "cross_scope": [(first, "发布门槛"), (parts.get("second"), "留存期限"), (parts.get("second"), "回退条件")],
        "global": [(first, "归档规则"), (first, "通知时限")],
        "negative": [],
    }[family]
    return family, parts, requests


def review_data(data: dict) -> dict:
    """Pure semantic check; usable for new seeds without rewriting frozen files."""
    require(data.get("schema_version") == 1 and data.get("source", {}).get("kind") == "synthetic"
            and data["source"].get("generator") == GENERATOR, "unsupported dataset provenance or version")
    memories, cases = data["memories"], data["cases"]
    require(bool(memories) and bool(cases), "empty corpus or cases")
    parsed, memory_ids, case_ids = [], set(), set()
    label_scopes = defaultdict(set)
    for memory in memories:
        mid = memory["memory_id"]
        require(re.fullmatch(r"m-[0-9a-f]{24}", mid) is not None and mid not in memory_ids,
                "invalid or duplicate synthetic memory identity")
        require(memory.get("source", {}).get("kind") == "synthetic", "non-synthetic memory")
        memory_ids.add(mid)
        match = re.fullmatch(BODY_PATTERN, memory["body"])
        require(match is not None, "body does not match the supported v1 template")
        row = match.groupdict()
        require(row["topic"] in TOPICS and re.fullmatch(VALUE_PATTERNS[row["topic"]], row["value"]) is not None,
                "body policy does not match its declared topic")
        require(scope(row["scope"]) == memory["scope"] and row["available"] == memory["available_at"]
                and row["topic"] + "约定" == memory["title"], "body/metadata mismatch")
        row.update(mid=mid, available=instant(row["available"]), start=instant(row["start"]),
                   end=None if row["end"] == "未设结束时间" else instant(row["end"]))
        require(row["end"] is None or row["start"] < row["end"], "invalid effective interval")
        parsed.append(row)
        if row["scope"] != ".":
            label_scopes[row["label"]].add(row["scope"])
    entity_scope = {}
    for label, scopes in label_scopes.items():
        deepest = max(scopes, key=lambda path: len(PurePosixPath(path).parts))
        require(all(is_ancestor(path, deepest) for path in scopes), "business has ambiguous non-root scope")
        entity_scope[label] = deepest
    split_labels, source_sessions = defaultdict(set), {}
    matrix, visible_counts, facts_checked = Counter(), set(), 0
    for case in cases:
        cid = case["case_id"]
        require(re.fullmatch(r"syn-[0-9a-f]{24}", cid) is not None and cid not in case_ids,
                "invalid or duplicate synthetic case identity")
        case_ids.add(cid)
        require(case.get("source", {}).get("kind") == "synthetic", "non-synthetic case")
        split = case["split"]
        require(split in {"dev", "test"}, "unsupported split")
        session = case["source"]["session_id"]
        require(re.fullmatch(r"session-[0-9a-f]{24}", session) is not None, "invalid synthetic source session")
        require(session not in source_sessions or source_sessions[session] == split, "source session crosses splits")
        source_sessions[session] = split
        question, when = case["question"], instant(case["query_at"])
        require(not any(mid in question for mid in memory_ids)
                and re.search(r"(?:memory-|rule-|entity-|\.md|services/|gold)", question) is None,
                "question leaks a memory identity or path")
        family, parts, requests = parse_question(question)
        require(family == case["scenario_family"], "family disagrees with the question")
        labels = {parts["first"]} | {label for label, _ in requests}
        require(labels <= entity_scope.keys(), "question names a business with no known scope")
        split_labels[split].update(labels)
        allowed_scopes = {entity_scope[parts["first"]]} | ({"."} if family == "global" else set())
        require(scope(case["scope"]) in allowed_scopes, "current scope disagrees with the requested business")
        modes = {"memory_qa", "pre_task_retrieval"} if family == "local" else {
            "pre_task_retrieval" if family in {"override", "cross_scope"} else "memory_qa"}
        require(case["task_mode"] in modes, "task mode disagrees with the supported template")
        visible = [row for row in parsed if row["available"] < when]
        require(bool(visible), "case has no time-eligible corpus")
        visible_counts.add(len(visible))
        expected, statements = [], []
        for label, topic in requests:
            eligible = [row for row in visible if row["topic"] == topic
                        and row["start"] <= when and (row["end"] is None or when < row["end"])
                        and is_ancestor(row["scope"], entity_scope[label])
                        and (row["audience"] == "全部位于该目录或其子目录的业务"
                             or label in row["audience"].split("、"))]
            require(bool(eligible), "requested fact has no applicable visible rule")
            def rank(row):
                return len(PurePosixPath(row["scope"]).parts), row["start"]
            winners = sorted(eligible, key=rank, reverse=True)
            require(len(winners) == 1 or rank(winners[0]) != rank(winners[1]), "ambiguous applicable rule")
            if winners[0]["mid"] not in expected:
                expected.append(winners[0]["mid"])
            statements.append(f"{label}的{topic}：{winners[0]['value']}")
            facts_checked += 1
        # Only now inspect the supplied gold and reference answer.
        gold = case["gold_memory_ids"]
        require(isinstance(gold, list) and len(gold) == len(set(gold)) and set(expected) == set(gold),
                "gold differs from independently resolved visible rules")
        require(len(expected) <= 5, "requested evidence exceeds the declared top-five ceiling")
        if expected:
            require(re.search(r"\d", question) is None, "positive question contains a numeric hint")
            answer = "；".join(statements) + "。仅列执行前规则，不表示外部任务已经完成。"
        else:
            answer = f"共 {int(parts['per_box']) * int(parts['boxes'])} 件。此题仅需算术，没有适用的项目记忆。"
        require(case["reference_answer"] == answer, "reference answer disagrees with the visible requested facts")
        require(not case.get("answer_checks") and not case.get("forbidden_patterns"),
                "this review version covers retrieval-only evaluation")
        matrix[(split, family, len(expected))] += 1
    require(not split_labels["dev"] & split_labels["test"], "business identity crosses dev/test")
    return {
        "schema_version": 1, "parser_version": PARSER_VERSION, "supported_generator": GENERATOR,
        "decision": "passed", "review_kind": "independent template-constrained data validation",
        "cases_checked": len(cases), "requested_facts_checked": facts_checked,
        "exact_gold_matches": len(cases), "ambiguous_winner_count": 0,
        "body_metadata_consistency_count": len(memories), "business_domains_checked": len(entity_scope),
        "visible_memories_per_case": sorted(visible_counts),
        "positive_question_numeric_or_identity_leaks": 0, "dev_test_business_overlap": 0,
        "matrix": [{"split": key[0], "family": key[1], "gold_count": key[2], "cases": count}
                   for key, count in sorted(matrix.items())],
    }


def check_runner(runner: Path, cases: list[dict]) -> int:
    """Evaluate only a restricted, pure instruction function; no module import."""
    tree = ast.parse(runner.read_text())
    functions = [node for node in tree.body if isinstance(node, ast.FunctionDef) and node.name == "instruction"]
    require(len(functions) == 1 and not functions[0].decorator_list, "unsupported runner instruction function")
    function = functions[0]
    allowed = (ast.FunctionDef, ast.arguments, ast.arg, ast.Assign, ast.Return, ast.Name, ast.Load,
               ast.Store, ast.Constant, ast.Attribute, ast.Call, ast.keyword, ast.Compare, ast.Eq,
               ast.IfExp, ast.BinOp, ast.Add, ast.Subscript, ast.Dict, ast.List, ast.Tuple,
               ast.BoolOp, ast.And, ast.Or, ast.UnaryOp, ast.Not, ast.NotEq, ast.In, ast.NotIn)
    for node in ast.walk(function):
        require(isinstance(node, allowed), "runner instruction exceeds supported pure expression syntax")
        if isinstance(node, ast.Attribute):
            require(node.attr in {"get", "dumps"}, "unsupported runner instruction attribute")
        if isinstance(node, ast.Call):
            require(isinstance(node.func, ast.Attribute) and node.func.attr in {"get", "dumps"},
                    "unsupported runner instruction call")
    namespace = {"json": json, "__builtins__": {"dict": dict, "str": str}}
    exec(compile(ast.Module(body=[function], type_ignores=[]), "<reviewed instruction>", "exec"), namespace)
    for case in cases:
        prompt = namespace["instruction"](case)
        require(all(text in prompt for text in ("当前作用域是工作的起点", "须分别按每个目标业务的作用域解释和回答",
                                                "不能把其他业务规则套到当前业务")), "synthetic multi-business prompt is ambiguous")
        require("真实问题" not in prompt and "历史用户任务" not in prompt, "synthetic prompt claims real provenance")
    return len(cases)


def review(dataset: Path, protocol: Path, runner: Path) -> dict:
    raw = dataset.read_bytes()
    data = json.loads(raw)
    result = review_data(data)
    declaration = json.loads(protocol.read_text())
    require(declaration.get("data_kind") == "synthetic" and declaration.get("dataset_sha256") == digest(raw),
            "dataset differs from the public frozen protocol")
    require(declaration.get("seed") == data["source"]["seed"], "protocol seed differs from dataset")
    manifest_path = dataset.parent / "BUILD_MANIFEST.json"
    manifest_raw = manifest_path.read_bytes()
    require(declaration.get("generator_build_manifest_sha256") == digest(manifest_raw),
            "build manifest differs from the public frozen protocol")
    manifest = json.loads(manifest_raw)
    require(manifest["artifacts"].get("data-v1.json") == digest(raw), "selected dataset differs from build manifest")
    expected_files = {"artifacts": {"DATA_REPORT.json", "DATA_REPORT.md", "data-v1.json"},
                      "programs": {"generate.py", "oracle.py"}}
    checked = 0
    for group, names in expected_files.items():
        require(set(manifest[group]) == names, "unsupported build manifest entries")
        for name in sorted(names):
            require(digest((dataset.parent / name).read_bytes()) == manifest[group][name], "build manifest content mismatch")
            checked += 1
    for split in ("dev", "test"):
        split_cases = [case for case in data["cases"] if case["split"] == split]
        require(declaration[split]["cases"] == len(split_cases), "protocol split count mismatch")
    require(dict(Counter(case["scenario_family"] for case in data["cases"] if case["split"] == "test"))
            == declaration["prespecified_families"], "protocol test family matrix mismatch")
    result.update(dataset_sha256=digest(raw), protocol_sha256=digest(protocol.read_bytes()),
                  runner_sha256=digest(runner.read_bytes()), reviewer_sha256=digest(Path(__file__).read_bytes()),
                  build_manifest_sha256=digest(manifest_raw), manifest_artifacts_and_programs_verified=checked,
                  prompt_clarification_verified_cases=check_runner(runner, data["cases"]),
                  dataset_matches_frozen_protocol=True)
    return result


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dataset", type=Path, default=HERE / "data-v1.json")
    parser.add_argument("--protocol", type=Path, default=HERE / "protocol-v1.json")
    parser.add_argument("--runner", type=Path, default=HERE.parent / "run.py")
    parser.add_argument("--output", type=Path, help="optional JSON output; default is stdout")
    args = parser.parse_args()
    try:
        if args.output:
            protected = {args.dataset.resolve(), args.protocol.resolve(), args.runner.resolve(), Path(__file__).resolve()}
            protected.update((args.dataset.parent / name).resolve() for name in
                             ("BUILD_MANIFEST.json", "DATA_REPORT.json", "DATA_REPORT.md", "data-v1.json", "generate.py", "oracle.py"))
            require(args.output.resolve() not in protected, "output must not overwrite an input")
        result = review(args.dataset, args.protocol, args.runner)
        output = json.dumps(result, ensure_ascii=False, indent=2, allow_nan=False) + "\n"
        if args.output:
            args.output.write_text(output)
        print(output, end="")
        return 0
    except (OSError, ValueError, KeyError, TypeError, AttributeError, SyntaxError, NameError) as error:
        # Fixed messages do not echo caller paths, input bodies or private IDs.
        message = str(error) if isinstance(error, ReviewError) else "invalid input, unsupported structure, or unreadable file"
        print(json.dumps({"decision": "failed", "error": message}, ensure_ascii=False), file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
