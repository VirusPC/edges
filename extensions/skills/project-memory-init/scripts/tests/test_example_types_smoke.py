#!/usr/bin/env python3
"""ADR 0006 example types: smoke only, never official init seeds."""

from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parents[1]
if str(SCRIPTS) not in sys.path:
    sys.path.insert(0, str(SCRIPTS))

from lib.paths import type_content_dir, type_dir_name  # noqa: E402
from lib.templates import template_path  # noqa: E402
from lib.types import discover_layer_types, seed_index_files  # noqa: E402
from operations.add_type import add_type  # noqa: E402
from operations.doctor import doctor_memory  # noqa: E402
from operations.init import init_memory  # noqa: E402
from operations.remember import remember  # noqa: E402

EXAMPLE_TYPES: tuple[tuple[str, str], ...] = (
    ("docs", "项目内文档指针，不是知识库正文"),
    ("progress", "进行中的进度快照，不是可提交决策"),
    ("tasks", "项目记忆里的任务备忘，不是 knowledge/tasks 看板"),
    ("research", "调研笔记指针，不是 reference 外部源头"),
    ("reminder", "提醒与到期事项"),
    ("scheduler", "调度与周期动作"),
)


class ExampleTypesAreNotSeedsTests(unittest.TestCase):
    def test_template_and_seed_map_omit_examples(self) -> None:
        seeds = seed_index_files()
        template = template_path("AGENTS.md").read_text(encoding="utf-8")
        for name, _description in EXAMPLE_TYPES:
            self.assertNotIn(name, seeds)
            self.assertNotIn(f".memory/{name.upper()}.md", template)


class ExampleTypesSmokeTests(unittest.TestCase):
    def test_add_remember_doctor_init_roundtrip(self) -> None:
        with tempfile.TemporaryDirectory() as raw:
            target = Path(raw)
            init_memory(target, target, "example smoke")
            for name, description in EXAMPLE_TYPES:
                add_type(target, name, description)
                self.assertTrue((target / ".memory" / f"{name.upper()}.md").is_file())
                self.assertEqual(
                    type_content_dir(target, name),
                    target / ".memory" / type_dir_name(name),
                )
            self.assertFalse((target / "knowledge").exists())
            self.assertEqual(
                type_content_dir(target, "tasks"),
                target / ".memory" / "tasks",
            )
            remember(
                target,
                "docs",
                "layout_pointer",
                "LAYOUT is the extension surface",
                "example docs type is a pointer slot, not a seed",
                "Use add-type, not AGENTS.tmpl.md.\n\n"
                "**Why:** ADR 0006 smoke only.\n\n"
                "**How to apply:** keep examples out of seeds.",
                {"username": "tester", "email": "t@example.com"},
            )
            self.assertTrue(
                (target / ".memory" / "docs" / "docs_layout_pointer.md").is_file()
            )
            remember(
                target,
                "tasks",
                "not_the_board",
                "tasks Memory Type is not the board",
                "ordinary memory, not knowledge/tasks status folders",
                "Do not move board files.\n\n**Why:** ADR 0006.\n\n"
                "**How to apply:** write .memory/tasks/ only.",
                {"username": "tester", "email": "t@example.com"},
            )
            self.assertTrue(
                (target / ".memory" / "tasks" / "tasks_not_the_board.md").is_file()
            )
            self.assertEqual(doctor_memory(target, apply=False)["findings"], [])
            init_memory(target, target, "example smoke")
            agents = (target / "AGENTS.md").read_text(encoding="utf-8")
            for name, _description in EXAMPLE_TYPES:
                self.assertIn(f".memory/{name.upper()}.md", agents)
                self.assertIn(name, discover_layer_types(target))
            self.assertEqual(doctor_memory(target, apply=True)["remaining"], [])


if __name__ == "__main__":
    unittest.main()
