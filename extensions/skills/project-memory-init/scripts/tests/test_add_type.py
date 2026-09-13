#!/usr/bin/env python3
"""add-type: LAYOUT artifacts, privileges, example-type smoke helpers."""

from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parents[1]
if str(SCRIPTS) not in sys.path:
    sys.path.insert(0, str(SCRIPTS))

from lib.types import discover_layer_types  # noqa: E402
from operations.add_type import add_type  # noqa: E402
from operations.init import init_memory  # noqa: E402
from operations.remember import remember  # noqa: E402


class AddTypeLayoutTests(unittest.TestCase):
    def test_add_type_writes_entry_dir_and_agents_line(self) -> None:
        with tempfile.TemporaryDirectory() as raw:
            target = Path(raw)
            init_memory(target, target, "temp tree")
            result = add_type(target, "docs", "项目内文档指针，不是知识库正文")
            self.assertEqual(result["operation"], "add-type")
            self.assertEqual(result["type"], "docs")
            self.assertEqual(result["index"], ".memory/DOCS.md")
            self.assertEqual(result["contentDir"], ".memory/docs")
            self.assertEqual(result["action"], "created")
            self.assertTrue((target / ".memory" / "DOCS.md").is_file())
            self.assertTrue((target / ".memory" / "docs").is_dir())
            self.assertIn(
                ".memory/DOCS.md",
                (target / "AGENTS.md").read_text(encoding="utf-8"),
            )
            self.assertEqual(discover_layer_types(target)["docs"], "DOCS.md")
            self.assertFalse((target / "knowledge" / "tasks").exists())

    def test_add_type_rejects_uninitialized_target(self) -> None:
        with tempfile.TemporaryDirectory() as raw:
            with self.assertRaises(ValueError) as ctx:
                add_type(Path(raw), "docs", "nope")
            self.assertIn("init", str(ctx.exception))

    def test_add_type_rejects_seed_name(self) -> None:
        with tempfile.TemporaryDirectory() as raw:
            target = Path(raw)
            init_memory(target, target, "temp tree")
            with self.assertRaises(ValueError):
                add_type(target, "user", "should fail")

    def test_add_type_is_idempotent(self) -> None:
        with tempfile.TemporaryDirectory() as raw:
            target = Path(raw)
            init_memory(target, target, "temp tree")
            add_type(target, "docs", "项目内文档指针，不是知识库正文")
            again = add_type(target, "docs", "项目内文档指针，不是知识库正文")
            self.assertEqual(again["action"], "preserved")

    def test_remember_after_add_type(self) -> None:
        with tempfile.TemporaryDirectory() as raw:
            target = Path(raw)
            init_memory(target, target, "temp tree")
            add_type(target, "docs", "项目内文档指针，不是知识库正文")
            remember(
                target,
                "docs",
                "readme_pointer",
                "README is the truth source",
                "docs type holds pointers, not copies of the README",
                "Link the README.\n\n**Why:** no docs bucket.\n\n"
                "**How to apply:** remember --type docs.",
                {"username": "tester", "email": "t@example.com"},
            )
            self.assertTrue(
                (target / ".memory" / "docs" / "docs_readme_pointer.md").is_file()
            )


if __name__ == "__main__":
    unittest.main()
