"""Resolve authored evidence obligations, applicability and dependencies.

The oracle never reads question words. It is a consistency oracle for an authored
world, not an independent judgement of natural-language relevance.
"""
from __future__ import annotations

from datetime import datetime


def instant(value: str) -> datetime:
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed.tzinfo is None:
        raise ValueError("timezone required")
    return parsed


def applicability(rule: dict, case: dict) -> str | None:
    now = instant(case["query_at"])
    if rule["scene_id"] != case["scene_id"]:
        return "different_entity_and_task"
    if instant(rule["available_at"]) >= now:
        return "not_available_before_query"
    if instant(rule["effective_from"]) > now:
        return "not_yet_effective"
    if rule.get("effective_until") and now >= instant(rule["effective_until"]):
        return "superseded_or_expired"
    if rule["operation"] != case["operation"]:
        return "different_operation"
    if any(case["facts"].get(key) != value for key, value in rule["when"].items()):
        return "condition_not_satisfied"
    return None


def resolve(truth: dict, case: dict) -> dict:
    by_unit: dict[str, list[dict]] = {}
    excluded = {}
    for rule in truth["rules"]:
        reason = applicability(rule, case)
        if reason:
            excluded[rule["rule_id"]] = reason
        else:
            by_unit.setdefault(rule["unit"], []).append(rule)
    selected, visiting, unresolved = {}, set(), []

    def visit(unit: str) -> None:
        if unit in visiting:
            raise ValueError("cyclic evidence dependency")
        if unit in selected:
            return
        candidates = by_unit.get(unit, [])
        if not candidates:
            unresolved.append(unit)
            return
        rank = lambda r: (r["priority"], instant(r["effective_from"]))
        best = max(candidates, key=rank)
        if sum(rank(r) == rank(best) for r in candidates) != 1:
            raise ValueError("ambiguous rule precedence")
        visiting.add(unit)
        for dependency in best.get("requires", []):
            visit(dependency)
        visiting.remove(unit)
        selected[unit] = best
        for other in candidates:
            if other is not best:
                excluded[other["rule_id"]] = "overridden_applicable_version"

    for unit in case["obligations"]:
        visit(unit)
    chosen = {r["rule_id"] for r in selected.values()}
    for candidates in by_unit.values():
        for rule in candidates:
            if rule["rule_id"] not in chosen:
                excluded.setdefault(rule["rule_id"], "not_required_for_requested_operation")
    return {"rule_ids": sorted(chosen), "unresolved_obligations": sorted(set(unresolved)),
            "exclusions": excluded}


def expected_memory_ids(truth: dict, case: dict) -> list[str]:
    mapping = {r["rule_id"]: r["memory_id"] for r in truth["rules"]}
    return sorted(mapping[rid] for rid in resolve(truth, case)["rule_ids"])


def reference_answer(truth: dict, case: dict) -> str:
    rules = {r["rule_id"]: r for r in truth["rules"]}
    result = resolve(truth, case)
    if not result["rule_ids"]:
        return "现有记忆没有适用于这次请求的专属约定；不把同名词、旧事件或其他受众的规则套用到当前任务。可说明缺少的事实，但不声称已经执行任务。"
    return "\n".join(rules[rid]["decision"] for rid in result["rule_ids"])
