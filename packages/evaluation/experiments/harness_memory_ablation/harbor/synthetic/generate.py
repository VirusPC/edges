"""Deterministic fictional scene graph -> memory corpus, questions and oracle gold.

No network, model, private repository, historical query, or external input is read.
"""
from __future__ import annotations

import argparse
from collections import Counter, defaultdict
import hashlib
import json
import math
from pathlib import Path
import random
import re
import sys

HARBOR = Path(__file__).resolve().parents[1]
if str(HARBOR) not in sys.path:
    sys.path.insert(0, str(HARBOR))
from dataset import validate_dataset as validate_provenance
from run import validate_dataset as validate_runner
from synthetic.oracle import ancestor, exclusion_reasons, expected_rules, instant, truth_answer

VERSION = "synthetic-scenes-v1"
DEFAULT_SEED = 20261109
DEFAULT_DISTRACTOR_SCOPES = 48
QUERY_AT = "2025-01-15T09:00:00Z"
MATRIX = {"dev": {"local": 3, "override": 1, "cross_scope": 2, "global": 1, "negative": 1},
          "test": {"local": 12, "override": 6, "cross_scope": 6, "global": 4, "negative": 4}}
TOPICS = ("发布门槛", "留存期限", "回退条件")
ADJECTIVES = ("雾岭", "晨湾", "银杉", "晴屿", "浅泉", "青梧", "远帆", "星砂", "白榆", "蓝穗", "栖鹭", "秋岚")
NOUNS = ("书亭", "租赁", "花房", "仓配", "票务", "工坊", "食集", "展馆")


def encoded(value: object) -> bytes:
    return (json.dumps(value, ensure_ascii=False, sort_keys=True, indent=2, allow_nan=False) + "\n").encode()


def opaque(seed: int, namespace: str, value: object) -> str:
    return hashlib.sha256(f"{VERSION}|{seed}|{namespace}|{value}".encode()).hexdigest()[:24]


def rule_value(seed: int, key: str, topic: str) -> str:
    rng = random.Random(int(opaque(seed, "value", key), 16))
    if topic == "发布门槛":
        return f"观察至少 {rng.randrange(20, 160)} 分钟，且错误计数不超过 {rng.randrange(1, 9)} 次"
    if topic == "留存期限":
        return f"业务流水的原始记录保留 {rng.randrange(17, 230)} 天，业务摘要保留 {rng.randrange(260, 720)} 天"
    if topic == "回退条件":
        return f"连续 {rng.randrange(3, 15)} 个检查窗口失败时回退，并恢复最近 {rng.randrange(2, 10)} 份快照中的最后一份通过校验者"
    if topic == "归档规则":
        return f"复核记录按月归档，保留 {rng.randrange(14, 49)} 个月"
    if topic == "通知时限":
        return f"异常确认后 {rng.randrange(25, 120)} 分钟内通知值班协调员"
    raise ValueError("unknown fictional topic")


def build_dataset(seed: int = DEFAULT_SEED, distractor_scopes: int = DEFAULT_DISTRACTOR_SCOPES) -> dict:
    if type(seed) is not int or type(distractor_scopes) is not int or not 0 <= distractor_scopes <= 256:
        raise ValueError("seed must be an integer; distractor-scopes must be 0..256")
    truth = {"schema_version": 1, "entities": [], "rules": [], "cases": [],
             "precedence": "active narrower owner overrides ancestor; newest effective version breaks equal-depth ties; unresolved ties invalid",
             "version_interval": "effective_from <= query_at < effective_until; available_at < query_at"}
    labels = [a + n for a in ADJECTIVES for n in NOUNS]
    random.Random(seed).shuffle(labels)

    def add_entity(split: str, role: str) -> dict:
        n = len(truth["entities"])
        eid = "entity-" + opaque(seed, "entity", n)
        label = labels[n % len(labels)]
        if n >= len(ADJECTIVES) * len(NOUNS):
            label += f"第{n // (len(ADJECTIVES) * len(NOUNS)) + 1}区"
        parent = "services/" + opaque(seed, "domain", n)[:10]
        entity = {"entity_id": eid, "label": label, "scope": parent + "/checkout",
                  "parent_scope": parent, "split": split, "role": role}
        truth["entities"].append(entity)
        return entity

    def add_rule(entity: dict, topic: str, level: str, version: str = "current", audience=None) -> None:
        scope = "." if level == "global" else entity["parent_scope"] if level == "parent" else entity["scope"]
        key = f"{entity['entity_id']}|{topic}|{level}|{version}"
        available, start, until = "2024-12-20T00:00:00Z", "2025-01-01T00:00:00Z", None
        if version == "expired":
            available, start, until = "2024-12-01T00:00:00Z", "2024-12-01T00:00:00Z", "2025-01-10T00:00:00Z"
        elif version == "current" and level == "leaf" and topic == "留存期限":
            available, start = "2025-01-09T00:00:00Z", "2025-01-10T00:00:00Z"
        elif version == "future":
            available, start = "2025-02-01T00:00:00Z", "2025-02-01T00:00:00Z"
        truth["rules"].append({"rule_id": "rule-" + opaque(seed, "rule", key),
            "owner_entity_id": entity["entity_id"], "owner_scope": scope, "topic": topic,
            "available_at": available, "effective_from": start, "effective_until": until,
            "audience_entity_ids": audience, "value": rule_value(seed, key, topic), "version": version})

    def domain_rules(entity: dict) -> None:
        for topic in TOPICS:
            add_rule(entity, topic, "parent")
        add_rule(entity, "发布门槛", "leaf")
        for version in ("expired", "current", "future"):
            add_rule(entity, "留存期限", "leaf", version)

    for split, families in MATRIX.items():
        for family, count in families.items():
            for number in range(count):
                entity = add_entity(split, "primary")
                domain_rules(entity)
                case_id = "syn-" + opaque(seed, "case", len(truth["cases"]))
                requests, partner = [], None
                scope = entity["scope"]
                if family == "local":
                    requests = [{"entity_id": entity["entity_id"], "topic": t} for t in TOPICS[:2]]
                    question = f"{entity['label']}的结算服务准备做本月发布。请核对适用的发布门槛，以及原始记录和摘要的留存期限。"
                elif family == "override":
                    requests = [{"entity_id": entity["entity_id"], "topic": t} for t in TOPICS]
                    question = f"请为{entity['label']}结算服务整理执行前约定：发布要满足什么门槛，记录保留多久，失败时按什么条件回退？若上层与服务自己的规定不同，说明此刻适用的规则。"
                elif family == "cross_scope":
                    partner = add_entity(split, "partner")
                    domain_rules(partner)
                    requests = [{"entity_id": entity["entity_id"], "topic": "发布门槛"},
                                {"entity_id": partner["entity_id"], "topic": "留存期限"},
                                {"entity_id": partner["entity_id"], "topic": "回退条件"}]
                    question = f"{entity['label']}准备与{partner['label']}联动。本次只核对前者的发布门槛，以及后者负责的记录留存期限和回退条件，整理执行前需要遵守的约定。"
                elif family == "global":
                    for topic in ("归档规则", "通知时限"):
                        add_rule(entity, topic, "global", audience=[entity["entity_id"]])
                        requests.append({"entity_id": entity["entity_id"], "topic": topic})
                    scope = "." if number % 2 == 0 else entity["scope"]
                    question = f"本次复核{entity['label']}的统一行政约定：复核记录怎样归档、保留多久，异常确认后应在多长时间内通知？"
                else:
                    a, b = 5 + number * 2 + (0 if split == "dev" else 1), 4 + number
                    question = f"{entity['label']}在准备活动物料：每箱装 {a} 件，共有 {b} 箱，一共有多少件？"
                ct = {"case_id": case_id, "entity_id": entity["entity_id"],
                      "partner_entity_id": partner["entity_id"] if partner else None,
                      "scenario_family": family, "split": split, "scope": scope,
                      "query_at": QUERY_AT, "requests": requests, "question": question,
                      "task_mode": "pre_task_retrieval" if family in {"override", "cross_scope"} or (family == "local" and number % 2) else "memory_qa"}
                if family == "negative":
                    ct["arithmetic"] = {"per_box": a, "boxes": b}
                truth["cases"].append(ct)
    for _ in range(distractor_scopes):
        domain_rules(add_entity("background", "distractor"))

    entities = {e["entity_id"]: e for e in truth["entities"]}
    memories = []
    mapping = {}
    for rule in truth["rules"]:
        mid = "m-" + opaque(seed, "memory", rule["rule_id"])
        mapping[rule["rule_id"]] = mid
        memories.append({"memory_id": mid, "scope": rule["owner_scope"], "title": rule["topic"] + "约定",
                         "available_at": rule["available_at"], "body": render_rule(rule, entities),
                         "source": {"kind": "synthetic", "generator": VERSION, "rule_id": rule["rule_id"]}})
    # Opaque ID order is deterministic and unrelated to case or relevance order.
    memories.sort(key=lambda m: m["memory_id"])
    rules = {r["rule_id"]: r for r in truth["rules"]}
    cases = []
    for ct in truth["cases"]:
        resolved = expected_rules(truth, ct)
        excluded = exclusion_reasons(truth, ct)
        examples = defaultdict(list)
        for rid, reason in excluded.items():
            if len(examples[reason]) < 3:
                examples[reason].append(mapping[rid])
        case = {k: ct[k] for k in ("case_id", "scope", "query_at", "split", "question", "task_mode", "scenario_family")}
        case.update({"gold_memory_ids": [mapping[rid] for rid in resolved],
            "source": {"kind": "synthetic", "scene_id": ct["case_id"],
                       "session_id": "session-" + opaque(seed, "session", ct["case_id"]),
                       "trace_id": "trace-" + opaque(seed, "trace", ct["case_id"]),
                       "observation_id": "observation-" + opaque(seed, "observation", ct["case_id"])},
            "scope_evidence": {"kind": "synthetic-scene", "detail": "Explicit current maintenance scope in the fictional scene; not inferred from gold."},
            "reference_answer": truth_answer(truth, ct),
            "relevance_rationale": [{"memory_id": mapping[rid], "rule_id": rid,
                "reason": f"Requested topic {rules[rid]['topic']}; owner {rules[rid]['owner_scope']} applies to the requested entity; active at query time, winning ancestry/version precedence."} for rid in resolved],
            "non_gold_exclusion": {"rule": "Recompute every exclusion from scene_truth with oracle.exclusion_reasons; no arbitrary top-k gold truncation.",
                                   "counts": dict(sorted(Counter(excluded.values()).items())), "examples": dict(sorted(examples.items()))}})
        cases.append(case)
    data = {"schema_version": 1, "source": {"kind": "synthetic", "generator": VERSION,
                "seed": seed, "distractor_scopes": distractor_scopes,
                "provenance": "Fictional templates and deterministic scene facts authored for this experiment; no historical queries or private inputs."},
            "memories": memories, "cases": cases, "scene_truth": truth}
    validate_synthetic(data)
    return data


def render_rule(rule: dict, entities: dict) -> str:
    entity = entities[rule["owner_entity_id"]]
    end = rule["effective_until"] or "未设结束时间"
    audience = "全部位于该目录或其子目录的业务" if rule["audience_entity_ids"] is None else "、".join(entities[e]["label"] for e in rule["audience_entity_ids"])
    return (f"虚构业务：{entity['label']}。主题：{rule['topic']}。\n\n"
            f"适用目录：{rule['owner_scope']}；适用对象：{audience}。根目录的有条件规则也只能用于列明的对象。\n"
            "适用规则：目录规则覆盖自身及子目录；同主题存在已生效的更深层规则时，以更深层为准。"
            "同一层若有多个版本，以当前生效区间内起始时间最新者为准。其他业务、兄弟目录和未请求的主题不能据此推断。\n\n"
            f"版本有效期：从 {rule['effective_from']}（含）至 {end}（不含，若未设则持续）。"
            f"此记录在 {rule['available_at']} 才可获得；在这之前不得据此回答。\n\n"
            f"规定：{rule['value']}。\n")


def validate_synthetic(data: dict) -> dict:
    validate_provenance(data)
    validate_runner(data)
    if data.get("source", {}).get("kind") != "synthetic":
        raise ValueError("synthetic provenance required")
    truth = data["scene_truth"]
    entities = {e["entity_id"]: e for e in truth["entities"]}
    rules = {r["rule_id"]: r for r in truth["rules"]}
    scenes = {s["case_id"]: s for s in truth["cases"]}
    if len(entities) != len(truth["entities"]) or len(rules) != len(truth["rules"]) or len(scenes) != len(truth["cases"]):
        raise ValueError("duplicate scene identity")
    mapping = {}
    for memory in data["memories"]:
        if memory["source"].get("kind") != "synthetic":
            raise ValueError("non-synthetic memory source")
        rid = memory["source"]["rule_id"]
        if rid in mapping:
            raise ValueError("duplicate memory for scene rule")
        mapping[rid] = memory["memory_id"]
        rule = rules[rid]
        if memory["scope"] != rule["owner_scope"] or memory["available_at"] != rule["available_at"] or memory["body"] != render_rule(rule, entities):
            raise ValueError("memory disagrees with scene truth")
    if set(mapping) != set(rules):
        raise ValueError("scene rule/memory mapping incomplete")
    if set(scenes) != {c["case_id"] for c in data["cases"]}:
        raise ValueError("case/scene mapping incomplete")
    used = {"dev": set(), "test": set()}
    for case in data["cases"]:
        ct = scenes[case["case_id"]]
        if case["source"].get("kind") != "synthetic" or case["source"].get("scene_id") != ct["case_id"]:
            raise ValueError("synthetic case provenance mismatch")
        for field in ("scope", "query_at", "split", "question", "scenario_family", "task_mode"):
            if case[field] != ct[field]:
                raise ValueError("case disagrees with scene truth")
        expected = [mapping[rid] for rid in expected_rules(truth, ct)]
        if case["gold_memory_ids"] != expected or len(expected) > 5:
            raise ValueError("gold disagrees with independent scene resolution")
        if case["reference_answer"] != truth_answer(truth, ct):
            raise ValueError("reference answer disagrees with scene truth")
        if any(mid in case["question"] for mid in mapping.values()) or "/" in case["question"] or re.search(r"(?:memory-|rule-|entity-|\.md\b)", case["question"]):
            raise ValueError("question leaks a file, path or identity hint")
        case_entities = {ct["entity_id"]} | {q["entity_id"] for q in ct["requests"]}
        if any(entities[e]["split"] != case["split"] for e in case_entities):
            raise ValueError("case entity split mismatch")
        used[case["split"]].update(case_entities)
    if used["dev"] & used["test"]:
        raise ValueError("dev/test entity leakage")
    actual = {split: dict(Counter(c["scenario_family"] for c in data["cases"] if c["split"] == split)) for split in MATRIX}
    if actual != MATRIX:
        raise ValueError("frozen family matrix changed")
    if sum(c["split"] == "test" and c["scope"] != "." for c in data["cases"]) < 24:
        raise ValueError("insufficient non-root test scopes")
    return {"matrix": actual, "entity_overlap": 0, "gold_resolved_from_scene": True}


def lexical_tokens(text: str) -> Counter:
    # Character bigrams are a deliberately simple Chinese lexical comparator.
    pieces = re.findall(r"[a-zA-Z0-9]+|[\u4e00-\u9fff]+", text.lower())
    tokens = []
    for piece in pieces:
        tokens.extend(piece[i:i + 2] for i in range(len(piece) - 1)) if re.fullmatch(r"[\u4e00-\u9fff]+", piece) else tokens.append(piece)
    return Counter(tokens)


def diagnose(data: dict) -> dict:
    validation = validate_synthetic(data)
    docs, df = {}, Counter()
    scopes = sorted({m["scope"] for m in data["memories"] if m["scope"] != "."}, key=len, reverse=True)
    visible_memories = [m for m in data["memories"] if instant(m["available_at"]) < instant(QUERY_AT)]
    for memory in visible_memories:
        text = memory["title"] + "\n" + memory["body"]
        for scope in scopes:
            text = text.replace(scope, "")
        tokens = lexical_tokens(text)
        docs[memory["memory_id"]] = tokens
        df.update(tokens.keys())
    n = len(docs)
    average = sum(sum(d.values()) for d in docs.values()) / n
    rows = []
    scene_map = {s["case_id"]: s for s in data["scene_truth"]["cases"]}
    rule_to_memory = {m["source"]["rule_id"]: m["memory_id"] for m in data["memories"]}
    for case in data["cases"]:
        query = lexical_tokens(case["question"])
        eligible = [m for m in data["memories"] if instant(m["available_at"]) < instant(case["query_at"])]
        def score(memory):
            tokens = docs[memory["memory_id"]]
            length = sum(tokens.values())
            return sum(math.log(1 + (n - df[t] + .5) / (df[t] + .5)) * tokens[t] * 2.2 /
                       (tokens[t] + 1.2 * (.25 + .75 * length / average)) for t in query if tokens[t])
        ranked = sorted(eligible, key=lambda m: (-score(m), m["memory_id"]))[:5]
        selected = [m["memory_id"] for m in ranked]
        gold = set(case["gold_memory_ids"])
        resolved = [rule_to_memory[rid] for rid in expected_rules(data["scene_truth"], scene_map[case["case_id"]])]
        rows.append({"case_id": case["case_id"], "split": case["split"], "scenario_family": case["scenario_family"],
                     "gold_count": len(gold), "visible_memory_count": len(eligible),
                     "oracle_memory_ids": resolved, "oracle_answer": truth_answer(data["scene_truth"], scene_map[case["case_id"]]),
                     "oracle_recall_at_5": 1.0 if gold else None,
                     "scope_blind_lexical_top5": selected,
                     "scope_blind_lexical_recall_at_5": len(gold & set(selected)) / len(gold) if gold else None,
                     "scope_blind_lexical_negative_selection": bool(selected) if not gold else None})
    groups = {}
    for split in MATRIX:
        for family in MATRIX[split]:
            subset = [r for r in rows if r["split"] == split and r["scenario_family"] == family]
            scores = [r["scope_blind_lexical_recall_at_5"] for r in subset if r["gold_count"]]
            groups[f"{split}/{family}"] = {"cases": len(subset), "positive_cases": len(scores),
                "oracle_recall_at_5": 1.0 if scores else None,
                "scope_blind_lexical_recall_at_5": sum(scores) / len(scores) if scores else None,
                "oracle_minus_lexical": 1 - sum(scores) / len(scores) if scores else None}
    return {"kind": "offline_construct_diagnostics_not_model_results", "generator": VERSION,
            "parameters": {k: data["source"][k] for k in ("seed", "distractor_scopes")},
            "dataset_sha256": hashlib.sha256(encoded(data)).hexdigest(), "validation": validation,
            "counts": {"memories": len(data["memories"]), "cases": len(data["cases"]),
                       "domains": len(data["scene_truth"]["entities"]), "memory_scopes": len({m["scope"] for m in data["memories"]}),
                       "test_nonroot_cases": sum(c["split"] == "test" and c["scope"] != "." for c in data["cases"]),
                       "max_gold": max(len(c["gold_memory_ids"]) for c in data["cases"]),
                       "future_memories": sum(instant(m["available_at"]) >= instant(QUERY_AT) for m in data["memories"])},
            "baseline_definition": "BM25-style title/body character-bigram ranking over time-visible documents only, including document-frequency statistics; explicit directory strings and scope metadata omitted; business names and dates retained; top 5, no abstention; no semantic ancestry/version reasoning. This is not an LLM and does not compare placement arms.",
            "discriminability_policy": "Before model runs, report oracle-minus-lexical by family, duplicate-title rate and scope/version conflicts. A positive gap means lexical confounding exists, not that scoped will beat root. No effect-size threshold is used to select seeds or revise test cases.",
            "duplicate_title_fraction": 1 - len({m["title"] for m in data["memories"]}) / len(data["memories"]),
            "groups": groups, "cases": rows,
            "limitations": ["Templates are shared across dev/test; entities, sessions, facts and IDs are disjoint.",
                "Synthetic difficulty and arbitrary policy values do not establish real-world memory effectiveness.",
                "Oracle and lexical diagnostic outcomes are constructed/offline, not model experiment results.",
                "Generator validation is not an independent semantic review; freeze only after a separate reviewer checks scene/renderer/question agreement.",
                "Root keeps full scope/time metadata and identical bodies; scope is never used to hide memories from root.",
                "No model output was used to design cases, select seeds, or tune test difficulty."]}


def report_markdown(report: dict) -> str:
    rows = ["# 公开合成数据离线诊断", "", "这是可重复构造的数据质量与词法诊断，不是真实用户数据，也不是模型运行结果。", "",
            f"参数：`--seed {report['parameters']['seed']} --distractor-scopes {report['parameters']['distractor_scopes']}`。", "",
            "计数：`" + json.dumps(report["counts"], ensure_ascii=False) + "`。", "",
            "| split / family | 题数 | 场景 oracle recall@5 | 无 scope 词法 recall@5 | 差距 |", "| --- | ---: | ---: | ---: | ---: |"]
    for key, group in report["groups"].items():
        def number(value):
            return "N/A" if value is None else f"{value:.3f}"
        rows.append(f"| {key} | {group['cases']} | {number(group['oracle_recall_at_5'])} | {number(group['scope_blind_lexical_recall_at_5'])} | {number(group['oracle_minus_lexical'])} |")
    rows += ["", "词法基线：" + report["baseline_definition"], "", "区分度判读：" + report["discriminability_policy"], "",
             "负例的词法基线固定选 5 条，不能用于证明其会合理弃答。祖先覆盖和跨域组合以结构事实重新求解；任何单纯按当前 scope 截断的检索都会漏掉跨域需求。", "",
             "独立场景、gold 必要理由与非 gold 排除类别在 data-v1.json；逐题 oracle 答案和词法前五在 DATA_REPORT.json。", ""]
    rows += ["- " + value for value in report["limitations"]]
    rows += ["", f"数据 SHA256：`{report['dataset_sha256']}`。", ""]
    return "\n".join(rows)


def write_artifacts(output: Path, data: dict) -> dict:
    report = diagnose(data)
    files = {"data-v1.json": encoded(data), "DATA_REPORT.json": encoded(report), "DATA_REPORT.md": report_markdown(report).encode()}
    manifest = {"generator": VERSION, "parameters": report["parameters"],
                "artifacts": {name: hashlib.sha256(raw).hexdigest() for name, raw in files.items()},
                "programs": {name: hashlib.sha256((Path(__file__).parent / name).read_bytes()).hexdigest() for name in ("generate.py", "oracle.py")}}
    files["BUILD_MANIFEST.json"] = encoded(manifest)
    output = Path(output)
    for name, raw in files.items():
        target = output / name
        if target.is_symlink() or (target.exists() and (not target.is_file() or target.read_bytes() != raw)):
            raise ValueError(f"refusing to overwrite changed artifact: {name}; use a new output directory/version")
    output.mkdir(parents=True, exist_ok=True)
    for name, raw in files.items():
        target = output / name
        if not target.exists():
            with target.open("xb") as stream:
                stream.write(raw)
    return manifest


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--seed", type=int, default=DEFAULT_SEED)
    parser.add_argument("--distractor-scopes", type=int, default=DEFAULT_DISTRACTOR_SCOPES)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    data = build_dataset(args.seed, args.distractor_scopes)
    manifest = write_artifacts(args.output, data)
    print(json.dumps({"output": str(args.output), "parameters": manifest["parameters"], "dataset_sha256": manifest["artifacts"]["data-v1.json"]}, ensure_ascii=False))


if __name__ == "__main__":
    main()
