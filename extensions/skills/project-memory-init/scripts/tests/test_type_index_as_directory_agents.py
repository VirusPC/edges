#!/usr/bin/env python3
"""Type indexes live at .harness/memory/<plural>/AGENTS.md (ADR 0012)."""

from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parents[1]
if str(SCRIPTS) not in sys.path:
    sys.path.insert(0, str(SCRIPTS))

from lib.blocks import index_files  # noqa: E402
from lib.templates import read_template, template_path  # noqa: E402
from lib.types import (  # noqa: E402
    discover_layer_types,
    index_file_name,
    seed_index_files,
    type_index_template_name,
)
from operations.add_type import add_type  # noqa: E402
from operations.doctor import doctor_memory  # noqa: E402
from operations.init import init_memory as _init_memory  # noqa: E402
from operations.remember import remember  # noqa: E402


def init_memory(target, root, description=None):
    # These existing tests explicitly exercise all six official adopted types.
    (target / '.agents/skills').mkdir(parents=True, exist_ok=True)
    return _init_memory(target, root, description,
        memory_types=['user', 'feedback', 'project', 'reference'],
        skill_types=['managed', 'referenced'])


class SeedIndexPathTests(unittest.TestCase):
    def test_index_files_use_plural_agents(self) -> None:
        files = index_files()
        self.assertEqual(
            list(files),
            ["user", "feedback", "project", "reference", "managed", "referenced"],
        )
        self.assertEqual(files["user"], ".harness/memory/users/AGENTS.md")
        self.assertEqual(files["feedback"], ".harness/memory/feedbacks/AGENTS.md")
        self.assertEqual(files["project"], ".harness/memory/projects/AGENTS.md")
        self.assertEqual(files["reference"], ".harness/memory/references/AGENTS.md")
        self.assertEqual(files["managed"], ".harness/skills/managed/AGENTS.md")
        self.assertEqual(files["referenced"], ".harness/skills/referenced/AGENTS.md")
        self.assertNotIn("USER.md", files.values())
        self.assertEqual(seed_index_files(), files)

    def test_index_file_name_is_plural_agents(self) -> None:
        self.assertEqual(index_file_name("feedback"), ".harness/memory/feedbacks/AGENTS.md")
        self.assertEqual(index_file_name("user"), ".harness/memory/users/AGENTS.md")
        self.assertEqual(index_file_name("docs"), ".harness/memory/docs/AGENTS.md")
        self.assertEqual(index_file_name("referenced"), ".harness/skills/referenced/AGENTS.md")
        self.assertEqual(type_index_template_name("feedback"), "FEEDBACK.md")
        self.assertEqual(type_index_template_name("user"), "USER.md")
        self.assertEqual(type_index_template_name("docs"), "DOCS.md")

    def test_agents_template_links_plural_agents(self) -> None:
        text = template_path("AGENTS.md").read_text(encoding="utf-8")
        self.assertIn(".harness/memory/feedbacks/AGENTS.md", text)
        self.assertIn(".harness/memory/users/AGENTS.md", text)
        self.assertIn(".harness/skills/referenced/AGENTS.md", text)
        self.assertNotIn(".harness/memory/FEEDBACK.md", text)
        self.assertNotIn(".harness/memory/USER.md", text)
        self.assertNotIn(".harness/memory/DOCS.md", text)
        self.assertNotIn("project-memory-important:start", read_template("FEEDBACK.md"))


class InitTypeIndexTests(unittest.TestCase):
    def test_init_writes_type_agents_from_type_templates(self) -> None:
        with tempfile.TemporaryDirectory() as raw:
            target = Path(raw)
            _init_memory(target, target, "temp", memory_types=["user", "feedback", "project", "reference"], skill_types=["managed", "referenced"])
            feedback = (target / ".harness/memory" / "feedbacks" / "AGENTS.md").read_text(
                encoding="utf-8"
            )
            self.assertIn("project-memory-entries:start", feedback)
            self.assertIn("纠正与约束", feedback)
            self.assertNotIn("project-memory-important:start", feedback)
            self.assertNotIn("project-memory-local:start", feedback)
            self.assertFalse((target / ".harness/memory" / "FEEDBACK.md").exists())
            self.assertFalse((target / ".harness/memory" / "USER.md").exists())
            self.assertFalse((target / ".harness/memory" / "AGENT_SKILLS.md").exists())
            agents = (target / "AGENTS.md").read_text(encoding="utf-8")
            self.assertIn(".harness/memory/feedbacks/AGENTS.md", agents)
            self.assertIn(".harness/memory/users/AGENTS.md", agents)
            self.assertIn(".harness/skills/referenced/AGENTS.md", agents)
            self.assertNotIn(".harness/memory/FEEDBACK.md", agents)
            self.assertTrue((target / ".harness/memory" / "users" / "AGENTS.md").is_file())
            self.assertTrue((target / ".harness/skills" / "referenced" / "AGENTS.md").is_file())
            self.assertFalse((target / ".agents").exists())
            self.assertEqual(
                list(discover_layer_types(target)),
                list(seed_index_files()),
            )


class RememberAndAddTypePathTests(unittest.TestCase):
    def test_remember_feedback_indexes_same_dir(self) -> None:
        with tempfile.TemporaryDirectory() as raw:
            target = Path(raw)
            init_memory(target, target, "temp")
            result = remember(
                target,
                "feedback",
                "no_flat_index",
                "Do not write flat TYPE.md",
                "type index is feedbacks/AGENTS.md",
                "Use the colocated index.\n\n**Why:** ADR 0012.\n\n"
                "**How to apply:** open feedbacks/AGENTS.md.",
                {"username": "tester", "email": "t@example.com"},
            )
            self.assertEqual(result["index"], ".harness/memory/feedbacks/AGENTS.md")
            index = (target / ".harness/memory" / "feedbacks" / "AGENTS.md").read_text(
                encoding="utf-8"
            )
            self.assertIn("](feedback_no_flat_index.md)", index)
            self.assertNotIn("feedbacks/feedback_no_flat_index.md", index)

    def test_remember_user_index_is_users_agents(self) -> None:
        with tempfile.TemporaryDirectory() as raw:
            target = Path(raw)
            init_memory(target, target, "temp")
            result = remember(
                target,
                "user",
                "local_editor",
                "Prefer helix for git commits",
                "personal editor preference for this repo, not a team convention",
                "Use helix here.\n\n**Why:** personal.\n\n**How to apply:** do not commit.",
                {"username": "tester", "email": "t@example.com"},
            )
            self.assertEqual(result["index"], ".harness/memory/users/AGENTS.md")
            index = (target / ".harness/memory" / "users" / "AGENTS.md").read_text(
                encoding="utf-8"
            )
            self.assertIn("](user_local_editor.md)", index)

    def test_add_type_docs_writes_docs_agents(self) -> None:
        with tempfile.TemporaryDirectory() as raw:
            target = Path(raw)
            init_memory(target, target, "temp")
            result = add_type(target, "docs", "项目内文档指针，不是知识库正文")
            self.assertEqual(result["index"], ".harness/memory/docs/AGENTS.md")
            self.assertTrue((target / ".harness/memory" / "docs" / "AGENTS.md").is_file())
            self.assertFalse((target / ".harness/memory" / "DOCS.md").exists())
            self.assertEqual(discover_layer_types(target)["docs"], ".harness/memory/docs/AGENTS.md")
            self.assertIn(
                ".harness/memory/docs/AGENTS.md",
                (target / "AGENTS.md").read_text(encoding="utf-8"),
            )
            docs = (target / ".harness/memory" / "docs" / "AGENTS.md").read_text(encoding="utf-8")
            self.assertIn("project-memory-type:start", docs)
            self.assertNotIn("project-memory-important:start", docs)
