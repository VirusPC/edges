"""Offline synthetic-data checks with independent, hand-written oracle examples."""
from __future__ import annotations

from collections import Counter
import copy
import hashlib
import json
from pathlib import Path, PurePosixPath
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

HERE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(HERE))

import dataset
import run
from synthetic.generate import build_dataset, validate_synthetic, write_artifacts
from synthetic.oracle import expected_rules


QUERY_AT = "2026-06-15T12:00:00Z"


def rule(rule_id, owner_scope, *, topic="release", available_at="2026-01-01T00:00:00Z",
         effective_from="2026-01-01T00:00:00Z", effective_until=None, audience=None,
         version=1):
    return {
        "rule_id": rule_id, "owner_scope": owner_scope, "topic": topic,
        "available_at": available_at, "effective_from": effective_from,
        "effective_until": effective_until, "audience_entity_ids": audience,
        "value": f"Use {rule_id}.", "version": version,
    }


def oracle_fixture():
    """Names and expected decisions are authored independently of the generator."""
    return {
        "entities": [
            {"entity_id": "alpha", "label": "Amber", "scope": "platforms/alpha",
             "split": "test", "role": "service"},
            {"entity_id": "alpha-api", "label": "Amber API", "scope": "platforms/alpha/api",
             "split": "test", "role": "service"},
            {"entity_id": "beta", "label": "Birch", "scope": "platforms/beta",
             "split": "test", "role": "service"},
            {"entity_id": "alphabet", "label": "Cobalt", "scope": "platforms/alphabet",
             "split": "test", "role": "service"},
        ],
        "rules": [rule("root", "."), rule("organization", "platforms"),
                  rule("alpha-rule", "platforms/alpha"), rule("beta-rule", "platforms/beta")],
        "cases": [],
    }


def request(*entities, topic="release", query_at=QUERY_AT):
    return {"case_id": "manual-case", "entity_id": entities[0], "query_at": query_at,
            "scenario_family": "cross_scope" if len(entities) > 1 else "local",
            "requests": [{"entity_id": entity, "topic": topic} for entity in entities]}


def files_under(directory):
    return {path.relative_to(directory).as_posix(): path.read_bytes()
            for path in directory.rglob("*") if path.is_file()}


class OracleTests(unittest.TestCase):
    def test_nearest_ancestor_wins_and_siblings_do_not_leak(self):
        truth = oracle_fixture()
        self.assertEqual(expected_rules(truth, request("alpha-api")), ["alpha-rule"])
        self.assertEqual(expected_rules(truth, request("beta")), ["beta-rule"])
        # A string-prefix match would incorrectly choose alpha-rule here.
        self.assertEqual(expected_rules(truth, request("alphabet")), ["organization"])

    def test_deeper_rule_overrides_a_more_recent_parent(self):
        truth = oracle_fixture()
        truth["rules"].append(rule("new-parent", "platforms",
                                   effective_from="2026-06-01T00:00:00Z", version=2))
        self.assertEqual(expected_rules(truth, request("alpha-api")), ["alpha-rule"])
        self.assertEqual(expected_rules(truth, request("alphabet")), ["new-parent"])

    def test_same_scope_latest_effective_rule_wins(self):
        truth = oracle_fixture()
        truth["rules"].append(rule("alpha-v2", "platforms/alpha",
                                   effective_from="2026-06-01T00:00:00Z", version=2))
        self.assertEqual(expected_rules(truth, request("alpha")), ["alpha-v2"])

    def test_audience_does_not_widen_scope_or_restrict_unrelated_entities(self):
        truth = oracle_fixture()
        truth["rules"].append(rule("audience-only", "platforms",
                                   effective_from="2026-06-01T00:00:00Z",
                                   audience=["alphabet"]))
        self.assertEqual(expected_rules(truth, request("alphabet")), ["audience-only"])
        self.assertEqual(expected_rules(truth, request("alpha")), ["alpha-rule"])
        truth["rules"].append(rule("wrong-owner", "platforms/beta",
                                   audience=["alphabet"]))
        self.assertEqual(expected_rules(truth, request("alphabet")), ["audience-only"])

    def test_available_at_must_be_strictly_before_query(self):
        for available_at in (QUERY_AT, "2026-06-16T00:00:00Z"):
            with self.subTest(available_at=available_at):
                truth = oracle_fixture()
                truth["rules"].append(rule("unavailable", "platforms/alpha/api",
                                           available_at=available_at))
                self.assertEqual(expected_rules(truth, request("alpha-api")), ["alpha-rule"])

    def test_effective_start_inclusive_and_end_exclusive(self):
        truth = oracle_fixture()
        truth["rules"].append(rule("starts-now", "platforms/alpha/api", effective_from=QUERY_AT))
        self.assertEqual(expected_rules(truth, request("alpha-api")), ["starts-now"])
        truth["rules"][-1]["effective_from"] = "2026-01-01T00:00:00Z"
        truth["rules"][-1]["effective_until"] = QUERY_AT
        self.assertEqual(expected_rules(truth, request("alpha-api")), ["alpha-rule"])
        truth["rules"][-1]["effective_from"] = "2026-06-16T00:00:00Z"
        truth["rules"][-1]["effective_until"] = None
        self.assertEqual(expected_rules(truth, request("alpha-api")), ["alpha-rule"])

    def test_timezones_are_compared_as_instants(self):
        truth = oracle_fixture()
        truth["rules"].append(rule("same-instant", "platforms/alpha/api",
                                   available_at="2026-06-15T14:00:00+02:00"))
        self.assertEqual(expected_rules(truth, request("alpha-api")), ["alpha-rule"])
        truth["rules"][-1]["available_at"] = "2026-06-15T13:59:59+02:00"
        self.assertEqual(expected_rules(truth, request("alpha-api")), ["same-instant"])

    def test_cross_scope_requests_are_resolved_separately_and_deduplicated(self):
        truth = oracle_fixture()
        self.assertEqual(set(expected_rules(truth, request("alpha", "beta", "alpha-api"))),
                         {"alpha-rule", "beta-rule"})
        self.assertEqual(len(expected_rules(truth, request("alpha", "alpha-api"))), 1)

    def test_empty_request_has_no_gold_and_stored_gold_is_ignored(self):
        truth = oracle_fixture()
        case = request("alpha")
        case["requests"] = []
        case["gold_memory_ids"] = ["alpha-rule"]
        self.assertEqual(expected_rules(truth, case), [])
        case = request("alpha")
        case["gold_memory_ids"] = ["beta-rule"]
        self.assertEqual(expected_rules(truth, case), ["alpha-rule"])

    def test_unresolved_or_ambiguous_requests_are_rejected(self):
        truth = oracle_fixture()
        with self.assertRaises(ValueError):
            expected_rules(truth, request("alpha", topic="unknown"))
        truth["rules"].append(rule("same-rank", "platforms/alpha"))
        with self.assertRaises(ValueError):
            expected_rules(truth, request("alpha"))

    def test_global_rule_can_apply_to_multiple_unrelated_entities(self):
        truth = oracle_fixture()
        truth["rules"].append(rule("global-audit", ".", topic="audit"))
        self.assertEqual(expected_rules(truth, request("alpha", "beta", topic="audit")),
                         ["global-audit"])


class GeneratedDatasetTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = build_dataset(seed=20261109, distractor_scopes=48)

    def test_frozen_case_matrix_and_nonroot_coverage(self):
        cases = self.data["cases"]
        self.assertEqual(len(cases), 40)
        expected = {
            "dev": {"local": 3, "override": 1, "cross_scope": 2, "global": 1, "negative": 1},
            "test": {"local": 12, "override": 6, "cross_scope": 6, "global": 4, "negative": 4},
        }
        for split, families in expected.items():
            with self.subTest(split=split):
                selected = [case for case in cases if case["split"] == split]
                self.assertEqual(Counter(case["scenario_family"] for case in selected), families)
        self.assertGreaterEqual(sum(case["scope"] != "." for case in cases
                                    if case["split"] == "test"), 24)

    def test_every_case_gold_is_recomputed_from_scene_truth(self):
        truth = self.data["scene_truth"]
        scenes = {case["case_id"]: case for case in truth["cases"]}
        memory_for_rule = {memory["source"]["rule_id"]: memory["memory_id"]
                           for memory in self.data["memories"]}
        for case in self.data["cases"]:
            with self.subTest(case=case["case_id"]):
                scene = scenes[case["source"]["scene_id"]]
                independently_resolved = {memory_for_rule[rid] for rid in expected_rules(truth, scene)}
                self.assertEqual(set(case["gold_memory_ids"]), independently_resolved)
                self.assertLessEqual(len(independently_resolved), 5)
                self.assertEqual(bool(independently_resolved), case["scenario_family"] != "negative")

    def test_dev_and_test_entities_are_disjoint_including_cross_scope_requests(self):
        truth = self.data["scene_truth"]
        entities = {entity["entity_id"]: entity for entity in truth["entities"]}
        scenes = {case["case_id"]: case for case in truth["cases"]}
        used = {"dev": set(), "test": set()}
        for case in self.data["cases"]:
            scene = scenes[case["source"]["scene_id"]]
            referenced = {scene["entity_id"], *(item["entity_id"] for item in scene["requests"])}
            for entity_id in referenced:
                self.assertEqual(entities[entity_id]["split"], case["split"])
            used[case["split"]].update(referenced)
        self.assertTrue(used["dev"])
        self.assertTrue(used["test"])
        self.assertFalse(used["dev"] & used["test"])
        self.assertFalse({entities[e]["label"] for e in used["dev"]}
                         & {entities[e]["label"] for e in used["test"]})

    def test_both_existing_schema_validators_accept_generated_data(self):
        stats = dataset.validate_dataset(self.data)
        self.assertEqual(stats["splits"], {"dev": 8, "test": 32})
        run.validate_dataset(self.data)
        validate_synthetic(self.data)

    def test_gold_never_contains_future_or_equal_time_memories(self):
        memories = {memory["memory_id"]: memory for memory in self.data["memories"]}
        self.assertTrue(any(dataset.timestamp(memory["available_at"]) >=
                            dataset.timestamp(self.data["cases"][0]["query_at"])
                            for memory in memories.values()), "the corpus needs future distractors")
        for case in self.data["cases"]:
            for mid in case["gold_memory_ids"]:
                self.assertLess(dataset.timestamp(memories[mid]["available_at"]),
                                dataset.timestamp(case["query_at"]))

    def test_equal_time_and_future_gold_mutations_are_rejected_by_both_schemas(self):
        for available_at in (self.data["cases"][0]["query_at"], "2099-01-01T00:00:00Z"):
            changed = copy.deepcopy(self.data)
            case = next(case for case in changed["cases"] if case["gold_memory_ids"])
            memory = next(memory for memory in changed["memories"]
                          if memory["memory_id"] == case["gold_memory_ids"][0])
            memory["available_at"] = available_at
            for validator in (dataset.validate_dataset, run.validate_dataset, validate_synthetic):
                with self.subTest(available_at=available_at, validator=validator.__module__), self.assertRaises(ValueError):
                    validator(changed)

    def test_missing_and_extra_gold_are_rejected_even_when_schema_is_valid(self):
        for replacement in ([], "unrelated"):
            changed = copy.deepcopy(self.data)
            case = next(case for case in changed["cases"] if case["gold_memory_ids"])
            if replacement == "unrelated":
                unrelated = next(memory for memory in changed["memories"]
                                 if memory["memory_id"] not in case["gold_memory_ids"]
                                 and dataset.timestamp(memory["available_at"])
                                 < dataset.timestamp(case["query_at"]))
                case["gold_memory_ids"].append(unrelated["memory_id"])
            else:
                case["gold_memory_ids"] = replacement
            with self.subTest(replacement=replacement):
                dataset.validate_dataset(changed)
                run.validate_dataset(changed)
                with self.assertRaises(ValueError):
                    validate_synthetic(changed)

    def test_wrong_scope_gold_is_rejected(self):
        changed = copy.deepcopy(self.data)
        case = next(case for case in changed["cases"] if case["scenario_family"] == "local")
        ancestors = {".", case["scope"], *(path.as_posix() for path in PurePosixPath(case["scope"]).parents)}
        wrong = next(memory for memory in changed["memories"]
                     if memory["scope"] not in ancestors
                     and dataset.timestamp(memory["available_at"]) < dataset.timestamp(case["query_at"]))
        case["gold_memory_ids"] = [wrong["memory_id"]]
        dataset.validate_dataset(changed)
        run.validate_dataset(changed)
        with self.assertRaises(ValueError):
            validate_synthetic(changed)

    def test_overridden_ancestor_cannot_replace_the_local_gold(self):
        changed = copy.deepcopy(self.data)
        case = next(case for case in changed["cases"] if case["scenario_family"] == "override")
        memories = {memory["memory_id"]: memory for memory in changed["memories"]}
        rules = {item["rule_id"]: item for item in changed["scene_truth"]["rules"]}
        winner = rules[memories[case["gold_memory_ids"][0]]["source"]["rule_id"]]
        ancestors = {path.as_posix() for path in PurePosixPath(winner["owner_scope"]).parents}
        overridden = next(memory for memory in changed["memories"]
                          if memory["scope"] in ancestors
                          and rules[memory["source"]["rule_id"]]["topic"] == winner["topic"]
                          and dataset.timestamp(memory["available_at"]) < dataset.timestamp(case["query_at"]))
        case["gold_memory_ids"] = [overridden["memory_id"]]
        dataset.validate_dataset(changed)
        run.validate_dataset(changed)
        with self.assertRaises(ValueError):
            validate_synthetic(changed)

    def test_rendered_memory_and_truth_cannot_drift_apart(self):
        for field in ("body", "scope"):
            changed = copy.deepcopy(self.data)
            changed["memories"][0][field] = "A different synthetic rule." if field == "body" else "another/scope"
            with self.subTest(field=field), self.assertRaises(ValueError):
                validate_synthetic(changed)

    def test_duplicate_cases_queries_and_memories_are_rejected(self):
        for kind in ("case", "query", "memory"):
            changed = copy.deepcopy(self.data)
            if kind == "case":
                changed["cases"].append(copy.deepcopy(changed["cases"][0]))
            elif kind == "query":
                changed["cases"][1]["question"] = "  " + changed["cases"][0]["question"] + " \n"
            else:
                changed["memories"].append(copy.deepcopy(changed["memories"][0]))
            with self.subTest(kind=kind), self.assertRaises(ValueError):
                validate_synthetic(changed)

    def test_duplicate_truth_identities_are_rejected(self):
        for collection in ("entities", "rules", "cases"):
            changed = copy.deepcopy(self.data)
            items = changed["scene_truth"][collection]
            items.append(copy.deepcopy(items[0]))
            with self.subTest(collection=collection), self.assertRaises(ValueError):
                validate_synthetic(changed)

    def test_questions_do_not_disclose_memory_ids_or_file_paths(self):
        ids = {memory["memory_id"] for memory in self.data["memories"]}
        ids.update(item["rule_id"] for item in self.data["scene_truth"]["rules"])
        ids.update(item["entity_id"] for item in self.data["scene_truth"]["entities"])
        scopes = {memory["scope"] for memory in self.data["memories"] if memory["scope"] != "."}
        for case in self.data["cases"]:
            with self.subTest(case=case["case_id"]):
                question = case["question"]
                for hint in ids | scopes | {".edges/", "AGENTS.md", "MEMORY_INDEX.md"}:
                    self.assertNotIn(hint, question)

    def test_all_provenance_is_synthetic_and_has_no_external_source_references(self):
        self.assertEqual(self.data["source"]["kind"], "synthetic")
        for memory in self.data["memories"]:
            self.assertEqual(set(memory["source"]), {"kind", "generator", "rule_id"})
            self.assertEqual(memory["source"]["kind"], "synthetic")
            self.assertIn("虚构业务", memory["body"])
        for case in self.data["cases"]:
            self.assertEqual(set(case["source"]),
                             {"kind", "scene_id", "session_id", "trace_id", "observation_id"})
            self.assertEqual(case["source"]["kind"], "synthetic")
            for field, prefix in (("session_id", "session"), ("trace_id", "trace"),
                                  ("observation_id", "observation")):
                self.assertRegex(case["source"][field], rf"^{prefix}-[0-9a-f]{{24}}$")
            self.assertNotIn("question_original", case)
            self.assertNotIn("question_normalized", case)
        serialized = json.dumps(self.data, ensure_ascii=False)
        for external_hint in ("/Users/", "/home/", "file://", "langfuse.com", "PRIVATE"):
            self.assertNotIn(external_hint, serialized)

    def test_building_uses_no_filesystem_input_or_network(self):
        with patch("builtins.open", side_effect=AssertionError("unexpected file input")), \
             patch("pathlib.Path.read_bytes", side_effect=AssertionError("unexpected byte input")), \
             patch("pathlib.Path.read_text", side_effect=AssertionError("unexpected text input")), \
             patch("socket.socket", side_effect=AssertionError("unexpected network")):
            self.assertEqual(build_dataset(seed=20261109, distractor_scopes=48), self.data)


class ArtifactTests(unittest.TestCase):
    def test_manifest_hashes_bind_the_dataset_and_reports(self):
        data = build_dataset(seed=20261109, distractor_scopes=48)
        with tempfile.TemporaryDirectory() as temporary:
            output = Path(temporary) / "artifacts"
            write_artifacts(output, data)
            artifacts = files_under(output)
            self.assertEqual(set(artifacts),
                             {"data-v1.json", "DATA_REPORT.json", "DATA_REPORT.md", "BUILD_MANIFEST.json"})
            self.assertEqual(json.loads(artifacts["data-v1.json"]), data)
            manifest = json.loads(artifacts["BUILD_MANIFEST.json"])
            self.assertEqual(set(manifest["artifacts"]), set(artifacts) - {"BUILD_MANIFEST.json"})
            for name, digest in manifest["artifacts"].items():
                self.assertEqual(hashlib.sha256(artifacts[name]).hexdigest(), digest)
            report = json.loads(artifacts["DATA_REPORT.json"])
            self.assertEqual(report["dataset_sha256"], manifest["artifacts"]["data-v1.json"])

    def test_same_seed_reproduces_all_artifact_bytes(self):
        first = build_dataset(seed=20261109, distractor_scopes=48)
        second = build_dataset(seed=20261109, distractor_scopes=48)
        self.assertEqual(first, second)
        with tempfile.TemporaryDirectory() as temporary:
            left, right = Path(temporary) / "left", Path(temporary) / "right"
            write_artifacts(left, first)
            write_artifacts(right, second)
            self.assertTrue(files_under(left))
            self.assertEqual(files_under(left), files_under(right))

    def test_a_different_seed_changes_the_actual_synthetic_content(self):
        first = build_dataset(seed=20261109, distractor_scopes=48)
        second = build_dataset(seed=20261110, distractor_scopes=48)
        self.assertNotEqual([case["question"] for case in first["cases"]],
                            [case["question"] for case in second["cases"]])
        self.assertNotEqual([memory["body"] for memory in first["memories"]],
                            [memory["body"] for memory in second["memories"]])

    def test_repeating_identical_input_is_idempotent(self):
        data = build_dataset(seed=20261109, distractor_scopes=48)
        with tempfile.TemporaryDirectory() as temporary:
            output = Path(temporary) / "artifacts"
            write_artifacts(output, data)
            before = files_under(output)
            write_artifacts(output, copy.deepcopy(data))
            self.assertEqual(files_under(output), before)

    def test_changed_seed_or_distractor_count_cannot_overwrite_existing_artifacts(self):
        original = build_dataset(seed=20261109, distractor_scopes=48)
        for seed, distractor_scopes in ((20261110, 48), (20261109, 49)):
            with self.subTest(seed=seed, distractor_scopes=distractor_scopes):
                replacement = build_dataset(seed=seed, distractor_scopes=distractor_scopes)
                with tempfile.TemporaryDirectory() as temporary:
                    output = Path(temporary) / "artifacts"
                    write_artifacts(output, original)
                    before = files_under(output)
                    with self.assertRaises(ValueError):
                        write_artifacts(output, replacement)
                    self.assertEqual(files_under(output), before)

    def test_cli_reproduces_the_api_output_without_model_or_network(self):
        with tempfile.TemporaryDirectory() as temporary:
            via_cli, via_api = Path(temporary) / "cli", Path(temporary) / "api"
            result = subprocess.run(
                [sys.executable, "-m", "synthetic.generate", "--seed", "20261109",
                 "--distractor-scopes", "48", "--output", str(via_cli)],
                cwd=HERE, capture_output=True, text=True, timeout=30,
            )
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
            write_artifacts(via_api, build_dataset(seed=20261109, distractor_scopes=48))
            self.assertEqual(files_under(via_cli), files_under(via_api))


if __name__ == "__main__":
    unittest.main()
