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

    def test_receipt_namespace_symlink_and_nested_names(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp).resolve()
            src = root / 'input'
            src.mkdir()
            (src / 'manifest.json').write_text('immutable original')
            base = root / 'experiment'
            base.mkdir()
            with self.assertRaises(ValueError):
                archive.archive(src, 'receipts', apply=True, base=base)
            (base / 'local').mkdir()
            (base / 'local/receipts').symlink_to(src)
            with self.assertRaisesRegex(ValueError, 'symlink'):
                archive.archive(src, 'archive', apply=True, base=base)
            self.assertEqual((src / 'manifest.json').read_text(), 'immutable original')
            (base / 'local/receipts').unlink()
            archive.archive(src, 'a/b', apply=True, base=base)
            archive.archive(src, 'a--b', apply=True, base=base)
            self.assertTrue((base / 'local/receipts/a/b/manifest.json').is_file())
            self.assertTrue((base / 'local/receipts/a--b/manifest.json').is_file())


if __name__ == '__main__':
    unittest.main()
