#!/usr/bin/env python3
"""Backup/restore packs USER.md and users/, refuses overwrite without force."""

from __future__ import annotations

import sys
import tarfile
import tempfile
import unittest
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parents[1]
BACKUP = SCRIPTS.parents[1] / "user-memory-backup" / "scripts"
RESTORE = SCRIPTS.parents[1] / "user-memory-restore" / "scripts"
for extra in (SCRIPTS, BACKUP, RESTORE):
    if str(extra) not in sys.path:
        sys.path.insert(0, str(extra))


class BackupTests(unittest.TestCase):
    def test_backup_packs_user_md_and_users(self) -> None:
        from backup import backup_user_memory

        with tempfile.TemporaryDirectory() as raw:
            repo = Path(raw) / "repo"
            users = repo / ".memory" / "users"
            users.mkdir(parents=True)
            (repo / ".memory" / "USER.md").write_text("# USER\n", encoding="utf-8")
            (users / "user_pref.md").write_text("secret token xyz\n", encoding="utf-8")
            archive = backup_user_memory(repo, timestamp="20260911T120000Z")
            self.assertEqual(archive.name, "user-memory-backup-20260911T120000Z.tar.gz")
            self.assertEqual(archive.parent, repo)
            with tarfile.open(archive, "r:gz") as tar:
                names = set(tar.getnames())
            self.assertIn(".memory/USER.md", names)
            self.assertIn(".memory/users/user_pref.md", names)

    def test_backup_errors_when_nothing_to_pack(self) -> None:
        from backup import backup_user_memory

        with tempfile.TemporaryDirectory() as raw:
            repo = Path(raw)
            with self.assertRaises(ValueError):
                backup_user_memory(repo)


class RestoreTests(unittest.TestCase):
    def test_restore_reinjects_user_md_and_users(self) -> None:
        from backup import backup_user_memory
        from restore import restore_user_memory

        with tempfile.TemporaryDirectory() as raw:
            src = Path(raw) / "src"
            dest = Path(raw) / "dest"
            users = src / ".memory" / "users"
            users.mkdir(parents=True)
            (src / ".memory" / "USER.md").write_text(
                "<!-- project-memory-entries:start -->\n"
                "- [pref](users/user_pref.md) — personal\n"
                "<!-- project-memory-entries:end -->\n",
                encoding="utf-8",
            )
            (users / "user_pref.md").write_text("token=abc\n", encoding="utf-8")
            archive = backup_user_memory(src, timestamp="20260911T130000Z")
            dest.mkdir()
            restore_user_memory(archive, dest)
            self.assertEqual(
                (dest / ".memory" / "users" / "user_pref.md").read_text(encoding="utf-8"),
                "token=abc\n",
            )
            self.assertTrue((dest / ".memory" / "USER.md").is_file())

    def test_restore_refuses_overwrite_without_force(self) -> None:
        from backup import backup_user_memory
        from restore import restore_user_memory

        with tempfile.TemporaryDirectory() as raw:
            src = Path(raw) / "src"
            dest = Path(raw) / "dest"
            for tree in (src, dest):
                (tree / ".memory" / "users").mkdir(parents=True)
                (tree / ".memory" / "users" / "user_keep.md").write_text(
                    "keep\n", encoding="utf-8"
                )
                (tree / ".memory" / "USER.md").write_text(
                    "<!-- project-memory-entries:start -->\n"
                    "- [keep](users/user_keep.md) — x\n"
                    "<!-- project-memory-entries:end -->\n",
                    encoding="utf-8",
                )
            archive = backup_user_memory(src, timestamp="20260911T140000Z")
            with self.assertRaises(ValueError):
                restore_user_memory(archive, dest, force=False)
            restore_user_memory(archive, dest, force=True)
            self.assertTrue((dest / ".memory" / "users" / "user_keep.md").is_file())


if __name__ == "__main__":
    unittest.main()
