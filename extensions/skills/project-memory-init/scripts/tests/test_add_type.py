#!/usr/bin/env python3
"""add-type: LAYOUT artifacts, privileges, example-type smoke helpers."""

from __future__ import annotations

import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

MEMORY_PY = Path(__file__).resolve().parents[1] / "memory.py"

SCRIPTS = Path(__file__).resolve().parents[1]
if str(SCRIPTS) not in sys.path:
    sys.path.insert(0, str(SCRIPTS))

from lib.types import discover_layer_types, parse_type_meta  # noqa: E402
from operations.add_type import add_type  # noqa: E402
from operations.doctor import doctor_memory  # noqa: E402
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
            self.assertEqual(result["index"], ".memory/docs/AGENTS.md")
            self.assertEqual(result["contentDir"], ".memory/docs")
            self.assertEqual(result["action"], "created")
            self.assertTrue((target / ".memory" / "docs" / "AGENTS.md").is_file())
            self.assertTrue((target / ".memory" / "docs").is_dir())
            self.assertFalse((target / ".memory" / "DOCS.md").exists())
            self.assertIn(
                ".memory/docs/AGENTS.md",
                (target / "AGENTS.md").read_text(encoding="utf-8"),
            )
            self.assertEqual(discover_layer_types(target)["docs"], "docs/AGENTS.md")
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


class AddTypeGitignoreTests(unittest.TestCase):
    def test_gitignore_flag_appends_repo_patterns(self) -> None:
        with tempfile.TemporaryDirectory() as raw:
            target = Path(raw)
            (target / ".git").mkdir()
            (target / ".gitignore").write_text("# keep\n", encoding="utf-8")
            init_memory(target, target, "temp tree")
            add_type(target, "secret", "本层不宜提交的摘录", gitignore=True)
            text = (target / ".gitignore").read_text(encoding="utf-8")
            for pattern in (
                ".memory/SECRET.md",
                ".memory/secrets/",
                "**/.memory/SECRET.md",
                "**/.memory/secrets/",
            ):
                self.assertIn(pattern, text, pattern)
            meta = (target / ".memory" / "secrets" / "AGENTS.md").read_text(
                encoding="utf-8"
            )
            self.assertIn("gitignore: true", meta)
            spec = parse_type_meta(meta)
            self.assertIsNotNone(spec)
            self.assertEqual(spec.name, "secret")
            self.assertTrue(spec.gitignore)

    def test_gitignore_without_git_does_not_fail(self) -> None:
        with tempfile.TemporaryDirectory() as raw:
            target = Path(raw)
            init_memory(target, target, "temp tree")
            result = add_type(target, "secret", "no git root", gitignore=True)
            self.assertEqual(result["flags"]["gitignore"], True)
            self.assertIn(result.get("gitignoreAction"), (None, "skipped-no-git"))


class AddTypeIndexOnlyTests(unittest.TestCase):
    def test_index_only_has_no_content_dir_and_rejects_remember(self) -> None:
        with tempfile.TemporaryDirectory() as raw:
            target = Path(raw)
            init_memory(target, target, "temp tree")
            result = add_type(
                target,
                "catalog",
                "只索引外部清单，不在这里写条目",
                writable=False,
            )
            self.assertFalse(result["flags"]["writable"])
            self.assertTrue((target / ".memory" / "catalogs" / "AGENTS.md").is_file())
            self.assertFalse((target / ".memory" / "CATALOG.md").exists())
            self.assertEqual(list((target / ".memory" / "catalogs").glob("catalog_*.md")), [])
            with self.assertRaises(ValueError) as ctx:
                remember(
                    target,
                    "catalog",
                    "nope",
                    "title",
                    "should fail",
                    "body",
                    {},
                )
            self.assertIn("只索引", str(ctx.exception))
            report = doctor_memory(target, apply=False)
            issues = {item["issue"] for item in report["findings"]}
            self.assertNotIn("missing-type-dir", issues)
            self.assertNotIn("outdated-local", issues)


class AddTypeSkillsFormatTests(unittest.TestCase):
    def test_skills_format_remember_writes_skill_md(self) -> None:
        with tempfile.TemporaryDirectory() as raw:
            target = Path(raw)
            init_memory(target, target, "temp tree")
            add_type(
                target,
                "playbook",
                "可执行手册，形态与 skills 相同",
                format="skills",
            )
            result = remember(
                target,
                "playbook",
                "rerun-failed-e2e",
                None,
                "rerun failed e2e once",
                "1. Collect failed tests.\n2. Rerun them.",
                {"username": "tester", "email": "t@example.com"},
            )
            path = target / ".memory" / "playbooks" / "rerun-failed-e2e" / "SKILL.md"
            self.assertTrue(path.is_file(), result)
            self.assertEqual(
                result["path"],
                ".memory/playbooks/rerun-failed-e2e/SKILL.md",
            )


class AddTypeExternalStubTests(unittest.TestCase):
    def test_external_content_dir_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as raw:
            target = Path(raw)
            init_memory(target, target, "temp tree")
            with self.assertRaises(ValueError) as ctx:
                add_type(
                    target,
                    "plugins",
                    "want external root",
                    external_content_dir=(".agents", "plugins"),
                )
            message = str(ctx.exception)
            self.assertIn("stub", message.lower())
            self.assertIn("agent_skills", message)
            self.assertNotIn("plugins", discover_layer_types(target))


class DoctorDiscoversExtraTypesTests(unittest.TestCase):
    def test_doctor_clean_after_add_type(self) -> None:
        with tempfile.TemporaryDirectory() as raw:
            target = Path(raw)
            init_memory(target, target, "temp tree")
            add_type(target, "docs", "项目内文档指针，不是知识库正文")
            report = doctor_memory(target, apply=False)
            self.assertEqual(report["findings"], [], report)

    def test_doctor_apply_does_not_drop_docs_line(self) -> None:
        with tempfile.TemporaryDirectory() as raw:
            target = Path(raw)
            init_memory(target, target, "temp tree")
            add_type(target, "docs", "项目内文档指针，不是知识库正文")
            doctor_memory(target, apply=True)
            self.assertIn(
                ".memory/docs/AGENTS.md",
                (target / "AGENTS.md").read_text(encoding="utf-8"),
            )
            remaining = doctor_memory(target, apply=False)
            self.assertEqual(remaining["findings"], [], remaining)

    def test_doctor_apply_restores_missing_seed_without_dropping_docs(self) -> None:
        with tempfile.TemporaryDirectory() as raw:
            target = Path(raw)
            init_memory(target, target, "temp tree")
            add_type(target, "docs", "项目内文档指针，不是知识库正文")
            agents = target / "AGENTS.md"
            text = agents.read_text(encoding="utf-8")
            agents.write_text(
                "\n".join(
                    line
                    for line in text.splitlines()
                    if ".memory/users/AGENTS.md" not in line
                )
                + "\n",
                encoding="utf-8",
            )
            diagnosed = doctor_memory(target, apply=False)
            issues = {item["issue"] for item in diagnosed["findings"]}
            self.assertIn("outdated-local", issues)
            doctor_memory(target, apply=True)
            local = agents.read_text(encoding="utf-8")
            self.assertIn(".memory/users/AGENTS.md", local)
            self.assertIn(".memory/docs/AGENTS.md", local)
            remaining = doctor_memory(target, apply=False)
            self.assertEqual(remaining["findings"], [], remaining)

    def test_init_refreshes_extra_type_index(self) -> None:
        with tempfile.TemporaryDirectory() as raw:
            target = Path(raw)
            init_memory(target, target, "temp tree")
            add_type(target, "docs", "项目内文档指针，不是知识库正文")
            remember(
                target,
                "docs",
                "layout_pointer",
                "LAYOUT is the extension surface",
                "extra indexes must refresh on init too",
                "Isomorphic to seeds.\n\n**Why:** plan file map.\n\n"
                "**How to apply:** refresh discovered types.",
                {"username": "tester", "email": "t@example.com"},
            )
            docs_index = target / ".memory" / "docs" / "AGENTS.md"
            docs_index.write_text(
                "# DOCS\n\n<!-- project-memory-entries:start -->\n- 暂无条目。\n"
                "<!-- project-memory-entries:end -->\n",
                encoding="utf-8",
            )
            init_memory(target, target, "temp tree")
            self.assertIn(
                "docs_layout_pointer.md",
                docs_index.read_text(encoding="utf-8"),
            )

    def test_unregistered_type_entry_is_linked_on_apply(self) -> None:
        with tempfile.TemporaryDirectory() as raw:
            target = Path(raw)
            init_memory(target, target, "temp tree")
            research = target / ".memory" / "research"
            research.mkdir()
            (research / "AGENTS.md").write_text(
                "# RESEARCH\n\n<!-- project-memory-entries:start -->\n- 暂无条目。\n"
                "<!-- project-memory-entries:end -->\n",
                encoding="utf-8",
            )
            report = doctor_memory(target, apply=False)
            issues = {item["issue"] for item in report["findings"]}
            self.assertIn("unregistered-type", issues)
            doctor_memory(target, apply=True)
            self.assertIn(
                ".memory/research/AGENTS.md",
                (target / "AGENTS.md").read_text(encoding="utf-8"),
            )


class AddTypeCliTests(unittest.TestCase):
    def test_cli_add_type_then_remember(self) -> None:
        with tempfile.TemporaryDirectory() as raw:
            target = Path(raw)
            init = subprocess.run(
                [
                    sys.executable,
                    str(MEMORY_PY),
                    "init",
                    "--target-dir",
                    str(target),
                    "--root-dir",
                    str(target),
                ],
                capture_output=True,
                text=True,
                check=False,
            )
            self.assertEqual(init.returncode, 0, init.stderr)
            added = subprocess.run(
                [
                    sys.executable,
                    str(MEMORY_PY),
                    "add-type",
                    "--target-dir",
                    str(target),
                    "--name",
                    "docs",
                    "--description",
                    "项目内文档指针，不是知识库正文",
                ],
                capture_output=True,
                text=True,
                check=False,
            )
            self.assertEqual(added.returncode, 0, added.stderr)
            payload = json.loads(added.stdout)
            self.assertTrue(payload["ok"])
            self.assertEqual(payload["type"], "docs")
            remember_cli = subprocess.run(
                [
                    sys.executable,
                    str(MEMORY_PY),
                    "remember",
                    "--target-dir",
                    str(target),
                    "--type",
                    "docs",
                    "--slug",
                    "cli_docs",
                    "--title",
                    "CLI docs",
                    "--description",
                    "created from add-type CLI",
                    "--username",
                    "tester",
                    "--email",
                    "t@example.com",
                    "--content",
                    "CLI body.\n\n**Why:** wire the subcommand.\n\n"
                    "**How to apply:** skill calls this.",
                ],
                capture_output=True,
                text=True,
                check=False,
            )
            self.assertEqual(remember_cli.returncode, 0, remember_cli.stderr)

    def test_cli_external_content_dir_returns_json_error(self) -> None:
        with tempfile.TemporaryDirectory() as raw:
            target = Path(raw)
            subprocess.run(
                [
                    sys.executable,
                    str(MEMORY_PY),
                    "init",
                    "--target-dir",
                    str(target),
                    "--root-dir",
                    str(target),
                ],
                check=True,
                capture_output=True,
                text=True,
            )
            stubbed = subprocess.run(
                [
                    sys.executable,
                    str(MEMORY_PY),
                    "add-type",
                    "--target-dir",
                    str(target),
                    "--name",
                    "plugins",
                    "--description",
                    "external stub",
                    "--external-content-dir",
                    ".agents/plugins",
                ],
                capture_output=True,
                text=True,
                check=False,
            )
            self.assertEqual(stubbed.returncode, 1)
            payload = json.loads(stubbed.stdout)
            self.assertFalse(payload["ok"])
            self.assertIn("stub", payload["error"].lower())


if __name__ == "__main__":
    unittest.main()
