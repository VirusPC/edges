import importlib.util
from pathlib import Path
import tempfile
import unittest

SPEC = importlib.util.spec_from_file_location('local_archive', Path(__file__).resolve().parents[1] / 'local_archive.py')
archive = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(archive)


class ArchiveTests(unittest.TestCase):
    def test_preview_copy_idempotency_and_conflict(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            src = root / 'input'
            src.mkdir()
            (src / 'dataset.json').write_text('{"frozen":true}')
            base = root / 'experiment'
            base.mkdir()
            self.assertEqual(archive.archive(src, 'archive', base=base)['new_files'], 1)
            self.assertFalse((base / 'local').exists())
            archive.archive(src, 'archive', apply=True, base=base)
            self.assertEqual(archive.archive(src, 'archive', base=base)['new_files'], 0)
            (src / 'dataset.json').write_text('{"changed":true}')
            with self.assertRaisesRegex(ValueError, 'conflicts'):
                archive.archive(src, 'archive', apply=True, base=base)
            self.assertEqual((base / 'local/archive/dataset.json').read_text(), '{"frozen":true}')

    def test_credentials_symlinks_and_path_escape_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            src = root / 'input'
            src.mkdir()
            (src / 'auth.json').write_text('{}')
            with self.assertRaises(ValueError):
                archive.archive(src, 'archive', base=root)
            (src / 'auth.json').unlink()
            (src / 'link').symlink_to(root)
            with self.assertRaises(ValueError):
                archive.archive(src, 'archive', base=root)
            with self.assertRaises(ValueError):
                archive.archive(src, '../escape', base=root)


if __name__ == '__main__':
    unittest.main()
