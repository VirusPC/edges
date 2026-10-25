"""Dataset items are not local case files. The adapter has to map them.

Production change that should fail this test: reading `ground_truth` as a
question, or dropping metadata.case_id / expectedOutput.criteria.
"""

from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

import support  # noqa: F401  # quiets expected failure logs

from experiment_webhook.dispatch import RunContext, RunFailure
from experiment_webhook.runners.harness_memory_ablation import adapt_items, run


ITEM = {
    "id": "harness-memory-ablation-S01",
    "status": "ACTIVE",
    "input": {"question": "本仓把 LoCoMo 冒烟分数写成项目记忆有效，可以吗？"},
    "expectedOutput": {
        "criteria": ["不可以。这是评测冒烟，不是公开基准证明"],
        "violations": ["把 LoCoMo 冒烟分数写成项目记忆有效"],
    },
    "metadata": {"category": "memory-dependent", "case_id": "S01"},
}


class AdapterTests(unittest.TestCase):
    def test_maps_dataset_item_and_rejects_path_retrieval(self) -> None:
        cases = adapt_items([ITEM, dict(ITEM, id="archived", status="ARCHIVED", metadata={"case_id": "S09", "category": "memory-dependent"})])
        self.assertEqual(len(cases), 1)
        self.assertEqual(cases[0]["case_id"], "S01")
        self.assertEqual(cases[0]["id"], "harness-memory-ablation-S01")
        self.assertEqual(cases[0]["question"], "本仓把 LoCoMo 冒烟分数写成项目记忆有效，可以吗？")
        self.assertEqual(cases[0]["criteria"], ["不可以。这是评测冒烟，不是公开基准证明"])
        self.assertEqual(cases[0]["category"], "memory-dependent")
        with self.assertRaises(RunFailure) as raised:
            adapt_items([{"id": "path-1", "ground_truth": ["a"], "predicted": ["b"]}])
        self.assertEqual(raised.exception.code, "invalid_items")

    def test_json_string_payload_reaches_run_experiment(self) -> None:
        seen: dict[str, object] = {}

        def fake_run_experiment(**kwargs: object) -> dict[str, object]:
            seen["cases"] = kwargs["cases"]
            seen["memory_off"] = kwargs["memory_off"]
            return {"worth_default_on": False, "trials": [], "gates": []}

        def fake_load() -> tuple[object, object, object, object]:
            def select_cases(items: list[dict[str, object]], *, samples: int | None, case_ids: list[str] | None) -> list[dict[str, object]]:
                return items

            return fake_run_experiment, (lambda client_id: client_id), select_cases, (lambda flag: flag)

        import experiment_webhook.runners.harness_memory_ablation as adapter

        original = adapter._load_entrypoint
        adapter._load_entrypoint = fake_load  # type: ignore[method-assign]
        self.addCleanup(lambda: setattr(adapter, "_load_entrypoint", original))
        with tempfile.TemporaryDirectory() as tmp:
            off = Path(tmp) / "off"
            on = Path(tmp) / "on"
            off.mkdir()
            on.mkdir()
            payload = (
                '{"memoryOff": "%s", "memoryOn": "%s", "repeats": 1, "judge": "skip", "client": "codex"}'
                % (off, on)
            )
            result = run(
                RunContext(
                    run_id="run-1",
                    project_id="p",
                    dataset_id="d",
                    dataset_name="harness-memory-ablation/v1",
                    payload=payload,
                    items=[ITEM],
                    reports_dir=Path(tmp),
                )
            )
        self.assertEqual(seen["cases"][0]["case_id"], "S01")  # type: ignore[index]
        self.assertEqual(result["scores"][0]["name"], "worth_default_on")
        self.assertEqual(result["scores"][0]["value"], 0)
        self.assertEqual(result["items"][0]["id"], "harness-memory-ablation-S01")
