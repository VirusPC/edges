#!/usr/bin/env python3
"""Layer Memory Type discovery and add-type (ADR 0006)."""

from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parents[1]
if str(SCRIPTS) not in sys.path:
    sys.path.insert(0, str(SCRIPTS))

from lib.blocks import index_files
from lib.types import (  # noqa: E402
    SEED_TYPE_NAMES,
    discover_layer_types,
    index_file_name,
    seed_index_files,
    validate_type_name,
)
from operations.init import init_memory  # noqa: E402
from operations.remember import remember  # noqa: E402


class SeedIsolationTests(unittest.TestCase):
    def test_seed_index_files_is_the_template_map(self) -> None:
        self.assertEqual(seed_index_files(), index_files())
        self.assertEqual(
            list(seed_index_files()),
            ["user", "feedback", "project", "reference", "skills", "agent_skills"],
        )
        self.assertEqual(SEED_TYPE_NAMES, tuple(seed_index_files()))

    def test_init_seeds_do_not_include_example_types(self) -> None:
        files = seed_index_files()
        for name in ("docs", "progress", "tasks", "research", "reminder", "scheduler"):
            self.assertNotIn(name, files)

    def test_index_file_name_uppercases(self) -> None:
        self.assertEqual(index_file_name("docs"), "DOCS.md")
        self.assertEqual(index_file_name("agent_skills"), "AGENT_SKILLS.md")


class ValidateTypeNameTests(unittest.TestCase):
    def test_accepts_snake_case(self) -> None:
        self.assertEqual(validate_type_name("docs"), "docs")
        self.assertEqual(validate_type_name("my_type"), "my_type")

    def test_rejects_seeds(self) -> None:
        with self.assertRaises(ValueError) as ctx:
            validate_type_name("project")
        self.assertIn("官方种子", str(ctx.exception))

    def test_rejects_kebab_and_caps(self) -> None:
        with self.assertRaises(ValueError):
            validate_type_name("my-type")
        with self.assertRaises(ValueError):
            validate_type_name("Docs")


class DiscoverLayerTypesTests(unittest.TestCase):
    def test_fresh_init_discovers_only_seeds(self) -> None:
        with tempfile.TemporaryDirectory() as raw:
            target = Path(raw)
            init_memory(target, target, "temp tree")
            self.assertEqual(
                list(discover_layer_types(target)),
                list(seed_index_files()),
            )

    def test_discovers_extra_type_from_agents_local_line(self) -> None:
        with tempfile.TemporaryDirectory() as raw:
            target = Path(raw)
            init_memory(target, target, "temp tree")
            agents = target / "AGENTS.md"
            text = agents.read_text(encoding="utf-8")
            text = text.replace(
                "<!-- project-memory-local:end -->",
                "- [.memory/DOCS.md](.memory/DOCS.md) — 文档指针\n"
                "<!-- project-memory-local:end -->",
            )
            agents.write_text(text, encoding="utf-8")
            (target / ".memory" / "DOCS.md").write_text(
                "<!-- project-memory-entries:start -->\n- 暂无条目。\n"
                "<!-- project-memory-entries:end -->\n",
                encoding="utf-8",
            )
            discovered = discover_layer_types(target)
            self.assertIn("docs", discovered)
            self.assertEqual(discovered["docs"], "DOCS.md")
            self.assertEqual(list(discovered)[:6], list(seed_index_files()))
            self.assertEqual(list(discovered)[-1], "docs")

    def test_discovers_entry_file_not_yet_listed_in_agents(self) -> None:
        with tempfile.TemporaryDirectory() as raw:
            target = Path(raw)
            init_memory(target, target, "temp tree")
            (target / ".memory" / "RESEARCH.md").write_text(
                "<!-- project-memory-entries:start -->\n- 暂无条目。\n"
                "<!-- project-memory-entries:end -->\n",
                encoding="utf-8",
            )
            discovered = discover_layer_types(target)
            self.assertEqual(discovered["research"], "RESEARCH.md")


class PreserveExtraTypesTests(unittest.TestCase):
    def _add_docs_line(self, target: Path) -> None:
        agents = target / "AGENTS.md"
        text = agents.read_text(encoding="utf-8")
        agents.write_text(
            text.replace(
                "<!-- project-memory-local:end -->",
                "- [.memory/DOCS.md](.memory/DOCS.md) — 文档指针\n"
                "<!-- project-memory-local:end -->",
            ),
            encoding="utf-8",
        )
        (target / ".memory" / "DOCS.md").write_text(
            "<!-- project-memory-entries:start -->\n- 暂无条目。\n"
            "<!-- project-memory-entries:end -->\n",
            encoding="utf-8",
        )
        (target / ".memory" / "docs").mkdir(exist_ok=True)

    def test_init_on_existing_layer_keeps_extra_local_line(self) -> None:
        with tempfile.TemporaryDirectory() as raw:
            target = Path(raw)
            init_memory(target, target, "temp tree")
            self._add_docs_line(target)
            init_memory(target, target, "temp tree")
            local = (target / "AGENTS.md").read_text(encoding="utf-8")
            self.assertIn(".memory/DOCS.md", local)
            self.assertIn(".memory/USER.md", local)

    def test_remember_does_not_drop_extra_local_line(self) -> None:
        with tempfile.TemporaryDirectory() as raw:
            target = Path(raw)
            init_memory(target, target, "temp tree")
            self._add_docs_line(target)
            remember(
                target,
                "project",
                "keep_docs_line",
                "Keep extra type line",
                "remember must not rewrite local block back to seeds only",
                "Extra types stay.\n\n**Why:** ADR 0006 discovery.\n\n"
                "**How to apply:** merge, do not replace.",
                {"username": "tester", "email": "t@example.com"},
            )
            self.assertIn(
                ".memory/DOCS.md",
                (target / "AGENTS.md").read_text(encoding="utf-8"),
            )


if __name__ == "__main__":
    unittest.main()
