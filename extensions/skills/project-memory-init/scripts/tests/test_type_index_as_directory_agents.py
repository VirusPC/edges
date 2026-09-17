#!/usr/bin/env python3
"""Type indexes live at .memory/<plural>/AGENTS.md (ADR 0012)."""

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
from operations.init import init_memory  # noqa: E402
from operations.remember import remember  # noqa: E402


class SeedIndexPathTests(unittest.TestCase):
    def test_index_files_use_plural_agents(self) -> None:
        files = index_files()
        self.assertEqual(
            list(files),
            ["user", "feedback", "project", "reference", "skills", "agent_skills"],
        )
        self.assertEqual(files["user"], "users/AGENTS.md")
        self.assertEqual(files["feedback"], "feedbacks/AGENTS.md")
        self.assertEqual(files["project"], "projects/AGENTS.md")
        self.assertEqual(files["reference"], "references/AGENTS.md")
        self.assertEqual(files["skills"], "skills/AGENTS.md")
        self.assertEqual(files["agent_skills"], "agent_skills/AGENTS.md")
        self.assertNotIn("USER.md", files.values())
        self.assertEqual(seed_index_files(), files)

    def test_index_file_name_is_plural_agents(self) -> None:
        self.assertEqual(index_file_name("feedback"), "feedbacks/AGENTS.md")
        self.assertEqual(index_file_name("user"), "users/AGENTS.md")
        self.assertEqual(index_file_name("docs"), "docs/AGENTS.md")
        self.assertEqual(index_file_name("agent_skills"), "agent_skills/AGENTS.md")
        self.assertEqual(type_index_template_name("feedback"), "FEEDBACK.md")
        self.assertEqual(type_index_template_name("user"), "USER.md")
        self.assertEqual(type_index_template_name("docs"), "DOCS.md")

    def test_agents_template_links_plural_agents(self) -> None:
        text = template_path("AGENTS.md").read_text(encoding="utf-8")
        self.assertIn(".memory/feedbacks/AGENTS.md", text)
        self.assertIn(".memory/users/AGENTS.md", text)
        self.assertIn(".memory/agent_skills/AGENTS.md", text)
        self.assertNotIn(".memory/FEEDBACK.md", text)
        self.assertNotIn(".memory/USER.md", text)
        self.assertNotIn(".memory/DOCS.md", text)
        self.assertNotIn("project-memory-important:start", read_template("FEEDBACK.md"))


class InitTypeIndexTests(unittest.TestCase):
    def test_init_writes_type_agents_from_type_templates(self) -> None:
        with tempfile.TemporaryDirectory() as raw:
            target = Path(raw)
            init_memory(target, target, "temp")
            feedback = (target / ".memory" / "feedbacks" / "AGENTS.md").read_text(
                encoding="utf-8"
            )
            self.assertIn("project-memory-entries:start", feedback)
            self.assertIn("纠正与约束", feedback)
            self.assertNotIn("project-memory-important:start", feedback)
            self.assertNotIn("project-memory-local:start", feedback)
            self.assertFalse((target / ".memory" / "FEEDBACK.md").exists())
            self.assertFalse((target / ".memory" / "USER.md").exists())
            self.assertFalse((target / ".memory" / "AGENT_SKILLS.md").exists())
            agents = (target / "AGENTS.md").read_text(encoding="utf-8")
            self.assertIn(".memory/feedbacks/AGENTS.md", agents)
            self.assertIn(".memory/users/AGENTS.md", agents)
            self.assertIn(".memory/agent_skills/AGENTS.md", agents)
            self.assertNotIn(".memory/FEEDBACK.md", agents)
            self.assertTrue((target / ".memory" / "users" / "AGENTS.md").is_file())
            self.assertTrue((target / ".memory" / "agent_skills" / "AGENTS.md").is_file())
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
            self.assertEqual(result["index"], ".memory/feedbacks/AGENTS.md")
            index = (target / ".memory" / "feedbacks" / "AGENTS.md").read_text(
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
            self.assertEqual(result["index"], ".memory/users/AGENTS.md")
            index = (target / ".memory" / "users" / "AGENTS.md").read_text(
                encoding="utf-8"
            )
            self.assertIn("](user_local_editor.md)", index)

    def test_add_type_docs_writes_docs_agents(self) -> None:
        with tempfile.TemporaryDirectory() as raw:
            target = Path(raw)
            init_memory(target, target, "temp")
            result = add_type(target, "docs", "项目内文档指针，不是知识库正文")
            self.assertEqual(result["index"], ".memory/docs/AGENTS.md")
            self.assertTrue((target / ".memory" / "docs" / "AGENTS.md").is_file())
            self.assertFalse((target / ".memory" / "DOCS.md").exists())
            self.assertEqual(discover_layer_types(target)["docs"], "docs/AGENTS.md")
            self.assertIn(
                ".memory/docs/AGENTS.md",
                (target / "AGENTS.md").read_text(encoding="utf-8"),
            )
            docs = (target / ".memory" / "docs" / "AGENTS.md").read_text(encoding="utf-8")
            self.assertIn("project-memory-type:start", docs)
            self.assertNotIn("project-memory-important:start", docs)


class DoctorLegacyFlatIndexTests(unittest.TestCase):
    def test_migrates_feedback_md_then_deletes_old(self) -> None:
        with tempfile.TemporaryDirectory() as raw:
            target = Path(raw)
            init_memory(target, target, "temp")
            old = target / ".memory" / "FEEDBACK.md"
            new = target / ".memory" / "feedbacks" / "AGENTS.md"
            body = new.read_text(encoding="utf-8")
            old.write_text(
                body.replace("暂无条目。", "- leftover intro kept"),
                encoding="utf-8",
            )
            new.unlink()
            agents = target / "AGENTS.md"
            agents.write_text(
                agents.read_text(encoding="utf-8").replace(
                    ".memory/feedbacks/AGENTS.md", ".memory/FEEDBACK.md"
                ),
                encoding="utf-8",
            )
            diagnosed = doctor_memory(target, apply=False)
            issues = {item["issue"] for item in diagnosed["findings"]}
            self.assertIn("legacy-flat-index", issues)
            doctor_memory(target, apply=True)
            self.assertTrue(new.is_file())
            self.assertFalse(old.exists())
            local = agents.read_text(encoding="utf-8")
            self.assertIn(".memory/feedbacks/AGENTS.md", local)
            self.assertNotIn(".memory/FEEDBACK.md", local)
            self.assertEqual(doctor_memory(target, apply=False)["findings"], [])

    def test_agent_skills_migration_does_not_touch_agents_dir(self) -> None:
        with tempfile.TemporaryDirectory() as raw:
            target = Path(raw)
            init_memory(target, target, "temp")
            old = target / ".memory" / "AGENT_SKILLS.md"
            new = target / ".memory" / "agent_skills" / "AGENTS.md"
            old.write_text(new.read_text(encoding="utf-8"), encoding="utf-8")
            new.unlink()
            doctor_memory(target, apply=True)
            self.assertTrue(new.is_file())
            self.assertFalse(old.exists())
            self.assertFalse((target / ".agents").exists())
            remaining = doctor_memory(target, apply=False)
            self.assertEqual(remaining["findings"], [], remaining)

    def test_migrates_user_md_into_users_agents(self) -> None:
        with tempfile.TemporaryDirectory() as raw:
            target = Path(raw)
            init_memory(target, target, "temp")
            old = target / ".memory" / "USER.md"
            new = target / ".memory" / "users" / "AGENTS.md"
            old.write_text(new.read_text(encoding="utf-8"), encoding="utf-8")
            new.unlink()
            doctor_memory(target, apply=True)
            self.assertTrue(new.is_file())
            self.assertFalse(old.exists())
            self.assertIn(
                ".memory/users/AGENTS.md",
                (target / "AGENTS.md").read_text(encoding="utf-8"),
            )


if __name__ == "__main__":
    unittest.main()
