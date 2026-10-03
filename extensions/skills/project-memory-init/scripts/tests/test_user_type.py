#!/usr/bin/env python3
"""User memory type: registration, paths, init, remember, gitignore."""

from __future__ import annotations

import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parents[1]
if str(SCRIPTS) not in sys.path:
    sys.path.insert(0, str(SCRIPTS))

from lib.blocks import index_files  # noqa: E402
from lib.paths import type_content_dir, type_dir_name  # noqa: E402
from nodes.entries import memory_entry_types  # noqa: E402
from operations.init import init_memory as _init_memory  # noqa: E402
from operations.remember import remember  # noqa: E402


def init_memory(target, root, description=None):
    # These existing tests explicitly exercise all six official adopted types.
    (target / '.agents/skills').mkdir(parents=True, exist_ok=True)
    return _init_memory(target, root, description,
        memory_types=['user', 'feedback', 'project', 'reference'],
        skill_types=['managed', 'referenced'])


class UserTypeRegistrationTests(unittest.TestCase):
    def test_index_files_includes_user(self) -> None:
        files = index_files()
        self.assertEqual(files["user"], ".harness/memory/users/AGENTS.md")

    def test_index_files_order_user_then_feedback_project_reference(self) -> None:
        self.assertEqual(
            list(index_files()),
            ["user", "feedback", "project", "reference", "managed", "referenced"],
        )

    def test_memory_entry_types_includes_user(self) -> None:
        self.assertIn("user", memory_entry_types())

    def test_type_dir_name_user_is_users(self) -> None:
        self.assertEqual(type_dir_name("user"), "users")

    def test_type_content_dir_is_memory_users(self) -> None:
        with tempfile.TemporaryDirectory() as raw:
            target = Path(raw)
            self.assertEqual(
                type_content_dir(target, "user"),
                target / ".harness/memory" / "users",
            )


class UserInitTests(unittest.TestCase):
    def test_init_creates_user_index_and_dir(self) -> None:
        with tempfile.TemporaryDirectory() as raw:
            target = Path(raw)
            result = init_memory(target, target, "temp tree")
            user_index = target / ".harness/memory" / "users" / "AGENTS.md"
            users_dir = target / ".harness/memory" / "users"
            self.assertTrue(user_index.is_file(), result)
            self.assertTrue(users_dir.is_dir(), result)
            text = user_index.read_text(encoding="utf-8")
            self.assertIn("project-memory-entries:start", text)
            self.assertIn(
                ".harness/memory/users/AGENTS.md",
                (target / "AGENTS.md").read_text(encoding="utf-8"),
            )


class UserRememberTests(unittest.TestCase):
    def test_remember_user_writes_entry_and_refreshes_index(self) -> None:
        with tempfile.TemporaryDirectory() as raw:
            target = Path(raw)
            init_memory(target, target, "temp tree")
            result = remember(
                target,
                "user",
                "local_editor",
                "Prefer helix for git commits",
                "personal editor preference for this repo, not a team convention",
                "Use helix for interactive rebase in this clone.\n\n"
                "**Why:** personal muscle memory.\n\n"
                "**How to apply:** do not write this into project memory.",
                {"username": "tester", "email": "t@example.com"},
            )
            path = target / ".harness/memory" / "users" / "user_local_editor.md"
            self.assertTrue(path.is_file(), result)
            self.assertEqual(result["path"], ".harness/memory/users/user_local_editor.md")
            self.assertEqual(result["index"], ".harness/memory/users/AGENTS.md")
            index = (target / ".harness/memory" / "users" / "AGENTS.md").read_text(
                encoding="utf-8"
            )
            self.assertIn("user_local_editor.md", index)
            self.assertIn("personal editor preference", index)


class UserGitignoreTests(unittest.TestCase):
    def test_nested_user_memory_paths_are_ignored(self):
        with tempfile.TemporaryDirectory() as raw:
            root = Path(raw)
            subprocess.run(['git', 'init', '-q', str(root)], check=True)
            child = root / 'nested'
            child.mkdir()
            _init_memory(child, root, memory_types=['user'])
            for path in ['nested/.harness/memory/users/AGENTS.md', 'nested/.harness/memory/users/user_private.md']:
                result = subprocess.run(['git', '-C', str(root), 'check-ignore', path], capture_output=True)
                self.assertEqual(result.returncode, 0, path)
