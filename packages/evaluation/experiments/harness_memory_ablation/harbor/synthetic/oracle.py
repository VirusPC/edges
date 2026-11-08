"""Resolve structured scene facts without reading generated questions or gold IDs."""
from __future__ import annotations

from datetime import datetime


def instant(value: str) -> datetime:
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed.tzinfo is None:
        raise ValueError("scene timestamps require timezone")
    return parsed


def ancestor(owner: str, target: str) -> bool:
    return owner == "." or target == owner or target.startswith(owner + "/")


def eligibility(rule: dict, entity: dict, topic: str, when: str) -> str:
    """Return a stable exclusion reason, or eligible before precedence resolution."""
    if instant(rule["available_at"]) >= instant(when):
        return "not_yet_available"
    if rule["topic"] != topic:
        return "unrequested_topic"
    if not ancestor(rule["owner_scope"], entity["scope"]):
        return "outside_entity_scope"
    audience = rule.get("audience_entity_ids")
    if audience is not None and entity["entity_id"] not in audience:
        return "different_audience"
    if instant(rule["effective_from"]) > instant(when):
        return "not_yet_effective"
    if rule.get("effective_until") and instant(when) >= instant(rule["effective_until"]):
        return "expired_version"
    return "eligible"


def expected_rules(scene_truth: dict, case_truth: dict) -> list[str]:
    """Resolve requested entity/topic pairs by ancestry, audience and version.

    An active narrower owner overrides its ancestor. At equal depth the newest
    effective version wins. An unresolved tie is invalid rather than arbitrary.
    The resolver does not inspect memories, gold_memory_ids, or natural language.
    """
    entities = {e["entity_id"]: e for e in scene_truth["entities"]}
    selected = []
    for request in case_truth["requests"]:
        entity = entities[request["entity_id"]]
        candidates = [r for r in scene_truth["rules"]
                      if eligibility(r, entity, request["topic"], case_truth["query_at"]) == "eligible"]
        if not candidates:
            raise ValueError("scene request has no applicable rule")
        rank = lambda r: (0 if r["owner_scope"] == "." else len(r["owner_scope"].split("/")),
                          instant(r["effective_from"]))
        best_rank = max(map(rank, candidates))
        best = [r for r in candidates if rank(r) == best_rank]
        if len(best) != 1:
            raise ValueError("ambiguous scene precedence")
        if best[0]["rule_id"] not in selected:
            selected.append(best[0]["rule_id"])
    return selected


def exclusion_reasons(scene_truth: dict, case_truth: dict) -> dict[str, str]:
    entities = {e["entity_id"]: e for e in scene_truth["entities"]}
    selected = set(expected_rules(scene_truth, case_truth))
    result = {}
    priority = ["eligible", "expired_version", "not_yet_effective", "different_audience",
                "outside_entity_scope", "unrequested_topic", "not_yet_available"]
    for rule in scene_truth["rules"]:
        if rule["rule_id"] in selected:
            continue
        reasons = [eligibility(rule, entities[q["entity_id"]], q["topic"], case_truth["query_at"])
                   for q in case_truth["requests"]]
        reason = min(reasons, key=priority.index) if reasons else "no_memory_requested"
        result[rule["rule_id"]] = "overridden_by_more_specific_or_newer_rule" if reason == "eligible" else reason
    return result


def truth_answer(scene_truth: dict, case_truth: dict) -> str:
    if not case_truth["requests"]:
        a, b = case_truth["arithmetic"]["per_box"], case_truth["arithmetic"]["boxes"]
        return f"共 {a * b} 件。此题仅需算术，没有适用的项目记忆。"
    entities = {e["entity_id"]: e for e in scene_truth["entities"]}
    rules = {r["rule_id"]: r for r in scene_truth["rules"]}
    parts = []
    for request in case_truth["requests"]:
        single = {**case_truth, "requests": [request]}
        rule = rules[expected_rules(scene_truth, single)[0]]
        parts.append(f"{entities[request['entity_id']]['label']}的{request['topic']}：{rule['value']}")
    return "；".join(parts) + "。仅列执行前规则，不表示外部任务已经完成。"
