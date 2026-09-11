#!/usr/bin/env python3
"""User memory type: registration, paths, init, remember, gitignore."""

from __future__ import annotations

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


if __name__ == "__main__":
    unittest.main()
