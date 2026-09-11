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
from operations.init import init_memory  # noqa: E402
from operations.remember import remember  # noqa: E402


class UserTypeRegistrationTests(unittest.TestCase):
    def test_index_files_includes_user(self) -> None:
        files = index_files()
        self.assertEqual(files["user"], "USER.md")

    def test_index_files_order_user_then_feedback_project_reference(self) -> None:
        self.assertEqual(
            list(index_files()),
            ["user", "feedback", "project", "reference", "skills", "agent_skills"],
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
                target / ".memory" / "users",
            )


class UserInitTests(unittest.TestCase):
    def test_init_creates_user_index_and_dir(self) -> None:
        with tempfile.TemporaryDirectory() as raw:
            target = Path(raw)
            result = init_memory(target, target, "temp tree")
            user_index = target / ".memory" / "USER.md"
            users_dir = target / ".memory" / "users"
            self.assertTrue(user_index.is_file(), result)
            self.assertTrue(users_dir.is_dir(), result)
            text = user_index.read_text(encoding="utf-8")
            self.assertIn("project-memory-entries:start", text)
            self.assertIn(
                ".memory/USER.md",
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
            path = target / ".memory" / "users" / "user_local_editor.md"
            self.assertTrue(path.is_file(), result)
            self.assertEqual(result["path"], ".memory/users/user_local_editor.md")
            self.assertEqual(result["index"], ".memory/USER.md")
            index = (target / ".memory" / "USER.md").read_text(encoding="utf-8")
            self.assertIn("user_local_editor.md", index)
            self.assertIn("personal editor preference", index)


class UserGitignoreTests(unittest.TestCase):
    def test_root_gitignore_covers_user_memory(self) -> None:
        root = Path(__file__).resolve()
        gitignore = None
        for candidate in (root, *root.parents):
            probe = candidate / ".gitignore"
            if probe.is_file() and (candidate / "docs" / "adr").is_dir():
                gitignore = probe
                break
        self.assertIsNotNone(gitignore)
        text = gitignore.read_text(encoding="utf-8")
        for pattern in (
            ".memory/users/",
            ".memory/USER.md",
            "**/.memory/users/",
            "**/.memory/USER.md",
            "user-memory-backup-*.tar.gz",
            "user-memory-backup-*.zip",
        ):
            self.assertIn(pattern, text, pattern)

    def test_nested_user_memory_paths_are_ignored(self) -> None:
        repo = Path(__file__).resolve()
        root = None
        for candidate in (repo, *repo.parents):
            if (candidate / ".git").exists() and (candidate / ".gitignore").is_file():
                root = candidate
                break
        self.assertIsNotNone(root)
        nested = (
            "extensions/.memory/USER.md",
            "extensions/.memory/users/user_sample.md",
            "knowledge/tasks/.memory/USER.md",
        )
        for relative in nested:
            checked = subprocess.run(
                ["git", "-C", str(root), "check-ignore", "-q", relative],
                check=False,
            )
            self.assertEqual(
                checked.returncode,
                0,
                f"{relative} must be gitignored (slash patterns in .gitignore are root-only unless **)",
            )


if __name__ == "__main__":
    unittest.main()
