"""Private archive roundtrips, replacement and unsafe input contracts."""
from __future__ import annotations
import io
import os
from pathlib import Path
import stat
import subprocess
import sys
import tarfile
import tempfile
import unittest

SCRIPTS = Path(__file__).resolve().parents[1]
BACKUP = SCRIPTS.parents[1] / 'user-memory-backup/scripts'
RESTORE = SCRIPTS.parents[1] / 'user-memory-restore/scripts'
for extra in (SCRIPTS, BACKUP, RESTORE):
    sys.path.insert(0, str(extra))
from backup import backup_user_memory
from restore import restore_user_memory

USERS = Path('.harness/memory/users')
INDEX = '<!-- project-memory-entries:start -->\n- [pref](user_pref.md) — private\n<!-- project-memory-entries:end -->\n'

class ArchiveTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.base = Path(self.temp.name)
        self.src, self.dest = self.base / 'src', self.base / 'dest'
        self.src.mkdir()
        self.dest.mkdir()

    def source(self):
        users = self.src / USERS
        users.mkdir(parents=True)
        (users / 'AGENTS.md').write_text(INDEX)
        (users / 'user_pref.md').write_bytes(b'private\r\n\x00')
        (users / 'user_pref.md').chmod(0o600)
        return users

    def tar(self, names):
        archive = self.base / 'fixture.tar.gz'
        with tarfile.open(archive, 'w:gz') as handle:
            for name, content in names:
                info = tarfile.TarInfo(name)
                info.size = len(content)
                handle.addfile(info, io.BytesIO(content))
        return archive

    def test_backup_restore_roundtrip_preserves_index_bytes_mode(self):
        users = self.source()
        archive = backup_user_memory(self.src, timestamp='20261003T000000Z')
        with tarfile.open(archive) as handle:
            self.assertEqual(set(handle.getnames()), {'.harness/memory/users/AGENTS.md', '.harness/memory/users/user_pref.md'})
        self.assertEqual(stat.S_IMODE(archive.stat().st_mode), 0o600)
        restore_user_memory(archive, self.dest)
        for name in ('AGENTS.md', 'user_pref.md'):
            self.assertEqual((self.dest / USERS / name).read_bytes(), (users / name).read_bytes())
        self.assertEqual(stat.S_IMODE((self.dest / USERS / 'user_pref.md').stat().st_mode), 0o600)
        self.assertFalse((self.dest / '.memory').exists())

    def test_backup_nothing_or_legacy_only_requires_conversion(self):
        with self.assertRaises(ValueError):
            backup_user_memory(self.src)
        (self.src / '.memory/users').mkdir(parents=True)
        (self.src / '.memory/users/user_pref.md').write_text('legacy')
        with self.assertRaisesRegex(ValueError, 'conversion-required'):
            backup_user_memory(self.src)

    def test_backup_does_not_overwrite_archive_or_follow_source_symlink(self):
        users = self.source()
        archive = backup_user_memory(self.src, timestamp='fixed')
        before = archive.read_bytes()
        with self.assertRaises((ValueError, OSError)):
            backup_user_memory(self.src, timestamp='fixed')
        self.assertEqual(archive.read_bytes(), before)
        external = self.base / 'external'
        external.write_text('external')
        (users / 'leak').symlink_to(external)
        with self.assertRaises(ValueError):
            backup_user_memory(self.src, timestamp='next')
        self.assertFalse((self.src / 'user-memory-backup-next.tar.gz').exists())

    def test_backup_timestamp_cannot_escape(self):
        self.source()
        with self.assertRaises(ValueError):
            backup_user_memory(self.src, timestamp='../../escaped')

    def test_restore_requires_force_for_any_existing_asset_then_replaces(self):
        self.source()
        archive = backup_user_memory(self.src)
        users = self.dest / USERS
        users.mkdir(parents=True)
        (users / 'unknown-secret.bin').write_text('stale')
        with self.assertRaises(ValueError):
            restore_user_memory(archive, self.dest)
        restore_user_memory(archive, self.dest, force=True)
        self.assertFalse((users / 'unknown-secret.bin').exists())
        self.assertEqual((users / 'user_pref.md').read_bytes(), b'private\r\n\x00')

    def test_restore_into_initialized_empty_index(self):
        from operations.init import init_memory
        init_memory(self.dest, self.dest, 'test', memory_types=['user'], skill_types=[])
        self.source()
        restore_user_memory(backup_user_memory(self.src), self.dest)
        self.assertEqual((self.dest / USERS / 'AGENTS.md').read_text(), INDEX)

    def test_legacy_archive_reports_actionable_conversion_before_mutation(self):
        archive = self.tar([('.memory/USER.md', b'legacy'), ('.memory/users/user_pref.md', b'old')])
        with self.assertRaisesRegex(ValueError, 'conversion-required.*project-memory-migrate'):
            restore_user_memory(archive, self.dest)
        self.assertEqual(list(self.dest.iterdir()), [])

    def test_rejects_traversal_absolute_and_duplicate_members(self):
        for name in ['../escape', '/absolute', '.harness/memory/users/../escape', '.harness/memory/users/../../escape']:
            with self.subTest(name=name):
                archive = self.tar([(name, b'evil'), ('.harness/memory/users/user_ok.md', b'good')])
                with self.assertRaises(ValueError):
                    restore_user_memory(archive, self.dest)
                self.assertEqual(list(self.dest.iterdir()), [])
        archive = self.tar([('.harness/memory/users/x', b'a'), ('.harness/memory/users/x', b'b')])
        with self.assertRaises(ValueError):
            restore_user_memory(archive, self.dest)

    def test_rejects_tar_symlink_and_existing_linked_parent(self):
        archive = self.base / 'evil.tar.gz'
        with tarfile.open(archive, 'w:gz') as tar:
            info = tarfile.TarInfo('.harness/memory/users/evil')
            info.type = tarfile.SYMTYPE
            info.linkname = '../../escape'
            tar.addfile(info)
        with self.assertRaisesRegex(ValueError, '非普通文件'):
            restore_user_memory(archive, self.dest)
        self.source()
        archive = backup_user_memory(self.src)
        outside = self.base / 'outside'
        outside.mkdir()
        (self.dest / '.harness').symlink_to(outside)
        with self.assertRaises(ValueError):
            restore_user_memory(archive, self.dest, force=True)
        self.assertEqual(list(outside.iterdir()), [])

    def test_force_replaces_users_link_without_following_it(self):
        self.source()
        archive = backup_user_memory(self.src)
        outside = self.dest / '.harness/memory/feedbacks'
        outside.mkdir(parents=True)
        keep = outside / 'keep'
        keep.write_text('do not change')
        (self.dest / USERS).symlink_to(outside)
        restore_user_memory(archive, self.dest, force=True)
        self.assertEqual(keep.read_text(), 'do not change')
        self.assertFalse((self.dest / USERS).is_symlink())
        self.assertTrue((self.dest / USERS / 'user_pref.md').is_file())

    def test_backup_and_restore_establish_gitignore_before_private_writes(self):
        for repo in (self.src, self.dest):
            subprocess.run(['git', 'init', '-q', str(repo)], check=True)
        self.source()
        archive = backup_user_memory(self.src)
        restore_user_memory(archive, self.dest)
        for repo, path in [(self.src, archive.name), (self.dest, '.harness/memory/users/AGENTS.md')]:
            self.assertEqual(subprocess.run(['git', '-C', str(repo), 'check-ignore', '-q', path]).returncode, 0)

if __name__ == '__main__':
    unittest.main()
