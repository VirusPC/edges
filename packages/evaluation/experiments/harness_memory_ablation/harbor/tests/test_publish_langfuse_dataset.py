import copy
import json
from pathlib import Path
import sys
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import publish_langfuse_dataset as publisher


class PublisherTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.path = Path(self.tmp.name) / "dataset.json"
        self.source = {
            "schema_version": 1,
            "provenance": {"revision": "fixture", "optional": None},
            "scene_truth": {"scene": {"gold": ["m-1"], "review_only": "secret answer"}},
            "memories": [
                {"memory_id": "m-1", "scope": "project", "title": "Rule", "body": "保留证据。",
                 "available_at": "2026-10-01T00:00:00Z", "source": {"revision": "old"}},
                {"memory_id": "m-2", "scope": "project", "title": "Future", "body": "Later rule.",
                 "available_at": "2026-12-01T00:00:00Z", "source": {"revision": "future"}},
            ],
            "cases": [
                {"case_id": "c-1", "question": "Which rule applies?", "scope": "project",
                 "query_at": "2026-11-01T00:00:00Z", "task_mode": "memory_qa", "split": "dev",
                 "gold_memory_ids": ["m-1"], "reference_answer": None, "answer_checks": [],
                 "review": {"approved": True, "notes": "secret answer"},
                 "source": {"trace_id": "synthetic-not-a-real-trace"}},
                {"case_id": "c-2", "question": "Is there another rule?", "scope": ".",
                 "query_at": "2026-11-02T00:00:00Z", "split": "test", "gold_memory_ids": [],
                 "forbidden_patterns": [], "annotation_notes": None,
                 "source": {"session_id": "s-2"}},
            ],
        }
        self.path.write_text(json.dumps(self.source, ensure_ascii=False), encoding="utf-8")

    def plan(self, key="fixture"):
        return publisher.build_plan(key, self.path, "test-publication")

    def test_complete_roundtrip_preserves_order_future_memory_and_optional_fields(self):
        cases, corpus = self.plan()["specs"]
        restored = publisher.reconstruct(
            cases["dataset"], dict(reversed(list(cases["items"].items()))),
            dict(reversed(list(corpus["items"].items()))))
        self.assertEqual(restored, self.source)
        self.assertEqual(publisher.digest(restored), publisher.digest(self.source))
        self.assertIsNone(restored["cases"][0]["reference_answer"])
        self.assertEqual(restored["cases"][0]["answer_checks"], [])
        self.assertNotIn("reference_answer", restored["cases"][1])
        self.assertNotIn("answer_checks", restored["cases"][1])

    def test_only_task_fields_reach_case_input(self):
        cases, corpus = self.plan()["specs"]
        for row in cases["items"].values():
            self.assertLessEqual(set(row["input"]), {"question", "query_at", "scope", "task_mode"})
            self.assertNotIn("secret answer", json.dumps(row["input"]))
            self.assertNotIn("sourceTraceId", row)
            self.assertNotIn("sourceObservationId", row)
            self.assertIn("gold_memory_ids", row["expectedOutput"])
        self.assertEqual(len(corpus["items"]), 2, "Publication must retain future memories")
        self.assertEqual(cases["dataset"]["metadata"]["source_header"]["scene_truth"],
                         self.source["scene_truth"])

    def test_ids_are_repeatable_and_namespaced_for_project_wide_uniqueness(self):
        first, repeat, other = self.plan(), self.plan(), self.plan("another-dataset")
        first_ids = [set(spec["items"]) for spec in first["specs"]]
        self.assertEqual(first_ids, [set(spec["items"]) for spec in repeat["specs"]])
        self.assertTrue(first_ids[0].isdisjoint(first_ids[1]))
        self.assertTrue(set.union(*first_ids).isdisjoint(
            set.union(*(set(spec["items"]) for spec in other["specs"]))))

    def test_existing_item_changes_are_rejected(self):
        expected = next(iter(self.plan()["specs"][0]["items"].values()))
        publisher.assert_item({**expected, "createdAt": "server-owned"}, expected)
        for field, replacement in [("datasetName", "unrelated"), ("status", "ARCHIVED"),
                                   ("expectedOutput", {}), ("metadata", {}), ("input", {})]:
            with self.subTest(field=field):
                changed = copy.deepcopy(expected)
                changed[field] = replacement
                with self.assertRaises(ValueError):
                    publisher.assert_item(changed, expected)

    def test_existing_dataset_changes_and_wrong_project_are_rejected(self):
        expected = self.plan()["specs"][0]["dataset"]
        remote = {**copy.deepcopy(expected), "projectId": "p-1", "id": "server-id"}
        publisher.assert_dataset(remote, expected, "p-1")
        changed = copy.deepcopy(remote)
        changed["metadata"]["source_header"]["scene_truth"] = {}
        with self.assertRaises(ValueError):
            publisher.assert_dataset(changed, expected, "p-1")
        with self.assertRaises(ValueError):
            publisher.assert_dataset(remote, expected, "p-2")

    def test_reconstruction_rejects_verifier_field_overwriting_input(self):
        cases, corpus = self.plan()["specs"]
        row = next(iter(cases["items"].values()))
        row["metadata"]["original_fields"]["question"] = "leaked replacement"
        with self.assertRaisesRegex(ValueError, "Overlapping"):
            publisher.reconstruct(cases["dataset"], cases["items"], corpus["items"])

    def test_pagination_requires_complete_unique_stable_snapshot(self):
        class OfflineClient(publisher.Client):
            def __init__(self, pages):
                self.pages = iter(pages)
                self.next_page = 1

            def request(self, method, endpoint, payload=None, params=None, missing_ok=False):
                if method != "GET" or params["page"] != self.next_page:
                    raise AssertionError("Unexpected pagination request")
                self.next_page += 1
                return next(self.pages)

        def page(ids, total=2, pages=2):
            return {"data": [{"id": key} for key in ids],
                    "meta": {"totalItems": total, "totalPages": pages}}

        self.assertEqual(set(OfflineClient([page(["a"]), page(["b"])]).items("fixture")), {"a", "b"})
        for label, pages in [
            ("Duplicate", [page(["a"]), page(["a"])]),
            ("Incomplete", [page(["a"]), page([])]),
            ("changed", [page(["a"]), page(["b"], total=3)]),
        ]:
            with self.subTest(label=label), self.assertRaisesRegex(ValueError, label):
                OfflineClient(pages).items("fixture")


if __name__ == "__main__":
    unittest.main()
